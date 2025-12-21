const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
const PIPEDRIVE_BASE_URL = "https://api.pipedrive.com/v1";

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

export async function getAllDeals(): Promise<PipedriveDeal[]> {
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
export async function getPipedriveDashboardMetrics(filters?: { startDate?: string; endDate?: string; userId?: number }) {
  try {
    const [allDeals, wonDeals, activities, users] = await Promise.all([
      getAllDeals(),
      getWonDeals(filters?.startDate, filters?.endDate),
      getAllActivities(),
      getUsers(),
    ]);

    // Filter by user if specified
    let filteredDeals = allDeals;
    let filteredWonDeals = wonDeals;
    let filteredActivities = activities;

    if (filters?.userId) {
      filteredDeals = allDeals.filter(d => {
        const userId = typeof d.user_id === 'object' ? d.user_id.id : d.user_id;
        return userId === filters.userId;
      });
      filteredWonDeals = wonDeals.filter(d => {
        const userId = typeof d.user_id === 'object' ? d.user_id.id : d.user_id;
        return userId === filters.userId;
      });
      filteredActivities = activities.filter(a => a.user_id === filters.userId);
    }

    // Filter by date
    if (filters?.startDate || filters?.endDate) {
      filteredDeals = filteredDeals.filter(deal => {
        const addTime = new Date(deal.add_time);
        if (filters?.startDate && addTime < new Date(filters.startDate)) return false;
        if (filters?.endDate && addTime > new Date(filters.endDate)) return false;
        return true;
      });
      
      filteredActivities = filteredActivities.filter(activity => {
        const addTime = new Date(activity.add_time);
        if (filters?.startDate && addTime < new Date(filters.startDate)) return false;
        if (filters?.endDate && addTime > new Date(filters.endDate)) return false;
        return true;
      });
    }

    // Calculate metrics
    const openDeals = filteredDeals.filter(d => d.status === "open");
    const lostDeals = filteredDeals.filter(d => d.status === "lost");
    
    const totalRevenue = filteredWonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const meetings = filteredActivities.filter(a => a.type === "meeting" && a.done).length;
    const logos = filteredWonDeals.length;
    
    // Closure rate: won / (won + lost)
    const closedDeals = filteredWonDeals.length + lostDeals.length;
    const closureRate = closedDeals > 0 ? (filteredWonDeals.length / closedDeals) * 100 : 0;

    // Average sales cycle (days from add_time to won_time)
    const salesCycles = filteredWonDeals
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

// Get rankings by user
export async function getRankingsByUser(filters?: { startDate?: string; endDate?: string }) {
  const [wonDeals, users] = await Promise.all([
    getWonDeals(filters?.startDate, filters?.endDate),
    getUsers(),
  ]);

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

// Get revenue history (grouped by day/week/month)
export async function getRevenueHistory(filters?: { startDate?: string; endDate?: string }) {
  const wonDeals = await getWonDeals(filters?.startDate, filters?.endDate);

  const dailyRevenue: Record<string, number> = {};
  
  wonDeals.forEach(deal => {
    if (deal.won_time) {
      const date = deal.won_time.split(" ")[0]; // YYYY-MM-DD
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (deal.value || 0);
    }
  });

  return Object.entries(dailyRevenue)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
}

// Get meetings history
export async function getMeetingsHistory(filters?: { startDate?: string; endDate?: string }) {
  const activities = await getAllActivities();
  
  let filteredActivities = activities.filter(a => a.type === "meeting");
  
  if (filters?.startDate || filters?.endDate) {
    filteredActivities = filteredActivities.filter(activity => {
      const dueDate = new Date(activity.due_date);
      if (filters?.startDate && dueDate < new Date(filters.startDate)) return false;
      if (filters?.endDate && dueDate > new Date(filters.endDate)) return false;
      return true;
    });
  }

  const dailyMeetings: Record<string, { done: number; total: number }> = {};
  
  filteredActivities.forEach(activity => {
    const date = activity.due_date;
    if (!dailyMeetings[date]) {
      dailyMeetings[date] = { done: 0, total: 0 };
    }
    dailyMeetings[date].total++;
    if (activity.done) {
      dailyMeetings[date].done++;
    }
  });

  return Object.entries(dailyMeetings)
    .map(([date, data]) => ({ date, value: data.done, value2: data.total - data.done }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
}
