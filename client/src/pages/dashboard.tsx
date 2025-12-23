import { Layout } from "@/components/layout";
import { KPICard } from "@/components/kpi-card";
import { RevenueChart, MeetingsChart, ClosureChart, CompanySizeChart } from "@/components/charts";
import { DashboardFilters } from "@/components/dashboard-filters";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { EmptyState } from "@/components/empty-state";
import { CacheStatusIndicator } from "@/components/cache-status";
import { ConversionFunnel } from "@/components/conversion-funnel";
import { LossReasons } from "@/components/loss-reasons";
import { DealsModal } from "@/components/deals-modal";
import { DraggableWidget } from "@/components/draggable-widget";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
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
  Package,
  Filter,
  FileDown,
  FileText,
  ChevronDown
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { exportDashboardToCSV, exportToPDF } from "@/lib/export-utils";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useWidgetOrder, WidgetId } from '@/hooks/use-widget-order';

export default function Dashboard() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [dealsModal, setDealsModal] = useState<{ isOpen: boolean; metricType: string; title: string }>({
    isOpen: false,
    metricType: "",
    title: "",
  });

  const { order, updateOrder } = useWidgetOrder();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = order.indexOf(active.id as WidgetId);
      const newIndex = order.indexOf(over.id as WidgetId);
      updateOrder(arrayMove(order, oldIndex, newIndex));
    }
  };

  const handleKPIClick = (metricType: string, title: string) => {
    setDealsModal({ isOpen: true, metricType, title });
  };

  const closeDealsModal = () => {
    setDealsModal({ isOpen: false, metricType: "", title: "" });
  };
  
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
    conversionFunnel,
    lossReasons,
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
        <div className="relative rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-primary/10 p-4 sm:p-6 border border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-foreground tracking-tight">
                Resumen General
              </h2>
              <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                Panel de control de métricas comerciales
              </p>
              <div className="mt-2">
                <CacheStatusIndicator />
              </div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="export-dropdown"
                  className="bg-primary text-primary-foreground px-3 sm:px-4 py-2 rounded-md text-sm font-medium shadow-md shadow-primary/20 hover:bg-primary/90 cursor-pointer transition-colors min-h-[44px] flex items-center gap-2"
                >
                  Exportar Reporte
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  data-testid="export-csv"
                  onClick={() => exportDashboardToCSV({
                    metrics,
                    rankings,
                    products,
                    filters
                  })}
                  className="cursor-pointer"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Descargar CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-testid="export-pdf"
                  onClick={exportToPDF}
                  className="cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <DashboardFilters filters={filters} onFilterChange={handleFilterChange} />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <div className="space-y-4 sm:space-y-6 md:space-y-8 pl-4">
              {order.map((widgetId) => {
                switch (widgetId) {
                  case 'kpis':
                    return (
                      <DraggableWidget key="kpis" id="kpis">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                          <KPICard 
                            title={metrics.revenue?.label || "Revenue"} 
                            value={metrics.revenue?.value || 0} 
                            change={metrics.revenue?.change || 0} 
                            trend={metrics.revenue?.trend || "neutral"} 
                            prefix={metrics.revenue?.prefix}
                            subtext={metrics.revenue?.subtext}
                            icon={DollarSign}
                            className="border-l-4 border-l-primary"
                            onClick={() => handleKPIClick("revenue", metrics.revenue?.label || "Revenue")}
                          />
                          <KPICard 
                            title={metrics.closureRate?.label || "Closure Rate"} 
                            value={metrics.closureRate?.value || 0} 
                            change={metrics.closureRate?.change || 0} 
                            trend={metrics.closureRate?.trend || "neutral"} 
                            suffix={metrics.closureRate?.suffix}
                            subtext={metrics.closureRate?.subtext}
                            icon={Target}
                            onClick={() => handleKPIClick("closureRate", metrics.closureRate?.label || "Closure Rate")}
                          />
                          <KPICard 
                            title={metrics.meetings?.label || "Meetings"} 
                            value={metrics.meetings?.value || 0} 
                            change={metrics.meetings?.change || 0} 
                            trend={metrics.meetings?.trend || "neutral"} 
                            subtext={metrics.meetings?.subtext}
                            icon={CalendarCheck}
                            onClick={() => handleKPIClick("meetings", metrics.meetings?.label || "Meetings")}
                          />
                          <KPICard 
                            title={metrics.logos?.label || "Logos"} 
                            value={metrics.logos?.value || 0} 
                            change={metrics.logos?.change || 0} 
                            trend={metrics.logos?.trend || "neutral"} 
                            subtext={metrics.logos?.subtext}
                            icon={Briefcase}
                            onClick={() => handleKPIClick("logos", metrics.logos?.label || "Logos")}
                          />
                          <KPICard 
                            title={metrics.avgSalesCycle?.label || "Sales Cycle"} 
                            value={metrics.avgSalesCycle?.value || 0} 
                            change={metrics.avgSalesCycle?.change || 0} 
                            trend={metrics.avgSalesCycle?.trend || "neutral"} 
                            suffix={metrics.avgSalesCycle?.suffix}
                            subtext={metrics.avgSalesCycle?.subtext}
                            icon={Clock}
                            onClick={() => handleKPIClick("avgSalesCycle", metrics.avgSalesCycle?.label || "Sales Cycle")}
                          />
                          <KPICard 
                            title={metrics.avgTicket?.label || "Ticket Promedio"} 
                            value={metrics.avgTicket?.value || 0} 
                            change={metrics.avgTicket?.change || 0} 
                            trend={metrics.avgTicket?.trend || "neutral"} 
                            prefix={metrics.avgTicket?.prefix}
                            subtext={metrics.avgTicket?.subtext}
                            icon={Banknote}
                            onClick={() => handleKPIClick("avgTicket", metrics.avgTicket?.label || "Ticket Promedio")}
                          />
                        </div>
                      </DraggableWidget>
                    );
                  case 'charts':
                    return (
                      <DraggableWidget key="charts" id="charts">
                        <div>
                          <h3 className="text-lg sm:text-xl font-heading font-bold mb-4 flex items-center gap-2 text-foreground">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Análisis de Tendencias
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                          <RevenueChart 
                            data={revenueHistory} 
                            title="Evolución de Ingresos" 
                            description="Ingresos semanales (USD)"
                            dataKey="value"
                            onClick={(data) => handleChartClick(data, "revenue")}
                          />
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
                          <CompanySizeChart 
                            data={companySizes}
                            title="Tamaño de Empresas"
                            description="Distribución por cantidad de empleados (Click para filtrar)"
                            onClick={(data) => handleChartClick(data, "companySize")}
                          />
                          <CompanySizeChart 
                            data={sourceDistribution}
                            title="Distribución por Source"
                            description="Top 10 sources por cantidad de tarjetas"
                          />
                          </div>
                        </div>
                      </DraggableWidget>
                    );
                  case 'funnel':
                    return (
                      <DraggableWidget key="funnel" id="funnel">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                          <ConversionFunnel data={conversionFunnel} />
                          <LossReasons data={lossReasons} />
                        </div>
                      </DraggableWidget>
                    );
                  case 'rankings':
                    return (
                      <DraggableWidget key="rankings" id="rankings">
                        <div>
                          <h3 className="text-lg sm:text-xl font-heading font-bold mb-4 flex items-center gap-2 text-foreground">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            Rankings de Rendimiento
                          </h3>
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
                              <Card className="border-none shadow-sm">
                                <CardHeader className="pb-2 px-4 sm:px-6">
                                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
                                    <span className="truncate">Top Equipos</span>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 sm:px-6">
                                  {rankings?.byTeam?.length ? (
                                    <TooltipProvider>
                                      <div className="space-y-3 sm:space-y-4">
                                        {rankings?.byTeam?.map((item: any, index: number) => {
                                          const maxValue = rankings?.byTeam?.[0]?.value || 1;
                                          const teamId = item.id || item.teamId || item.name;
                                          return (
                                            <Tooltip key={item.name}>
                                              <TooltipTrigger asChild>
                                                <div 
                                                  data-testid={`ranking-team-${teamId}`}
                                                  className="flex flex-col gap-1 cursor-pointer rounded-md p-2 -mx-2 transition-all hover:bg-muted/50 group"
                                                  onClick={() => handleFilterChange({ team: String(teamId) })}
                                                >
                                                  <div className="flex justify-between items-start text-xs sm:text-sm font-medium gap-2">
                                                    <span className="truncate min-w-0 flex items-center gap-1.5">
                                                      {index + 1}. {item.name}
                                                      <Filter className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </span>
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex-shrink-0">{item.valueFormatted}</span>
                                                  </div>
                                                  <Progress value={(item.value / maxValue) * 100} className="h-2" />
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent side="top">
                                                <p className="text-xs">Click para filtrar por este equipo</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          );
                                        })}
                                      </div>
                                    </TooltipProvider>
                                  ) : (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                      Sin datos de equipos
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                              <Card className="border-none shadow-sm">
                                <CardHeader className="pb-2 px-4 sm:px-6">
                                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                    <span className="truncate">Top Ejecutivos</span>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 sm:px-6">
                                  {rankings?.byPerson?.length ? (
                                    <TooltipProvider>
                                      <div className="space-y-3 sm:space-y-4">
                                        {rankings?.byPerson?.map((item: any, index: number) => {
                                          const maxValue = rankings?.byPerson?.[0]?.value || 1;
                                          const personId = item.id || item.personId || item.name;
                                          return (
                                            <Tooltip key={item.name}>
                                              <TooltipTrigger asChild>
                                                <div 
                                                  data-testid={`ranking-person-${personId}`}
                                                  className="flex flex-col gap-1 cursor-pointer rounded-md p-2 -mx-2 transition-all hover:bg-muted/50 group"
                                                  onClick={() => handleFilterChange({ person: String(personId) })}
                                                >
                                                  <div className="flex justify-between text-xs sm:text-sm font-medium gap-2">
                                                    <span className="truncate min-w-0 flex items-center gap-1.5">
                                                      {index + 1}. {item.name}
                                                      <Filter className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </span>
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex-shrink-0">{item.valueFormatted}</span>
                                                  </div>
                                                  <Progress value={(item.value / maxValue) * 100} className="h-2" />
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent side="top">
                                                <p className="text-xs">Click para filtrar por este ejecutivo</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          );
                                        })}
                                      </div>
                                    </TooltipProvider>
                                  ) : (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                      Sin datos de ejecutivos
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                              <Card className="border-none shadow-sm">
                                <CardHeader className="pb-2 px-4 sm:px-6">
                                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                                    <span className="truncate">Top Orígenes</span>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 sm:px-6">
                                  {rankings?.bySource?.length ? (
                                    <TooltipProvider>
                                      <div className="space-y-3 sm:space-y-4">
                                        {rankings?.bySource?.map((item: any, index: number) => {
                                          const sourceId = item.id || item.sourceId || item.name;
                                          return (
                                            <Tooltip key={item.name}>
                                              <TooltipTrigger asChild>
                                                <div 
                                                  data-testid={`ranking-source-${sourceId}`}
                                                  className="flex items-center justify-between py-2 px-2 -mx-2 rounded-md border-b border-border last:border-0 gap-2 cursor-pointer transition-all hover:bg-muted/50 group"
                                                  onClick={() => {
                                                    const currentSources = filters?.sources || [];
                                                    const newSources = currentSources.includes(String(sourceId))
                                                      ? currentSources.filter((s: string) => s !== String(sourceId))
                                                      : [...currentSources, String(sourceId)];
                                                    handleFilterChange({ sources: newSources.length > 0 ? newSources : undefined });
                                                  }}
                                                >
                                                  <div className="flex flex-col min-w-0">
                                                    <span className="text-xs sm:text-sm font-medium truncate flex items-center gap-1.5">
                                                      {index + 1}. {item.name}
                                                      <Filter className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </span>
                                                  </div>
                                                  <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-semibold flex-shrink-0 text-xs">
                                                    {item.valueFormatted}
                                                  </Badge>
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent side="top">
                                                <p className="text-xs">Click para filtrar por este origen</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          );
                                        })}
                                      </div>
                                    </TooltipProvider>
                                  ) : (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                      Sin datos de orígenes
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </div>
                      </DraggableWidget>
                    );
                  case 'products':
                    return (
                      <DraggableWidget key="products" id="products">
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
                                          <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-xs">
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
                      </DraggableWidget>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          </SortableContext>
        </DndContext>

      </div>

      <DealsModal
        isOpen={dealsModal.isOpen}
        onClose={closeDealsModal}
        metricType={dealsModal.metricType}
        metricTitle={dealsModal.title}
        filters={filters}
      />
    </Layout>
  );
}
