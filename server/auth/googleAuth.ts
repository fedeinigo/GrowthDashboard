import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { pool } from "../db";

// User type for session
export interface GoogleUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

// Extend Express session types
declare global {
  namespace Express {
    interface User extends GoogleUser {}
  }
}

// Initialize Google OAuth
export function setupGoogleAuth(app: Express): void {
  const PgStore = connectPgSimple(session);

  // Session configuration
  app.use(
    session({
      store: new PgStore({
        pool: pool,
        createTableIfMissing: true,
        errorLog: () => {}, // Suppress table already exists errors
      }),
      secret: process.env.SESSION_SECRET || "wisecx-growth-dashboard-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "lax",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Google Strategy
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.error("[Auth] Google OAuth credentials not configured");
    return;
  }

  // Determine callback URL based on environment
  const baseUrl = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.REPLIT_DEPLOYMENT_URL
      ? `https://${process.env.REPLIT_DEPLOYMENT_URL}`
      : "http://localhost:5000";

  const callbackURL = `${baseUrl}/auth/google/callback`;
  console.log(`[Auth] Google OAuth callback URL: ${callbackURL}`);

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          
          if (!email) {
            return done(new Error("No email provided by Google"), undefined);
          }

          // Check domain restriction
          if (!email.endsWith("@wisecx.com")) {
            console.log(`[Auth] Access denied for non-wisecx.com email: ${email}`);
            return done(new Error("Solo usuarios con correo @wisecx.com pueden acceder"), undefined);
          }

          const googleUser: GoogleUser = {
            id: profile.id,
            email,
            firstName: profile.name?.givenName || null,
            lastName: profile.name?.familyName || null,
            profileImageUrl: profile.photos?.[0]?.value || null,
          };

          // Upsert user in database
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.id, profile.id))
            .limit(1);

          if (existingUser.length === 0) {
            await db.insert(users).values({
              id: profile.id,
              email,
              firstName: googleUser.firstName,
              lastName: googleUser.lastName,
              profileImageUrl: googleUser.profileImageUrl,
            });
            console.log(`[Auth] New user created: ${email}`);
          } else {
            await db
              .update(users)
              .set({
                email,
                firstName: googleUser.firstName,
                lastName: googleUser.lastName,
                profileImageUrl: googleUser.profileImageUrl,
                updatedAt: new Date(),
              })
              .where(eq(users.id, profile.id));
            console.log(`[Auth] User updated: ${email}`);
          }

          return done(null, googleUser);
        } catch (error) {
          console.error("[Auth] Error in Google strategy:", error);
          return done(error as Error, undefined);
        }
      }
    )
  );

  // Serialize user to session
  passport.serializeUser((user: GoogleUser, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user: GoogleUser, done) => {
    done(null, user);
  });
}

// Register Google auth routes
export function registerGoogleAuthRoutes(app: Express): void {
  // Login route - redirects to Google
  app.get("/api/login", passport.authenticate("google"));

  // Google OAuth callback
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login?error=auth_failed",
      successRedirect: "/",
    })
  );

  // Logout route
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("[Auth] Logout error:", err);
      }
      res.redirect("/login");
    });
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user has @wisecx.com domain
export const requireWisecxDomain: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user?.email?.endsWith("@wisecx.com")) {
    return next();
  }
  res.status(403).json({ message: "Access restricted to @wisecx.com users only" });
};
