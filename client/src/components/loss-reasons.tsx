import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingDown, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface LossReason {
  reason: string;
  count: number;
  percentage: number;
}

interface LossReasonsProps {
  data: { reasons: LossReason[] } | null;
  isLoading?: boolean;
}

export function LossReasons({ data, isLoading }: LossReasonsProps) {
  if (isLoading) {
    return (
      <Card className="border-none shadow-sm" data-testid="loss-reasons-loading">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Razones de Pérdida</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Cargando datos...</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <div className="animate-pulse space-y-3 w-full">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.reasons || data.reasons.length === 0) {
    return (
      <Card className="border-none shadow-sm" data-testid="loss-reasons-empty">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-500" />
            Razones de Pérdida
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Sin datos disponibles</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          No hay datos de razones de pérdida para mostrar
        </CardContent>
      </Card>
    );
  }

  const { reasons } = data;
  const maxPercentage = reasons[0]?.percentage || 1;

  const getBarColor = (index: number) => {
    const colors = [
      "bg-rose-500",
      "bg-rose-400",
      "bg-rose-300",
      "bg-rose-200",
      "bg-rose-100",
      "bg-red-300",
      "bg-red-200",
      "bg-red-100",
    ];
    return colors[index] || colors[colors.length - 1];
  };

  const getTextColor = (index: number) => {
    return index < 3 ? "text-white" : "text-rose-700";
  };

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow" data-testid="loss-reasons">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-rose-500" />
          Razones de Pérdida
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Principales motivos de pérdida en deals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3" data-testid="loss-reasons-list">
          {reasons.slice(0, 8).map((item, index) => (
            <motion.div
              key={item.reason}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative"
              data-testid={`loss-reason-item-${index}`}
            >
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate max-w-[180px] sm:max-w-none">
                    {item.reason}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                  <span className="text-xs" data-testid={`loss-reason-count-${index}`}>
                    {item.count} deals
                  </span>
                  <span className="font-semibold text-rose-600" data-testid={`loss-reason-percentage-${index}`}>
                    {item.percentage}%
                  </span>
                </div>
              </div>
              <div className="relative h-6 bg-muted rounded-md overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.percentage / maxPercentage) * 100}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={`absolute inset-y-0 left-0 ${getBarColor(index)} rounded-md flex items-center justify-end pr-2`}
                >
                  {item.percentage >= 10 && (
                    <span className={`text-xs font-medium ${getTextColor(index)}`}>
                      {item.percentage}%
                    </span>
                  )}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>Total deals perdidos</span>
            </div>
            <span className="font-semibold text-rose-600" data-testid="loss-reasons-total">
              {reasons.reduce((sum, r) => sum + r.count, 0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
