import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardMetrics,
  fetchRevenueHistory,
  fetchMeetingsHistory,
  fetchClosureRateHistory,
  fetchProductStats,
  fetchRankingsByTeam,
  fetchRankingsByPerson,
  fetchRankingsBySource,
  fetchRegionalData,
  fetchCompanySizeDistribution,
  fetchSourceDistribution,
  fetchNCMeetings10Weeks,
  fetchQuarterlyRegionComparison,
  fetchTopOriginsByRegion,
  fetchSalesCycleByRegion,
} from "@/lib/api";

export function useDashboardData(filters?: any) {
  // Convert filter values to API format
  const apiFilters = filters ? {
    teamId: filters.team && filters.team !== 'all' ? parseInt(filters.team) : undefined,
    personId: filters.person && filters.person !== 'all' ? parseInt(filters.person) : undefined,
    sources: filters.sources, // Array of source IDs
    startDate: filters.startDate,
    endDate: filters.endDate,
    dealType: filters.dealType,
    countries: filters.countries,
  } : undefined;

  const metrics = useQuery({
    queryKey: ['dashboard-metrics', apiFilters],
    queryFn: () => fetchDashboardMetrics(apiFilters),
  });

  const revenueHistory = useQuery({
    queryKey: ['revenue-history', apiFilters],
    queryFn: () => fetchRevenueHistory(apiFilters),
  });

  const meetingsHistory = useQuery({
    queryKey: ['meetings-history', apiFilters],
    queryFn: () => fetchMeetingsHistory(apiFilters),
  });

  const closureRateHistory = useQuery({
    queryKey: ['closure-rate-history', apiFilters],
    queryFn: () => fetchClosureRateHistory(apiFilters),
  });

  const productStats = useQuery({
    queryKey: ['product-stats', apiFilters],
    queryFn: () => fetchProductStats(apiFilters),
  });

  const rankingsByTeam = useQuery({
    queryKey: ['rankings-team', apiFilters],
    queryFn: () => fetchRankingsByTeam(apiFilters),
  });

  const rankingsByPerson = useQuery({
    queryKey: ['rankings-person', apiFilters],
    queryFn: () => fetchRankingsByPerson(apiFilters),
  });

  const rankingsBySource = useQuery({
    queryKey: ['rankings-source', apiFilters],
    queryFn: () => fetchRankingsBySource(apiFilters),
  });

  const regionalData = useQuery({
    queryKey: ['regional-data', apiFilters],
    queryFn: () => fetchRegionalData(apiFilters),
  });

  const companySizeDistribution = useQuery({
    queryKey: ['company-size-distribution', apiFilters],
    queryFn: () => fetchCompanySizeDistribution(apiFilters),
  });

  const sourceDistribution = useQuery({
    queryKey: ['source-distribution', apiFilters],
    queryFn: () => fetchSourceDistribution(apiFilters),
  });

  const ncMeetings10Weeks = useQuery({
    queryKey: ['nc-meetings-10weeks'],
    queryFn: fetchNCMeetings10Weeks,
  });

  const quarterlyRegionComparison = useQuery({
    queryKey: ['quarterly-region-comparison'],
    queryFn: fetchQuarterlyRegionComparison,
  });

  const topOriginsByRegion = useQuery({
    queryKey: ['top-origins-by-region'],
    queryFn: fetchTopOriginsByRegion,
  });

  const salesCycleByRegion = useQuery({
    queryKey: ['sales-cycle-by-region'],
    queryFn: fetchSalesCycleByRegion,
  });

  const isLoading = 
    metrics.isLoading ||
    revenueHistory.isLoading ||
    meetingsHistory.isLoading ||
    closureRateHistory.isLoading ||
    productStats.isLoading ||
    rankingsByTeam.isLoading ||
    rankingsByPerson.isLoading ||
    rankingsBySource.isLoading ||
    regionalData.isLoading ||
    companySizeDistribution.isLoading ||
    sourceDistribution.isLoading ||
    ncMeetings10Weeks.isLoading ||
    quarterlyRegionComparison.isLoading ||
    topOriginsByRegion.isLoading ||
    salesCycleByRegion.isLoading;

  const isError = 
    metrics.isError ||
    revenueHistory.isError ||
    meetingsHistory.isError ||
    closureRateHistory.isError ||
    productStats.isError ||
    rankingsByTeam.isError ||
    rankingsByPerson.isError ||
    rankingsBySource.isError ||
    regionalData.isError ||
    companySizeDistribution.isError ||
    sourceDistribution.isError ||
    ncMeetings10Weeks.isError ||
    quarterlyRegionComparison.isError ||
    topOriginsByRegion.isError ||
    salesCycleByRegion.isError;

  // Transform metrics data to match the expected format
  // Support both old field names (revenue, logos, avgSalesCycle) and new cached format (totalRevenue, logosWon, salesCycle)
  const m = metrics.data;
  const transformedMetrics = m ? {
    revenue: {
      label: "Dólares Conseguidos",
      value: m.revenue ?? m.totalRevenue ?? 0,
      change: (m.previousRevenue || 0) > 0 
        ? (((m.revenue ?? m.totalRevenue ?? 0) - (m.previousRevenue || 0)) / (m.previousRevenue || 1)) * 100
        : 0,
      trend: (m.revenue ?? m.totalRevenue ?? 0) >= (m.previousRevenue || 0) ? "up" : "down",
      prefix: "$",
      subtext: "ARR Neto"
    },
    closureRate: {
      label: "Tasa de Cierre",
      value: m.closureRate ?? 0,
      change: (m.closureRate ?? 0) - (m.previousClosureRate ?? 0),
      trend: (m.closureRate ?? 0) >= (m.previousClosureRate ?? 0) ? "up" : "down",
      suffix: "%",
      subtext: m.previousClosureRate != null 
        ? `vs. período anterior (${m.previousClosureRate.toFixed(1)}%)`
        : "Período actual"
    },
    meetings: {
      label: "Reuniones Realizadas",
      value: m.meetings ?? 0,
      change: (m.meetings ?? 0) - (m.previousMeetings ?? 0),
      trend: (m.meetings ?? 0) >= (m.previousMeetings ?? 0) ? "up" : "down",
      subtext: m.previousMeetings != null 
        ? `${m.previousMeetings} en período anterior`
        : "Período actual"
    },
    logos: {
      label: "Logos Conseguidos",
      value: m.logos ?? m.logosWon ?? 0,
      change: (m.logos ?? m.logosWon ?? 0) - (m.previousLogos ?? 0),
      trend: (m.logos ?? m.logosWon ?? 0) >= (m.previousLogos ?? 0) ? "up" : "down",
      subtext: m.previousLogos != null 
        ? `${m.previousLogos} en período anterior`
        : "Período actual"
    },
    avgSalesCycle: {
      label: "Ciclo de Venta Promedio",
      value: m.avgSalesCycle ?? m.salesCycle ?? 0,
      change: (m.previousAvgSalesCycle ?? 0) - (m.avgSalesCycle ?? m.salesCycle ?? 0), // Lower is better
      trend: (m.avgSalesCycle ?? m.salesCycle ?? 0) <= (m.previousAvgSalesCycle ?? 0) ? "up" : "down",
      suffix: " días",
      subtext: m.previousAvgSalesCycle != null 
        ? `${m.previousAvgSalesCycle} días anterior`
        : "Período actual"
    },
    avgTicket: {
      label: "Ticket Promedio",
      value: m.avgTicket ?? 0,
      change: (m.previousAvgTicket || 0) > 0
        ? (((m.avgTicket ?? 0) - (m.previousAvgTicket || 0)) / (m.previousAvgTicket || 1)) * 100
        : 0,
      trend: (m.avgTicket ?? 0) >= (m.previousAvgTicket ?? 0) ? "up" : "down",
      prefix: "$",
      subtext: "New Customers ganados"
    }
  } : undefined;

  const formatRankingValue = (value: number) => `$${(value || 0).toLocaleString()}`;

  const transformedRankingsByTeam = (rankingsByTeam.data || []).map(item => ({
    ...item,
    valueFormatted: formatRankingValue(item.value),
  }));

  const transformedRankingsByPerson = (rankingsByPerson.data || []).map((item: any) => ({
    ...item,
    value: item.revenue || item.value || 0,
    valueFormatted: formatRankingValue(item.revenue || item.value || 0),
  }));

  const transformedRankingsBySource = (rankingsBySource.data || []).map(item => ({
    ...item,
    valueFormatted: formatRankingValue(item.value),
  }));

  const transformedRevenueHistory = (revenueHistory.data || []).map((item: any) => ({
    date: item.week || item.month,
    value: item.revenue,
  }));

  const transformedMeetingsHistory = (meetingsHistory.data || []).map((item: any) => ({
    date: item.week || item.month,
    value: item.cardsCreated || item.meetings,
  }));

  return {
    metrics: transformedMetrics,
    revenueHistory: transformedRevenueHistory,
    meetingsHistory: transformedMeetingsHistory,
    closureRateHistory: closureRateHistory.data || {},
    products: productStats.data || [],
    rankings: {
      byTeam: transformedRankingsByTeam,
      byPerson: transformedRankingsByPerson,
      bySource: transformedRankingsBySource,
    },
    regionalData: regionalData.data || [],
    companySizes: companySizeDistribution.data || [],
    sourceDistribution: sourceDistribution.data || [],
    ncMeetings10Weeks: ncMeetings10Weeks.data || [],
    quarterlyRegionComparison: quarterlyRegionComparison.data || null,
    topOriginsByRegion: topOriginsByRegion.data || [],
    salesCycleByRegion: salesCycleByRegion.data || [],
    isLoading,
    isError,
  };
}
