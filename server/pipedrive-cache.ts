import { db } from "./db";
import { pipedriveDeals, cacheMetadata, pipedriveDealProducts, people, teams } from "@shared/schema";
import { eq, sql, and, gte, lte, inArray } from "drizzle-orm";
import * as pipedrive from "./pipedrive";

const CACHE_KEY = "pipedrive_deals";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let isRefreshing = false;

export async function getCacheStatus() {
  const [metadata] = await db
    .select()
    .from(cacheMetadata)
    .where(eq(cacheMetadata.cacheKey, CACHE_KEY))
    .limit(1);
  
  if (!metadata) {
    return { 
      lastSyncAt: null, 
      status: "never_synced", 
      totalRecords: 0,
      isStale: true,
      isRefreshing 
    };
  }

  const isStale = metadata.lastSyncAt 
    ? Date.now() - new Date(metadata.lastSyncAt).getTime() > CACHE_TTL_MS 
    : true;

  return {
    lastSyncAt: metadata.lastSyncAt,
    status: metadata.lastSyncStatus,
    totalRecords: metadata.totalRecords,
    error: metadata.lastSyncError,
    syncDurationMs: metadata.syncDurationMs,
    isStale,
    isRefreshing
  };
}

export async function refreshCache(): Promise<{ success: boolean; message: string; totalRecords?: number }> {
  if (isRefreshing) {
    return { success: false, message: "Refresh already in progress" };
  }

  isRefreshing = true;
  const startTime = Date.now();

  try {
    await db
      .insert(cacheMetadata)
      .values({ cacheKey: CACHE_KEY, lastSyncStatus: "in_progress" })
      .onConflictDoUpdate({
        target: cacheMetadata.cacheKey,
        set: { lastSyncStatus: "in_progress", lastSyncError: null }
      });

    console.log("[Cache] Starting Pipedrive deals sync...");
    
    // Fetch deals from both pipeline 1 (Deals) and pipeline 9 (Reuniones/Meetings)
    const [pipeline1Deals, pipeline9Deals] = await Promise.all([
      pipedrive.getAllDeals(1),
      pipedrive.getAllDeals(9),
    ]);
    
    const deals = [...pipeline1Deals, ...pipeline9Deals];
    
    console.log(`[Cache] Fetched ${deals.length} deals from Pipedrive (Pipeline 1: ${pipeline1Deals.length}, Pipeline 9: ${pipeline9Deals.length})`);

    const TYPE_OF_DEAL_FIELD_KEY = "a7ab0c5cfbfd5a57ce6531b4aa0a74b317c4b657";
    const COUNTRY_FIELD_KEY = "f7c43d98b4ef75192ee0798b360f2076754981b9";
    const ORIGEN_FIELD_KEY = "a9241093db8147d20f4c1c7f6c1998477f819ef4";
    const EMPLOYEE_COUNT_FIELD_KEY = "f488b70aa96b8a83c49fa816f926c82f4a9a9ab4";
    const SOURCE_FIELD_KEY = "552c1914dddd36582917f20f82b71c475bfbd132";

    const dedupeMap = new Map<number, any>();
    deals.forEach(deal => {
      if (!dedupeMap.has(deal.id)) {
        dedupeMap.set(deal.id, deal);
      }
    });
    const uniqueDeals = Array.from(dedupeMap.values());
    
    console.log(`[Cache] Processing ${uniqueDeals.length} unique deals (${deals.length - uniqueDeals.length} duplicates removed)`);

    const records = uniqueDeals.map(deal => {
      const addTime = deal.add_time ? new Date(deal.add_time) : null;
      const wonTime = deal.won_time ? new Date(deal.won_time) : null;
      let salesCycleDays: number | null = null;
      
      if (addTime && wonTime && deal.status === "won") {
        salesCycleDays = Math.round((wonTime.getTime() - addTime.getTime()) / (1000 * 60 * 60 * 24));
      }

      const userId = typeof deal.user_id === 'object' ? deal.user_id?.id : deal.user_id;
      const creatorUserId = typeof deal.creator_user_id === 'object' ? deal.creator_user_id?.id : deal.creator_user_id;
      const personId = typeof deal.person_id === 'object' ? deal.person_id?.value : deal.person_id;
      const orgId = typeof deal.org_id === 'object' ? deal.org_id?.value : deal.org_id;

      return {
        id: deal.id,
        title: deal.title || null,
        value: deal.value?.toString() || null,
        currency: deal.currency || null,
        status: deal.status || null,
        stageId: deal.stage_id || null,
        pipelineId: deal.pipeline_id || null,
        userId: userId || null,
        creatorUserId: creatorUserId || null,
        personId: personId || null,
        orgId: orgId || null,
        addTime: deal.add_time ? new Date(deal.add_time) : null,
        updateTime: deal.update_time ? new Date(deal.update_time) : null,
        wonTime: wonTime,
        lostTime: deal.lost_time ? new Date(deal.lost_time) : null,
        dealType: (deal as any)[TYPE_OF_DEAL_FIELD_KEY] || null,
        country: (deal as any)[COUNTRY_FIELD_KEY]?.toString() || null,
        origin: (deal as any)[ORIGEN_FIELD_KEY]?.toString() || null,
        employeeCount: (deal as any)[EMPLOYEE_COUNT_FIELD_KEY]?.toString() || null,
        sourceField: (deal as any)[SOURCE_FIELD_KEY]?.toString() || null,
        salesCycleDays,
        cachedAt: new Date(),
      };
    });

    await db.transaction(async (tx) => {
      await tx.delete(pipedriveDeals);
      
      if (records.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          await tx.insert(pipedriveDeals).values(batch);
        }
      }
    });

    const durationMs = Date.now() - startTime;
    
    await db
      .update(cacheMetadata)
      .set({
        lastSyncAt: new Date(),
        lastSyncStatus: "success",
        lastSyncError: null,
        totalRecords: deals.length,
        syncDurationMs: durationMs,
      })
      .where(eq(cacheMetadata.cacheKey, CACHE_KEY));

    console.log(`[Cache] Sync completed: ${deals.length} deals in ${durationMs}ms`);
    
    return { success: true, message: "Cache refreshed successfully", totalRecords: deals.length };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    
    await db
      .update(cacheMetadata)
      .set({
        lastSyncStatus: "error",
        lastSyncError: error.message || "Unknown error",
        syncDurationMs: durationMs,
      })
      .where(eq(cacheMetadata.cacheKey, CACHE_KEY));

    console.error("[Cache] Sync failed:", error);
    
    return { success: false, message: error.message || "Cache refresh failed" };
  } finally {
    isRefreshing = false;
  }
}

