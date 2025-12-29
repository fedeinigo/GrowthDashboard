import React, { useState, useMemo } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, LabelList
} from "recharts";
import { Loader2, Users, DollarSign, TrendingUp, Target, Briefcase, ArrowUpDown, ArrowUp, ArrowDown, Info, Trophy } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { KPICard } from "@/components/kpi-card";
import { DashboardFilters } from "@/components/dashboard-filters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { fetchTeams } from "@/lib/api";

interface ExecutiveMetrics {
  userId: number;
  name: string;
  teamId: number | null;
  teamName: string;
  revenue: number;
  wonDeals: number;
  closureRate: number;
  avgTicket: number;
  avgSalesCycle: number;
  opportunitiesCreated: number;
  funnelActual: number;
  currentSprintValue: number;
  demoCount: number;
  demoValue: number;
  proposalCount: number;
  proposalValue: number;
  wonCount: number;
  wonValue: number;
  demoPercentage: number;
  proposalPercentage: number;
  wonPercentage: number;
}

interface TeamAggregate {
  teamId: number;
  teamName: string;
  revenue: number;
  wonDeals: number;
  closureRate: number;
  avgTicket: number;
  avgSalesCycle: number;
  opportunitiesCreated: number;
  funnelActual: number;
  currentSprintValue: number;
  members: ExecutiveMetrics[];
}

interface TeamsDataResponse {
  executives: ExecutiveMetrics[];
  teams: TeamAggregate[];
  globalMetrics: {
    revenue: number;
    wonDeals: number;
    closureRate: number;
    avgTicket: number;
    avgSalesCycle: number;
    opportunitiesCreated: number;
    funnelActual: number;
    currentSprintValue: number;
  };
}

type SortField = "revenue" | "closureRate" | "wonDeals" | "avgTicket" | "funnelActual";
type SortOrder = "asc" | "desc";

function getCurrentQuarter() {
  const now = new Date();
  return `q${Math.floor(now.getMonth() / 3) + 1}`;
}

function getQuarterDates(quarter: string, year: number) {
  const quarterNum = parseInt(quarter.replace('q', '')) - 1;
  const startMonth = quarterNum * 3;
  const endMonth = startMonth + 2;
  
  return {
    startDate: new Date(year, startMonth, 1),
    endDate: new Date(year, endMonth + 1, 0),
  };
}

