import { Layout } from "@/components/layout";
import { KPICard } from "@/components/kpi-card";
import { mockMetrics, companySizes } from "@/lib/mock-data";
import { RevenueChart, MeetingsChart, ClosureChart, CompanySizeChart } from "@/components/charts";
import { DashboardFilters } from "@/components/dashboard-filters";
import { 
  DollarSign, 
  Target, 
  Clock, 
  Briefcase,
  TrendingUp,
  CalendarCheck,
  Building2,
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
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  
  // Destructure safely with defaults
  const { 
    metrics = {
      revenue: { label: "Revenue", value: 0, change: 0, trend: "neutral" },
      closureRate: { label: "Closure Rate", value: 0, change: 0, trend: "neutral" },
      meetings: { label: "Meetings", value: 0, change: 0, trend: "neutral" },
      logos: { label: "Logos", value: 0, change: 0, trend: "neutral" },
      avgSalesCycle: { label: "Sales Cycle", value: 0, change: 0, trend: "neutral" },
      companySize: { label: "Company Size", value: "N/A", change: 0, trend: "neutral" }
    },
    revenueHistory = [], 
    meetingsHistory = [], 
    closureRateHistory = [], 
    products = [],
    rankings = { byTeam: [], byPerson: [], bySource: [] },
    regionalData = []
  } = mockMetrics || {};

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

  // Safe access check
  if (!metrics || !metrics.revenue) {
    return (
      <Layout>
        <div className="p-8 text-center text-muted-foreground">
          Loading dashboard data...
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
                    title={metrics.companySize?.label || "Company Size"} 
                    value={metrics.companySize?.value || "N/A"} 
                    change={metrics.companySize?.change || 0} 
                    trend={metrics.companySize?.trend || "neutral"} 
                    subtext={metrics.companySize?.subtext}
                    icon={Building2}
                />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Revenue Chart */}
                    <RevenueChart 
                        data={revenueHistory} 
                        title="Evolución de Ingresos (ARR)" 
                        description="Ingresos acumulados últimos 30 días"
                        dataKey="value"
                        onClick={(data) => handleChartClick(data, "revenue")}
                    />
                    
                    {/* Secondary Charts Row */}
                    <MeetingsChart 
                        data={meetingsHistory}
                        title="Actividad de Reuniones"
                        description="Reuniones agendadas vs canceladas"
                        dataKey="value"
                        onClick={(data) => handleChartClick(data, "meetings")}
                    />
                    <ClosureChart 
                        data={closureRateHistory}
                        title="Tendencia de Cierre"
                        description="Variación semanal de tasa de conversión"
                        dataKey="value"
                        onClick={(data) => handleChartClick(data, "closure")}
                    />

                    {/* Company Size Distribution - Interactive Filter */}
                    <CompanySizeChart 
                        data={companySizes}
                        title="Tamaño de Empresas"
                        description="Distribución por cantidad de empleados (Click para filtrar)"
                        onClick={(data) => handleChartClick(data, "companySize")}
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
                                {rankings?.byTeam?.map((item, index) => (
                                    <div key={item.name} className="flex flex-col gap-1">
                                        <div className="flex justify-between items-start text-sm font-medium">
                                            <span>{index + 1}. {item.name}</span>
                                            <div className="flex flex-col items-end">
                                                <span>{item.valueFormatted}</span>
                                                <span className={item.change && item.change > 0 ? "text-emerald-600 text-xs" : "text-destructive text-xs"}>
                                                    {item.change && item.change > 0 ? "+" : ""}{item.change}%
                                                </span>
                                            </div>
                                        </div>
                                        <Progress value={item.value / 1500} className="h-2" />
                                    </div>
                                ))}
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
                                {rankings?.byPerson?.map((item, index) => (
                                    <div key={item.name} className="flex flex-col gap-1">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>{item.name}</span>
                                            <span className={item.change && item.change > 0 ? "text-emerald-600" : "text-destructive"}>
                                                {item.change && item.change > 0 ? "+" : ""}{item.change}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{item.valueFormatted} generado</span>
                                        </div>
                                        <Progress value={item.value / 600} className="h-2 bg-muted" indicatorClassName="bg-emerald-500" />
                                    </div>
                                ))}
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
                                            <span className="text-sm font-medium">{item.name}</span>
                                            <span className="text-xs text-muted-foreground">{item.valueFormatted}</span>
                                        </div>
                                        <Badge variant="outline" className={item.change && item.change > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>
                                            {item.change && item.change > 0 ? "+" : ""}{item.change}%
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
                            <CardDescription>Desglose de ventas e ingresos por línea de producto</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[300px]">Producto</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead className="text-right">Unidades Vendidas</TableHead>
                                        <TableHead className="text-right">Ingresos Totales</TableHead>
                                        <TableHead className="text-right">Tendencia</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map((product) => (
                                        <TableRow key={product.name} className="hover:bg-muted/30">
                                            <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal">{product.category}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{product.sold}</TableCell>
                                            <TableCell className="text-right font-medium">${product.revenue.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end items-center text-emerald-600">
                                                    <TrendingUp className="w-4 h-4 mr-1" />
                                                    <span className="text-xs">+12%</span>
                                                </div>
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
                                    <TableHead className="text-right">Reuniones</TableHead>
                                    <TableHead className="text-right">Propuesta</TableHead>
                                    <TableHead className="text-right">Cierre</TableHead>
                                    <TableHead className="text-right">Conversión</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {regionalData.map((region) => (
                                    <>
                                        {region.rows.map((row, index) => (
                                            <TableRow key={`${region.region}-${row.origin}`} className="hover:bg-muted/30 border-b">
                                                {/* Only show Region name on the first row of the group */}
                                                <TableCell className={`font-medium align-top ${index === 0 ? "text-foreground" : ""}`}>
                                                    {index === 0 ? region.region : ""}
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
                                        {/* Optional Spacer Row or summary line could go here */}
                                    </>
                                ))}
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
