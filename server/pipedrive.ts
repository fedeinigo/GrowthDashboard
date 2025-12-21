const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
const PIPEDRIVE_BASE_URL = "https://api.pipedrive.com/v1";

// Constants for Pipedrive configuration
export const DEALS_PIPELINE_ID = 1; // The "Deals" pipeline
export const TYPE_OF_DEAL_FIELD_KEY = "a7ab0c5cfbfd5a57ce6531b4aa0a74b317c4b657";
export const DEAL_TYPES = {
  NEW_CUSTOMER: "13",
  UPSELLING: "14",
} as const;

async function pipedriveRequest(endpoint: string, params: Record<string, string> = {}) {
  if (!PIPEDRIVE_API_TOKEN) {
    throw new Error("PIPEDRIVE_API_TOKEN is not set");
  }

  const url = new URL(`${PIPEDRIVE_BASE_URL}${endpoint}`);
  url.searchParams.append("api_token", PIPEDRIVE_API_TOKEN);
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Pipedrive API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export interface PipedriveDeal {
  id: number;
  title: string;
  value: number;
  currency: string;
  status: "open" | "won" | "lost" | "deleted";
  add_time: string;
  update_time: string;
  won_time: string | null;
  lost_time: string | null;
  close_time: string | null;
  stage_id: number;
  pipeline_id: number;
  user_id: { id: number; name: string; email: string } | number;
  org_id: { value: number; name: string } | null;
  person_id: { value: number; name: string } | null;
}

export interface PipedriveActivity {
  id: number;
  type: string;
  subject: string;
  done: boolean;
  due_date: string;
  due_time: string | null;
  add_time: string;
  update_time: string;
  deal_id: number | null;
  user_id: number;
  org_id: number | null;
  person_id: number | null;
}

export interface PipedriveUser {
  id: number;
  name: string;
  email: string;
  active_flag: boolean;
}

export interface PipedrivePipeline {
  id: number;
  name: string;
  active: boolean;
}

export interface PipedriveStage {
  id: number;
  name: string;
  pipeline_id: number;
  order_nr: number;
}

export async function getDeals(params: { status?: string; start?: number; limit?: number } = {}): Promise<PipedriveDeal[]> {
  const queryParams: Record<string, string> = {
    limit: (params.limit || 500).toString(),
  };
  if (params.status) queryParams.status = params.status;
  if (params.start) queryParams.start = params.start.toString();

  const response = await pipedriveRequest("/deals", queryParams);
  return response.data || [];
}

export async function getAllDeals(pipelineId?: number): Promise<PipedriveDeal[]> {
  let allDeals: PipedriveDeal[] = [];
  let start = 0;
  const limit = 500;
  let hasMore = true;

  while (hasMore) {
    const response = await pipedriveRequest("/deals", {
      start: start.toString(),
      limit: limit.toString(),
    });

    if (response.data && response.data.length > 0) {
      allDeals = allDeals.concat(response.data);
      start += limit;
      hasMore = response.additional_data?.pagination?.more_items_in_collection || false;
    } else {
      hasMore = false;
    }
  }

  // Filter by pipeline if specified
  if (pipelineId !== undefined) {
    allDeals = allDeals.filter(deal => deal.pipeline_id === pipelineId);
  }

  return allDeals;
}

export async function getWonDeals(startDate?: string, endDate?: string): Promise<PipedriveDeal[]> {
  const response = await pipedriveRequest("/deals", {
    status: "won",
    limit: "500",
  });
  
  let deals = response.data || [];
  
  // Filter by date if provided
  if (startDate || endDate) {
    deals = deals.filter((deal: PipedriveDeal) => {
      const wonTime = deal.won_time ? new Date(deal.won_time) : null;
      if (!wonTime) return false;
      
      if (startDate && wonTime < new Date(startDate)) return false;
      if (endDate && wonTime > new Date(endDate)) return false;
      return true;
    });
  }
  
  return deals;
}

export async function getActivities(params: { type?: string; start?: number; limit?: number; done?: boolean } = {}): Promise<PipedriveActivity[]> {
  const queryParams: Record<string, string> = {
    limit: (params.limit || 500).toString(),
  };
  if (params.type) queryParams.type = params.type;
  if (params.start) queryParams.start = params.start.toString();
  if (params.done !== undefined) queryParams.done = params.done ? "1" : "0";

  const response = await pipedriveRequest("/activities", queryParams);
  return response.data || [];
}

export async function getAllActivities(): Promise<PipedriveActivity[]> {
  let allActivities: PipedriveActivity[] = [];
  let start = 0;
  const limit = 500;
  let hasMore = true;

  while (hasMore) {
    const response = await pipedriveRequest("/activities", {
      start: start.toString(),
      limit: limit.toString(),
    });

    if (response.data && response.data.length > 0) {
      allActivities = allActivities.concat(response.data);
      start += limit;
      hasMore = response.additional_data?.pagination?.more_items_in_collection || false;
    } else {
      hasMore = false;
    }
  }

  return allActivities;
}

export async function getUsers(): Promise<PipedriveUser[]> {
  const response = await pipedriveRequest("/users");
  return response.data || [];
}

export async function getPipelines(): Promise<PipedrivePipeline[]> {
  const response = await pipedriveRequest("/pipelines");
  return response.data || [];
}

export async function getStages(): Promise<PipedriveStage[]> {
  const response = await pipedriveRequest("/stages");
  return response.data || [];
}

export async function getDealsSummary(status?: string): Promise<any> {
  const queryParams: Record<string, string> = {};
  if (status) queryParams.status = status;
  
  const response = await pipedriveRequest("/deals/summary", queryParams);
  return response.data;
}

export async function getActivityTypes(): Promise<any[]> {
  const response = await pipedriveRequest("/activityTypes");
  return response.data || [];
}

// Helper to get dashboard metrics from Pipedrive
export async function getPipedriveDashboardMetrics(filters?: { 
  startDate?: string; 
  endDate?: string; 
  userId?: number;
  dealType?: string;
}) {
  try {
    // Only get deals from the "Deals" pipeline (id=1)
    const [allDeals, users] = await Promise.all([
      getAllDeals(DEALS_PIPELINE_ID),
      getUsers(),
    ]);

    // Filter by user if specified
    let filteredDeals = allDeals;

    if (filters?.userId) {
      filteredDeals = filteredDeals.filter(d => {
        const userId = typeof d.user_id === 'object' ? d.user_id.id : d.user_id;
        return userId === filters.userId;
      });
    }

    // Filter by deal type if specified
    if (filters?.dealType) {
      filteredDeals = filteredDeals.filter(d => {
        const dealTypeValue = (d as any)[TYPE_OF_DEAL_FIELD_KEY];
        return dealTypeValue === filters.dealType;
      });
    }

    // Filter won/lost deals by close date (won_time or lost_time)
    const wonDeals = filteredDeals.filter(d => {
      if (d.status !== "won") return false;
      if (!d.won_time) return false;
      const wonTime = new Date(d.won_time);
      if (filters?.startDate && wonTime < new Date(filters.startDate)) return false;
      if (filters?.endDate && wonTime > new Date(filters.endDate)) return false;
      return true;
    });

    const lostDeals = filteredDeals.filter(d => {
      if (d.status !== "lost") return false;
      const lostTime = d.lost_time ? new Date(d.lost_time) : null;
      if (!lostTime) return false;
      if (filters?.startDate && lostTime < new Date(filters.startDate)) return false;
      if (filters?.endDate && lostTime > new Date(filters.endDate)) return false;
      return true;
    });

    // Open deals (for reference)
    const openDeals = filteredDeals.filter(d => d.status === "open");

    // Calculate metrics
    const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const logos = wonDeals.length;
    
    // Closure rate: Won / (Won + Lost) - NOT including open deals
    const closedDeals = wonDeals.length + lostDeals.length;
    const closureRate = closedDeals > 0 ? (wonDeals.length / closedDeals) * 100 : 0;

    // Meetings: Count New Customer deals created in the period
    const newCustomerDeals = filteredDeals.filter(d => {
      const dealTypeValue = (d as any)[TYPE_OF_DEAL_FIELD_KEY];
      if (dealTypeValue !== DEAL_TYPES.NEW_CUSTOMER) return false;
      const addTime = new Date(d.add_time);
      if (filters?.startDate && addTime < new Date(filters.startDate)) return false;
      if (filters?.endDate && addTime > new Date(filters.endDate)) return false;
      return true;
    });
    const meetings = newCustomerDeals.length;

    // Average sales cycle (days from add_time to won_time)
    const salesCycles = wonDeals
      .filter(d => d.won_time)
      .map(d => {
        const addTime = new Date(d.add_time).getTime();
        const wonTime = new Date(d.won_time!).getTime();
        return (wonTime - addTime) / (1000 * 60 * 60 * 24);
      })
      .filter(days => days > 0);
    const avgSalesCycle = salesCycles.length > 0 
      ? salesCycles.reduce((a, b) => a + b, 0) / salesCycles.length 
      : 0;

    return {
      closureRate: Math.round(closureRate * 10) / 10,
      previousClosureRate: 0,
      meetings,
      previousMeetings: 0,
      revenue: totalRevenue,
      previousRevenue: 0,
      logos,
      previousLogos: 0,
      avgSalesCycle: Math.round(avgSalesCycle),
      previousAvgSalesCycle: 0,
      companySize: "N/A",
      openDeals: openDeals.length,
      totalDeals: filteredDeals.length,
    };
  } catch (error) {
    console.error("Error fetching Pipedrive metrics:", error);
    throw error;
  }
}

// Get rankings by user (only from Deals pipeline)
export async function getRankingsByUser(filters?: { startDate?: string; endDate?: string; dealType?: string }) {
  const [allDeals, users] = await Promise.all([
    getAllDeals(DEALS_PIPELINE_ID),
    getUsers(),
  ]);

  // Filter won deals by date
  let wonDeals = allDeals.filter(d => {
    if (d.status !== "won") return false;
    if (!d.won_time) return false;
    const wonTime = new Date(d.won_time);
    if (filters?.startDate && wonTime < new Date(filters.startDate)) return false;
    if (filters?.endDate && wonTime > new Date(filters.endDate)) return false;
    return true;
  });

  // Filter by deal type if specified
  if (filters?.dealType) {
    wonDeals = wonDeals.filter(d => {
      const dealTypeValue = (d as any)[TYPE_OF_DEAL_FIELD_KEY];
      return dealTypeValue === filters.dealType;
    });
  }

  const userRevenue: Record<number, number> = {};
  
  wonDeals.forEach(deal => {
    const userId = typeof deal.user_id === 'object' ? deal.user_id.id : deal.user_id;
    userRevenue[userId] = (userRevenue[userId] || 0) + (deal.value || 0);
  });

  return users
    .filter(user => user.active_flag)
    .map(user => ({
      id: user.id,
      name: user.name,
      value: userRevenue[user.id] || 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

// Get revenue history (grouped by day/week/month) - only from Deals pipeline
export async function getRevenueHistory(filters?: { startDate?: string; endDate?: string; dealType?: string }) {
  const allDeals = await getAllDeals(DEALS_PIPELINE_ID);
  
  // Filter won deals by date
  let wonDeals = allDeals.filter(d => {
    if (d.status !== "won") return false;
    if (!d.won_time) return false;
    const wonTime = new Date(d.won_time);
    if (filters?.startDate && wonTime < new Date(filters.startDate)) return false;
    if (filters?.endDate && wonTime > new Date(filters.endDate)) return false;
    return true;
  });

  // Filter by deal type if specified
  if (filters?.dealType) {
    wonDeals = wonDeals.filter(d => {
      const dealTypeValue = (d as any)[TYPE_OF_DEAL_FIELD_KEY];
      return dealTypeValue === filters.dealType;
    });
  }

  const dailyRevenue: Record<string, number> = {};
  
  wonDeals.forEach(deal => {
    if (deal.won_time) {
      const date = deal.won_time.split(" ")[0]; // YYYY-MM-DD
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (deal.value || 0);
    }
  });

  return Object.entries(dailyRevenue)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Get meetings history - counts New Customer deals created per day in Deals pipeline
export async function getMeetingsHistory(filters?: { startDate?: string; endDate?: string; dealType?: string }) {
  const allDeals = await getAllDeals(DEALS_PIPELINE_ID);
  
  // Filter New Customer deals by add_time
  let newCustomerDeals = allDeals.filter(d => {
    const dealTypeValue = (d as any)[TYPE_OF_DEAL_FIELD_KEY];
    if (dealTypeValue !== DEAL_TYPES.NEW_CUSTOMER) return false;
    const addTime = new Date(d.add_time);
    if (filters?.startDate && addTime < new Date(filters.startDate)) return false;
    if (filters?.endDate && addTime > new Date(filters.endDate)) return false;
    return true;
  });

  const dailyMeetings: Record<string, number> = {};
  
  newCustomerDeals.forEach(deal => {
    const date = deal.add_time.split(" ")[0]; // YYYY-MM-DD
    dailyMeetings[date] = (dailyMeetings[date] || 0) + 1;
  });

  return Object.entries(dailyMeetings)
    .map(([date, value]) => ({ date, value, value2: 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Get deal types for filtering
export async function getDealTypes() {
  return [
    { id: DEAL_TYPES.NEW_CUSTOMER, name: "New Customer", displayName: "New Customer" },
    { id: DEAL_TYPES.UPSELLING, name: "Upselling", displayName: "Upselling" },
  ];
}

// Get stats by deal type
export async function getStatsByDealType(filters?: { startDate?: string; endDate?: string }) {
  const allDeals = await getAllDeals(DEALS_PIPELINE_ID);
  
  const dealTypeStats: Record<string, { deals: number; won: number; lost: number; revenue: number }> = {
    [DEAL_TYPES.NEW_CUSTOMER]: { deals: 0, won: 0, lost: 0, revenue: 0 },
    [DEAL_TYPES.UPSELLING]: { deals: 0, won: 0, lost: 0, revenue: 0 },
    "other": { deals: 0, won: 0, lost: 0, revenue: 0 },
  };

  allDeals.forEach(deal => {
    const dealTypeValue = (deal as any)[TYPE_OF_DEAL_FIELD_KEY] || "other";
    const typeKey = dealTypeStats[dealTypeValue] ? dealTypeValue : "other";
    
    // Check date filters for won/lost
    const inDateRange = (date: string | null) => {
      if (!date) return false;
      const d = new Date(date);
      if (filters?.startDate && d < new Date(filters.startDate)) return false;
      if (filters?.endDate && d > new Date(filters.endDate)) return false;
      return true;
    };

    dealTypeStats[typeKey].deals++;
    
    if (deal.status === "won" && inDateRange(deal.won_time)) {
      dealTypeStats[typeKey].won++;
      dealTypeStats[typeKey].revenue += deal.value || 0;
    } else if (deal.status === "lost" && inDateRange(deal.lost_time)) {
      dealTypeStats[typeKey].lost++;
    }
  });

  return [
    { name: "New Customer", deals: dealTypeStats[DEAL_TYPES.NEW_CUSTOMER].deals, won: dealTypeStats[DEAL_TYPES.NEW_CUSTOMER].won, lost: dealTypeStats[DEAL_TYPES.NEW_CUSTOMER].lost, revenue: dealTypeStats[DEAL_TYPES.NEW_CUSTOMER].revenue },
    { name: "Upselling", deals: dealTypeStats[DEAL_TYPES.UPSELLING].deals, won: dealTypeStats[DEAL_TYPES.UPSELLING].won, lost: dealTypeStats[DEAL_TYPES.UPSELLING].lost, revenue: dealTypeStats[DEAL_TYPES.UPSELLING].revenue },
    { name: "Sin Tipo", deals: dealTypeStats["other"].deals, won: dealTypeStats["other"].won, lost: dealTypeStats["other"].lost, revenue: dealTypeStats["other"].revenue },
  ];
}