export default function Equipos() {
  const currentQ = getQuarterDates(getCurrentQuarter(), new Date().getFullYear());
  const [filters, setFilters] = useState<Record<string, any>>({
    startDate: format(currentQ.startDate, 'yyyy-MM-dd'),
    endDate: format(currentQ.endDate, 'yyyy-MM-dd'),
  });
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("revenue");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleFilterChange = (newFilters: any) => {
    if (newFilters.reset) {
      const qDates = getQuarterDates(getCurrentQuarter(), new Date().getFullYear());
      setFilters({
        startDate: format(qDates.startDate, 'yyyy-MM-dd'),
        endDate: format(qDates.endDate, 'yyyy-MM-dd'),
      });
      setSelectedTeamId("all");
      return;
    }
    const cleanedFilters = { ...filters, ...newFilters };
    Object.keys(cleanedFilters).forEach(key => {
      if (cleanedFilters[key] === undefined) {
        delete cleanedFilters[key];
      }
    });
    setFilters(cleanedFilters);
  };

  const { data: teamsData = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (selectedTeamId !== 'all') params.append('teamId', selectedTeamId);
    if (filters.countries?.length) params.append('countries', filters.countries.join(','));
    if (filters.sources?.length) params.append('sources', filters.sources.join(','));
    if (filters.dealType && filters.dealType !== 'all') params.append('dealType', filters.dealType);
    return params.toString();
  };

  const { data, isLoading } = useQuery<TeamsDataResponse>({
    queryKey: ['teamsData', filters, selectedTeamId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/teams?${buildQueryString()}`);
      if (!response.ok) throw new Error('Failed to fetch teams data');
      return response.json();
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    return sortOrder === "asc" ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const sortedExecutives = useMemo(() => {
    if (!data?.executives) return [];
    return [...data.executives].sort((a, b) => {
      const aVal = a[sortField] || 0;
      const bVal = b[sortField] || 0;
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [data?.executives, sortField, sortOrder]);

  const displayMetrics = useMemo(() => {
    if (!data) return null;
    if (selectedTeamId !== 'all') {
      const team = data.teams.find(t => t.teamId === parseInt(selectedTeamId));
      return team || data.globalMetrics;
    }
    return data.globalMetrics;
  }, [data, selectedTeamId]);

  const topExecutives = useMemo(() => {
    if (!sortedExecutives) return [];
    return sortedExecutives.slice(0, 8);
  }, [sortedExecutives]);

  const selectedTeam = useMemo(() => {
    if (selectedTeamId === 'all' || !teamsData) return null;
    return teamsData.find((t: any) => t.id.toString() === selectedTeamId) || null;
  }, [selectedTeamId, teamsData]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Cargando datos de equipos...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="relative rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-primary/10 p-4 sm:p-6 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight" data-testid="text-page-title">
                Equipos
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Rendimiento por ejecutivo y equipo comercial</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-stretch">
          {/* Left side - Team image and selector */}
          <div className="flex flex-col gap-4 min-w-[200px]">
            {/* Large team image area */}
            <div className="flex items-center justify-center h-[180px] rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden">
              {selectedTeam?.imageUrl ? (
                <img 
                  src={selectedTeam.imageUrl} 
                  alt={selectedTeam.displayName} 
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Users className="w-12 h-12 opacity-30" />
                  <span className="text-xs">Selecciona un equipo</span>
                </div>
              )}
            </div>
            {/* Team selector */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Equipo</label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId} data-testid="select-team">
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Seleccionar equipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Equipos</SelectItem>
                  {teamsData.map((team: any) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Right side - Dashboard filters */}
          <div className="flex-1">
            <DashboardFilters filters={filters} onFilterChange={handleFilterChange} />
          </div>
        </div>

        {displayMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <KPICard
              title="Revenue Total"
              value={`$${Math.round(displayMetrics.revenue).toLocaleString()}`}
              change={0}
              trend="neutral"
              icon={DollarSign}
              tooltip="Suma del valor de todos los deals ganados en el período"
              data-testid="kpi-revenue"
            />
            <KPICard
              title="Logos Ganados"
              value={displayMetrics.wonDeals}
              change={0}
              trend="neutral"
              icon={Trophy}
              tooltip="Cantidad de deals cerrados exitosamente"
              data-testid="kpi-logos"
            />
            <KPICard
              title="Closure Rate (NC)"
              value={`${displayMetrics.closureRate}%`}
              change={0}
              trend="neutral"
              icon={Target}
              statusThresholds={{ good: 25, warning: 15 }}
              tooltip="Tasa de cierre solo para New Customer: ganados / (ganados + perdidos)"
              data-testid="kpi-closure-rate"
            />
            <KPICard
              title="Ticket Promedio"
              value={`$${Math.round(displayMetrics.avgTicket).toLocaleString()}`}
              change={0}
              trend="neutral"
              icon={Briefcase}
              tooltip="Valor promedio de los deals ganados"
              data-testid="kpi-avg-ticket"
            />
            <KPICard
              title="Funnel Actual"
              value={`$${Math.round(displayMetrics.funnelActual).toLocaleString()}`}
              change={0}
              trend="neutral"
              icon={TrendingUp}
              tooltip="Valor de deals abiertos en Proposal Made o Current Sprint"
              data-testid="kpi-funnel"
            />
            <KPICard
              title="Current Sprint"
              value={`$${Math.round(displayMetrics.currentSprintValue).toLocaleString()}`}
              change={0}
              trend="neutral"
              icon={Target}
              tooltip="Valor de deals en etapa Current Sprint"
              data-testid="kpi-sprint"
            />
            <KPICard
              title="Oportunidades"
              value={displayMetrics.opportunitiesCreated}
              change={0}
              trend="neutral"
              icon={Users}
              tooltip="Total de oportunidades NC creadas en el período"
              data-testid="kpi-opportunities"
            />
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Ranking de Ejecutivos
              </CardTitle>
              <CardDescription>Ordenar por columna para cambiar el ranking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">#</TableHead>
                      <TableHead>Ejecutivo</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => handleSort("revenue")}>
                        <div className="flex items-center justify-end">
                          Revenue {getSortIcon("revenue")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => handleSort("wonDeals")}>
                        <div className="flex items-center justify-end">
                          Won {getSortIcon("wonDeals")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => handleSort("closureRate")}>
                        <div className="flex items-center justify-end">
                          Closure {getSortIcon("closureRate")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => handleSort("avgTicket")}>
                        <div className="flex items-center justify-end">
                          Ticket {getSortIcon("avgTicket")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => handleSort("funnelActual")}>
                        <div className="flex items-center justify-end">
                          Funnel {getSortIcon("funnelActual")}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedExecutives.slice(0, 15).map((exec, index) => (
                      <TableRow key={exec.userId} data-testid={`row-executive-${exec.userId}`}>
                        <TableCell className="font-medium">
                          {index < 3 ? (
                            <Badge variant={index === 0 ? "default" : "secondary"} className={index === 0 ? "bg-amber-500" : index === 1 ? "bg-gray-400" : "bg-amber-700"}>
                              {index + 1}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{index + 1}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{exec.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{exec.teamName}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">${Math.round(exec.revenue).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{exec.wonDeals}</TableCell>
                        <TableCell className="text-right">
                          <span className={exec.closureRate >= 25 ? "text-emerald-600 font-medium" : exec.closureRate >= 15 ? "text-amber-600" : "text-muted-foreground"}>
                            {exec.closureRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">${Math.round(exec.avgTicket).toLocaleString()}</TableCell>
                        <TableCell className="text-right">${Math.round(exec.funnelActual).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Funnel de Conversión por Ejecutivo
              </CardTitle>
              <CardDescription>Demo Done → Propuesta → Ganado (top 8 ejecutivos)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {topExecutives.map((exec) => (
                  <ExecutiveCard key={exec.userId} executive={exec} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {data?.teams && data.teams.length > 0 && (
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Resumen por Equipo
              </CardTitle>
              <CardDescription>Métricas agregadas por equipo comercial</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipo</TableHead>
                      <TableHead className="text-right">Miembros</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Logos</TableHead>
                      <TableHead className="text-right">Closure Rate</TableHead>
                      <TableHead className="text-right">Avg Ticket</TableHead>
                      <TableHead className="text-right">Funnel</TableHead>
                      <TableHead className="text-right">Oportunidades</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.teams.map((team) => (
                      <TableRow key={team.teamId} data-testid={`row-team-${team.teamId}`}>
                        <TableCell className="font-medium">{team.teamName}</TableCell>
                        <TableCell className="text-right">{team.members.length}</TableCell>
                        <TableCell className="text-right font-medium">${Math.round(team.revenue).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{team.wonDeals}</TableCell>
                        <TableCell className="text-right">
                          <span className={team.closureRate >= 25 ? "text-emerald-600 font-medium" : team.closureRate >= 15 ? "text-amber-600" : "text-muted-foreground"}>
                            {team.closureRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">${Math.round(team.avgTicket).toLocaleString()}</TableCell>
                        <TableCell className="text-right">${Math.round(team.funnelActual).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{team.opportunitiesCreated}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

function ExecutiveCard({ executive }: { executive: ExecutiveMetrics }) {
  const chartData = [
    { name: "Demo", count: executive.demoCount, percentage: executive.demoPercentage, color: "#f59e0b" },
    { name: "Propuesta", count: executive.proposalCount, percentage: executive.proposalPercentage, color: "#8b5cf6" },
    { name: "Ganado", count: executive.wonCount, percentage: executive.wonPercentage, color: "#10b981" },
  ];

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow" data-testid={`card-executive-${executive.userId}`}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="font-medium text-sm truncate">{executive.name}</p>
              <p className="text-xs text-muted-foreground truncate">{executive.teamName}</p>
            </div>
            <TooltipProvider delayDuration={200}>
              <UITooltip>
                <TooltipTrigger>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${executive.closureRate >= 25 ? 'text-emerald-600' : executive.closureRate >= 15 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {executive.closureRate}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Win Rate</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tasa de cierre NC</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="horizontal" margin={{ top: 15, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="count" position="top" fontSize={10} fill="hsl(var(--foreground))" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{executive.demoPercentage}%</span>
            <span>{executive.proposalPercentage}%</span>
            <span>{executive.wonPercentage}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
