import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CacheStatus {
  lastSyncAt: string | null;
  status: string;
  totalRecords: number;
  isStale: boolean;
  isRefreshing: boolean;
  error?: string;
  syncDurationMs?: number;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 1) return "hace menos de 1 minuto";
  if (diffMinutes === 1) return "hace 1 minuto";
  if (diffMinutes < 60) return `hace ${diffMinutes} minutos`;
  if (diffHours === 1) return "hace 1 hora";
  return `hace ${diffHours} horas`;
}

export function CacheStatusIndicator() {
  const queryClient = useQueryClient();

  const { data: cacheStatus, isLoading } = useQuery<CacheStatus>({
    queryKey: ["/api/cache/status"],
    refetchInterval: 30000,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/cache/refresh", { method: "POST" });
      if (!response.ok) throw new Error("Failed to refresh cache");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cache/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });

  const isRefreshing = cacheStatus?.isRefreshing || refreshMutation.isPending;
  const lastSyncAt = cacheStatus?.lastSyncAt
    ? new Date(cacheStatus.lastSyncAt)
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-3.5 w-3.5 animate-pulse" />
        <span>Cargando estado...</span>
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-auto py-1 px-2 text-xs gap-1.5 font-normal",
            isRefreshing && "cursor-wait"
          )}
          onClick={() => !isRefreshing && refreshMutation.mutate()}
          disabled={isRefreshing}
          data-testid="cache-status-refresh"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
          />
          {isRefreshing ? (
            <span className="text-muted-foreground">Actualizando...</span>
          ) : lastSyncAt ? (
            <span className="text-muted-foreground">
              Actualizado {formatTimeAgo(lastSyncAt)}
            </span>
          ) : (
            <span className="text-muted-foreground">Sin sincronizar</span>
          )}
          {cacheStatus?.status === "success" && !isRefreshing && (
            <CheckCircle className="h-3 w-3 text-emerald-500" />
          )}
          {cacheStatus?.status === "error" && (
            <AlertCircle className="h-3 w-3 text-destructive" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <div className="space-y-1">
          <p>
            {isRefreshing
              ? "Los datos se están actualizando..."
              : "Haz clic para actualizar los datos"}
          </p>
          {cacheStatus?.totalRecords !== undefined && (
            <p className="text-muted-foreground">
              {cacheStatus.totalRecords.toLocaleString()} registros en caché
            </p>
          )}
          {cacheStatus?.error && (
            <p className="text-destructive">Error: {cacheStatus.error}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
