const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
const PIPEDRIVE_BASE_URL = "https://api.pipedrive.com/v1";

// Constants for Pipedrive configuration
export const DEALS_PIPELINE_ID = 1; // The "Deals" pipeline
export const TYPE_OF_DEAL_FIELD_KEY = "a7ab0c5cfbfd5a57ce6531b4aa0a74b317c4b657";
export const COUNTRY_FIELD_KEY = "f7c43d98b4ef75192ee0798b360f2076754981b9";
export const ORIGEN_FIELD_KEY = "a9241093db8147d20f4c1c7f6c1998477f819ef4";
export const DEAL_TYPES = {
  NEW_CUSTOMER: "13",
  UPSELLING: "14",
} as const;

export const ORIGEN_OPTIONS: Record<string, string> = {
  "375": "Directo",
  "15": "Directo Inbound",
  "230": "Directo Outbound",
  "741": "Netlife",
  "16": "Telefonica ARG",
  "18": "Telefónica CO",
  "40": "Telefónica PE",
  "171": "Telefonica Chile",
  "368": "Telefonica UY",
  "239": "Telefonica España - TTech",
  "664": "Telefonica España - Acens",
  "762": "Nods",
  "17": "Apex",
  "37": "Ricoh",
  "577": "Solu",
  "578": "Teleperformance",
  "586": "Link Solution",
  "605": "Atento",
  "610": "E3",
  "616": "Telefónica México",
  "617": "Telefónica Ecuador",
  "618": "Agata",
  "619": "Outsourcing",
  "626": "Jelou",
  "628": "Teknio",
  "638": "Lop",
  "649": "Konecta",
  "651": "Pontech",
  "750": "Vtex Colombia",
  "748": "Santex",
  "655": "Tatt",
  "656": "Orsonia",
  "763": "Tecnicom",
  "657": "Idata",
  "666": "Nexa BPO",
  "678": "Intellecta",
  "172": "Agencia COMLatam",
  "718": "AMG Consulting",
  "751": "Vtex - Otros",
  "758": "Patagonia - Franco Roccuzo",
  "759": "Avansa",
  "761": "WoowUp",
  "765": "Mak21",
  "772": "Solvis",
  "773": "Integratel",
  "740": "Govtech - Luciano",
};

