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

  // Session configuration - table already exists from previous auth setup
  app.use(
    session({
      store: new PgStore({
        pool: pool,
        createTableIfMissing: false, // Table already exists
        tableName: "sessions",
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
  // In production (deployed), REPLIT_DEPLOYMENT=1 and REPLIT_DOMAINS has the domain
  // In development, use REPLIT_DEV_DOMAIN
  let baseUrl: string;
  if (process.env.REPLIT_DEPLOYMENT === "1" && process.env.REPLIT_DOMAINS) {
    // Production deployment - use first domain from REPLIT_DOMAINS
    const productionDomain = process.env.REPLIT_DOMAINS.split(",")[0];
    baseUrl = `https://${productionDomain}`;
  } else if (process.env.REPLIT_DEV_DOMAIN) {
    // Development environment
    baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  } else {
    baseUrl = "http://localhost:5000";
  }

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

          // Upsert user in database - search by email to handle migration from Replit Auth
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
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
            // Update existing user (may have different ID from Replit Auth)
            await db
              .update(users)
              .set({
                id: profile.id, // Update to Google ID
                firstName: googleUser.firstName,
                lastName: googleUser.lastName,
                profileImageUrl: googleUser.profileImageUrl,
                updatedAt: new Date(),
              })
              .where(eq(users.email, email));
            console.log(`[Auth] User updated: ${email}`);
            // Update googleUser.id to match what's in the database
            googleUser.id = profile.id;
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
