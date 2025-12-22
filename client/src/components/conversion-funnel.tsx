import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, TrendingDown, Filter as FilterIcon } from "lucide-react";
import { motion } from "framer-motion";

interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  conversionToNext: number | null;
}

interface ConversionFunnelProps {
  data: { stages: FunnelStage[] } | null;
  isLoading?: boolean;
}

export function ConversionFunnel({ data, isLoading }: ConversionFunnelProps) {
  if (isLoading) {
    return (
      <Card className="border-none shadow-sm" data-testid="conversion-funnel-loading">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Funnel de Conversión</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Cargando datos...</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <div className="animate-pulse flex gap-4">
            <div className="h-24 w-32 bg-muted rounded"></div>
            <div className="h-20 w-28 bg-muted rounded"></div>
            <div className="h-16 w-24 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.stages || data.stages.length === 0) {
    return (
      <Card className="border-none shadow-sm" data-testid="conversion-funnel-empty">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <FilterIcon className="w-5 h-5 text-primary" />
            Funnel de Conversión
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Sin datos disponibles</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          No hay datos de conversión para mostrar
        </CardContent>
      </Card>
    );
  }

  const { stages } = data;
  const maxCount = stages[0]?.count || 1;

  const stageColors = [
    { bg: "bg-primary", text: "text-primary-foreground", bar: "bg-primary" },
    { bg: "bg-primary/70", text: "text-primary-foreground", bar: "bg-primary/70" },
    { bg: "bg-primary/40", text: "text-primary-foreground", bar: "bg-primary/40" },
  ];

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow" data-testid="conversion-funnel">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <FilterIcon className="w-5 h-5 text-primary" />
          Funnel de Conversión
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Tarjetas New Customer: Reuniones → Propuestas → Cierres
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-stretch justify-center gap-2 lg:gap-0">
          {stages.map((stage, index) => {
            const widthPercentage = Math.max(30, (stage.count / maxCount) * 100);
            const colors = stageColors[index] || stageColors[stageColors.length - 1];
            
            return (
              <div key={stage.name} className="flex flex-col lg:flex-row items-center flex-1">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="w-full lg:w-auto"
                  data-testid={`funnel-stage-${stage.name.toLowerCase()}`}
                >
                  <div 
                    className={`relative ${colors.bg} rounded-lg p-4 lg:p-6 text-center transition-all duration-300 hover:scale-105 cursor-default`}
                    style={{
                      minWidth: '140px',
                      clipPath: index === stages.length - 1 
                        ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' 
                        : 'polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%)'
                    }}
                  >
                    <div className={`font-bold text-2xl lg:text-3xl ${colors.text}`} data-testid={`funnel-count-${stage.name.toLowerCase()}`}>
                      {stage.count.toLocaleString()}
                    </div>
                    <div className={`text-sm lg:text-base font-medium ${colors.text} opacity-90`}>
                      {stage.name}
                    </div>
                    <div className={`text-xs ${colors.text} opacity-75 mt-1`} data-testid={`funnel-percentage-${stage.name.toLowerCase()}`}>
                      {stage.percentage}% del total
                    </div>
                  </div>
                </motion.div>

                {stage.conversionToNext !== null && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.15 }}
                    className="flex flex-col items-center justify-center px-2 lg:px-4 py-2 lg:py-0"
                    data-testid={`funnel-conversion-${index}`}
                  >
                    <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground hidden lg:block" />
                    <TrendingDown className="w-5 h-5 text-muted-foreground lg:hidden" />
                    <div className="text-xs lg:text-sm font-semibold text-primary mt-1">
                      {stage.conversionToNext}%
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      pasan
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            {stages.map((stage, index) => {
              const prevStage = index > 0 ? stages[index - 1] : null;
              const conversionFromPrev = prevStage && prevStage.count > 0 
                ? Math.round((stage.count / prevStage.count) * 100) 
                : null;
              
              return (
                <div key={`stat-${stage.name}`} className="space-y-1">
                  <div className="text-xs text-muted-foreground">{stage.name}</div>
                  <div className="text-lg font-bold text-foreground">{stage.count}</div>
                  {conversionFromPrev !== null && (
                    <div className="text-xs text-primary font-medium">
                      ({conversionFromPrev}% conversión)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