export async function getCachedDeals(filters?: {
  startDate?: string;
  endDate?: string;
  dealType?: string;
  countries?: string[];
  status?: string;
}) {
  let query = db.select().from(pipedriveDeals).$dynamic();
  
  const conditions = [];
  
  if (filters?.status) {
    conditions.push(eq(pipedriveDeals.status, filters.status));
  }
  
  if (filters?.dealType) {
    conditions.push(eq(pipedriveDeals.dealType, filters.dealType));
  }
  
  if (filters?.countries && filters.countries.length > 0) {
    conditions.push(inArray(pipedriveDeals.country, filters.countries));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const deals = await query;
  
  return deals.filter(deal => {
    if (filters?.startDate || filters?.endDate) {
      const wonTime = deal.wonTime ? new Date(deal.wonTime) : null;
      const addTime = deal.addTime ? new Date(deal.addTime) : null;
      
      if (deal.status === "won" && wonTime) {
        if (filters?.startDate && wonTime < new Date(filters.startDate)) return false;
        if (filters?.endDate && wonTime > new Date(filters.endDate)) return false;
      } else if (addTime) {
        if (filters?.startDate && addTime < new Date(filters.startDate)) return false;
        if (filters?.endDate && addTime > new Date(filters.endDate)) return false;
      }
    }
    return true;
  });
}

export async function ensureCacheWarmed() {
  const status = await getCacheStatus();
  
  if (status.status === "never_synced" || status.totalRecords === 0) {
    console.log("[Cache] Cache is empty, warming up...");
    await refreshCache();
  } else if (status.isStale && !status.isRefreshing) {
    console.log("[Cache] Cache is stale, refreshing in background...");
    refreshCache().catch(err => console.error("[Cache] Background refresh failed:", err));
  }
}

let refreshInterval: NodeJS.Timeout | null = null;

export function startAutoRefresh() {
  if (refreshInterval) return;
  
  console.log("[Cache] Starting auto-refresh every 10 minutes");
  
  refreshInterval = setInterval(async () => {
    const status = await getCacheStatus();
    if (!status.isRefreshing) {
      console.log("[Cache] Auto-refresh triggered");
      refreshCache().catch(err => console.error("[Cache] Auto-refresh failed:", err));
    }
  }, CACHE_TTL_MS);
}

export function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

const NEW_CUSTOMER_ID = "13";
const PROPOSAL_MADE_STAGE = 4;
const BLOCKED_STAGE = 64;
const CURRENT_SPRINT_STAGE = 30;

interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  dealType?: string;
  countries?: string[];
  origins?: string[];
  teamId?: number;
  personId?: number;
}

import { people } from "@shared/schema";

async function getUserIdsForTeam(teamId: number): Promise<number[]> {
  const teamPeople = await db.select({ pipedriveUserId: people.pipedriveUserId, displayName: people.displayName })
    .from(people)
    .where(eq(people.teamId, teamId));
  
  const pipedriveUserIds = teamPeople
    .filter(p => p.pipedriveUserId !== null)
    .map(p => p.pipedriveUserId!);
  
  if (pipedriveUserIds.length > 0) {
    return pipedriveUserIds;
  }
  
  const teamNames = teamPeople.map(p => p.displayName.toLowerCase().trim());
  const pipedriveUsers = await pipedrive.getUsers();
  const matchedUserIds: number[] = [];
  
  for (const user of pipedriveUsers) {
    const userName = user.name.toLowerCase().trim();
    for (const teamName of teamNames) {
      if (userName.includes(teamName) || teamName.includes(userName) || 
          userName.split(' ')[0] === teamName.split(' ')[0]) {
        matchedUserIds.push(user.id);
        break;
      }
    }
  }
  
  return matchedUserIds;
}

export async function getCachedDashboardMetrics(filters: DashboardFilters) {
  const allDeals = await db.select().from(pipedriveDeals);
  
  const startDate = filters.startDate ? new Date(filters.startDate) : null;
  const endDate = filters.endDate ? new Date(filters.endDate + "T23:59:59") : null;

  let allowedUserIds: number[] | null = null;
  
  if (filters.personId) {
    allowedUserIds = [filters.personId];
  } else if (filters.teamId) {
    allowedUserIds = await getUserIdsForTeam(filters.teamId);
  }

  const filteredDeals = allDeals.filter(deal => {
    if (filters.dealType && deal.dealType !== filters.dealType) return false;
    if (filters.countries?.length && !filters.countries.includes(deal.country || "")) return false;
    if (filters.origins?.length && !filters.origins.includes(deal.origin || "")) return false;
    if (allowedUserIds && !allowedUserIds.includes(deal.userId || 0)) return false;
    return true;
  });

  const wonDeals = filteredDeals.filter(deal => {
    if (deal.status !== "won") return false;
    const wonTime = deal.wonTime ? new Date(deal.wonTime) : null;
    if (!wonTime) return false;
    if (startDate && wonTime < startDate) return false;
    if (endDate && wonTime > endDate) return false;
    return true;
  });

  const ncWonDeals = wonDeals.filter(d => d.dealType === NEW_CUSTOMER_ID);
  const ncCreated = filteredDeals.filter(deal => {
    if (deal.dealType !== NEW_CUSTOMER_ID) return false;
    const addTime = deal.addTime ? new Date(deal.addTime) : null;
    if (!addTime) return false;
    if (startDate && addTime < startDate) return false;
    if (endDate && addTime > endDate) return false;
    return true;
  });

  const ncTotal = filteredDeals.filter(deal => {
    if (deal.dealType !== NEW_CUSTOMER_ID) return false;
    const addTime = deal.addTime ? new Date(deal.addTime) : null;
    if (!addTime) return false;
    if (startDate && addTime < startDate) return false;
    if (endDate && addTime > endDate) return false;
    return deal.status === "won" || deal.status === "lost" || deal.status === "open";
  });

  const ncClosed = ncTotal.filter(d => d.status === "won" || d.status === "lost");
  const ncWon = ncTotal.filter(d => d.status === "won");
  
  const closureRate = ncClosed.length > 0 ? (ncWon.length / ncClosed.length) * 100 : 0;

  const totalRevenue = wonDeals.reduce((sum, d) => sum + parseFloat(d.value || "0"), 0);
  const logosWon = ncWonDeals.length;
  const meetings = ncCreated.length;
  const avgTicket = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

  const ncWonWithCycle = ncWonDeals.filter(d => d.salesCycleDays !== null && d.salesCycleDays >= 0);
  const avgSalesCycle = ncWonWithCycle.length > 0 
    ? ncWonWithCycle.reduce((sum, d) => sum + (d.salesCycleDays || 0), 0) / ncWonWithCycle.length 
    : 0;

  return {
    closureRate: Math.round(closureRate * 10) / 10,
    meetings,
    totalRevenue: Math.round(totalRevenue),
    logosWon,
    salesCycle: Math.round(avgSalesCycle),
    avgTicket: Math.round(avgTicket),
  };
}

function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

