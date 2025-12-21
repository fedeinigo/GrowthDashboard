import { 
  type User, 
  type InsertUser,
  type Team,
  type InsertTeam,
  type Person,
  type InsertPerson,
  type Source,
  type InsertSource,
  type Product,
  type InsertProduct,
  type Region,
  type InsertRegion,
  type Lead,
  type InsertLead,
  type Activity,
  type InsertActivity,
  type Sale,
  type InsertSale,
  teams,
  people,
  sources,
  products,
  regions,
  leads,
  activities,
  sales,
  users
} from "@shared/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { db } from "./db";

export interface DashboardFilters {
  teamId?: number;
  personId?: number;
  sourceId?: number;
  regionId?: number;
  startDate?: string;
  endDate?: string;
}

export interface DashboardMetrics {
  closureRate: number;
  previousClosureRate: number;
  meetings: number;
  previousMeetings: number;
  revenue: number;
  previousRevenue: number;
  logos: number;
  previousLogos: number;
  avgSalesCycle: number;
  previousAvgSalesCycle: number;
  companySize: string;
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Teams
  getAllTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;

  // People
  getAllPeople(): Promise<Person[]>;
  getPerson(id: number): Promise<Person | undefined>;
  createPerson(person: InsertPerson): Promise<Person>;

  // Sources
  getAllSources(): Promise<Source[]>;
  getSource(id: number): Promise<Source | undefined>;
  createSource(source: InsertSource): Promise<Source>;

  // Products
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Regions
  getAllRegions(): Promise<Region[]>;
  getRegion(id: number): Promise<Region | undefined>;
  createRegion(region: InsertRegion): Promise<Region>;

  // Leads
  getAllLeads(filters?: DashboardFilters): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;

  // Activities
  getActivitiesByLead(leadId: number): Promise<Activity[]>;
  getAllActivities(filters?: DashboardFilters): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Sales
  getSalesByLead(leadId: number): Promise<Sale[]>;
  getAllSales(filters?: DashboardFilters): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;

  // Dashboard Metrics
  getDashboardMetrics(filters?: DashboardFilters): Promise<DashboardMetrics>;
  getRevenueHistory(filters?: DashboardFilters): Promise<{ date: string; value: number }[]>;
  getMeetingsHistory(filters?: DashboardFilters): Promise<{ date: string; value: number; value2: number }[]>;
  getClosureRateHistory(filters?: DashboardFilters): Promise<{ date: string; value: number }[]>;
  getProductStats(filters?: DashboardFilters): Promise<{ name: string; category: string; sold: number; revenue: number }[]>;
  getRankingsByTeam(filters?: DashboardFilters): Promise<{ name: string; value: number }[]>;
  getRankingsByPerson(filters?: DashboardFilters): Promise<{ name: string; value: number }[]>;
  getRankingsBySource(filters?: DashboardFilters): Promise<{ name: string; value: number }[]>;
  getRegionalData(filters?: DashboardFilters): Promise<any[]>;
  getCompanySizeDistribution(filters?: DashboardFilters): Promise<{ date: string; value: number }[]>;
}

