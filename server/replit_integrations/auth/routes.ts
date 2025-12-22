import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const claims = req.user.claims;
      const userId = claims.sub;
      const user = await authStorage.getUser(userId);
      
      // If user exists but profile data is missing, supplement from claims
      if (user) {
        const enrichedUser = {
          ...user,
          firstName: user.firstName || claims.first_name || claims.given_name || claims.name?.split(" ")[0],
          lastName: user.lastName || claims.last_name || claims.family_name || claims.name?.split(" ").slice(1).join(" "),
          profileImageUrl: user.profileImageUrl || claims.profile_image_url || claims.picture,
        };
        res.json(enrichedUser);
      } else {
        // User not found, create from claims
        res.json({
          id: userId,
          email: claims.email,
          firstName: claims.first_name || claims.given_name || claims.name?.split(" ")[0],
          lastName: claims.last_name || claims.family_name || claims.name?.split(" ").slice(1).join(" "),
          profileImageUrl: claims.profile_image_url || claims.picture,
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
