import { Layout } from "@/components/layout";
import { KPICard } from "@/components/kpi-card";
import { RevenueChart, MeetingsChart, ClosureChart, CompanySizeChart } from "@/components/charts";
import { DashboardFilters } from "@/components/dashboard-filters";
import { useDashboardData } from "@/hooks/use-dashboard-data";
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
  UserCheck
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

        <div className="space-y-8">
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
        </div>

      </div>
    </Layout>
  );
}
