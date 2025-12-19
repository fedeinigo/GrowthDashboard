import { Layout } from "@/components/layout";
import { KPICard } from "@/components/kpi-card";
import { mockMetrics } from "@/lib/mock-data";
import { RevenueChart, MeetingsChart, ClosureChart } from "@/components/charts";
import { 
  Users, 
  DollarSign, 
  Target, 
  Clock, 
  Briefcase,
  TrendingUp,
  CalendarCheck
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

export default function Dashboard() {
  const { metrics, revenueHistory, meetingsHistory, closureRateHistory, products } = mockMetrics;

  return (
    <Layout>
      <div className="space-y-8">
        
        {/* Header Section with Date Filter Placeholder */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight">Resumen General</h2>
            <p className="text-muted-foreground mt-1">Última actualización: hace 5 minutos</p>
          </div>
          <div className="flex gap-2">
             <div className="bg-background border border-input px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-accent/50 cursor-pointer transition-colors">
                Últimos 30 días
             </div>
             <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium shadow-md shadow-primary/20 hover:bg-primary/90 cursor-pointer transition-colors">
                Exportar Reporte
             </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <KPICard 
            title={metrics.revenue.label} 
            value={metrics.revenue.value} 
            change={metrics.revenue.change} 
            trend={metrics.revenue.trend} 
            prefix={metrics.revenue.prefix}
            subtext={metrics.revenue.subtext}
            icon={DollarSign}
            className="border-l-4 border-l-primary"
          />
          <KPICard 
            title={metrics.closureRate.label} 
            value={metrics.closureRate.value} 
            change={metrics.closureRate.change} 
            trend={metrics.closureRate.trend} 
            suffix={metrics.closureRate.suffix}
            subtext={metrics.closureRate.subtext}
            icon={Target}
          />
          <KPICard 
            title={metrics.meetings.label} 
            value={metrics.meetings.value} 
            change={metrics.meetings.change} 
            trend={metrics.meetings.trend} 
            subtext={metrics.meetings.subtext}
            icon={CalendarCheck}
          />
          <KPICard 
            title={metrics.logos.label} 
            value={metrics.logos.value} 
            change={metrics.logos.change} 
            trend={metrics.logos.trend} 
            subtext={metrics.logos.subtext}
            icon={Briefcase}
          />
           <KPICard 
            title={metrics.avgSalesCycle.label} 
            value={metrics.avgSalesCycle.value} 
            change={metrics.avgSalesCycle.change} 
            trend={metrics.avgSalesCycle.trend} 
            suffix={metrics.avgSalesCycle.suffix}
            subtext={metrics.avgSalesCycle.subtext}
            icon={Clock}
          />
           <KPICard 
            title={metrics.employeesPerMeeting.label} 
            value={metrics.employeesPerMeeting.value} 
            change={metrics.employeesPerMeeting.change} 
            trend={metrics.employeesPerMeeting.trend} 
            subtext={metrics.employeesPerMeeting.subtext}
            icon={Users}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Revenue Chart - Spans full width on mobile, 4 cols on large */}
            <RevenueChart 
                data={revenueHistory} 
                title="Evolución de Ingresos (ARR)" 
                description="Ingresos acumulados últimos 30 días"
                dataKey="value"
            />
            
            {/* Secondary Charts Row */}
            <MeetingsChart 
                data={meetingsHistory}
                title="Actividad de Reuniones"
                description="Reuniones agendadas vs canceladas"
                dataKey="value"
            />
            <ClosureChart 
                data={closureRateHistory}
                title="Tendencia de Cierre"
                description="Variación semanal de tasa de conversión"
                dataKey="value"
            />
        </div>

        {/* Products Table */}
        <div className="grid grid-cols-1">
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

      </div>
    </Layout>
  );
}
