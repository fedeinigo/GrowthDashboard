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

export interface RankingData {
  name: string;
  value: number;
  valueFormatted?: string;
  change?: number;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterState {
  metrics: Record<string, KPIData>;
  revenueHistory: ChartDataPoint[];
  meetingsHistory: ChartDataPoint[];
  closureRateHistory: ChartDataPoint[];
  products: ProductData[];
  rankings: {
    byTeam: RankingData[];
    byPerson: RankingData[];
    bySource: RankingData[];
  };
}

export const teams: FilterOption[] = [
  { value: "all", label: "Todos los Equipos" },
  { value: "enterprise", label: "Enterprise Sales" },
  { value: "sme", label: "SME Sales" },
  { value: "outbound", label: "Outbound Growth" },
];

export const people: FilterOption[] = [
  { value: "all", label: "Todas las Personas" },
  { value: "camila", label: "Camila Rodriguez" },
  { value: "juan", label: "Juan Pérez" },
  { value: "sofia", label: "Sofía Martínez" },
  { value: "lucas", label: "Lucas García" },
];

export const sources: FilterOption[] = [
  { value: "all", label: "Todos los Orígenes" },
  { value: "inbound", label: "Inbound Marketing" },
  { value: "outbound", label: "Outbound Prospecting" },
  { value: "referral", label: "Referidos" },
  { value: "events", label: "Eventos" },
];

export const companySizes: ChartDataPoint[] = [
  { date: "1-10", value: 15 },
  { date: "11-50", value: 45 },
  { date: "51-200", value: 30 },
  { date: "201-500", value: 8 },
  { date: "500+", value: 2 },
];

export const mockMetrics: FilterState = {
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
    companySize: {
      label: "Tamaño Empresa (Promedio)",
      value: "51-200", // Changed to reflect the user request
      change: 0, 
      trend: "neutral",
      subtext: "Segmento más frecuente"
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
  ],
  rankings: {
    byTeam: [
      { name: "Enterprise Sales", value: 125000, valueFormatted: "$125,000", change: 12 },
      { name: "SME Sales", value: 85000, valueFormatted: "$85,000", change: 5 },
      { name: "Outbound Growth", value: 45000, valueFormatted: "$45,000", change: -2 },
    ],
    byPerson: [
      { name: "Camila Rodriguez", value: 52000, valueFormatted: "$52,000", change: 15 },
      { name: "Juan Pérez", value: 48000, valueFormatted: "$48,000", change: 8 },
      { name: "Sofía Martínez", value: 35000, valueFormatted: "$35,000", change: 3 },
      { name: "Lucas García", value: 28000, valueFormatted: "$28,000", change: -5 },
    ],
    bySource: [
      { name: "Inbound Marketing", value: 95000, valueFormatted: "$95,000", change: 10 },
      { name: "Outbound Prospecting", value: 65000, valueFormatted: "$65,000", change: 4 },
      { name: "Referidos", value: 32000, valueFormatted: "$32,000", change: 20 },
      { name: "Eventos", value: 18000, valueFormatted: "$18,000", change: -8 },
    ]
  }
};