export class PgStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Teams
  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
    return result[0];
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const result = await db.insert(teams).values(team).returning();
    return result[0];
  }

  // People
  async getAllPeople(): Promise<Person[]> {
    return await db.select().from(people);
  }

  async getPerson(id: number): Promise<Person | undefined> {
    const result = await db.select().from(people).where(eq(people.id, id)).limit(1);
    return result[0];
  }

  async createPerson(person: InsertPerson): Promise<Person> {
    const result = await db.insert(people).values(person).returning();
    return result[0];
  }

  // Sources
  async getAllSources(): Promise<Source[]> {
    return await db.select().from(sources);
  }

  async getSource(id: number): Promise<Source | undefined> {
    const result = await db.select().from(sources).where(eq(sources.id, id)).limit(1);
    return result[0];
  }

  async createSource(source: InsertSource): Promise<Source> {
    const result = await db.insert(sources).values(source).returning();
    return result[0];
  }

  // Products
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  // Regions
  async getAllRegions(): Promise<Region[]> {
    return await db.select().from(regions);
  }

  async getRegion(id: number): Promise<Region | undefined> {
    const result = await db.select().from(regions).where(eq(regions.id, id)).limit(1);
    return result[0];
  }

  async createRegion(region: InsertRegion): Promise<Region> {
    const result = await db.insert(regions).values(region).returning();
    return result[0];
  }

  // Leads
  async getAllLeads(filters?: DashboardFilters): Promise<Lead[]> {
    let query = db.select().from(leads);
    
    const conditions = [];
    if (filters?.teamId) conditions.push(eq(leads.teamId, filters.teamId));
    if (filters?.personId) conditions.push(eq(leads.assignedToId, filters.personId));
    if (filters?.sourceId) conditions.push(eq(leads.sourceId, filters.sourceId));
    if (filters?.regionId) conditions.push(eq(leads.regionId, filters.regionId));
    if (filters?.startDate) conditions.push(gte(leads.createdAt, new Date(filters.startDate)));
    if (filters?.endDate) conditions.push(lte(leads.createdAt, new Date(filters.endDate)));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query;
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    return result[0];
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const result = await db.insert(leads).values(lead).returning();
    return result[0];
  }

  async updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    const result = await db.update(leads).set(lead).where(eq(leads.id, id)).returning();
    return result[0];
  }

  // Activities
  async getActivitiesByLead(leadId: number): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.leadId, leadId));
  }

  async getAllActivities(filters?: DashboardFilters): Promise<Activity[]> {
    const leadsSubquery = this.buildLeadsFilter(filters);
    
    return await db.select().from(activities)
      .innerJoin(leads, eq(activities.leadId, leads.id))
      .where(sql`${leads.id} IN (${leadsSubquery})`);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const result = await db.insert(activities).values(activity).returning();
    return result[0];
  }

  // Sales
  async getSalesByLead(leadId: number): Promise<Sale[]> {
    return await db.select().from(sales).where(eq(sales.leadId, leadId));
  }

  async getAllSales(filters?: DashboardFilters): Promise<Sale[]> {
    const leadsSubquery = this.buildLeadsFilter(filters);
    
    return await db.select().from(sales)
      .innerJoin(leads, eq(sales.leadId, leads.id))
      .where(sql`${leads.id} IN (${leadsSubquery})`);
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const result = await db.insert(sales).values(sale).returning();
    return result[0];
  }

  // Helper method for building leads filter
  private buildLeadsFilter(filters?: DashboardFilters) {
    const conditions = [];
    if (filters?.teamId) conditions.push(eq(leads.teamId, filters.teamId));
    if (filters?.personId) conditions.push(eq(leads.assignedToId, filters.personId));
    if (filters?.sourceId) conditions.push(eq(leads.sourceId, filters.sourceId));
    if (filters?.regionId) conditions.push(eq(leads.regionId, filters.regionId));
    if (filters?.startDate) conditions.push(gte(leads.createdAt, new Date(filters.startDate)));
    if (filters?.endDate) conditions.push(lte(leads.createdAt, new Date(filters.endDate)));

    let query = db.select({ id: leads.id }).from(leads);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return query;
  }

  // Dashboard Metrics
  async getDashboardMetrics(filters?: DashboardFilters): Promise<DashboardMetrics> {
    // Get current period leads
    const currentLeads = await this.getAllLeads(filters);
    
    // Calculate previous period (simple: 30 days back from current period)
    const previousFilters = filters ? { ...filters } : {};
    if (filters?.startDate && filters?.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      const diff = end.getTime() - start.getTime();
      previousFilters.startDate = new Date(start.getTime() - diff).toISOString();
      previousFilters.endDate = filters.startDate;
    }
    
    const closedWonLeads = currentLeads.filter(l => l.status === 'closed-won');
    const totalRevenue = closedWonLeads.reduce((sum, l) => sum + Number(l.dealValue || 0), 0);
    
    // Meetings count
    const currentActivities = await this.getAllActivities(filters);
    const meetings = currentActivities.filter(a => a.type === 'meeting').length;
    
    // Previous period metrics
    const previousLeads = await this.getAllLeads(previousFilters);
    const previousClosedWonLeads = previousLeads.filter(l => l.status === 'closed-won');
    const previousRevenue = previousClosedWonLeads.reduce((sum, l) => sum + Number(l.dealValue || 0), 0);
    
    const previousActivities = await this.getAllActivities(previousFilters);
    const previousMeetings = previousActivities.filter(a => a.type === 'meeting').length;
    
    // Closure rate
    const proposals = currentLeads.filter(l => l.status === 'proposal' || l.status === 'closed-won' || l.status === 'closed-lost').length;
    const closureRate = proposals > 0 ? (closedWonLeads.length / proposals) * 100 : 0;
    
    const previousProposals = previousLeads.filter(l => l.status === 'proposal' || l.status === 'closed-won' || l.status === 'closed-lost').length;
    const previousClosureRate = previousProposals > 0 ? (previousClosedWonLeads.length / previousProposals) * 100 : 0;
    
    // Average sales cycle
    const salesCycles = closedWonLeads
      .map(l => {
        const created = new Date(l.createdAt).getTime();
        const now = Date.now();
        return (now - created) / (1000 * 60 * 60 * 24); // days
      })
      .filter(d => d > 0);
    const avgSalesCycle = salesCycles.length > 0 ? salesCycles.reduce((a, b) => a + b, 0) / salesCycles.length : 0;
    
    const previousSalesCycles = previousClosedWonLeads
      .map(l => {
        const created = new Date(l.createdAt).getTime();
        const end = filters?.startDate ? new Date(filters.startDate).getTime() : Date.now();
        return (end - created) / (1000 * 60 * 60 * 24);
      })
      .filter(d => d > 0);
    const previousAvgSalesCycle = previousSalesCycles.length > 0 ? previousSalesCycles.reduce((a, b) => a + b, 0) / previousSalesCycles.length : 0;
    
    // Most common company size
    const sizes = currentLeads.map(l => l.companySize);
    const sizeCounts = sizes.reduce((acc, size) => {
      acc[size] = (acc[size] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const companySize = Object.entries(sizeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      closureRate: Math.round(closureRate * 10) / 10,
      previousClosureRate: Math.round(previousClosureRate * 10) / 10,
      meetings,
      previousMeetings,
      revenue: totalRevenue,
      previousRevenue,
      logos: closedWonLeads.length,
      previousLogos: previousClosedWonLeads.length,
      avgSalesCycle: Math.round(avgSalesCycle),
      previousAvgSalesCycle: Math.round(previousAvgSalesCycle),
      companySize,
    };
  }

  async getRevenueHistory(filters?: DashboardFilters): Promise<{ date: string; value: number }[]> {
    // Simplified: group by day
    const allLeads = await this.getAllLeads(filters);
    const closedWonLeads = allLeads.filter(l => l.status === 'closed-won');
    
    const dailyRevenue: Record<string, number> = {};
    closedWonLeads.forEach(lead => {
      const date = new Date(lead.createdAt).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + Number(lead.dealValue || 0);
    });
    
    return Object.entries(dailyRevenue)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  }

  async getMeetingsHistory(filters?: DashboardFilters): Promise<{ date: string; value: number; value2: number }[]> {
    const allActivities = await this.getAllActivities(filters);
    const meetings = allActivities.filter(a => a.type === 'meeting');
    
    const dailyMeetings: Record<string, number> = {};
    meetings.forEach(activity => {
      const date = activity.date;
      dailyMeetings[date] = (dailyMeetings[date] || 0) + 1;
    });
    
    return Object.entries(dailyMeetings)
      .map(([date, value]) => ({ date, value, value2: Math.floor(value * 0.2) }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
  }

  async getClosureRateHistory(filters?: DashboardFilters): Promise<{ date: string; value: number }[]> {
    // Simplified weekly closure rates
    const allLeads = await this.getAllLeads(filters);
    
    // Group by week
    const weeklyData: Record<string, { proposals: number; closed: number }> = {};
    allLeads.forEach(lead => {
      const date = new Date(lead.createdAt);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { proposals: 0, closed: 0 };
      }
      
      if (['proposal', 'closed-won', 'closed-lost'].includes(lead.status)) {
        weeklyData[weekKey].proposals++;
        if (lead.status === 'closed-won') {
          weeklyData[weekKey].closed++;
        }
      }
    });
    
    return Object.entries(weeklyData)
      .map(([date, data]) => ({
        date,
        value: data.proposals > 0 ? (data.closed / data.proposals) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12);
  }

  async getProductStats(filters?: DashboardFilters): Promise<{ name: string; category: string; sold: number; revenue: number }[]> {
    const allSales = await this.getAllSales(filters);
    const allProducts = await this.getAllProducts();
    
    const productMap: Record<number, { name: string; category: string; sold: number; revenue: number }> = {};
    
    allProducts.forEach(product => {
      productMap[product.id] = {
        name: product.name,
        category: product.category,
        sold: 0,
        revenue: 0,
      };
    });
    
    allSales.forEach(sale => {
      if (productMap[sale.productId]) {
        productMap[sale.productId].sold += sale.quantity;
        productMap[sale.productId].revenue += Number(sale.revenue);
      }
    });
    
    return Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
  }

  async getRankingsByTeam(filters?: DashboardFilters): Promise<{ name: string; value: number }[]> {
    const allLeads = await this.getAllLeads(filters);
    const allTeams = await this.getAllTeams();
    
    const teamRevenue: Record<number, number> = {};
    allLeads.filter(l => l.status === 'closed-won').forEach(lead => {
      if (lead.teamId) {
        teamRevenue[lead.teamId] = (teamRevenue[lead.teamId] || 0) + Number(lead.dealValue || 0);
      }
    });
    
    return allTeams
      .map(team => ({
        name: team.displayName,
        value: teamRevenue[team.id] || 0,
      }))
      .sort((a, b) => b.value - a.value);
  }

  async getRankingsByPerson(filters?: DashboardFilters): Promise<{ name: string; value: number }[]> {
    const allLeads = await this.getAllLeads(filters);
    const allPeople = await this.getAllPeople();
    
    const personRevenue: Record<number, number> = {};
    allLeads.filter(l => l.status === 'closed-won').forEach(lead => {
      if (lead.assignedToId) {
        personRevenue[lead.assignedToId] = (personRevenue[lead.assignedToId] || 0) + Number(lead.dealValue || 0);
      }
    });
    
    return allPeople
      .map(person => ({
        name: person.displayName,
        value: personRevenue[person.id] || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }

  async getRankingsBySource(filters?: DashboardFilters): Promise<{ name: string; value: number }[]> {
    const allLeads = await this.getAllLeads(filters);
    const allSources = await this.getAllSources();
    
    const sourceRevenue: Record<number, number> = {};
    allLeads.filter(l => l.status === 'closed-won').forEach(lead => {
      if (lead.sourceId) {
        sourceRevenue[lead.sourceId] = (sourceRevenue[lead.sourceId] || 0) + Number(lead.dealValue || 0);
      }
    });
    
    return allSources
      .map(source => ({
        name: source.displayName,
        value: sourceRevenue[source.id] || 0,
      }))
      .sort((a, b) => b.value - a.value);
  }

  async getRegionalData(filters?: DashboardFilters): Promise<any[]> {
    const allLeads = await this.getAllLeads(filters);
    const allRegions = await this.getAllRegions();
    const allSources = await this.getAllSources();
    const allActivities = await this.getAllActivities(filters);
    
    return allRegions.map(region => {
      const regionLeads = allLeads.filter(l => l.regionId === region.id);
      const regionActivities = allActivities.filter(a => {
        const lead = allLeads.find(l => l.id === a.leadId);
        return lead?.regionId === region.id;
      });
      
      // Group by source within region
      const sourceData = allSources.map(source => {
        const sourceLeads = regionLeads.filter(l => l.sourceId === source.id);
        const sourceMeetings = regionActivities.filter(a => {
          const lead = sourceLeads.find(l => l.id === a.leadId);
          return lead && a.type === 'meeting';
        }).length;
        
        const proposals = regionActivities.filter(a => {
          const lead = sourceLeads.find(l => l.id === a.leadId);
          return lead && a.type === 'proposal';
        });
        
        const closings = sourceLeads.filter(l => l.status === 'closed-won');
        
        const proposalsValue = proposals.reduce((sum, a) => sum + Number(a.value || 0), 0);
        const closingsValue = closings.reduce((sum, l) => sum + Number(l.dealValue || 0), 0);
        
        return {
          origin: source.displayName,
          meetings: sourceMeetings,
          proposals: proposals.length,
          closings: closings.length,
          proposalsValue,
          closingsValue,
        };
      }).filter(s => s.meetings > 0 || s.proposals > 0 || s.closings > 0);
      
      return {
        region: region.name,
        rows: sourceData,
      };
    }).filter(r => r.rows.length > 0);
  }

  async getCompanySizeDistribution(filters?: DashboardFilters): Promise<{ date: string; value: number }[]> {
    const allLeads = await this.getAllLeads(filters);
    
    const sizes: Record<string, number> = {};
    allLeads.forEach(lead => {
      sizes[lead.companySize] = (sizes[lead.companySize] || 0) + 1;
    });
    
    const sizeOrder = ['1-10', '11-50', '51-200', '201-500', '500+'];
    return sizeOrder.map(size => ({
      date: size,
      value: sizes[size] || 0,
    }));
  }
}

export const storage = new PgStorage();
