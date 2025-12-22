import { Layout } from "@/components/layout";
import { KPICard } from "@/components/kpi-card";
import { RevenueChart, MeetingsChart, ClosureChart, CompanySizeChart } from "@/components/charts";
import { DashboardFilters } from "@/components/dashboard-filters";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { EmptyState } from "@/components/empty-state";
import { CacheStatusIndicator } from "@/components/cache-status";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { 
  DollarSign, 
  Target, 
  Clock, 
  Briefcase,
  TrendingUp,
  CalendarCheck,
  Banknote,
  Trophy,
  Globe,
  UserCheck,
  Search,
  Database,
  BarChart3,
  Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import React, { useState } from "react";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  
  // Fetch dashboard data from API
  const { 
    metrics,
    revenueHistory,
    meetingsHistory, 
    closureRateHistory, 
    products,
    rankings,
    companySizes,
    ncMeetings10Weeks,
    sourceDistribution,
    isLoading,
    isError
  } = useDashboardData(filters);

  const handleFilterChange = (newFilters: any) => {
    if (newFilters.reset) {
        setFilters({});
        return;
    }
    
    // Remove undefined values
    const cleanedFilters = { ...filters, ...newFilters };
    Object.keys(cleanedFilters).forEach(key => {
        if (cleanedFilters[key] === undefined) {
            delete cleanedFilters[key];
        }
    });
    
    setFilters(cleanedFilters);
    console.log("Filters updated:", cleanedFilters);
  };

  const handleChartClick = (data: any, type: string) => {
     if (data && data.activePayload && data.activePayload[0]) {
        // Handle Area/Line chart clicks
         const point = data.activePayload[0].payload;
         console.log(`Clicked ${type}:`, point);
     } else if (data && data.date) {
         // Handle direct data point clicks (like Bar chart specialized click)
         console.log(`Clicked ${type}:`, data);
         if (type === "companySize") {
             handleFilterChange({ companySize: data.date });
         }
     }
  };

  // Loading and error states
  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 text-center text-muted-foreground">
          Cargando datos del dashboard...
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="p-8 text-center text-destructive">
          Error al cargar los datos. Por favor, intenta de nuevo.
        </div>
      </Layout>
    );
  }

  if (!metrics || !metrics.revenue) {
    return (
      <Layout>
        <EmptyState
          icon={Database}
          title="No hay datos disponibles"
          description="No se encontraron datos para mostrar. Intenta ajustar los filtros o verifica la conexión con Pipedrive."
          action={{
            label: "Limpiar filtros",
            onClick: () => handleFilterChange({ reset: true })
          }}
        />
      </Layout>
    );
  }

  const hasActiveFilters = Object.keys(filters).length > 0;
  const hasNoRankings = !rankings?.byTeam?.length && !rankings?.byPerson?.length && !rankings?.bySource?.length;
  const hasNoProducts = !products || products.length === 0;

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-foreground tracking-tight truncate">Resumen General</h2>
            <div className="mt-1">
              <CacheStatusIndicator />
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
             <div className="bg-primary text-primary-foreground px-3 sm:px-4 py-2 rounded-md text-sm font-medium shadow-md shadow-primary/20 hover:bg-primary/90 cursor-pointer transition-colors min-h-[44px] flex items-center">
                Exportar Reporte
             </div>
          </div>
        </div>

        {/* Filters Section */}
        <DashboardFilters filters={filters} onFilterChange={handleFilterChange} />

        <div className="space-y-4 sm:space-y-6 md:space-y-8">
                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KPICard 
                    title={metrics.revenue?.label || "Revenue"} 
                    value={metrics.revenue?.value || 0} 
                    change={metrics.revenue?.change || 0} 
                    trend={metrics.revenue?.trend || "neutral"} 
                    prefix={metrics.revenue?.prefix}
                    subtext={metrics.revenue?.subtext}
                    icon={DollarSign}
                    className="border-l-4 border-l-primary"
                />
                <KPICard 
                    title={metrics.closureRate?.label || "Closure Rate"} 
                    value={metrics.closureRate?.value || 0} 
                    change={metrics.closureRate?.change || 0} 
                    trend={metrics.closureRate?.trend || "neutral"} 
                    suffix={metrics.closureRate?.suffix}
                    subtext={metrics.closureRate?.subtext}
                    icon={Target}
                />
                <KPICard 
                    title={metrics.meetings?.label || "Meetings"} 
                    value={metrics.meetings?.value || 0} 
                    change={metrics.meetings?.change || 0} 
                    trend={metrics.meetings?.trend || "neutral"} 
                    subtext={metrics.meetings?.subtext}
                    icon={CalendarCheck}
                />
                <KPICard 
                    title={metrics.logos?.label || "Logos"} 
                    value={metrics.logos?.value || 0} 
                    change={metrics.logos?.change || 0} 
                    trend={metrics.logos?.trend || "neutral"} 
                    subtext={metrics.logos?.subtext}
                    icon={Briefcase}
                />
                <KPICard 
                    title={metrics.avgSalesCycle?.label || "Sales Cycle"} 
                    value={metrics.avgSalesCycle?.value || 0} 
                    change={metrics.avgSalesCycle?.change || 0} 
                    trend={metrics.avgSalesCycle?.trend || "neutral"} 
                    suffix={metrics.avgSalesCycle?.suffix}
                    subtext={metrics.avgSalesCycle?.subtext}
                    icon={Clock}
                />
                <KPICard 
                    title={metrics.avgTicket?.label || "Ticket Promedio"} 
                    value={metrics.avgTicket?.value || 0} 
                    change={metrics.avgTicket?.change || 0} 
                    trend={metrics.avgTicket?.trend || "neutral"} 
                    prefix={metrics.avgTicket?.prefix}
                    subtext={metrics.avgTicket?.subtext}
                    icon={Banknote}
                />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Main Revenue Chart */}
                    <RevenueChart 
                        data={revenueHistory} 
                        title="Evolución de Ingresos" 
                        description="Ingresos semanales (USD)"
                        dataKey="value"
                        onClick={(data) => handleChartClick(data, "revenue")}
                    />
                    
                    {/* Secondary Charts Row */}
                    <MeetingsChart 
                        data={meetingsHistory}
                        title="Tarjetas NC Creadas"
                        description="Cantidad de tarjetas New Customer creadas por semana"
                        dataKey="value"
                        onClick={(data) => handleChartClick(data, "meetings")}
                    />
                    <Card className="col-span-1 md:col-span-2 border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2 sm:pb-4">
                            <CardTitle className="text-base sm:text-lg">Tasa de Cierre</CardTitle>
                            <CardDescription className="text-xs sm:text-sm line-clamp-2">Tarjetas New Customer (últimos 6 meses): Ganadas / (Ganadas + Perdidas)</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center h-[160px] sm:h-[200px]">
                            <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary">
                                {typeof closureRateHistory === 'object' && 'closureRate' in closureRateHistory 
                                    ? `${closureRateHistory.closureRate}%` 
                                    : '0%'}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4 text-center">
                                {typeof closureRateHistory === 'object' && 'won' in closureRateHistory
                                    ? `${closureRateHistory.won} ganadas / ${closureRateHistory.total} cerradas`
                                    : ''}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Company Size Distribution - Interactive Filter */}
                    <CompanySizeChart 
                        data={companySizes}
                        title="Tamaño de Empresas"
                        description="Distribución por cantidad de empleados (Click para filtrar)"
                        onClick={(data) => handleChartClick(data, "companySize")}
                    />

                    {/* Source Distribution Chart */}
                    <CompanySizeChart 
                        data={sourceDistribution}
                        title="Distribución por Source"
                        description="Top 10 sources por cantidad de tarjetas"
                    />
                </div>

                {/* Rankings Section */}
                <h3 className="text-lg sm:text-xl font-heading font-bold mt-4 sm:mt-6 md:mt-8 mb-3 sm:mb-4">Rankings de Rendimiento</h3>
                {hasNoRankings ? (
                  <Card className="border-none shadow-sm">
                    <EmptyState
                      icon={BarChart3}
                      title="Sin datos de rankings"
                      description={hasActiveFilters 
                        ? "No hay datos para los filtros seleccionados. Intenta ajustar las fechas o filtros."
                        : "No se encontraron datos de rankings para mostrar."}
                      action={hasActiveFilters ? {
                        label: "Limpiar filtros",
                        onClick: () => handleFilterChange({ reset: true })
                      } : undefined}
                    />
                  </Card>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Team Ranking */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-2 px-4 sm:px-6">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
                                <span className="truncate">Top Equipos</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6">
                            {rankings?.byTeam?.length ? (
                            <div className="space-y-3 sm:space-y-4">
                                {rankings?.byTeam?.map((item, index) => {
                                    const maxValue = rankings?.byTeam?.[0]?.value || 1;
                                    return (
                                    <div key={item.name} className="flex flex-col gap-1">
                                        <div className="flex justify-between items-start text-xs sm:text-sm font-medium gap-2">
                                            <span className="truncate min-w-0">{index + 1}. {item.name}</span>
                                            <span className="text-emerald-600 font-semibold flex-shrink-0">{item.valueFormatted}</span>
                                        </div>
                                        <Progress value={(item.value / maxValue) * 100} className="h-2" />
                                    </div>
                                    );
                                })}
                            </div>
                            ) : (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                Sin datos de equipos
                              </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Person Ranking */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-2 px-4 sm:px-6">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                <span className="truncate">Top Ejecutivos</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6">
                            {rankings?.byPerson?.length ? (
                            <div className="space-y-3 sm:space-y-4">
                                {rankings?.byPerson?.map((item, index) => {
                                    const maxValue = rankings?.byPerson?.[0]?.value || 1;
                                    return (
                                    <div key={item.name} className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs sm:text-sm font-medium gap-2">
                                            <span className="truncate min-w-0">{index + 1}. {item.name}</span>
                                            <span className="text-emerald-600 font-semibold flex-shrink-0">{item.valueFormatted}</span>
                                        </div>
                                        <Progress value={(item.value / maxValue) * 100} className="h-2 bg-muted" indicatorClassName="bg-emerald-500" />
                                    </div>
                                    );
                                })}
                            </div>
                            ) : (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                Sin datos de ejecutivos
                              </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Source Ranking */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-2 px-4 sm:px-6">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                                <span className="truncate">Top Orígenes</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6">
                            {rankings?.bySource?.length ? (
                            <div className="space-y-3 sm:space-y-4">
                                {rankings?.bySource?.map((item, index) => (
                                    <div key={item.name} className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-2">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs sm:text-sm font-medium truncate">{index + 1}. {item.name}</span>
                                        </div>
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold flex-shrink-0 text-xs">
                                            {item.valueFormatted}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                            ) : (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                Sin datos de orígenes
                              </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                )}

                {/* Products Table */}
                <div className="grid grid-cols-1 mt-4 sm:mt-6 md:mt-8">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="px-4 sm:px-6">
                            <CardTitle className="text-base sm:text-lg">Rendimiento por Producto</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Desglose de ventas e ingresos por línea de producto (Pipedrive)</CardDescription>
                        </CardHeader>
                        <CardContent className="px-0 sm:px-6">
                            {hasNoProducts ? (
                              <EmptyState
                                icon={Package}
                                title="Sin datos de productos"
                                description={hasActiveFilters 
                                  ? "No hay productos para los filtros seleccionados. Intenta ajustar las fechas o filtros."
                                  : "No se encontraron datos de productos para mostrar."}
                                action={hasActiveFilters ? {
                                  label: "Limpiar filtros",
                                  onClick: () => handleFilterChange({ reset: true })
                                } : undefined}
                              />
                            ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="min-w-[180px] sm:w-[300px] pl-4 sm:pl-0">Producto</TableHead>
                                            <TableHead className="text-right whitespace-nowrap">Unidades</TableHead>
                                            <TableHead className="text-right whitespace-nowrap hidden sm:table-cell">Ingresos (USD)</TableHead>
                                            <TableHead className="text-right whitespace-nowrap pr-4 sm:pr-0">Promedio</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.map((product: any) => (
                                            <TableRow key={product.id || product.name} className="hover:bg-muted/30">
                                                <TableCell className="font-medium text-foreground pl-4 sm:pl-0 max-w-[180px] truncate">{product.name}</TableCell>
                                                <TableCell className="text-right">{product.sold}</TableCell>
                                                <TableCell className="text-right font-medium hidden sm:table-cell">${product.revenue.toLocaleString()}</TableCell>
                                                <TableCell className="text-right pr-4 sm:pr-0">
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                                        ${product.averageTicket?.toLocaleString() || '0'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
        </div>

      </div>
    </Layout>
  );
}
