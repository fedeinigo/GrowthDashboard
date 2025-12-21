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
} from "@/lib/api";

export function useDashboardData(filters?: any) {
  // Convert filter values to API format
  const apiFilters = filters ? {
    teamId: filters.team && filters.team !== 'all' ? parseInt(filters.team) : undefined,
    personId: filters.person && filters.person !== 'all' ? parseInt(filters.person) : undefined,
    sourceId: filters.source && filters.source !== 'all' ? parseInt(filters.source) : undefined,
    startDate: filters.startDate,
    endDate: filters.endDate,
    dealType: filters.dealType,
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
    companySizeDistribution.isLoading;

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
    companySizeDistribution.isError;

  // Transform metrics data to match the expected format
  const transformedMetrics = metrics.data ? {
    revenue: {
      label: "Dólares Conseguidos",
      value: metrics.data.revenue,
      change: metrics.data.previousRevenue > 0 
        ? ((metrics.data.revenue - metrics.data.previousRevenue) / metrics.data.previousRevenue) * 100
        : 0,
      trend: metrics.data.revenue >= metrics.data.previousRevenue ? "up" : "down",
      prefix: "$",
      subtext: "ARR Neto"
    },
    closureRate: {
      label: "Tasa de Cierre",
      value: metrics.data.closureRate,
      change: metrics.data.closureRate - metrics.data.previousClosureRate,
      trend: metrics.data.closureRate >= metrics.data.previousClosureRate ? "up" : "down",
      suffix: "%",
      subtext: `vs. período anterior (${metrics.data.previousClosureRate.toFixed(1)}%)`
    },
    meetings: {
      label: "Reuniones Realizadas",
      value: metrics.data.meetings,
      change: metrics.data.meetings - metrics.data.previousMeetings,
      trend: metrics.data.meetings >= metrics.data.previousMeetings ? "up" : "down",
      subtext: `${metrics.data.previousMeetings} en período anterior`
    },
    logos: {
      label: "Logos Conseguidos",
      value: metrics.data.logos,
      change: metrics.data.logos - metrics.data.previousLogos,
      trend: metrics.data.logos >= metrics.data.previousLogos ? "up" : "down",
      subtext: `${metrics.data.previousLogos} en período anterior`
    },
    avgSalesCycle: {
      label: "Ciclo de Venta Promedio",
      value: metrics.data.avgSalesCycle,
      change: metrics.data.previousAvgSalesCycle - metrics.data.avgSalesCycle, // Lower is better
      trend: metrics.data.avgSalesCycle <= metrics.data.previousAvgSalesCycle ? "up" : "down",
      suffix: " días",
      subtext: `${metrics.data.previousAvgSalesCycle} días anterior`
    },
    companySize: {
      label: "Tamaño Empresa (Promedio)",
      value: metrics.data.companySize,
      change: 0,
      trend: "neutral" as const,
      subtext: "Segmento más frecuente"
    }
  } : undefined;

  return {
    metrics: transformedMetrics,
    revenueHistory: revenueHistory.data || [],
    meetingsHistory: meetingsHistory.data || [],
    closureRateHistory: closureRateHistory.data || [],
    products: productStats.data || [],
    rankings: {
      byTeam: rankingsByTeam.data || [],
      byPerson: rankingsByPerson.data || [],
      bySource: rankingsBySource.data || [],
    },
    regionalData: regionalData.data || [],
    companySizes: companySizeDistribution.data || [],
    isLoading,
    isError,
  };
}
