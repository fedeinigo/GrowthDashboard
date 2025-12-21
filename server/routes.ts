import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type { DashboardFilters } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Dashboard API routes
  
  // Get dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const filters: DashboardFilters = {
        teamId: req.query.teamId ? parseInt(req.query.teamId as string) : undefined,
        personId: req.query.personId ? parseInt(req.query.personId as string) : undefined,
        sourceId: req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined,
        regionId: req.query.regionId ? parseInt(req.query.regionId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      
      const metrics = await storage.getDashboardMetrics(filters);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Get revenue history
  app.get("/api/dashboard/revenue-history", async (req, res) => {
    try {
      const filters: DashboardFilters = {
        teamId: req.query.teamId ? parseInt(req.query.teamId as string) : undefined,
        personId: req.query.personId ? parseInt(req.query.personId as string) : undefined,
        sourceId: req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined,
        regionId: req.query.regionId ? parseInt(req.query.regionId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      
      const history = await storage.getRevenueHistory(filters);
      res.json(history);
    } catch (error) {
      console.error("Error fetching revenue history:", error);
      res.status(500).json({ error: "Failed to fetch revenue history" });
    }
  });

  // Get meetings history
  app.get("/api/dashboard/meetings-history", async (req, res) => {
    try {
      const filters: DashboardFilters = {
        teamId: req.query.teamId ? parseInt(req.query.teamId as string) : undefined,
        personId: req.query.personId ? parseInt(req.query.personId as string) : undefined,
        sourceId: req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined,
        regionId: req.query.regionId ? parseInt(req.query.regionId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      
      const history = await storage.getMeetingsHistory(filters);
      res.json(history);
    } catch (error) {
      console.error("Error fetching meetings history:", error);
      res.status(500).json({ error: "Failed to fetch meetings history" });
    }
  });

  // Get closure rate history
  app.get("/api/dashboard/closure-rate-history", async (req, res) => {
    try {
      const filters: DashboardFilters = {
        teamId: req.query.teamId ? parseInt(req.query.teamId as string) : undefined,
        personId: req.query.personId ? parseInt(req.query.personId as string) : undefined,
        sourceId: req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined,
        regionId: req.query.regionId ? parseInt(req.query.regionId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      
      const history = await storage.getClosureRateHistory(filters);
      res.json(history);
    } catch (error) {
      console.error("Error fetching closure rate history:", error);
      res.status(500).json({ error: "Failed to fetch closure rate history" });
    }
  });

  // Get product stats
  app.get("/api/dashboard/product-stats", async (req, res) => {
    try {
      const filters: DashboardFilters = {
        teamId: req.query.teamId ? parseInt(req.query.teamId as string) : undefined,
        personId: req.query.personId ? parseInt(req.query.personId as string) : undefined,
        sourceId: req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined,
        regionId: req.query.regionId ? parseInt(req.query.regionId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      
      const stats = await storage.getProductStats(filters);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching product stats:", error);
      res.status(500).json({ error: "Failed to fetch product stats" });
    }
  });

  // Get rankings by team
  app.get("/api/dashboard/rankings/teams", async (req, res) => {
    try {
      const filters: DashboardFilters = {
        teamId: req.query.teamId ? parseInt(req.query.teamId as string) : undefined,
        personId: req.query.personId ? parseInt(req.query.personId as string) : undefined,
        sourceId: req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined,
        regionId: req.query.regionId ? parseInt(req.query.regionId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      
      const rankings = await storage.getRankingsByTeam(filters);
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching team rankings:", error);
      res.status(500).json({ error: "Failed to fetch team rankings" });
    }
  });

  // Get rankings by person
  app.get("/api/dashboard/rankings/people", async (req, res) => {
    try {
      const filters: DashboardFilters = {
        teamId: req.query.teamId ? parseInt(req.query.teamId as string) : undefined,
        personId: req.query.personId ? parseInt(req.query.personId as string) : undefined,
        sourceId: req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined,
        regionId: req.query.regionId ? parseInt(req.query.regionId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      
      const rankings = await storage.getRankingsByPerson(filters);
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching person rankings:", error);
      res.status(500).json({ error: "Failed to fetch person rankings" });
    }
  });

  // Get rankings by source
  app.get("/api/dashboard/rankings/sources", async (req, res) => {
    try {
      const filters: DashboardFilters = {
        teamId: req.query.teamId ? parseInt(req.query.teamId as string) : undefined,
        personId: req.query.personId ? parseInt(req.query.personId as string) : undefined,
        sourceId: req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined,
        regionId: req.query.regionId ? parseInt(req.query.regionId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      
      const rankings = await storage.getRankingsBySource(filters);
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching source rankings:", error);
      res.status(500).json({ error: "Failed to fetch source rankings" });
    }
  });

  // Get regional data
  app.get("/api/dashboard/regional-data", async (req, res) => {
    try {
      const filters: DashboardFilters = {
        teamId: req.query.teamId ? parseInt(req.query.teamId as string) : undefined,
        personId: req.query.personId ? parseInt(req.query.personId as string) : undefined,
        sourceId: req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined,
        regionId: req.query.regionId ? parseInt(req.query.regionId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      
      const data = await storage.getRegionalData(filters);
      res.json(data);
    } catch (error) {
      console.error("Error fetching regional data:", error);
      res.status(500).json({ error: "Failed to fetch regional data" });
    }
  });

  // Get company size distribution
  app.get("/api/dashboard/company-size-distribution", async (req, res) => {
    try {
      const filters: DashboardFilters = {
        teamId: req.query.teamId ? parseInt(req.query.teamId as string) : undefined,
        personId: req.query.personId ? parseInt(req.query.personId as string) : undefined,
        sourceId: req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined,
        regionId: req.query.regionId ? parseInt(req.query.regionId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      
      const distribution = await storage.getCompanySizeDistribution(filters);
      res.json(distribution);
    } catch (error) {
      console.error("Error fetching company size distribution:", error);
      res.status(500).json({ error: "Failed to fetch company size distribution" });
    }
  });

  // Filter options routes
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.get("/api/people", async (req, res) => {
    try {
      const people = await storage.getAllPeople();
      res.json(people);
    } catch (error) {
      console.error("Error fetching people:", error);
      res.status(500).json({ error: "Failed to fetch people" });
    }
  });

  app.get("/api/sources", async (req, res) => {
    try {
      const sources = await storage.getAllSources();
      res.json(sources);
    } catch (error) {
      console.error("Error fetching sources:", error);
      res.status(500).json({ error: "Failed to fetch sources" });
    }
  });

  app.get("/api/regions", async (req, res) => {
    try {
      const regions = await storage.getAllRegions();
      res.json(regions);
    } catch (error) {
      console.error("Error fetching regions:", error);
      res.status(500).json({ error: "Failed to fetch regions" });
    }
  });

  return httpServer;
}
