// ... imports ...
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartDataPoint } from "@/lib/mock-data";

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-lg text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="font-medium">
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            {entry.unit}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface ChartProps {
  data: ChartDataPoint[];
  title: string;
  description?: string;
  dataKey?: string;
  dataKey2?: string;
  color?: string;
  type?: "area" | "line" | "bar";
  height?: number;
  onClick?: (data: any) => void;
}

export function CompanySizeChart({ data, title, description, onClick }: ChartProps) {
    return (
      <Card className="col-span-4 lg:col-span-2 border-none shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  dataKey="date" 
                  type="category" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  width={60}
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }} 
                />
                <Bar 
                  dataKey="value" 
                  name="Tarjetas" 
                  fill="hsl(var(--chart-4))" 
                  radius={[0, 4, 4, 0]} 
                  barSize={24}
                  onClick={onClick ? (data) => onClick(data) : undefined}
                  className={onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
                >
                   {
                      data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                      ))
                    }
                  <LabelList 
                    dataKey="value" 
                    position="right" 
                    fontSize={11}
                    fill="hsl(var(--foreground))"
                    fontWeight={500}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

export function RevenueChart({ data, title, description, color = "hsl(var(--primary))", onClick }: ChartProps) {
  return (
    <Card className="col-span-4 border-none shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} onClick={onClick}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickMargin={10}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
              <Area 
                type="monotone" 
                dataKey="value" 
                name="Ingresos"
                stroke={color} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface StackedRevenueChartProps {
  data: { month: string; newCustomers: number; upselling: number; total: number }[];
  title: string;
  description?: string;
}

export function StackedRevenueChart({ data, title, description }: StackedRevenueChartProps) {
  // Format month labels (e.g., "2024-01" -> "Ene 24")
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const formattedData = data.map(d => {
    const [year, month] = d.month.split('-');
    const monthLabel = `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;
    return { ...d, monthLabel };
  });

  return (
    <Card className="col-span-4 md:col-span-2 border-none shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="monthLabel" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border border-border p-3 rounded-lg shadow-lg text-sm">
                        <p className="font-semibold text-foreground mb-1">{label}</p>
                        {payload.map((entry: any, index: number) => (
                          <p key={index} style={{ color: entry.color }} className="font-medium">
                            {entry.name}: ${entry.value.toLocaleString()}
                          </p>
                        ))}
                        <p className="font-bold text-foreground mt-1 pt-1 border-t border-border">
                          Total: ${payload.reduce((sum: number, p: any) => sum + p.value, 0).toLocaleString()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }} 
                cursor={{ fill: 'hsl(var(--muted)/0.2)' }} 
              />
              <Legend 
                wrapperStyle={{ fontSize: '11px' }}
                iconType="square"
              />
              <Bar 
                dataKey="newCustomers" 
                name="New Customers" 
                stackId="a"
                fill="hsl(var(--primary))" 
                radius={[0, 0, 0, 0]} 
              />
              <Bar 
                dataKey="upselling" 
                name="Upselling" 
                stackId="a"
                fill="hsl(var(--chart-2))" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function MeetingsChart({ data, title, description, onClick }: ChartProps) {
  return (
    <Card className="col-span-4 lg:col-span-2 border-none shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} onClick={onClick}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
              <Bar 
                dataKey="value" 
                name="Realizadas" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]} 
                barSize={20}
              >
                <LabelList 
                  dataKey="value" 
                  position="top" 
                  fontSize={10}
                  fill="hsl(var(--muted-foreground))"
                />
              </Bar>
               <Bar 
                dataKey="value2" 
                name="Canceladas" 
                fill="hsl(var(--muted))" 
                radius={[4, 4, 0, 0]} 
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ClosureChart({ data, title, description, onClick }: ChartProps) {
    return (
      <Card className="col-span-4 lg:col-span-2 border-none shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} onClick={onClick}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="step" 
                  dataKey="value" 
                  name="Tasa de Cierre"
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "hsl(var(--chart-3))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }
