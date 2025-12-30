import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardMetrics,
  fetchRevenueHistory,
  fetchMonthlyRevenueByType,
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
  fetchConversionFunnel,
  fetchLossReasons,
} from "@/lib/api";

export function useDashboardData(filters?: any) {
  // Convert filter values to API format
  const apiFilters = filters ? {
    // Support both old single-select (team/person) and new multi-select (teams/people)
    teamIds: filters.teams && filters.teams.length > 0 ? filters.teams.map((t: string) => parseInt(t)) : undefined,
    personIds: filters.people && filters.people.length > 0 ? filters.people.map((p: string) => parseInt(p)) : undefined,
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

  const monthlyRevenueByType = useQuery({
    queryKey: ['monthly-revenue-by-type', apiFilters],
    queryFn: () => fetchMonthlyRevenueByType(apiFilters),
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
    queryKey: ['quarterly-region-comparison', apiFilters],
    queryFn: () => fetchQuarterlyRegionComparison(apiFilters),
  });

  const topOriginsByRegion = useQuery({
    queryKey: ['top-origins-by-region', apiFilters],
    queryFn: () => fetchTopOriginsByRegion(apiFilters),
  });

  const salesCycleByRegion = useQuery({
    queryKey: ['sales-cycle-by-region', apiFilters],
    queryFn: () => fetchSalesCycleByRegion(apiFilters),
  });

  const conversionFunnel = useQuery({
    queryKey: ['conversion-funnel', apiFilters],
    queryFn: () => fetchConversionFunnel(apiFilters),
  });

  const lossReasons = useQuery({
    queryKey: ['loss-reasons', apiFilters],
    queryFn: () => fetchLossReasons(apiFilters),
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
    salesCycleByRegion.isLoading ||
    conversionFunnel.isLoading ||
    lossReasons.isLoading;

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
    salesCycleByRegion.isError ||
    conversionFunnel.isError ||
    lossReasons.isError;

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
      subtext: "MRR Neto"
    },
    closureRate: {
      label: "Tasa de Cierre (NC)",
      value: m.closureRate ?? 0,
      change: (m.closureRate ?? 0) - (m.previousClosureRate ?? 0),
      trend: (m.closureRate ?? 0) >= (m.previousClosureRate ?? 0) ? "up" : "down",
      suffix: "%",
      subtext: m.previousClosureRate != null 
        ? `New Customers: vs. anterior (${m.previousClosureRate.toFixed(1)}%)`
        : "Solo New Customers"
    },
    meetings: {
      label: "Reuniones NC",
      value: m.meetings ?? 0,
      change: (m.meetings ?? 0) - (m.previousMeetings ?? 0),
      trend: (m.meetings ?? 0) >= (m.previousMeetings ?? 0) ? "up" : "down",
      subtext: m.previousMeetings != null 
        ? `New Customers: ${m.previousMeetings} anterior`
        : "Solo New Customers"
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
      label: "Ciclo de Venta (NC)",
      value: m.avgSalesCycle ?? m.salesCycle ?? 0,
      change: (m.previousAvgSalesCycle ?? 0) - (m.avgSalesCycle ?? m.salesCycle ?? 0), // Lower is better
      trend: (m.avgSalesCycle ?? m.salesCycle ?? 0) <= (m.previousAvgSalesCycle ?? 0) ? "up" : "down",
      suffix: " días",
      subtext: m.previousAvgSalesCycle != null 
        ? `New Customers: ${m.previousAvgSalesCycle} días anterior`
        : "Solo New Customers"
    },
    avgTicket: {
      label: "Ticket Promedio (NC)",
      value: m.avgTicket ?? 0,
      change: (m.previousAvgTicket || 0) > 0
        ? (((m.avgTicket ?? 0) - (m.previousAvgTicket || 0)) / (m.previousAvgTicket || 1)) * 100
        : 0,
      trend: (m.avgTicket ?? 0) >= (m.previousAvgTicket ?? 0) ? "up" : "down",
      prefix: "$",
      subtext: "Solo New Customers"
    },
    totalNewCustomers: {
      label: "Revenue New Customers",
      value: m.revenueNewCustomers ?? 0,
      count: m.totalNewCustomers ?? 0,
      change: 0,
      trend: "neutral",
      prefix: "$",
      subtext: `${m.totalNewCustomers ?? 0} deals ganados`
    },
    totalUpselling: {
      label: "Revenue Upselling",
      value: m.revenueUpselling ?? 0,
      count: m.totalUpselling ?? 0,
      change: 0,
      trend: "neutral",
      prefix: "$",
      subtext: `${m.totalUpselling ?? 0} deals ganados`
    }
  } : undefined;

  const formatRankingValue = (value: number) => `$${(value || 0).toLocaleString()}`;

  const transformedRankingsByTeam = (rankingsByTeam.data || []).map((item: any) => ({
    ...item,
    valueFormatted: formatRankingValue(item.value),
  }));

  const transformedRankingsByPerson = (rankingsByPerson.data || []).map((item: any) => ({
    ...item,
    value: item.revenue || item.value || 0,
    valueFormatted: formatRankingValue(item.revenue || item.value || 0),
  }));

  const transformedRankingsBySource = (rankingsBySource.data || []).map((item: any) => ({
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
    monthlyRevenueByType: monthlyRevenueByType.data || [],
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
    conversionFunnel: conversionFunnel.data || null,
    lossReasons: lossReasons.data || null,
    isLoading,
    isError,
  };
}
