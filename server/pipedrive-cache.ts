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

    await db.delete(pipedriveDeals);

    if (deals.length > 0) {
      const TYPE_OF_DEAL_FIELD_KEY = "a7ab0c5cfbfd5a57ce6531b4aa0a74b317c4b657";
      const COUNTRY_FIELD_KEY = "f7c43d98b4ef75192ee0798b360f2076754981b9";
      const ORIGEN_FIELD_KEY = "a9241093db8147d20f4c1c7f6c1998477f819ef4";

      const batchSize = 100;
      for (let i = 0; i < deals.length; i += batchSize) {
        const batch = deals.slice(i, i + batchSize);
        const records = batch.map(deal => {
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

        await db.insert(pipedriveDeals).values(records);
      }
    }

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
    
    isRefreshing = false;
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
    
    isRefreshing = false;
    return { success: false, message: error.message || "Cache refresh failed" };
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