export async function getCachedRevenueHistory(filters: DashboardFilters) {
  const allDeals = await db.select().from(pipedriveDeals).where(eq(pipedriveDeals.status, "won"));
  
  const startDate = filters.startDate ? new Date(filters.startDate) : null;
  const endDate = filters.endDate ? new Date(filters.endDate + "T23:59:59") : null;

  let allowedUserIds: number[] | null = null;
  if (filters.personId) {
    allowedUserIds = [filters.personId];
  } else if (filters.teamId) {
    allowedUserIds = await getUserIdsForTeam(filters.teamId);
  }

  const filteredDeals = allDeals.filter(deal => {
    if (filters.dealType && deal.dealType !== filters.dealType) return false;
    if (filters.countries?.length && !filters.countries.includes(deal.country || "")) return false;
    if (filters.origins?.length && !filters.origins.includes(deal.origin || "")) return false;
    if (allowedUserIds && !allowedUserIds.includes(deal.userId || 0)) return false;
    const wonTime = deal.wonTime ? new Date(deal.wonTime) : null;
    if (!wonTime) return false;
    if (startDate && wonTime < startDate) return false;
    if (endDate && wonTime > endDate) return false;
    return true;
  });

  const weeklyData: Record<string, number> = {};
  
  filteredDeals.forEach(deal => {
    const wonTime = new Date(deal.wonTime!);
    const weekKey = getWeekKey(wonTime);
    weeklyData[weekKey] = (weeklyData[weekKey] || 0) + parseFloat(deal.value || "0");
  });

  return Object.entries(weeklyData)
    .map(([week, revenue]) => ({ week, revenue: Math.round(revenue) }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export async function getCachedMeetingsHistory(filters: DashboardFilters) {
  const allDeals = await db.select().from(pipedriveDeals)
    .where(eq(pipedriveDeals.dealType, NEW_CUSTOMER_ID));
  
  const startDate = filters.startDate ? new Date(filters.startDate) : null;
  const endDate = filters.endDate ? new Date(filters.endDate + "T23:59:59") : null;

  let allowedUserIds: number[] | null = null;
  if (filters.personId) {
    allowedUserIds = [filters.personId];
  } else if (filters.teamId) {
    allowedUserIds = await getUserIdsForTeam(filters.teamId);
  }

  const filteredDeals = allDeals.filter(deal => {
    if (filters.countries?.length && !filters.countries.includes(deal.country || "")) return false;
    if (filters.origins?.length && !filters.origins.includes(deal.origin || "")) return false;
    if (allowedUserIds && !allowedUserIds.includes(deal.userId || 0)) return false;
    const addTime = deal.addTime ? new Date(deal.addTime) : null;
    if (!addTime) return false;
    if (startDate && addTime < startDate) return false;
    if (endDate && addTime > endDate) return false;
    return true;
  });

  const weeklyData: Record<string, number> = {};
  
  filteredDeals.forEach(deal => {
    const addTime = new Date(deal.addTime!);
    const weekKey = getWeekKey(addTime);
    weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
  });

  return Object.entries(weeklyData)
    .map(([week, cardsCreated]) => ({ week, cardsCreated }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export async function getCachedClosureRate(filters: DashboardFilters) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const allDeals = await db.select().from(pipedriveDeals)
    .where(eq(pipedriveDeals.dealType, NEW_CUSTOMER_ID));

  let allowedUserIds: number[] | null = null;
  if (filters.personId) {
    allowedUserIds = [filters.personId];
  } else if (filters.teamId) {
    allowedUserIds = await getUserIdsForTeam(filters.teamId);
  }

  const filteredDeals = allDeals.filter(deal => {
    if (filters.countries?.length && !filters.countries.includes(deal.country || "")) return false;
    if (filters.origins?.length && !filters.origins.includes(deal.origin || "")) return false;
    if (allowedUserIds && !allowedUserIds.includes(deal.userId || 0)) return false;
    
    const addTime = deal.addTime ? new Date(deal.addTime) : null;
    if (!addTime) return false;
    if (addTime < sixMonthsAgo) return false;
    
    return deal.status === "won" || deal.status === "lost";
  });

  const wonDeals = filteredDeals.filter(d => d.status === "won");
  const totalClosed = filteredDeals.length;
  
  const closureRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0;
  
  return {
    closureRate: Math.round(closureRate * 10) / 10,
    won: wonDeals.length,
    lost: totalClosed - wonDeals.length,
    total: totalClosed,
  };
}

export async function getCachedRegionalData(filters: DashboardFilters) {
  const allDeals = await db.select().from(pipedriveDeals);
  
  const startDate = filters.startDate ? new Date(filters.startDate) : null;
  const endDate = filters.endDate ? new Date(filters.endDate + "T23:59:59") : null;

  let allowedUserIds: number[] | null = null;
  if (filters.personId) {
    allowedUserIds = [filters.personId];
  } else if (filters.teamId) {
    allowedUserIds = await getUserIdsForTeam(filters.teamId);
  }

  const COUNTRY_FIELD_KEY = "f7c43d98b4ef75192ee0798b360f2076754981b9";
  const ORIGEN_FIELD_KEY = "a9241093db8147d20f4c1c7f6c1998477f819ef4";
  const dealFields = await pipedrive.getDealFields();
  const countryField = dealFields.find((f: any) => f.key === COUNTRY_FIELD_KEY);
  const originField = dealFields.find((f: any) => f.key === ORIGEN_FIELD_KEY);
  const countryOptions = countryField?.options || [];
  const originOptions = originField?.options || [];
  const countryLabels = new Map(countryOptions.map((o: any) => [o.id.toString(), o.label]));
  const originLabels = new Map(originOptions.map((o: any) => [o.id.toString(), o.label]));

  const getCellForCountry = (countryName: string): string => {
    const normalized = countryName.toLowerCase();
    if (normalized === "colombia") return "Colombia";
    if (normalized === "argentina") return "Argentina";
    if (normalized === "mexico" || normalized === "méxico") return "Mexico";
    if (normalized === "brasil" || normalized === "brazil") return "Brasil";
    if (normalized === "españa" || normalized === "spain") return "España";
    return "Rest Latam";
  };

  type CellOriginData = { meetings: number; proposals: number; closings: number; meetingsValue: number; proposalsValue: number; closingsValue: number };
  const cellOriginData: Record<string, Record<string, CellOriginData>> = {};

  allDeals.forEach(deal => {
    if (filters.dealType && deal.dealType !== filters.dealType) return;
    if (filters.origins?.length && !filters.origins.includes(deal.origin || "")) return;
    if (allowedUserIds && !allowedUserIds.includes(deal.userId || 0)) return;
    
    const countryId = deal.country || "unknown";
    if (filters.countries?.length && !filters.countries.includes(countryId)) return;
    
    const countryName = countryLabels.get(countryId) || `País ${countryId}`;
    const cell = getCellForCountry(countryName);
    const originId = deal.origin || "direct";
    const origin = originLabels.get(originId) || "Directo";
    
    if (!cellOriginData[cell]) cellOriginData[cell] = {};
    if (!cellOriginData[cell][origin]) {
      cellOriginData[cell][origin] = { meetings: 0, proposals: 0, closings: 0, meetingsValue: 0, proposalsValue: 0, closingsValue: 0 };
    }
    
    const addTime = deal.addTime ? new Date(deal.addTime) : null;
    const wonTime = deal.wonTime ? new Date(deal.wonTime) : null;
    const value = parseFloat(deal.value || "0");

    if (deal.dealType === NEW_CUSTOMER_ID && addTime) {
      if ((!startDate || addTime >= startDate) && (!endDate || addTime <= endDate)) {
        cellOriginData[cell][origin].meetings++;
        cellOriginData[cell][origin].meetingsValue += value;
      }
    }

    if (deal.dealType === NEW_CUSTOMER_ID) {
      const proposalStages = [PROPOSAL_MADE_STAGE, BLOCKED_STAGE, CURRENT_SPRINT_STAGE];
      if (proposalStages.includes(deal.stageId || 0) || deal.status === "won") {
        if (addTime && (!startDate || addTime >= startDate) && (!endDate || addTime <= endDate)) {
          cellOriginData[cell][origin].proposals++;
          cellOriginData[cell][origin].proposalsValue += value;
        }
      }
    }

    if (deal.status === "won" && wonTime) {
      if ((!startDate || wonTime >= startDate) && (!endDate || wonTime <= endDate)) {
        cellOriginData[cell][origin].closings++;
        cellOriginData[cell][origin].closingsValue += value;
      }
    }
  });

  const cellOrder = ["Colombia", "Argentina", "Mexico", "Brasil", "España", "Rest Latam"];
  
  return cellOrder
    .filter(cell => cellOriginData[cell])
    .map(cell => ({
      region: cell,
      rows: Object.entries(cellOriginData[cell])
        .map(([origin, data]) => ({ origin, ...data }))
        .filter(row => row.meetings > 0 || row.proposals > 0 || row.closings > 0)
        .sort((a, b) => b.closingsValue - a.closingsValue)
    }))
    .filter(cell => cell.rows.length > 0);
}

export async function getCachedRankingsByUser(filters: DashboardFilters) {
  const allDeals = await db.select().from(pipedriveDeals).where(eq(pipedriveDeals.status, "won"));
  
  const startDate = filters.startDate ? new Date(filters.startDate) : null;
  const endDate = filters.endDate ? new Date(filters.endDate + "T23:59:59") : null;

  let allowedUserIds: number[] | null = null;
  if (filters.personId) {
    allowedUserIds = [filters.personId];
  } else if (filters.teamId) {
    allowedUserIds = await getUserIdsForTeam(filters.teamId);
  }

  const userData: Record<number, { closings: number; revenue: number }> = {};

  allDeals.forEach(deal => {
    if (filters.dealType && deal.dealType !== filters.dealType) return;
    if (filters.countries?.length && !filters.countries.includes(deal.country || "")) return;
    if (filters.origins?.length && !filters.origins.includes(deal.origin || "")) return;
    if (allowedUserIds && !allowedUserIds.includes(deal.userId || 0)) return;
    
    const wonTime = deal.wonTime ? new Date(deal.wonTime) : null;
    if (!wonTime) return;
    if (startDate && wonTime < startDate) return;
    if (endDate && wonTime > endDate) return;
    
    const userId = deal.userId;
    if (!userId) return;
    
    if (!userData[userId]) {
      userData[userId] = { closings: 0, revenue: 0 };
    }
    
    userData[userId].closings++;
    userData[userId].revenue += parseFloat(deal.value || "0");
  });

  const users = await pipedrive.getUsers();
  const userMap = new Map(users.map(u => [u.id, u.name]));

  return Object.entries(userData)
    .map(([id, data]) => ({
      id: parseInt(id),
      name: userMap.get(parseInt(id)) || `Usuario ${id}`,
      ...data,
      revenue: Math.round(data.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

import { teams } from "@shared/schema";

export async function getCachedRankingsByTeam(filters: DashboardFilters) {
  const allDeals = await db.select().from(pipedriveDeals).where(eq(pipedriveDeals.status, "won"));
  
  const startDate = filters.startDate ? new Date(filters.startDate) : null;
  const endDate = filters.endDate ? new Date(filters.endDate + "T23:59:59") : null;

  const allTeams = await db.select().from(teams);
  const allPeople = await db.select().from(people);
  
  const userIdToTeamId = new Map<number, number>();
  allPeople.forEach(p => {
    if (p.pipedriveUserId && p.teamId) {
      userIdToTeamId.set(p.pipedriveUserId, p.teamId);
    }
  });

  const teamRevenue: Record<number, number> = {};
  allTeams.forEach(t => {
    teamRevenue[t.id] = 0;
  });

  allDeals.forEach(deal => {
    if (filters.dealType && deal.dealType !== filters.dealType) return;
    if (filters.countries?.length && !filters.countries.includes(deal.country || "")) return;
    if (filters.origins?.length && !filters.origins.includes(deal.origin || "")) return;
    
    const wonTime = deal.wonTime ? new Date(deal.wonTime) : null;
    if (!wonTime) return;
    if (startDate && wonTime < startDate) return;
    if (endDate && wonTime > endDate) return;
    
    const userId = deal.userId;
    if (!userId) return;
    
    const teamId = userIdToTeamId.get(userId);
    if (!teamId) return;
    
    teamRevenue[teamId] += parseFloat(deal.value || "0");
  });

  const teamMap = new Map(allTeams.map(t => [t.id, t.displayName]));

  return Object.entries(teamRevenue)
    .map(([id, value]) => ({
      name: teamMap.get(parseInt(id)) || `Equipo ${id}`,
      value: Math.round(value),
    }))
    .filter(t => t.value > 0)
    .sort((a, b) => b.value - a.value);
}

export async function getCachedRankingsBySource(filters: DashboardFilters) {
  const allDeals = await db.select().from(pipedriveDeals).where(eq(pipedriveDeals.status, "won"));
  
  const startDate = filters.startDate ? new Date(filters.startDate) : null;
  const endDate = filters.endDate ? new Date(filters.endDate + "T23:59:59") : null;

  let allowedUserIds: number[] | null = null;
  if (filters.personId) {
    allowedUserIds = [filters.personId];
  } else if (filters.teamId) {
    allowedUserIds = await getUserIdsForTeam(filters.teamId);
  }

  const sourceRevenue: Record<string, number> = {};

  allDeals.forEach(deal => {
    if (filters.dealType && deal.dealType !== filters.dealType) return;
    if (filters.countries?.length && !filters.countries.includes(deal.country || "")) return;
    if (filters.origins?.length && !filters.origins.includes(deal.origin || "")) return;
    if (allowedUserIds && !allowedUserIds.includes(deal.userId || 0)) return;
    
    const wonTime = deal.wonTime ? new Date(deal.wonTime) : null;
    if (!wonTime) return;
    if (startDate && wonTime < startDate) return;
    if (endDate && wonTime > endDate) return;
    
    const origin = deal.origin;
    if (!origin) return;
    
    if (!sourceRevenue[origin]) {
      sourceRevenue[origin] = 0;
    }
    sourceRevenue[origin] += parseFloat(deal.value || "0");
  });

  const dealFields = await pipedrive.getDealFields();
  const originField = dealFields.find((f: any) => f.key === "a9241093db8147d20f4c1c7f6c1998477f819ef4");
  const originOptions = originField?.options || [];
  const originLabels = new Map(originOptions.map((o: any) => [o.id.toString(), o.label]));

  return Object.entries(sourceRevenue)
    .map(([id, value]) => ({
      name: originLabels.get(id) || `Origen ${id}`,
      value: Math.round(value),
    }))
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value);
}

// Get product stats from won deals with products
export async function getCachedProductStats(filters: DashboardFilters) {
  const startDate = filters.startDate ? new Date(filters.startDate) : null;
  const endDate = filters.endDate ? new Date(filters.endDate + "T23:59:59") : null;

  let allowedUserIds: number[] | null = null;
  if (filters.personId) {
    allowedUserIds = [filters.personId];
  } else if (filters.teamId) {
    allowedUserIds = await getUserIdsForTeam(filters.teamId);
  }

  // Get won deals from cache
  const allDeals = await db.select().from(pipedriveDeals).where(eq(pipedriveDeals.status, "won"));
  
  // Filter deals
  const filteredDeals = allDeals.filter(deal => {
    if (filters.dealType && deal.dealType !== filters.dealType) return false;
    if (filters.countries?.length && !filters.countries.includes(deal.country || "")) return false;
    if (filters.origins?.length && !filters.origins.includes(deal.origin || "")) return false;
    if (allowedUserIds && !allowedUserIds.includes(deal.userId || 0)) return false;
    
    const wonTime = deal.wonTime ? new Date(deal.wonTime) : null;
    if (!wonTime) return false;
    if (startDate && wonTime < startDate) return false;
    if (endDate && wonTime > endDate) return false;
    
    return true;
  });

  // Check if we have cached products
  const cachedProducts = await db.select().from(pipedriveDealProducts);
  
  // If no cached products, try to fetch them for the filtered deals (limited batch)
  if (cachedProducts.length === 0 && filteredDeals.length > 0) {
    console.log(`[Cache] Fetching products for ${Math.min(filteredDeals.length, 100)} deals...`);
    
    // Limit to 100 deals to avoid rate limits
    const dealsToFetch = filteredDeals.slice(0, 100);
    const allProducts: any[] = [];
    
    for (const deal of dealsToFetch) {
      try {
        const products = await pipedrive.getDealProducts(deal.id);
        for (const p of products) {
          allProducts.push({
            dealId: deal.id,
            productId: p.product_id,
            productName: p.name || p.product?.name || `Producto ${p.product_id}`,
            quantity: p.quantity || 1,
            itemPrice: p.item_price?.toString() || "0",
            discount: p.discount?.toString() || "0",
            sum: p.sum?.toString() || "0",
            cachedAt: new Date(),
          });
        }
      } catch (err) {
        console.error(`[Cache] Error fetching products for deal ${deal.id}:`, err);
      }
    }
    
    // Save to cache
    if (allProducts.length > 0) {
      await db.delete(pipedriveDealProducts);
      const batchSize = 50;
      for (let i = 0; i < allProducts.length; i += batchSize) {
        const batch = allProducts.slice(i, i + batchSize);
        await db.insert(pipedriveDealProducts).values(batch);
      }
      console.log(`[Cache] Cached ${allProducts.length} deal products`);
    }
    
    // Use the products we just fetched
    return aggregateProductStats(allProducts, filteredDeals);
  }

  // Use cached products
  const dealIds = new Set(filteredDeals.map(d => d.id));
  const relevantProducts = cachedProducts.filter(p => dealIds.has(p.dealId));
  
  return aggregateProductStats(relevantProducts, filteredDeals);
}

// Get employee count distribution (Q de empleados) from cached deals
export async function getCachedEmployeeCountDistribution(filters: {
  startDate?: string;
  endDate?: string;
  dealType?: string;
  countries?: string[];
  origins?: string[];
  teamId?: number;
  personId?: number;
}): Promise<{ date: string; value: number }[]> {
  // Get cached deals
  const cachedDeals = await db.select().from(pipedriveDeals);
  
  // Get person-to-team mapping if needed
  const peopleWithTeams = await db.select().from(people).leftJoin(teams, eq(people.teamId, teams.id));
  const personToTeam: Record<number, number | null> = {};
  peopleWithTeams.forEach(row => {
    if (row.people.pipedriveUserId) {
      personToTeam[row.people.pipedriveUserId] = row.people.teamId;
    }
  });
  
  // Filter deals based on criteria
  let filteredDeals = cachedDeals.filter(deal => {
    // Date filter - only include deals with add_time in the date range (meetings/cards)
    if (filters.startDate && deal.addTime) {
      const addDate = new Date(deal.addTime);
      if (addDate < new Date(filters.startDate)) return false;
    }
    if (filters.endDate && deal.addTime) {
      const addDate = new Date(deal.addTime);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (addDate > endDate) return false;
    }
    
    // Deal type filter
    if (filters.dealType && deal.dealType !== filters.dealType) return false;
    
    // Country filter
    if (filters.countries && filters.countries.length > 0) {
      if (!deal.country || !filters.countries.includes(deal.country)) return false;
    }
    
    // Origin filter
    if (filters.origins && filters.origins.length > 0) {
      if (!deal.origin || !filters.origins.includes(deal.origin)) return false;
    }
    
    // Team filter
    if (filters.teamId && deal.userId) {
      const dealTeamId = personToTeam[deal.userId];
      if (dealTeamId !== filters.teamId) return false;
    }
    
    // Person filter
    if (filters.personId && deal.userId !== filters.personId) return false;
    
    return true;
  });
  
  // Map Pipedrive option IDs to employee count ranges
  // Based on Pipedrive "Q de empleados" field options
  const employeeCountMapping: Record<string, string> = {
    "697": "1-10",      // 1 a 10 empleados
    "698": "11-50",     // 11 a 50 empleados
    "699": "51-200",    // 51 a 200 empleados
    "700": "201-500",   // 201 a 500 empleados
    "701": "500-1000",  // 500 a 1000 empleados
    "702": "1000+",     // Más de 1000 empleados
  };
  
  // Count deals by employee count ranges, excluding blank values
  const countByRange: Record<string, number> = {
    "1-10": 0,
    "11-50": 0,
    "51-200": 0,
    "201-500": 0,
    "500-1000": 0,
    "1000+": 0,
  };
  
  filteredDeals.forEach(deal => {
    const empCount = deal.employeeCount;
    // Skip blank/null/empty values
    if (!empCount || empCount.trim() === "") return;
    
    const value = empCount.trim();
    
    // Map Pipedrive option ID to our range
    const range = employeeCountMapping[value];
    if (range && countByRange[range] !== undefined) {
      countByRange[range]++;
    }
  });
  
  const sizeOrder = ["1-10", "11-50", "51-200", "201-500", "500-1000", "1000+"];
  return sizeOrder.map(size => ({
    date: size,
    value: countByRange[size],
  }));
}

// Get NC meetings history last 10 weeks by region
export async function getNCMeetingsLast10Weeks() {
  const allDeals = await db.select().from(pipedriveDeals)
    .where(eq(pipedriveDeals.dealType, NEW_CUSTOMER_ID));
  
  // Get last 10 weeks
  const now = new Date();
  const tenWeeksAgo = new Date(now);
  tenWeeksAgo.setDate(tenWeeksAgo.getDate() - 70);
  
  const filteredDeals = allDeals.filter(deal => {
    const addTime = deal.addTime ? new Date(deal.addTime) : null;
    if (!addTime) return false;
    return addTime >= tenWeeksAgo;
  });

  const weeklyData: Record<string, number> = {};
  
  filteredDeals.forEach(deal => {
    const addTime = new Date(deal.addTime!);
    const weekKey = getWeekKey(addTime);
    weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
  });

  // Sort chronologically by parsing year and week number
  const sortedWeeks = Object.entries(weeklyData)
    .map(([week, cardsCreated]) => {
      const [year, weekNum] = week.split('-W');
      return { 
        week, 
        cardsCreated, 
        sortKey: parseInt(year) * 100 + parseInt(weekNum) 
      };
    })
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(-10)
    .map(({ week, cardsCreated }) => ({ week, cardsCreated }));
  
  return sortedWeeks;
}

// Get quarterly comparison by region (last 5 quarters)
export async function getQuarterlyRegionComparison() {
  const allDeals = await db.select().from(pipedriveDeals);
  
  const dealFields = await pipedrive.getDealFields();
  const COUNTRY_FIELD_KEY = "f7c43d98b4ef75192ee0798b360f2076754981b9";
  const countryField = dealFields.find((f: any) => f.key === COUNTRY_FIELD_KEY);
  const countryOptions = countryField?.options || [];
  const countryLabels = new Map(countryOptions.map((o: any) => [o.id.toString(), o.label]));

  const getCellForCountry = (countryName: string): string => {
    const normalized = countryName.toLowerCase();
    if (normalized === "colombia") return "Colombia";
    if (normalized === "argentina") return "Argentina";
    if (normalized === "mexico" || normalized === "méxico") return "Mexico";
    if (normalized === "brasil") return "Brasil";
    if (normalized === "españa") return "España";
    return "Rest Latam";
  };

  const getQuarterKey = (date: Date): string => {
    const year = date.getFullYear();
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `${year}-Q${quarter}`;
  };

  // Calculate last 5 quarters
  const quarters: string[] = [];
  const now = new Date();
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - (i * 3));
    quarters.push(getQuarterKey(d));
  }

  const regions = ["Colombia", "Argentina", "Mexico", "Brasil", "España", "Rest Latam"];
  
  // Initialize data structure
  const data: Record<string, Record<string, { meetings: number; logos: number; revenue: number }>> = {};
  regions.forEach(region => {
    data[region] = {};
    quarters.forEach(q => {
      data[region][q] = { meetings: 0, logos: 0, revenue: 0 };
    });
  });

  allDeals.forEach(deal => {
    const countryName = countryLabels.get(deal.country || "") || "Unknown";
    const region = getCellForCountry(countryName);
    
    // Count meetings (cards created) by add_time
    if (deal.addTime) {
      const addTime = new Date(deal.addTime);
      const quarterKey = getQuarterKey(addTime);
      if (data[region]?.[quarterKey]) {
        data[region][quarterKey].meetings++;
      }
    }
    
    // Count logos and revenue by won_time
    if (deal.status === "won" && deal.wonTime) {
      const wonTime = new Date(deal.wonTime);
      const quarterKey = getQuarterKey(wonTime);
      if (data[region]?.[quarterKey]) {
        data[region][quarterKey].logos++;
        data[region][quarterKey].revenue += parseFloat(deal.value || "0");
      }
    }
  });

  return {
    quarters,
    regions: regions.map(region => ({
      region,
      data: quarters.map(q => ({
        quarter: q,
        meetings: data[region][q].meetings,
        logos: data[region][q].logos,
        revenue: Math.round(data[region][q].revenue),
      })),
    })),
  };
}

// Get top origins by region
export async function getTopOriginsByRegion() {
  const allDeals = await db.select().from(pipedriveDeals)
    .where(eq(pipedriveDeals.status, "won"));
  
  const dealFields = await pipedrive.getDealFields();
  const COUNTRY_FIELD_KEY = "f7c43d98b4ef75192ee0798b360f2076754981b9";
  const ORIGEN_FIELD_KEY = "a9241093db8147d20f4c1c7f6c1998477f819ef4";
  const countryField = dealFields.find((f: any) => f.key === COUNTRY_FIELD_KEY);
  const originField = dealFields.find((f: any) => f.key === ORIGEN_FIELD_KEY);
  const countryLabels = new Map(countryField?.options?.map((o: any) => [o.id.toString(), o.label]) || []);
  const originLabels = new Map(originField?.options?.map((o: any) => [o.id.toString(), o.label]) || []);

  const getCellForCountry = (countryName: string): string => {
    const normalized = countryName.toLowerCase();
    if (normalized === "colombia") return "Colombia";
    if (normalized === "argentina") return "Argentina";
    if (normalized === "mexico" || normalized === "méxico") return "Mexico";
    if (normalized === "brasil") return "Brasil";
    if (normalized === "españa") return "España";
    return "Rest Latam";
  };

  const regions = ["Colombia", "Argentina", "Mexico", "Brasil", "España", "Rest Latam"];
  const data: Record<string, Record<string, number>> = {};
  regions.forEach(r => { data[r] = {}; });

  allDeals.forEach(deal => {
    const countryName = countryLabels.get(deal.country || "") || "Unknown";
    const region = getCellForCountry(countryName);
    const originName = originLabels.get(deal.origin || "") || "Directo";
    
    if (!data[region][originName]) {
      data[region][originName] = 0;
    }
    data[region][originName] += parseFloat(deal.value || "0");
  });

  return regions.map(region => ({
    region,
    origins: Object.entries(data[region])
      .map(([origin, revenue]) => ({ origin, revenue: Math.round(revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
  }));
}

// Get sales cycle by region
export async function getSalesCycleByRegion() {
  const allDeals = await db.select().from(pipedriveDeals)
    .where(eq(pipedriveDeals.status, "won"));
  
  const dealFields = await pipedrive.getDealFields();
  const COUNTRY_FIELD_KEY = "f7c43d98b4ef75192ee0798b360f2076754981b9";
  const countryField = dealFields.find((f: any) => f.key === COUNTRY_FIELD_KEY);
  const countryLabels = new Map(countryField?.options?.map((o: any) => [o.id.toString(), o.label]) || []);

  const getCellForCountry = (countryName: string): string => {
    const normalized = countryName.toLowerCase();
    if (normalized === "colombia") return "Colombia";
    if (normalized === "argentina") return "Argentina";
    if (normalized === "mexico" || normalized === "méxico") return "Mexico";
    if (normalized === "brasil") return "Brasil";
    if (normalized === "españa") return "España";
    return "Rest Latam";
  };

  const regions = ["Colombia", "Argentina", "Mexico", "Brasil", "España", "Rest Latam"];
  const data: Record<string, { totalDays: number; count: number }> = {};
  regions.forEach(r => { data[r] = { totalDays: 0, count: 0 }; });

  allDeals.forEach(deal => {
    if (!deal.salesCycleDays || deal.salesCycleDays <= 0) return;
    
    const countryName = countryLabels.get(deal.country || "") || "Unknown";
    const region = getCellForCountry(countryName);
    
    data[region].totalDays += deal.salesCycleDays;
    data[region].count++;
  });

  return regions.map(region => ({
    region,
    avgDays: data[region].count > 0 ? Math.round(data[region].totalDays / data[region].count) : 0,
    deals: data[region].count,
  }));
}

// Get source distribution from cached deals (uses Origin field, same as ranking/regional)
export async function getSourceDistribution(filters?: DashboardFilters) {
  const cachedDeals = await db.select().from(pipedriveDeals);
  
  // Get people assignments for team filtering
  const peopleList = await db.select().from(people);
  const personToTeam: Record<number, number> = {};
  peopleList.forEach(p => {
    if (p.pipedriveUserId && p.teamId) {
      personToTeam[p.pipedriveUserId] = p.teamId;
    }
  });
  
  // Get Origin field options from Pipedrive (same field used in ranking/regional)
  const dealFields = await pipedrive.getDealFields();
  const ORIGEN_FIELD_KEY = "a9241093db8147d20f4c1c7f6c1998477f819ef4";
  const origenField = dealFields.find((f: any) => f.key === ORIGEN_FIELD_KEY);
  const originLabels = new Map(origenField?.options?.map((o: any) => [o.id.toString(), o.label]) || []);
  
  // Filter deals based on criteria
  let filteredDeals = cachedDeals.filter(deal => {
    if (filters?.startDate && deal.addTime) {
      const addDate = new Date(deal.addTime);
      if (addDate < new Date(filters.startDate)) return false;
    }
    if (filters?.endDate && deal.addTime) {
      const addDate = new Date(deal.addTime);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (addDate > endDate) return false;
    }
    if (filters?.dealType && deal.dealType !== filters.dealType) return false;
    if (filters?.countries && filters.countries.length > 0) {
      if (!deal.country || !filters.countries.includes(deal.country)) return false;
    }
    if (filters?.origins && filters.origins.length > 0) {
      if (!deal.origin || !filters.origins.includes(deal.origin)) return false;
    }
    if (filters?.teamId && deal.userId) {
      const dealTeamId = personToTeam[deal.userId];
      if (dealTeamId !== filters.teamId) return false;
    }
    if (filters?.personId && deal.userId !== filters.personId) return false;
    return true;
  });
  
  // Count deals by origin (same field as ranking/regional)
  const countBySource: Record<string, number> = {};
  
  filteredDeals.forEach(deal => {
    const originId = deal.origin;
    if (!originId || originId.trim() === "") return;
    
    const originName = originLabels.get(originId.trim()) || `Origin ${originId}`;
    countBySource[originName] = (countBySource[originName] || 0) + 1;
  });
  
  // Sort by count descending and take top 10
  return Object.entries(countBySource)
    .map(([name, value]) => ({ date: name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

function aggregateProductStats(products: any[], deals: any[]) {
  const productStats: Record<number, { name: string; units: number; revenue: number }> = {};
  
  products.forEach(p => {
    const productId = p.productId || p.product_id;
    const productName = p.productName || p.name || `Producto ${productId}`;
    const quantity = parseInt(p.quantity) || 1;
    const sum = parseFloat(p.sum) || 0;
    
    if (!productStats[productId]) {
      productStats[productId] = { name: productName, units: 0, revenue: 0 };
    }
    productStats[productId].units += quantity;
    productStats[productId].revenue += sum;
  });

  return Object.entries(productStats)
    .map(([id, data]) => ({
      id: parseInt(id),
      name: data.name,
      sold: data.units,
      revenue: Math.round(data.revenue * 100) / 100,
      averageTicket: data.units > 0 ? Math.round((data.revenue / data.units) * 100) / 100 : 0,
    }))
    .filter(p => p.sold > 0 || p.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);
}

// Get direct meetings data from cached Pipeline 1 (Deals)
// Filters for Directo Inbound + Outbound origins
interface DirectMeetingsFilters {
  startDate?: string;
  endDate?: string;
  personId?: number;
  teamId?: number;
  countries?: string[];
  origins?: string[];
  dealType?: string;
}

export async function getDirectMeetingsData(filters?: DirectMeetingsFilters) {
  // Get cached deals from pipeline 9
  const cachedDeals = await db.select().from(pipedriveDeals);
  
  // Date range: use filters or default to last 12 weeks
  let startDate: Date;
  let endDate: Date;
  
  if (filters?.startDate && filters?.endDate) {
    startDate = new Date(filters.startDate);
    endDate = new Date(filters.endDate + "T23:59:59");
  } else {
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 84); // Default: 12 weeks
  }
  
  // Get team members for team filtering
  const users = await pipedrive.getUsers();
  const userNames = new Map(users.map(u => [u.id, u.name]));
  
  // Build team member map if teamId filter is specified
  let teamMemberIds: Set<number> | undefined;
  if (filters?.teamId) {
    const teams = await db.select().from(teamsTable);
    const teamMembers = await db.select().from(teamMembersTable);
    const team = teams.find(t => t.id === filters.teamId);
    if (team) {
      const memberRelations = teamMembers.filter(tm => tm.teamId === team.id);
      teamMemberIds = new Set(memberRelations.map(tm => tm.pipedriveUserId));
    }
  }

  // Filter to pipeline 1 (Deals) only
  const pipeline1Deals = cachedDeals.filter(deal => {
    if (deal.pipelineId !== 1) return false;
    if (!deal.addTime) return false;
    const addDate = new Date(deal.addTime);
    if (addDate < startDate || addDate > endDate) return false;
    
    // Filter by person if specified
    if (filters?.personId && deal.userId !== filters.personId) return false;
    
    // Filter by team if specified
    if (teamMemberIds && deal.userId && !teamMemberIds.has(deal.userId)) return false;
    
    // Filter by countries if specified
    if (filters?.countries && filters.countries.length > 0) {
      if (!deal.country || !filters.countries.includes(deal.country)) return false;
    }
    
    // Filter by origins if specified
    if (filters?.origins && filters.origins.length > 0) {
      if (!deal.origin || !filters.origins.includes(deal.origin)) return false;
    }
    
    // Filter by deal type if specified
    if (filters?.dealType && filters.dealType !== 'all') {
      if (!deal.dealType || deal.dealType !== filters.dealType) return false;
    }
    
    return true;
  });
  
  // Get origin field options from Pipedrive for labels
  const dealFields = await pipedrive.getDealFields();
  const ORIGEN_FIELD_KEY = "a9241093db8147d20f4c1c7f6c1998477f819ef4";
  const origenField = dealFields.find((f: any) => f.key === ORIGEN_FIELD_KEY);
  const originLabels = new Map(origenField?.options?.map((o: any) => [o.id.toString(), o.label]) || []);
  
  // Get country options for region mapping
  const COUNTRY_FIELD_KEY = "f7c43d98b4ef75192ee0798b360f2076754981b9";
  const countryField = dealFields.find((f: any) => f.key === COUNTRY_FIELD_KEY);
  const countryLabels = new Map(countryField?.options?.map((o: any) => [o.id.toString(), o.label]) || []);
  
  // Helper function to map country to region
  const getCellForCountry = (countryName: string): string => {
    const normalized = countryName.toLowerCase();
    if (normalized === "colombia") return "Colombia";
    if (normalized === "argentina") return "Argentina";
    if (normalized === "mexico" || normalized === "méxico") return "Mexico";
    if (normalized === "brasil" || normalized === "brazil") return "Brasil";
    if (normalized === "españa" || normalized === "spain") return "España";
    return "Rest Latam";
  };
  
  // Find direct origin IDs (Directo, Directo Inbound, Directo Outbound)
  const directOriginIds: string[] = [];
  originLabels.forEach((label, id) => {
    if (label.toLowerCase().includes('directo')) {
      directOriginIds.push(id);
    }
  });
  
  // Filter deals with direct origins from pipeline 1
  const directDeals = pipeline1Deals.filter(deal => {
    if (!deal.origin) return false;
    return directOriginIds.includes(deal.origin);
  });
  
  // Aggregate by week
  const weeklyData: Record<string, { count: number; value: number }> = {};
  const byPerson: Record<number, { name: string; meetings: number; value: number }> = {};
  const byRegion: Record<string, { meetings: number; value: number }> = {};
  
  // SDR → BDR assignment tracking
  const sdrBdrMatrix: Record<string, Record<string, number>> = {};
  const sdrTotals: Record<string, number> = {};
  
  let totalMeetings = 0;
  let totalValue = 0;
  
  directDeals.forEach(deal => {
    const addDate = new Date(deal.addTime!);
    const year = addDate.getFullYear();
    const week = getWeekNumber(addDate);
    const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;
    const value = parseFloat(deal.value || "0") || 0;
    
    // Weekly aggregation
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { count: 0, value: 0 };
    }
    weeklyData[weekKey].count++;
    weeklyData[weekKey].value += value;
    
    // By person
    if (deal.userId) {
      if (!byPerson[deal.userId]) {
        byPerson[deal.userId] = { name: userNames.get(deal.userId) || `User ${deal.userId}`, meetings: 0, value: 0 };
      }
      byPerson[deal.userId].meetings++;
      byPerson[deal.userId].value += value;
    }
    
    // By region
    const countryName = countryLabels.get(deal.country || "") || "Unknown";
    const region = getCellForCountry(countryName);
    if (!byRegion[region]) {
      byRegion[region] = { meetings: 0, value: 0 };
    }
    byRegion[region].meetings++;
    byRegion[region].value += value;
    
    // SDR → BDR assignment
    const sdrId = deal.creatorUserId;
    const bdrId = deal.userId;
    const sdrName = sdrId ? (userNames.get(sdrId) || `User ${sdrId}`) : "Sin SDR";
    const bdrName = bdrId ? (userNames.get(bdrId) || `User ${bdrId}`) : "Sin owner";
    
    if (!sdrBdrMatrix[sdrName]) {
      sdrBdrMatrix[sdrName] = {};
      sdrTotals[sdrName] = 0;
    }
    if (!sdrBdrMatrix[sdrName][bdrName]) {
      sdrBdrMatrix[sdrName][bdrName] = 0;
    }
    sdrBdrMatrix[sdrName][bdrName]++;
    sdrTotals[sdrName]++;
    
    totalMeetings++;
    totalValue += value;
  });
  
  // Format weekly data
  const weeklyMeetings = Object.entries(weeklyData)
    .map(([week, data]) => ({ week, count: data.count, value: Math.round(data.value) }))
    .sort((a, b) => a.week.localeCompare(b.week));
  
  // Format by person (top 10)
  const personList = Object.values(byPerson)
    .map(p => ({ name: p.name, meetings: p.meetings, value: Math.round(p.value) }))
    .sort((a, b) => b.meetings - a.meetings)
    .slice(0, 10);
  
  // Format by region
  const regionList = Object.entries(byRegion)
    .map(([region, data]) => ({ region, meetings: data.meetings, value: Math.round(data.value) }))
    .sort((a, b) => b.meetings - a.meetings);
  
  // Format SDR → BDR assignment data
  const sdrBdrAssignment: Array<{ sdr: string; bdr: string; deals: number; percentage: number }> = [];
  Object.entries(sdrBdrMatrix).forEach(([sdr, bdrs]) => {
    const sdrTotal = sdrTotals[sdr];
    Object.entries(bdrs).forEach(([bdr, count]) => {
      sdrBdrAssignment.push({
        sdr,
        bdr,
        deals: count,
        percentage: Math.round((count / sdrTotal) * 100),
      });
    });
  });
  // Sort by SDR name, then by deals descending
  sdrBdrAssignment.sort((a, b) => {
    if (a.sdr !== b.sdr) return a.sdr.localeCompare(b.sdr);
    return b.deals - a.deals;
  });
  
  // Calculate SDR totals for summary
  const sdrSummary = Object.entries(sdrTotals)
    .map(([sdr, total]) => ({ sdr, totalDeals: total }))
    .sort((a, b) => b.totalDeals - a.totalDeals);
  
  // Calculate BDR totals for summary
  const bdrTotals: Record<string, number> = {};
  Object.values(sdrBdrMatrix).forEach(bdrs => {
    Object.entries(bdrs).forEach(([bdr, count]) => {
      bdrTotals[bdr] = (bdrTotals[bdr] || 0) + count;
    });
  });
  const bdrSummary = Object.entries(bdrTotals)
    .map(([bdr, total]) => ({ bdr, totalDeals: total }))
    .sort((a, b) => b.totalDeals - a.totalDeals);
  
  return {
    weeklyMeetings,
    byPerson: personList,
    byRegion: regionList,
    sdrBdrAssignment,
    sdrSummary,
    bdrSummary,
    totals: {
      meetings: totalMeetings,
      value: Math.round(totalValue),
      avgTicket: totalMeetings > 0 ? Math.round(totalValue / totalMeetings) : 0,
    },
  };
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
