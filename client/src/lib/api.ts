function buildFilterQuery(filters?: any): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  
  // Multi-select: teamIds (array of team IDs)
  if (filters.teamIds && filters.teamIds.length > 0) {
    params.append('teamIds', filters.teamIds.join(','));
  }
  // Multi-select: personIds (array of person IDs)
  if (filters.personIds && filters.personIds.length > 0) {
    params.append('personIds', filters.personIds.join(','));
  }
  // Array filters
  if (filters.sources && filters.sources.length > 0) {
    params.append('sources', filters.sources.join(','));
  }
  if (filters.countries && filters.countries.length > 0) {
    params.append('countries', filters.countries.join(','));
  }
  if (filters.origins && filters.origins.length > 0) {
    params.append('origins', filters.origins.join(','));
  }
  // Single value filters
  if (filters.regionId) params.append('regionId', filters.regionId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.dealType) params.append('dealType', filters.dealType);
  
  return params.toString();
}

function withQuery(basePath: string, query: string): string {
  return query ? `${basePath}?${query}` : basePath;
}

export async function fetchDashboardMetrics(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/metrics', query));
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
}

export async function fetchRevenueHistory(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/revenue-history', query));
  if (!res.ok) throw new Error('Failed to fetch revenue history');
  return res.json();
}

export async function fetchMonthlyRevenueByType(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/monthly-revenue-by-type', query));
  if (!res.ok) throw new Error('Failed to fetch monthly revenue by type');
  return res.json();
}

export async function fetchMeetingsHistory(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/meetings-history', query));
  if (!res.ok) throw new Error('Failed to fetch meetings history');
  return res.json();
}

export async function fetchClosureRateHistory(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/closure-rate-history', query));
  if (!res.ok) throw new Error('Failed to fetch closure rate history');
  return res.json();
}

export async function fetchProductStats(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/product-stats', query));
  if (!res.ok) throw new Error('Failed to fetch product stats');
  return res.json();
}

export async function fetchRankingsByTeam(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/rankings/teams', query));
  if (!res.ok) throw new Error('Failed to fetch team rankings');
  return res.json();
}

export async function fetchRankingsByPerson(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/rankings/people', query));
  if (!res.ok) throw new Error('Failed to fetch person rankings');
  return res.json();
}

export async function fetchRankingsBySource(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/rankings/sources', query));
  if (!res.ok) throw new Error('Failed to fetch source rankings');
  return res.json();
}

export async function fetchRegionalData(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/regional-data', query));
  if (!res.ok) throw new Error('Failed to fetch regional data');
  return res.json();
}

export async function fetchCompanySizeDistribution(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/company-size-distribution', query));
  if (!res.ok) throw new Error('Failed to fetch company size distribution');
  return res.json();
}

export async function fetchSourceDistribution(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/source-distribution', query));
  if (!res.ok) throw new Error('Failed to fetch source distribution');
  return res.json();
}

export async function fetchTeams() {
  const res = await fetch('/api/teams');
  if (!res.ok) throw new Error('Failed to fetch teams');
  return res.json();
}

export async function updateTeamImage(teamId: number, imageUrl: string | null) {
  const res = await fetch(`/api/teams/${teamId}/image`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });
  if (!res.ok) throw new Error('Failed to update team image');
  return res.json();
}

export async function fetchPeople() {
  const res = await fetch('/api/people');
  if (!res.ok) throw new Error('Failed to fetch people');
  return res.json();
}

export async function fetchSources() {
  const res = await fetch('/api/sources');
  if (!res.ok) throw new Error('Failed to fetch sources');
  return res.json();
}

export async function fetchRegions() {
  const res = await fetch('/api/regions');
  if (!res.ok) throw new Error('Failed to fetch regions');
  return res.json();
}

export async function fetchDealTypes() {
  const res = await fetch('/api/deal-types');
  if (!res.ok) throw new Error('Failed to fetch deal types');
  return res.json();
}

export async function fetchCountries() {
  const res = await fetch('/api/countries');
  if (!res.ok) throw new Error('Failed to fetch countries');
  return res.json();
}

export async function fetchDealTypeStats(filters?: any) {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const query = params.toString();
  const url = `/api/dashboard/deal-type-stats${query ? `?${query}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch deal type stats');
  return res.json();
}

export async function fetchCacheStatus() {
  const res = await fetch('/api/cache/status');
  if (!res.ok) throw new Error('Failed to fetch cache status');
  return res.json();
}

export async function refreshCache() {
  const res = await fetch('/api/cache/refresh', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to refresh cache');
  return res.json();
}

export async function fetchNCMeetings10Weeks() {
  const res = await fetch('/api/dashboard/nc-meetings-10weeks');
  if (!res.ok) throw new Error('Failed to fetch NC meetings');
  return res.json();
}

export async function fetchQuarterlyRegionComparison(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/quarterly-region-comparison', query));
  if (!res.ok) throw new Error('Failed to fetch quarterly comparison');
  return res.json();
}

export async function fetchTopOriginsByRegion(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/top-origins-by-region', query));
  if (!res.ok) throw new Error('Failed to fetch top origins');
  return res.json();
}

export async function fetchSalesCycleByRegion(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/sales-cycle-by-region', query));
  if (!res.ok) throw new Error('Failed to fetch sales cycle');
  return res.json();
}

export async function fetchConversionFunnel(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/conversion-funnel', query));
  if (!res.ok) throw new Error('Failed to fetch conversion funnel');
  return res.json();
}

export async function fetchLossReasons(filters?: any) {
  const query = buildFilterQuery(filters);
  const res = await fetch(withQuery('/api/dashboard/loss-reasons', query));
  if (!res.ok) throw new Error('Failed to fetch loss reasons');
  return res.json();
}
