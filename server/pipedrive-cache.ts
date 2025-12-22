import { db } from "./db";
import { pipedriveDeals, cacheMetadata } from "@shared/schema";
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
    
    const deals = await pipedrive.getAllDeals(1);
    
    console.log(`[Cache] Fetched ${deals.length} deals from Pipedrive`);

    const TYPE_OF_DEAL_FIELD_KEY = "a7ab0c5cfbfd5a57ce6531b4aa0a74b317c4b657";
    const COUNTRY_FIELD_KEY = "f7c43d98b4ef75192ee0798b360f2076754981b9";
    const ORIGEN_FIELD_KEY = "a9241093db8147d20f4c1c7f6c1998477f819ef4";

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
        personId: personId || null,
        orgId: orgId || null,
        addTime: deal.add_time ? new Date(deal.add_time) : null,
        updateTime: deal.update_time ? new Date(deal.update_time) : null,
        wonTime: wonTime,
        lostTime: deal.lost_time ? new Date(deal.lost_time) : null,
        dealType: (deal as any)[TYPE_OF_DEAL_FIELD_KEY] || null,
        country: (deal as any)[COUNTRY_FIELD_KEY]?.toString() || null,
        origin: (deal as any)[ORIGEN_FIELD_KEY]?.toString() || null,
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

  const monthlyData: Record<string, number> = {};
  
  filteredDeals.forEach(deal => {
    const wonTime = new Date(deal.wonTime!);
    const monthKey = `${wonTime.getFullYear()}-${String(wonTime.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + parseFloat(deal.value || "0");
  });

  return Object.entries(monthlyData)
    .map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }))
    .sort((a, b) => a.month.localeCompare(b.month));
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

  const monthlyData: Record<string, number> = {};
  
  filteredDeals.forEach(deal => {
    const addTime = new Date(deal.addTime!);
    const monthKey = `${addTime.getFullYear()}-${String(addTime.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
  });

  return Object.entries(monthlyData)
    .map(([month, meetings]) => ({ month, meetings }))
    .sort((a, b) => a.month.localeCompare(b.month));
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

  const countryData: Record<string, { reuniones: number; propuestas: number; cierres: number; reunionesValue: number; propuestasValue: number; cierresValue: number }> = {};

  allDeals.forEach(deal => {
    if (filters.dealType && deal.dealType !== filters.dealType) return;
    if (filters.origins?.length && !filters.origins.includes(deal.origin || "")) return;
    if (allowedUserIds && !allowedUserIds.includes(deal.userId || 0)) return;
    
    const country = deal.country || "unknown";
    if (filters.countries?.length && !filters.countries.includes(country)) return;
    
    if (!countryData[country]) {
      countryData[country] = { reuniones: 0, propuestas: 0, cierres: 0, reunionesValue: 0, propuestasValue: 0, cierresValue: 0 };
    }
    
    const addTime = deal.addTime ? new Date(deal.addTime) : null;
    const wonTime = deal.wonTime ? new Date(deal.wonTime) : null;
    const value = parseFloat(deal.value || "0");

    if (deal.dealType === NEW_CUSTOMER_ID && addTime) {
      if ((!startDate || addTime >= startDate) && (!endDate || addTime <= endDate)) {
        countryData[country].reuniones++;
        countryData[country].reunionesValue += value;
      }
    }

    if (deal.dealType === NEW_CUSTOMER_ID) {
      const proposalStages = [PROPOSAL_MADE_STAGE, BLOCKED_STAGE, CURRENT_SPRINT_STAGE];
      if (proposalStages.includes(deal.stageId || 0) || deal.status === "won") {
        if (addTime && (!startDate || addTime >= startDate) && (!endDate || addTime <= endDate)) {
          countryData[country].propuestas++;
          countryData[country].propuestasValue += value;
        }
      }
    }

    if (deal.status === "won" && wonTime) {
      if ((!startDate || wonTime >= startDate) && (!endDate || wonTime <= endDate)) {
        countryData[country].cierres++;
        countryData[country].cierresValue += value;
      }
    }
  });

  const COUNTRY_LABELS: Record<string, string> = {
    "59": "Argentina", "60": "Bolivia", "64": "Chile", "65": "Colombia", 
    "69": "Ecuador", "75": "Guatemala", "84": "Mexico", "87": "Nicaragua",
    "88": "Panama", "89": "Paraguay", "90": "Peru", "101": "Spain",
    "105": "Uruguay", "106": "Venezuela", "73": "El Salvador",
    "79": "Honduras", "66": "Costa Rica", "95": "Dominican Republic"
  };

  return Object.entries(countryData).map(([countryId, data]) => ({
    country: COUNTRY_LABELS[countryId] || `País ${countryId}`,
    countryId,
    ...data,
  }));
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