export const COUNTRY_OPTIONS = [
  { id: "265", label: "Argentina" },
  { id: "574", label: "Brasil" },
  { id: "274", label: "Bolivia" },
  { id: "575", label: "Canadá" },
  { id: "268", label: "Chile" },
  { id: "267", label: "Colombia" },
  { id: "600", label: "Costa Rica" },
  { id: "272", label: "España" },
  { id: "273", label: "Ecuador" },
  { id: "601", label: "El Salvador" },
  { id: "602", label: "Guatemala" },
  { id: "603", label: "Honduras" },
  { id: "266", label: "Peru" },
  { id: "269", label: "Mexico" },
  { id: "594", label: "Nicaragua" },
  { id: "275", label: "Otros" },
  { id: "271", label: "Paraguay" },
  { id: "391", label: "Panama" },
  { id: "563", label: "República Dominicana" },
  { id: "270", label: "Uruguay" },
  { id: "604", label: "Venezuela" },
];

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
    const params: Record<string, string> = {
      start: start.toString(),
      limit: limit.toString(),
    };
    
    const response = await pipedriveRequest("/deals", params);

    if (response.data && response.data.length > 0) {
      let pageDeals = response.data;
      
      // Filter by pipeline immediately to reduce memory usage
      if (pipelineId !== undefined) {
        pageDeals = pageDeals.filter((deal: PipedriveDeal) => deal.pipeline_id === pipelineId);
      }
      
      allDeals = allDeals.concat(pageDeals);
      start += limit;
      hasMore = response.additional_data?.pagination?.more_items_in_collection || false;
      
      // Safety limit to prevent infinite loops - max 200 pages (100,000 deals)
      if (start >= 100000) {
        hasMore = false;
      }
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

export async function getDealFields(): Promise<any[]> {
  const response = await pipedriveRequest("/dealFields");
  return response.data || [];
}

// Helper to get dashboard metrics from Pipedrive
export async function getPipedriveDashboardMetrics(filters?: { 
  startDate?: string; 
  endDate?: string; 
  userId?: number;
  dealType?: string;
  countries?: string[];
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

    // Filter by countries if specified (multiple selection)
    if (filters?.countries && filters.countries.length > 0) {
      filteredDeals = filteredDeals.filter(d => {
        const countryValue = (d as any)[COUNTRY_FIELD_KEY];
        return filters.countries!.includes(String(countryValue));
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
    
    // Closure rate: Won / (Won + Lost) - Only for New Customer deals
    const wonNewCustomerForClosure = wonDeals.filter(d => {
      const dealTypeValue = (d as any)[TYPE_OF_DEAL_FIELD_KEY];
      return dealTypeValue === DEAL_TYPES.NEW_CUSTOMER;
    });
    const lostNewCustomerForClosure = lostDeals.filter(d => {
      const dealTypeValue = (d as any)[TYPE_OF_DEAL_FIELD_KEY];
      return dealTypeValue === DEAL_TYPES.NEW_CUSTOMER;
    });
    const closedNewCustomerDeals = wonNewCustomerForClosure.length + lostNewCustomerForClosure.length;
    const closureRate = closedNewCustomerDeals > 0 ? (wonNewCustomerForClosure.length / closedNewCustomerDeals) * 100 : 0;

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

    // Won New Customer deals (used for sales cycle and avg ticket)
    const wonNewCustomerDeals = wonDeals.filter(d => {
      const dealTypeValue = (d as any)[TYPE_OF_DEAL_FIELD_KEY];
      return dealTypeValue === DEAL_TYPES.NEW_CUSTOMER;
    });

    // Average sales cycle (days from add_time to won_time) - Only for New Customer deals
    const salesCycles = wonNewCustomerDeals
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

    // Average ticket for won New Customer deals
    const avgTicket = wonNewCustomerDeals.length > 0
      ? wonNewCustomerDeals.reduce((sum, d) => sum + (d.value || 0), 0) / wonNewCustomerDeals.length
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
      avgTicket: Math.round(avgTicket * 100) / 100,
      previousAvgTicket: 0,
      openDeals: openDeals.length,
      totalDeals: filteredDeals.length,
    };
  } catch (error) {
    console.error("Error fetching Pipedrive metrics:", error);
    throw error;
  }
}

// Get rankings by user (only from Deals pipeline)
export async function getRankingsByUser(filters?: { startDate?: string; endDate?: string; dealType?: string; countries?: string[] }) {
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

  // Filter by countries if specified
  if (filters?.countries && filters.countries.length > 0) {
    wonDeals = wonDeals.filter(d => {
      const countryValue = (d as any)[COUNTRY_FIELD_KEY];
      return filters.countries!.includes(String(countryValue));
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
export async function getRevenueHistory(filters?: { startDate?: string; endDate?: string; dealType?: string; countries?: string[] }) {
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

  // Filter by countries if specified
  if (filters?.countries && filters.countries.length > 0) {
    wonDeals = wonDeals.filter(d => {
      const countryValue = (d as any)[COUNTRY_FIELD_KEY];
      return filters.countries!.includes(String(countryValue));
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
export async function getMeetingsHistory(filters?: { startDate?: string; endDate?: string; dealType?: string; countries?: string[] }) {
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

  // Filter by countries if specified
  if (filters?.countries && filters.countries.length > 0) {
    newCustomerDeals = newCustomerDeals.filter(d => {
      const countryValue = (d as any)[COUNTRY_FIELD_KEY];
      return filters.countries!.includes(String(countryValue));
    });
  }

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

// Pipeline stages for "Proposal Made" and later
const PROPOSAL_MADE_OR_LATER_STAGES = [4, 64, 30]; // Proposal Made, Blocked, Current Sprint

// Get regional data from Pipedrive - grouped by country and origin
export async function getRegionalData(filters?: { 
  startDate?: string; 
  endDate?: string; 
  dealType?: string;
  countries?: string[];
}) {
  const allDeals = await getAllDeals(DEALS_PIPELINE_ID);

  // Helper to check if date is in range
  const inDateRange = (dateStr: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (filters?.startDate && d < new Date(filters.startDate)) return false;
    if (filters?.endDate && d > new Date(filters.endDate)) return false;
    return true;
  };

  // Filter to NC deals only
  let ncDeals = allDeals.filter(d => {
    const dealTypeValue = (d as any)[TYPE_OF_DEAL_FIELD_KEY];
    return dealTypeValue === DEAL_TYPES.NEW_CUSTOMER;
  });

  // Filter by countries if specified
  if (filters?.countries && filters.countries.length > 0) {
    ncDeals = ncDeals.filter(d => {
      const countryValue = (d as any)[COUNTRY_FIELD_KEY];
      return filters.countries!.includes(String(countryValue));
    });
  }

  // Group by country and origin
  const countryData: Record<string, Record<string, { 
    meetings: number; meetingsValue: number;
    proposals: number; proposalsValue: number;
    closings: number; closingsValue: number;
  }>> = {};

  ncDeals.forEach(deal => {
    const countryId = String((deal as any)[COUNTRY_FIELD_KEY] || "unknown");
    const origenId = String((deal as any)[ORIGEN_FIELD_KEY] || "unknown");

    if (!countryData[countryId]) {
      countryData[countryId] = {};
    }
    if (!countryData[countryId][origenId]) {
      countryData[countryId][origenId] = { 
        meetings: 0, meetingsValue: 0,
        proposals: 0, proposalsValue: 0,
        closings: 0, closingsValue: 0 
      };
    }

    const stats = countryData[countryId][origenId];
    const dealValue = deal.value || 0;

    // Reuniones: NC deals created in period (add_time)
    if (inDateRange(deal.add_time)) {
      stats.meetings++;
      stats.meetingsValue += dealValue;
    }

    // Propuestas: NC at Proposal Made or later stages, or won
    // Check if deal reached these stages during the period
    const isAtProposalOrLater = PROPOSAL_MADE_OR_LATER_STAGES.includes(deal.stage_id) || deal.status === "won";
    if (isAtProposalOrLater && inDateRange(deal.add_time)) {
      stats.proposals++;
      stats.proposalsValue += dealValue;
    }

    // Cierres: NC won in period
    if (deal.status === "won" && inDateRange(deal.won_time)) {
      stats.closings++;
      stats.closingsValue += dealValue;
    }
  });

  // Convert to expected format
  const result = Object.entries(countryData).map(([countryId, origins]) => {
    const countryOption = COUNTRY_OPTIONS.find(c => c.id === countryId);
    const countryName = countryOption ? countryOption.label : "Desconocido";

    const rows = Object.entries(origins)
      .map(([origenId, stats]) => ({
        origin: ORIGEN_OPTIONS[origenId] || "Sin Origen",
        meetings: stats.meetings,
        meetingsValue: stats.meetingsValue,
        proposals: stats.proposals,
        proposalsValue: stats.proposalsValue,
        closings: stats.closings,
        closingsValue: stats.closingsValue,
      }))
      .filter(row => row.meetings > 0 || row.proposals > 0 || row.closings > 0)
      .sort((a, b) => b.closingsValue - a.closingsValue);

    return {
      region: countryName,
      rows,
    };
  }).filter(r => r.rows.length > 0)
    .sort((a, b) => {
      const totalA = a.rows.reduce((sum, r) => sum + r.closingsValue, 0);
      const totalB = b.rows.reduce((sum, r) => sum + r.closingsValue, 0);
      return totalB - totalA;
    });

  return result;
}
