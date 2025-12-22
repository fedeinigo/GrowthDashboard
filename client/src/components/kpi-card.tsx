import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Info } from "lucide-react";

interface StatusThresholds {
  good: number;
  warning: number;
}

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "neutral";
  prefix?: string;
  suffix?: string;
  subtext?: string;
  icon?: React.ElementType;
  className?: string;
  previousValue?: number;
  comparisonLabel?: string;
  statusThresholds?: StatusThresholds;
  lowerIsBetter?: boolean;
  tooltip?: string;
  onClick?: () => void;
}

function getStatusColor(
  value: number | string,
  thresholds: StatusThresholds,
  lowerIsBetter: boolean
): "green" | "yellow" | "red" {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return "yellow";
  
  if (lowerIsBetter) {
    if (numValue <= thresholds.good) return "green";
    if (numValue <= thresholds.warning) return "yellow";
    return "red";
  } else {
    if (numValue >= thresholds.good) return "green";
    if (numValue >= thresholds.warning) return "yellow";
    return "red";
  }
}

function calculatePercentageChange(current: number | string, previous: number): number {
  const currentNum = typeof current === "string" ? parseFloat(current) : current;
  if (isNaN(currentNum) || previous === 0) return 0;
  return Math.round(((currentNum - previous) / previous) * 100);
}

const statusColorMap = {
  green: {
    border: "border-l-emerald-500",
    dot: "bg-emerald-500",
    glow: "shadow-emerald-500/20"
  },
  yellow: {
    border: "border-l-amber-500",
    dot: "bg-amber-500",
    glow: "shadow-amber-500/20"
  },
  red: {
    border: "border-l-rose-500",
    dot: "bg-rose-500",
    glow: "shadow-rose-500/20"
  }
};

export function KPICard({
  title,
  value,
  change,
  trend,
  prefix = "",
  suffix = "",
  subtext,
  icon: Icon,
  className,
  previousValue,
  comparisonLabel,
  statusThresholds,
  lowerIsBetter = false,
  tooltip,
  onClick
}: KPICardProps) {
  const isUp = change >= 0;
  const trendColor = isUp ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50";
  const TrendIcon = isUp ? ArrowUpRight : ArrowDownRight;

  const statusColor = statusThresholds 
    ? getStatusColor(value, statusThresholds, lowerIsBetter)
    : null;

  const periodChange = previousValue !== undefined 
    ? calculatePercentageChange(value, previousValue)
    : null;

  const statusStyles = statusColor ? statusColorMap[statusColor] : null;

  return (
    <Card 
      className={cn(
        "overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 group",
        statusStyles && `border-l-4 ${statusStyles.border}`,
        onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      onClick={onClick}
      data-testid={onClick ? "kpi-card-clickable" : "kpi-card"}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          {tooltip && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info 
                    className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors" 
                    data-testid="kpi-tooltip-trigger"
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px] text-center">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-2">
          {statusColor && (
            <span 
              className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                statusStyles?.dot
              )}
              data-testid="kpi-status-indicator"
            />
          )}
          {Icon && <Icon className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {prefix}{typeof value === 'number' ? value.toLocaleString('es-AR') : value}{suffix}
          </div>
        </div>
        
        {periodChange !== null && comparisonLabel && (
          <div className="mt-2">
            <span 
              className={cn(
                "text-xs font-medium",
                periodChange >= 0 ? "text-emerald-600" : "text-rose-600"
              )}
              data-testid="kpi-period-comparison"
            >
              {periodChange >= 0 ? "+" : ""}{periodChange}% {comparisonLabel}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-3">
          <div className={cn("flex items-center text-xs font-medium px-2 py-0.5 rounded-full", trendColor)}>
            <TrendIcon className="w-3 h-3 mr-1" />
            {Math.abs(change)}%
          </div>
          {subtext && (
            <p className="text-xs text-muted-foreground truncate max-w-[120px]" title={subtext}>
              {subtext}
            </p>
          )}
        </div>
      </CardContent>
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </Card>
  );
}
