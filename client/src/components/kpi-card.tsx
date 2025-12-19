import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus, MoreHorizontal } from "lucide-react";

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
}

export function KPICard({
  title,
  value,
  change,
  trend,
  prefix = "",
  suffix = "",
  subtext,
  icon: Icon,
  className
}: KPICardProps) {
  const isPositive = trend === "up" ? change > 0 : change < 0; // Depends on metric, but generally green is good. 
  // Let's simplify: if trend matches change direction, determine color.
  // Actually, standard is: Green if "good". 
  // For 'Logos' (more is good): change > 0 -> green.
  // For 'Time' (less is good): change < 0 -> green.
  // We'll trust the 'trend' prop passed from parent (if trend='up' implies good visually, or just direction).
  // Let's just use standard: Green for positive change number, Red for negative.
  // Unless we want specific logic. 
  // I will assume change > 0 is green, < 0 is red, unless trend logic overrides.
  
  // Actually, better logic: 
  // If change > 0: arrow up. Color depends on if "up" is good.
  // Assuming for most business metrics up is green.
  
  const isUp = change >= 0;
  const trendColor = isUp ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50";
  const TrendIcon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className={cn("overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 group", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {prefix}{typeof value === 'number' ? value.toLocaleString('es-AR') : value}{suffix}
          </div>
        </div>
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
      {/* Decorative gradient bar at bottom */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </Card>
  );
}
