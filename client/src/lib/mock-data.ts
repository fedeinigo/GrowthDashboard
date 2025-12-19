import { addDays, subDays, format } from "date-fns";

export interface KPIData {
  label: string;
  value: string | number;
  change: number; // percentage
  trend: "up" | "down" | "neutral";
  suffix?: string;
  prefix?: string;
  subtext?: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  value2?: number;
}

export interface ProductData {
  name: string;
  category: string;
  sold: number;
  revenue: number;
}

export interface MetricState {
  metrics: Record<string, KPIData>;
  revenueHistory: ChartDataPoint[];
  meetingsHistory: ChartDataPoint[];
  closureRateHistory: ChartDataPoint[];
  products: ProductData[];
}

export const mockMetrics: MetricState = {
  metrics: {
    closureRate: {
      label: "Tasa de Cierre",
      value: 24.8,
      change: 2.5,
      trend: "up",
      suffix: "%",
      subtext: "vs. mes anterior (22.3%)"
    },
    meetings: {
      label: "Reuniones Realizadas",
      value: 142,
      change: 12,
      trend: "up",
      subtext: "15 agendadas para mañana"
    },
    revenue: {
      label: "Dólares Conseguidos",
      value: 84500,
      change: 8.4,
      trend: "up",
      prefix: "$",
      subtext: "ARR Neto"
    },
    logos: {
      label: "Logos Conseguidos",
      value: 18,
      change: -5,
      trend: "down",
      subtext: "Meta mensual: 20"
    },
    employeesPerMeeting: {
      label: "Q Empleados / Reunión",
      value: 1.8,
      change: -0.2,
      trend: "up", // Down is good for efficiency, so trend "up" visually might mean green? Usually we handle this in UI logic. Let's say -0.2 change is "positive" improvement.
      subtext: "Optimizando recursos"
    },
    avgSalesCycle: {
      label: "Ciclo de Venta Promedio",
      value: 28,
      change: -2,
      trend: "up", // Negative change (shorter time) is good
      suffix: " días",
      subtext: "Disminuyó 2 días"
    }
  },
  revenueHistory: Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), "MMM dd"),
    value: Math.floor(Math.random() * 5000) + 2000 + (i * 100), // Upward trend
  })),
  meetingsHistory: Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), "MMM dd"),
    value: Math.floor(Math.random() * 8) + 2,
    value2: Math.floor(Math.random() * 3) + 1, // Second metric, maybe cancellations
  })),
  closureRateHistory: Array.from({ length: 12 }, (_, i) => ({
    date: format(subDays(new Date(), (11 - i) * 7), "MMM dd"), // Weekly
    value: 20 + Math.random() * 10,
  })),
  products: [
    { name: "WiseCX Enterprise", category: "Platform", sold: 12, revenue: 60000 },
    { name: "WiseCX Growth", category: "Platform", sold: 25, revenue: 25000 },
    { name: "Consultoría Onboarding", category: "Services", sold: 8, revenue: 12000 },
    { name: "Add-on Analytics", category: "Add-on", sold: 15, revenue: 7500 },
    { name: "Soporte Premium", category: "Services", sold: 5, revenue: 5000 },
  ]
};
