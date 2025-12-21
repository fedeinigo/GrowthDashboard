import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type { DashboardFilters } from "./storage";
import * as pipedrive from "./pipedrive";
import * as pipedriveCache from "./pipedrive-cache";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Dashboard API routes - using cached data
  
  // Get dashboard metrics from cache
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
      };
      
      const metrics = await pipedriveCache.getCachedDashboardMetrics(filters);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics from cache:", error);
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Get revenue history from cache
  app.get("/api/dashboard/revenue-history", async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
      };
      
      const history = await pipedriveCache.getCachedRevenueHistory(filters);
      res.json(history);
    } catch (error) {
      console.error("Error fetching revenue history from cache:", error);
      res.status(500).json({ error: "Failed to fetch revenue history" });
    }
  });

  // Get meetings history from cache
  app.get("/api/dashboard/meetings-history", async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
      };
      
      const history = await pipedriveCache.getCachedMeetingsHistory(filters);
      res.json(history);
    } catch (error) {
      console.error("Error fetching meetings history from cache:", error);
      res.status(500).json({ error: "Failed to fetch meetings history" });
    }
  });

  // Get deal types for filter
  app.get("/api/deal-types", async (req, res) => {
    try {
      const dealTypes = await pipedrive.getDealTypes();
      res.json(dealTypes);
    } catch (error) {
      console.error("Error fetching deal types:", error);
      res.status(500).json({ error: "Failed to fetch deal types" });
    }
  });

  // Get countries for filter
  app.get("/api/countries", async (req, res) => {
    try {
      res.json(pipedrive.COUNTRY_OPTIONS);
    } catch (error) {
      console.error("Error fetching countries:", error);
      res.status(500).json({ error: "Failed to fetch countries" });
    }
  });

  // Get stats by deal type
  app.get("/api/dashboard/deal-type-stats", async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      
      const stats = await pipedrive.getStatsByDealType(filters);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching deal type stats:", error);
      res.status(500).json({ error: "Failed to fetch deal type stats" });
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

  // Get rankings by person from cache
  app.get("/api/dashboard/rankings/people", async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
      };
      
      const rankings = await pipedriveCache.getCachedRankingsByUser(filters);
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching person rankings from cache:", error);
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

  // Get regional data from cache
  app.get("/api/dashboard/regional-data", async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
      };
      
      const data = await pipedriveCache.getCachedRegionalData(filters);
      res.json(data);
    } catch (error) {
      console.error("Error fetching regional data from cache:", error);
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
      const users = await pipedrive.getUsers();
      // Transform to match expected format
      const people = users
        .filter(u => u.active_flag)
        .map(u => ({
          id: u.id,
          name: u.name.toLowerCase().replace(/\s+/g, '_'),
          displayName: u.name,
          teamId: null,
        }));
      res.json(people);
    } catch (error) {
      console.error("Error fetching people from Pipedrive:", error);
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

  // Cache status endpoint
  app.get("/api/cache/status", async (req, res) => {
    try {
      const status = await pipedriveCache.getCacheStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching cache status:", error);
      res.status(500).json({ error: "Failed to fetch cache status" });
    }
  });

  // Manual cache refresh endpoint
  app.post("/api/cache/refresh", async (req, res) => {
    try {
      const result = await pipedriveCache.refreshCache();
      res.json(result);
    } catch (error) {
      console.error("Error refreshing cache:", error);
      res.status(500).json({ error: "Failed to refresh cache" });
    }
  });

  // Initialize cache on startup
  pipedriveCache.ensureCacheWarmed().catch(err => {
    console.error("Failed to warm cache on startup:", err);
  });
  
  // Start auto-refresh
  pipedriveCache.startAutoRefresh();

  return httpServer;
}
