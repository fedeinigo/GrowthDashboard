import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Helper to extract display name from claims
function getDisplayName(claims: any): { firstName: string | null; lastName: string | null } {
  // Try standard name fields first
  if (claims.first_name && claims.last_name) {
    return { firstName: claims.first_name, lastName: claims.last_name };
  }
  if (claims.given_name && claims.family_name) {
    return { firstName: claims.given_name, lastName: claims.family_name };
  }
  if (claims.name) {
    const parts = claims.name.split(" ");
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") || null };
  }
  // Use username from Replit as fallback
  if (claims.username) {
    return { firstName: claims.username, lastName: null };
  }
  // Use email prefix as last resort
  if (claims.email) {
    const emailPrefix = claims.email.split("@")[0];
    return { firstName: emailPrefix, lastName: null };
  }
  return { firstName: null, lastName: null };
}

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const claims = req.user.claims;
      const userId = claims.sub;
      const user = await authStorage.getUser(userId);
      
      const displayName = getDisplayName(claims);
      const profileImage = claims.profile_image_url || claims.picture || null;
      
      // If user exists but profile data is missing, supplement from claims
      if (user) {
        const enrichedUser = {
          ...user,
          firstName: user.firstName || displayName.firstName,
          lastName: user.lastName || displayName.lastName,
          profileImageUrl: user.profileImageUrl || profileImage,
          username: claims.username,
        };
        res.json(enrichedUser);
      } else {
        // User not found, create from claims
        res.json({
          id: userId,
          email: claims.email,
          firstName: displayName.firstName,
          lastName: displayName.lastName,
          profileImageUrl: profileImage,
          username: claims.username,
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
