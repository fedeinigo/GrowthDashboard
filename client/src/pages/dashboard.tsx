import { Layout } from "@/components/layout";
import { KPICard } from "@/components/kpi-card";
import { RevenueChart, MeetingsChart, ClosureChart, CompanySizeChart } from "@/components/charts";
import { DashboardFilters } from "@/components/dashboard-filters";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line, Legend } from "recharts";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SortField = 'meetings' | 'proposals' | 'closings' | 'meetingsValue' | 'proposalsValue' | 'closingsValue';
type SortOrder = 'asc' | 'desc';

export default function Dashboard() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortField, setSortField] = useState<SortField>('meetings');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    return sortOrder === 'desc' 
      ? <ArrowDown className="w-3 h-3 ml-1" />
      : <ArrowUp className="w-3 h-3 ml-1" />;
  };
  
  // Fetch dashboard data from API
  const { 
    metrics,
    revenueHistory,
    meetingsHistory, 
    closureRateHistory, 
    products,
    rankings,
    regionalData,
    companySizes,
    ncMeetings10Weeks,
    quarterlyRegionComparison,
    topOriginsByRegion,
    salesCycleByRegion,
    sourceDistribution,
    isLoading,
    isError
  } = useDashboardData(filters);

  // Sort regional data based on current sort field and order
  // Handle both old format (with nested rows) and new flat format from cached API
  const sortedRegionalData = Array.isArray(regionalData) ? regionalData.map(region => {
    if (region.rows && Array.isArray(region.rows)) {
      return {
        ...region,
        rows: [...region.rows].sort((a: any, b: any) => {
          const aVal = a[sortField] || 0;
          const bVal = b[sortField] || 0;
          return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
        })
      };
    }
    return region;
  }).sort((a, b) => {
    if (a.rows && b.rows) {
      const totalA = a.rows.reduce((sum: number, r: any) => sum + (r[sortField] || 0), 0);
      const totalB = b.rows.reduce((sum: number, r: any) => sum + (r[sortField] || 0), 0);
      return sortOrder === 'desc' ? totalB - totalA : totalA - totalB;
    }
    const valA = a[sortField] || a.reuniones || 0;
    const valB = b[sortField] || b.reuniones || 0;
    return sortOrder === 'desc' ? valB - valA : valA - valB;
  }) : [];

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
        <div className="p-8 text-center text-muted-foreground">
          No hay datos disponibles.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight">Resumen General</h2>
            <p className="text-muted-foreground mt-1">Última actualización: hace 5 minutos</p>
          </div>
          <div className="flex gap-2">
             <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium shadow-md shadow-primary/20 hover:bg-primary/90 cursor-pointer transition-colors">
                Exportar Reporte
             </div>
          </div>
        </div>

        {/* Filters Section */}
        <DashboardFilters filters={filters} onFilterChange={handleFilterChange} />

        <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="general">Resumen General</TabsTrigger>
                <TabsTrigger value="regions">Regiones Estratégicas</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                    <Card className="col-span-4 lg:col-span-2 border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle>Tasa de Cierre</CardTitle>
                            <CardDescription>Tarjetas New Customer (últimos 6 meses): Ganadas / (Ganadas + Perdidas)</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center h-[200px]">
                            <div className="text-6xl font-bold text-primary">
                                {typeof closureRateHistory === 'object' && 'closureRate' in closureRateHistory 
                                    ? `${closureRateHistory.closureRate}%` 
                                    : '0%'}
                            </div>
                            <div className="text-sm text-muted-foreground mt-4">
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
                <h3 className="text-xl font-heading font-bold mt-8 mb-4">Rankings de Rendimiento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Team Ranking */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                Top Equipos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {rankings?.byTeam?.map((item, index) => {
                                    const maxValue = rankings?.byTeam?.[0]?.value || 1;
                                    return (
                                    <div key={item.name} className="flex flex-col gap-1">
                                        <div className="flex justify-between items-start text-sm font-medium">
                                            <span>{index + 1}. {item.name}</span>
                                            <span className="text-emerald-600 font-semibold">{item.valueFormatted}</span>
                                        </div>
                                        <Progress value={(item.value / maxValue) * 100} className="h-2" />
                                    </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Person Ranking */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-primary" />
                                Top Ejecutivos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {rankings?.byPerson?.map((item, index) => {
                                    const maxValue = rankings?.byPerson?.[0]?.value || 1;
                                    return (
                                    <div key={item.name} className="flex flex-col gap-1">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>{index + 1}. {item.name}</span>
                                            <span className="text-emerald-600 font-semibold">{item.valueFormatted}</span>
                                        </div>
                                        <Progress value={(item.value / maxValue) * 100} className="h-2 bg-muted" indicatorClassName="bg-emerald-500" />
                                    </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Source Ranking */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-500" />
                                Top Orígenes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {rankings?.bySource?.map((item, index) => (
                                    <div key={item.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{index + 1}. {item.name}</span>
                                        </div>
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                                            {item.valueFormatted}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Products Table */}
                <div className="grid grid-cols-1 mt-8">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Rendimiento por Producto</CardTitle>
                            <CardDescription>Desglose de ventas e ingresos por línea de producto (Pipedrive)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[300px]">Producto</TableHead>
                                        <TableHead className="text-right">Unidades Vendidas</TableHead>
                                        <TableHead className="text-right">Ingresos Totales (USD)</TableHead>
                                        <TableHead className="text-right">Promedio por Unidad</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map((product: any) => (
                                        <TableRow key={product.id || product.name} className="hover:bg-muted/30">
                                            <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                                            <TableCell className="text-right">{product.sold}</TableCell>
                                            <TableCell className="text-right font-medium">${product.revenue.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    ${product.averageTicket?.toLocaleString() || '0'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="regions" className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                {/* 4 Regional Reports Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Report 1: Revenue by Region - Last 5 Quarters */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">USD Cerrados por Región - Últimos 5Q</CardTitle>
                            <CardDescription>Evolución de ingresos por región en los últimos 5 trimestres</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={(() => {
                                        if (!quarterlyRegionComparison) return [];
                                        // Data format: {quarters: [...], regions: [{region, data: [{quarter, meetings, logos, revenue}]}]}
                                        const qc = quarterlyRegionComparison as any;
                                        const quarters = qc.quarters || [];
                                        const regions = qc.regions || [];
                                        if (!quarters.length || !regions.length) return [];
                                        return quarters.map((q: string) => {
                                            const point: Record<string, any> = { quarter: q };
                                            regions.forEach((r: any) => {
                                                const qData = r.data?.find((d: any) => d.quarter === q);
                                                point[r.region] = qData?.revenue || 0;
                                            });
                                            return point;
                                        });
                                    })()}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="quarter" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                                        <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                                        <Legend wrapperStyle={{ fontSize: 10 }} />
                                        <Line type="monotone" dataKey="Colombia" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="Argentina" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="Mexico" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="Brasil" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="España" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="Rest Latam" stroke="#6b7280" strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Report 2: Sales Cycle by Region */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Ciclo de Ventas por Región</CardTitle>
                            <CardDescription>Promedio de días para cerrar (deals ganados)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={salesCycleByRegion} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis type="number" tick={{ fontSize: 10 }} />
                                        <YAxis dataKey="region" type="category" tick={{ fontSize: 10 }} width={80} />
                                        <Tooltip formatter={(value: any) => [`${value} días`, 'Ciclo Promedio']} />
                                        <Bar dataKey="avgDays" fill="#10b981" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Report 3: Quarterly Comparison */}
                    <Card className="border-none shadow-sm col-span-1 md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Comparativo Últimos 5 Trimestres por Región</CardTitle>
                            <CardDescription>Reuniones, Logos Vendidos y USD Total</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[120px]">Región</TableHead>
                                            {quarterlyRegionComparison?.quarters?.map((q: string) => (
                                                <TableHead key={q} className="text-center" colSpan={3}>
                                                    {q}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                        <TableRow>
                                            <TableHead></TableHead>
                                            {quarterlyRegionComparison?.quarters?.map((q: string) => (
                                                <React.Fragment key={`sub-${q}`}>
                                                    <TableHead className="text-right text-xs">Reuniones</TableHead>
                                                    <TableHead className="text-right text-xs">Logos</TableHead>
                                                    <TableHead className="text-right text-xs">USD</TableHead>
                                                </React.Fragment>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {quarterlyRegionComparison?.regions?.map((region: any) => (
                                            <TableRow key={region.region}>
                                                <TableCell className="font-medium">{region.region}</TableCell>
                                                {region.data?.map((d: any) => (
                                                    <React.Fragment key={`${region.region}-${d.quarter}`}>
                                                        <TableCell className="text-right">{d.meetings}</TableCell>
                                                        <TableCell className="text-right">{d.logos}</TableCell>
                                                        <TableCell className="text-right">${d.revenue.toLocaleString()}</TableCell>
                                                    </React.Fragment>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Report 4: Top Origins by Region */}
                    <Card className="border-none shadow-sm col-span-1 md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Top 5 Orígenes por Región</CardTitle>
                            <CardDescription>Orígenes con mayor revenue por cada célula</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {topOriginsByRegion.map((region: any) => (
                                    <div key={region.region} className="space-y-2">
                                        <h4 className="font-semibold text-sm border-b pb-1">{region.region}</h4>
                                        {region.origins?.slice(0, 5).map((origin: any, idx: number) => (
                                            <div key={`${region.region}-${origin.origin}-${idx}`} className="flex justify-between text-xs">
                                                <span className="truncate max-w-[80px]" title={origin.origin}>{origin.origin}</span>
                                                <span className="font-medium">${origin.revenue.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Métricas por Región Estratégica</CardTitle>
                        <CardDescription>Análisis de conversión por célula y origen</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b-2">
                                    <TableHead className="w-[200px]">Células x Región</TableHead>
                                    <TableHead className="w-[250px]">Origen</TableHead>
                                    <TableHead 
                                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                                      onClick={() => handleSort('meetings')}
                                    >
                                      <div className="flex items-center justify-end">
                                        Reuniones {getSortIcon('meetings')}
                                      </div>
                                    </TableHead>
                                    <TableHead 
                                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                                      onClick={() => handleSort('proposals')}
                                    >
                                      <div className="flex items-center justify-end">
                                        Propuesta {getSortIcon('proposals')}
                                      </div>
                                    </TableHead>
                                    <TableHead 
                                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                                      onClick={() => handleSort('closings')}
                                    >
                                      <div className="flex items-center justify-end">
                                        Cierre {getSortIcon('closings')}
                                      </div>
                                    </TableHead>
                                    <TableHead className="text-right">Conversión</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedRegionalData.map((region: any, index: number) => {
                                    if (region.rows && Array.isArray(region.rows)) {
                                        return (
                                            <React.Fragment key={region.region}>
                                                {region.rows.map((row: any, rowIndex: number) => (
                                                    <TableRow key={`${region.region}-${row.origin}`} className="hover:bg-muted/30 border-b">
                                                        <TableCell className={`font-medium align-top ${rowIndex === 0 ? "text-foreground" : ""}`}>
                                                            {rowIndex === 0 ? region.region : ""}
                                                        </TableCell>
                                                        <TableCell>{row.origin}</TableCell>
                                                        <TableCell className="text-right">{row.meetings}</TableCell>
                                                        <TableCell className="text-right">{row.proposals}</TableCell>
                                                        <TableCell className="text-right">{row.closings}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge variant={row.closings > 0 ? "outline" : "secondary"} className={row.closings > 0 ? "border-emerald-200 text-emerald-700 bg-emerald-50" : ""}>
                                                                {row.meetings > 0 ? ((row.closings / row.meetings) * 100).toFixed(1) + "%" : "0%"}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </React.Fragment>
                                        );
                                    }
                                    const meetings = region.reuniones || 0;
                                    const proposals = region.propuestas || 0;
                                    const closings = region.cierres || 0;
                                    return (
                                        <TableRow key={region.country || region.countryId || index} className="hover:bg-muted/30 border-b">
                                            <TableCell className="font-medium text-foreground">{region.country || `País ${region.countryId}`}</TableCell>
                                            <TableCell>-</TableCell>
                                            <TableCell className="text-right">{meetings}</TableCell>
                                            <TableCell className="text-right">{proposals}</TableCell>
                                            <TableCell className="text-right">{closings}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={closings > 0 ? "outline" : "secondary"} className={closings > 0 ? "border-emerald-200 text-emerald-700 bg-emerald-50" : ""}>
                                                    {meetings > 0 ? ((closings / meetings) * 100).toFixed(1) + "%" : "0%"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Ingresos por Región Estratégica</CardTitle>
                        <CardDescription>Volumen de negocio en reuniones, propuestas y cierres (USD)</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b-2">
                                    <TableHead className="w-[200px]">Células x Región</TableHead>
                                    <TableHead className="w-[250px]">Origen</TableHead>
                                    <TableHead 
                                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                                      onClick={() => handleSort('meetingsValue')}
                                    >
                                      <div className="flex items-center justify-end">
                                        Reuniones ($) {getSortIcon('meetingsValue')}
                                      </div>
                                    </TableHead>
                                    <TableHead 
                                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                                      onClick={() => handleSort('proposalsValue')}
                                    >
                                      <div className="flex items-center justify-end">
                                        Propuesta ($) {getSortIcon('proposalsValue')}
                                      </div>
                                    </TableHead>
                                    <TableHead 
                                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                                      onClick={() => handleSort('closingsValue')}
                                    >
                                      <div className="flex items-center justify-end">
                                        Cierre ($) {getSortIcon('closingsValue')}
                                      </div>
                                    </TableHead>
                                    <TableHead className="text-right">Ticket Promedio</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedRegionalData.map((region: any, index: number) => {
                                    if (region.rows && Array.isArray(region.rows)) {
                                        return (
                                            <React.Fragment key={`rev-${region.region}`}>
                                                {region.rows.map((row: any, rowIndex: number) => (
                                                    <TableRow key={`rev-${region.region}-${row.origin}`} className="hover:bg-muted/30 border-b">
                                                        <TableCell className={`font-medium align-top ${rowIndex === 0 ? "text-foreground" : ""}`}>
                                                            {rowIndex === 0 ? region.region : ""}
                                                        </TableCell>
                                                        <TableCell>{row.origin}</TableCell>
                                                        <TableCell className="text-right text-muted-foreground">
                                                            ${row.meetingsValue ? row.meetingsValue.toLocaleString() : "0"}
                                                        </TableCell>
                                                        <TableCell className="text-right text-muted-foreground">
                                                            ${row.proposalsValue ? row.proposalsValue.toLocaleString() : "0"}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-foreground">
                                                            ${row.closingsValue ? row.closingsValue.toLocaleString() : "0"}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <span className="text-xs text-muted-foreground">
                                                                {row.closings > 0 ? "$" + Math.round(row.closingsValue / row.closings).toLocaleString() : "-"}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </React.Fragment>
                                        );
                                    }
                                    const meetingsVal = region.reunionesValue || 0;
                                    const proposalsVal = region.propuestasValue || 0;
                                    const closingsVal = region.cierresValue || 0;
                                    const closings = region.cierres || 0;
                                    return (
                                        <TableRow key={`rev-${region.country || region.countryId || index}`} className="hover:bg-muted/30 border-b">
                                            <TableCell className="font-medium text-foreground">{region.country || `País ${region.countryId}`}</TableCell>
                                            <TableCell>-</TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                ${meetingsVal.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                ${proposalsVal.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-foreground">
                                                ${closingsVal.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-xs text-muted-foreground">
                                                    {closings > 0 ? "$" + Math.round(closingsVal / closings).toLocaleString() : "-"}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

      </div>
    </Layout>
  );
}
