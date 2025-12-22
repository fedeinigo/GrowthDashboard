import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type { DashboardFilters } from "./storage";
import * as pipedrive from "./pipedrive";
import * as pipedriveCache from "./pipedrive-cache";
import { setupGoogleAuth, registerGoogleAuthRoutes, isAuthenticated, requireWisecxDomain } from "./auth/googleAuth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Google OAuth authentication FIRST
  setupGoogleAuth(app);
  registerGoogleAuthRoutes(app);
  
  // Dashboard API routes - using cached data (protected)
  
  // Get dashboard metrics from cache
  app.get("/api/dashboard/metrics", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      const teamId = req.query.teamId as string | undefined;
      const personId = req.query.personId as string | undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
        teamId: teamId ? parseInt(teamId) : undefined,
        personId: personId ? parseInt(personId) : undefined,
      };
      
      const metrics = await pipedriveCache.getCachedDashboardMetrics(filters);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics from cache:", error);
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Get revenue history from cache
  app.get("/api/dashboard/revenue-history", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      const teamId = req.query.teamId as string | undefined;
      const personId = req.query.personId as string | undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
        teamId: teamId ? parseInt(teamId) : undefined,
        personId: personId ? parseInt(personId) : undefined,
      };
      
      const history = await pipedriveCache.getCachedRevenueHistory(filters);
      res.json(history);
    } catch (error) {
      console.error("Error fetching revenue history from cache:", error);
      res.status(500).json({ error: "Failed to fetch revenue history" });
    }
  });

  // Get meetings history from cache
  app.get("/api/dashboard/meetings-history", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      const teamId = req.query.teamId as string | undefined;
      const personId = req.query.personId as string | undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
        teamId: teamId ? parseInt(teamId) : undefined,
        personId: personId ? parseInt(personId) : undefined,
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
  app.get("/api/dashboard/deal-type-stats", isAuthenticated, requireWisecxDomain, async (req, res) => {
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

  // Get closure rate (single value for last 6 months)
  app.get("/api/dashboard/closure-rate-history", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      const teamId = req.query.teamId as string | undefined;
      const personId = req.query.personId as string | undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
        teamId: teamId ? parseInt(teamId) : undefined,
        personId: personId ? parseInt(personId) : undefined,
      };
      
      const result = await pipedriveCache.getCachedClosureRate(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching closure rate:", error);
      res.status(500).json({ error: "Failed to fetch closure rate" });
    }
  });

  // Get product stats from Pipedrive deals
  app.get("/api/dashboard/product-stats", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      
      const filters = {
        teamId: req.query.teamId ? parseInt(req.query.teamId as string) : undefined,
        personId: req.query.personId ? parseInt(req.query.personId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
      };
      
      const stats = await pipedriveCache.getCachedProductStats(filters);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching product stats:", error);
      res.status(500).json({ error: "Failed to fetch product stats" });
    }
  });

  // Get rankings by team from cache
  app.get("/api/dashboard/rankings/teams", isAuthenticated, requireWisecxDomain, async (req, res) => {
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
      
      const rankings = await pipedriveCache.getCachedRankingsByTeam(filters);
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching team rankings:", error);
      res.status(500).json({ error: "Failed to fetch team rankings" });
    }
  });

  // Get rankings by person from cache
  app.get("/api/dashboard/rankings/people", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      const teamId = req.query.teamId as string | undefined;
      const personId = req.query.personId as string | undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
        teamId: teamId ? parseInt(teamId) : undefined,
        personId: personId ? parseInt(personId) : undefined,
      };
      
      const rankings = await pipedriveCache.getCachedRankingsByUser(filters);
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching person rankings from cache:", error);
      res.status(500).json({ error: "Failed to fetch person rankings" });
    }
  });

  // Get rankings by source from cache
  app.get("/api/dashboard/rankings/sources", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      const teamId = req.query.teamId as string | undefined;
      const personId = req.query.personId as string | undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
        teamId: teamId ? parseInt(teamId) : undefined,
        personId: personId ? parseInt(personId) : undefined,
      };
      
      const rankings = await pipedriveCache.getCachedRankingsBySource(filters);
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching source rankings:", error);
      res.status(500).json({ error: "Failed to fetch source rankings" });
    }
  });

  // Get NC meetings last 10 weeks
  app.get("/api/dashboard/nc-meetings-10weeks", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const data = await pipedriveCache.getNCMeetingsLast10Weeks();
      res.json(data);
    } catch (error) {
      console.error("Error fetching NC meetings 10 weeks:", error);
      res.status(500).json({ error: "Failed to fetch NC meetings" });
    }
  });

  // Get quarterly region comparison
  app.get("/api/dashboard/quarterly-region-comparison", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const data = await pipedriveCache.getQuarterlyRegionComparison();
      res.json(data);
    } catch (error) {
      console.error("Error fetching quarterly region comparison:", error);
      res.status(500).json({ error: "Failed to fetch quarterly comparison" });
    }
  });

  // Get top origins by region
  app.get("/api/dashboard/top-origins-by-region", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const data = await pipedriveCache.getTopOriginsByRegion();
      res.json(data);
    } catch (error) {
      console.error("Error fetching top origins by region:", error);
      res.status(500).json({ error: "Failed to fetch top origins" });
    }
  });

  // Get sales cycle by region
  app.get("/api/dashboard/sales-cycle-by-region", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const data = await pipedriveCache.getSalesCycleByRegion();
      res.json(data);
    } catch (error) {
      console.error("Error fetching sales cycle by region:", error);
      res.status(500).json({ error: "Failed to fetch sales cycle" });
    }
  });

  // Get regional data from cache
  app.get("/api/dashboard/regional-data", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      const teamId = req.query.teamId as string | undefined;
      const personId = req.query.personId as string | undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
        teamId: teamId ? parseInt(teamId) : undefined,
        personId: personId ? parseInt(personId) : undefined,
      };
      
      const data = await pipedriveCache.getCachedRegionalData(filters);
      res.json(data);
    } catch (error) {
      console.error("Error fetching regional data from cache:", error);
      res.status(500).json({ error: "Failed to fetch regional data" });
    }
  });

  // Get company size distribution from Pipedrive cache (by Q de empleados field)
  app.get("/api/dashboard/company-size-distribution", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      const teamId = req.query.teamId as string | undefined;
      const personId = req.query.personId as string | undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
        teamId: teamId ? parseInt(teamId) : undefined,
        personId: personId ? parseInt(personId) : undefined,
      };
      
      const distribution = await pipedriveCache.getCachedEmployeeCountDistribution(filters);
      res.json(distribution);
    } catch (error) {
      console.error("Error fetching company size distribution:", error);
      res.status(500).json({ error: "Failed to fetch company size distribution" });
    }
  });

  // Get source distribution from Pipedrive cache (by source field)
  app.get("/api/dashboard/source-distribution", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      const teamId = req.query.teamId as string | undefined;
      const personId = req.query.personId as string | undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
        teamId: teamId ? parseInt(teamId) : undefined,
        personId: personId ? parseInt(personId) : undefined,
      };
      
      const distribution = await pipedriveCache.getSourceDistribution(filters);
      res.json(distribution);
    } catch (error) {
      console.error("Error fetching source distribution:", error);
      res.status(500).json({ error: "Failed to fetch source distribution" });
    }
  });

  // Get conversion funnel data
  app.get("/api/dashboard/conversion-funnel", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      const teamId = req.query.teamId as string | undefined;
      const personId = req.query.personId as string | undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
        teamId: teamId ? parseInt(teamId) : undefined,
        personId: personId ? parseInt(personId) : undefined,
      };
      
      const funnel = await pipedriveCache.getCachedConversionFunnel(filters);
      res.json(funnel);
    } catch (error) {
      console.error("Error fetching conversion funnel:", error);
      res.status(500).json({ error: "Failed to fetch conversion funnel" });
    }
  });

  // Get loss reasons data
  app.get("/api/dashboard/loss-reasons", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      const teamId = req.query.teamId as string | undefined;
      const personId = req.query.personId as string | undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dealType: req.query.dealType as string | undefined,
        countries,
        origins,
        teamId: teamId ? parseInt(teamId) : undefined,
        personId: personId ? parseInt(personId) : undefined,
      };
      
      const lossReasons = await pipedriveCache.getCachedLossReasons(filters);
      res.json(lossReasons);
    } catch (error) {
      console.error("Error fetching loss reasons:", error);
      res.status(500).json({ error: "Failed to fetch loss reasons" });
    }
  });

  // Get direct meetings data (Directo Inbound + Outbound)
  app.get("/api/dashboard/direct-meetings", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      
      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        personId: req.query.personId ? parseInt(req.query.personId as string) : undefined,
        teamId: req.query.teamId ? parseInt(req.query.teamId as string) : undefined,
        countries,
        origins,
        dealType: req.query.dealType as string | undefined,
      };
      const data = await pipedriveCache.getDirectMeetingsData(filters);
      res.json(data);
    } catch (error) {
      console.error("Error fetching direct meetings:", error);
      res.status(500).json({ error: "Failed to fetch direct meetings" });
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

  app.post("/api/teams", async (req, res) => {
    try {
      const { name, displayName } = req.body;
      if (!name || !displayName) {
        return res.status(400).json({ error: "Name and displayName are required" });
      }
      const team = await storage.createTeam({ name, displayName });
      res.json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  app.get("/api/people", async (req, res) => {
    try {
      const users = await pipedrive.getUsers();
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

  app.get("/api/people/with-teams", async (req, res) => {
    try {
      const peopleWithTeams = await storage.getAllPeopleWithTeams();
      res.json(peopleWithTeams);
    } catch (error) {
      console.error("Error fetching people with teams:", error);
      res.status(500).json({ error: "Failed to fetch people with teams" });
    }
  });

  app.put("/api/people/:id/team", async (req, res) => {
    try {
      const personId = parseInt(req.params.id);
      const { teamId } = req.body;
      await storage.updatePersonTeam(personId, teamId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating person team:", error);
      res.status(500).json({ error: "Failed to update person team" });
    }
  });

  app.post("/api/people", async (req, res) => {
    try {
      const { pipedriveUserId, displayName, teamId } = req.body;
      const person = await storage.addPerson(pipedriveUserId, displayName, teamId);
      res.json(person);
    } catch (error) {
      console.error("Error adding person:", error);
      res.status(500).json({ error: "Failed to add person" });
    }
  });

  app.get("/api/sources", async (req, res) => {
    try {
      const ORIGEN_FIELD_KEY = "a9241093db8147d20f4c1c7f6c1998477f819ef4";
      const dealFields = await pipedrive.getDealFields();
      const originField = dealFields.find((f: any) => f.key === ORIGEN_FIELD_KEY);
      const originOptions = originField?.options || [];
      const sources = originOptions.map((o: any) => ({
        id: o.id,
        name: o.label,
        displayName: o.label
      }));
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

  // Get deals for modal
  app.get("/api/dashboard/deals", isAuthenticated, requireWisecxDomain, async (req, res) => {
    try {
      const countriesParam = req.query.countries as string | undefined;
      const countries = countriesParam ? countriesParam.split(',') : undefined;
      const originsParam = req.query.sources as string | undefined;
      const origins = originsParam ? originsParam.split(',') : undefined;
      const teamId = req.query.teamId as string | undefined;
      const personId = req.query.personId as string | undefined;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        status: req.query.status as string | undefined,
        dealType: req.query.dealType as string | undefined,
        metricType: req.query.metricType as string | undefined,
        countries,
        origins,
        teamId: teamId ? parseInt(teamId) : undefined,
        personId: personId ? parseInt(personId) : undefined,
      };
      
      const deals = await pipedriveCache.getCachedDealsForModal(filters);
      res.json(deals);
    } catch (error) {
      console.error("Error fetching deals for modal:", error);
      res.status(500).json({ error: "Failed to fetch deals" });
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
