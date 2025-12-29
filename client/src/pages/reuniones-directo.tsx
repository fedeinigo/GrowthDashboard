import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, Cell, LabelList, Legend
} from "recharts";
import { Loader2, Calendar, DollarSign, TrendingUp, Users, Settings, ArrowRight, Zap, Info, Target } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { KPICard } from "@/components/kpi-card";
import { DashboardFilters } from "@/components/dashboard-filters";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface DirectMeetingsData {
  weeklyMeetings: Array<{ week: string; count: number; value: number }>;
  byPerson: Array<{ name: string; meetings: number; value: number }>;
  byRegion: Array<{ region: string; meetings: number; value: number }>;
  sdrBdrAssignment: Array<{ sdr: string; bdr: string; deals: number; percentage: number }>;
  sdrSummary: Array<{ sdr: string; totalDeals: number }>;
  bdrSummary: Array<{ bdr: string; totalDeals: number }>;
  funnelBySdr: Array<{ sdrId: number; sdrName: string; proposalValue: number; sprintValue: number; totalValue: number; proposalCount: number; sprintCount: number }>;
  ejecutivosSdrTable: {
    sdrs: string[];
    rows: Array<{ ejecutivo: string; total: number; sdrs: Array<{ sdr: string; count: number }> }>;
  };
  totals: { meetings: number; value: number; avgTicket: number; funnelActual: number };
}

const REGION_COLORS: Record<string, string> = {
  "Colombia": "#3b82f6",
  "Argentina": "#10b981",
  "Mexico": "#f59e0b",
  "Brasil": "#ef4444",
  "España": "#8b5cf6",
  "Rest Latam": "#6b7280",
};

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

export default function ReunionesDirecto() {
  const currentQ = getQuarterDates(getCurrentQuarter(), new Date().getFullYear());
  const [filters, setFilters] = useState<Record<string, any>>({
    startDate: format(currentQ.startDate, 'yyyy-MM-dd'),
    endDate: format(currentQ.endDate, 'yyyy-MM-dd'),
  });
  const [excludedSdrs, setExcludedSdrs] = useState<Set<string>>(new Set());

  const handleFilterChange = (newFilters: any) => {
    if (newFilters.reset) {
      const qDates = getQuarterDates(getCurrentQuarter(), new Date().getFullYear());
      setFilters({
        startDate: format(qDates.startDate, 'yyyy-MM-dd'),
        endDate: format(qDates.endDate, 'yyyy-MM-dd'),
      });
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

  const toggleSdrExclusion = (sdr: string) => {
    setExcludedSdrs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sdr)) {
        newSet.delete(sdr);
      } else {
        newSet.add(sdr);
      }
      return newSet;
    });
  };

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    // Support multi-select format (teams/people arrays)
    if (filters.teams?.length) params.append('teamIds', filters.teams.join(','));
    if (filters.people?.length) params.append('personIds', filters.people.join(','));
    if (filters.sources?.length) params.append('sources', filters.sources.join(','));
    if (filters.dealType && filters.dealType !== 'all') params.append('dealType', filters.dealType);
    if (filters.countries?.length) params.append('countries', filters.countries.join(','));
    return params.toString();
  };

  const { data, isLoading } = useQuery<DirectMeetingsData>({
    queryKey: ["/api/dashboard/direct-meetings", filters],
    queryFn: async () => {
      const qs = buildQueryString();
      const res = await fetch(`/api/dashboard/direct-meetings${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Cargando datos...</span>
        </div>
      </Layout>
    );
  }

  const weeklyData = data?.weeklyMeetings || [];
  const byPerson = data?.byPerson || [];
  const byRegion = data?.byRegion || [];
  const sdrBdrAssignment = data?.sdrBdrAssignment || [];
  const sdrSummary = data?.sdrSummary || [];
  const bdrSummary = data?.bdrSummary || [];
  const funnelBySdr = data?.funnelBySdr || [];
  const ejecutivosSdrTable = data?.ejecutivosSdrTable || { sdrs: [], rows: [] };
  const totals = data?.totals || { meetings: 0, value: 0, avgTicket: 0, funnelActual: 0 };

  const groupedBySdr: Record<string, Array<{ bdr: string; deals: number; percentage: number }>> = {};
  sdrBdrAssignment.forEach(item => {
    if (!groupedBySdr[item.sdr]) {
      groupedBySdr[item.sdr] = [];
    }
    groupedBySdr[item.sdr].push({ bdr: item.bdr, deals: item.deals, percentage: item.percentage });
  });

  const sortedSdrs = sdrSummary
    .filter(s => !excludedSdrs.has(s.sdr))
    .map(s => s.sdr);

  const maxSdrDeals = Math.max(...sdrSummary.map(s => s.totalDeals), 1);
  const maxBdrDeals = Math.max(...bdrSummary.map(b => b.totalDeals), 1);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="relative rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-primary/10 p-4 sm:p-6 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight">Reuniones Directo</h2>
              <p className="text-sm text-muted-foreground mt-1">Análisis de deals de origen directo (Pipeline 1 - Directo + Inbound + Outbound)</p>
            </div>
          </div>
        </div>

        <DashboardFilters filters={filters} onFilterChange={handleFilterChange} />

        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <UITooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-muted/80 transition-colors">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-semibold mb-1">Total Reuniones</p>
                  <p className="text-xs">Cantidad de deals New Customer de origen directo (Directo + Inbound + Outbound) creados en el periodo seleccionado.</p>
                </TooltipContent>
              </UITooltip>
              <KPICard 
                title="Total Reuniones" 
                value={totals.meetings} 
                change={0} 
                trend="neutral" 
                icon={Calendar}
                className="border-l-4 border-l-primary"
              />
            </div>
            
            <div className="relative">
              <UITooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-muted/80 transition-colors">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-semibold mb-1">Valor Total</p>
                  <p className="text-xs">Suma del valor de deals que han alcanzado etapa Proposal Made o posterior (incluye ganados). Solo origen directo.</p>
                </TooltipContent>
              </UITooltip>
              <KPICard 
                title="Valor Total" 
                value={totals.value} 
                change={0} 
                trend="neutral" 
                prefix="$"
                icon={DollarSign}
                className="border-l-4 border-l-emerald-500"
              />
            </div>
            
            <div className="relative">
              <UITooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-muted/80 transition-colors">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-semibold mb-1">Funnel Actual</p>
                  <p className="text-xs">Valor de deals activos (status open) en etapas Proposal Made o Current Sprint. Representa el pipeline activo de propuestas.</p>
                </TooltipContent>
              </UITooltip>
              <KPICard 
                title="Funnel Actual" 
                value={totals.funnelActual} 
                change={0} 
                trend="neutral" 
                prefix="$"
                icon={Target}
                className="border-l-4 border-l-violet-500"
              />
            </div>
            
            <div className="relative">
              <UITooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-muted/80 transition-colors">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-semibold mb-1">Ticket Promedio</p>
                  <p className="text-xs">Promedio del valor de deals efectivamente ganados (won). Solo considera ventas cerradas de origen directo.</p>
                </TooltipContent>
              </UITooltip>
              <KPICard 
                title="Ticket Promedio" 
                value={totals.avgTicket} 
                change={0} 
                trend="neutral" 
                prefix="$"
                icon={TrendingUp}
                className="border-l-4 border-l-amber-500"
              />
            </div>
          </div>
        </TooltipProvider>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Asignacion SDR → BDR (Owner Actual)</CardTitle>
                  <CardDescription className="mt-1">
                    Quien creo el deal (SDR) y quien es el propietario actual (BDR)
                  </CardDescription>
                </div>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Ajustar
                    {excludedSdrs.size > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                        {excludedSdrs.size} ocultos
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0" align="end">
                  <div className="p-4 border-b bg-muted/50">
                    <h4 className="font-semibold text-sm">Filtrar Creadores (SDRs)</h4>
                    <p className="text-xs text-muted-foreground mt-1">Deselecciona los creadores que no quieres mostrar</p>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    {sdrSummary.map((s) => (
                      <div 
                        key={s.sdr} 
                        className="flex items-center space-x-3 p-2.5 hover:bg-accent rounded-md cursor-pointer transition-colors"
                        onClick={() => toggleSdrExclusion(s.sdr)}
                      >
                        <Checkbox
                          id={`sdr-${s.sdr}`}
                          checked={!excludedSdrs.has(s.sdr)}
                          onCheckedChange={() => toggleSdrExclusion(s.sdr)}
                        />
                        <label htmlFor={`sdr-${s.sdr}`} className="text-sm cursor-pointer flex-1 flex justify-between items-center">
                          <span className="font-medium">{s.sdr}</span>
                          <Badge variant="outline" className="tabular-nums">{s.totalDeals}</Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                  {excludedSdrs.size > 0 && (
                    <div className="border-t p-3 bg-muted/50">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full" 
                        onClick={() => setExcludedSdrs(new Set())}
                      >
                        Mostrar todos
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-foreground">Detalle por SDR</h4>
                  {excludedSdrs.size > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {sortedSdrs.length} de {sdrSummary.length} SDRs
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto pr-2 max-h-[500px]">
                  {sortedSdrs.map((sdr, idx) => {
                    const assignments = groupedBySdr[sdr] || [];
                    const sdrTotal = sdrSummary.find(s => s.sdr === sdr)?.totalDeals || 0;
                    const percentage = (sdrTotal / maxSdrDeals) * 100;
                    return (
                      <div 
                        key={sdr} 
                        className="border rounded-lg p-3 bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300">
                              {idx + 1}
                            </div>
                            <span className="font-semibold text-xs truncate max-w-[100px]">{sdr}</span>
                          </div>
                          <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/70">
                            {sdrTotal}
                          </Badge>
                        </div>
                        <div className="mb-2">
                          <Progress value={percentage} className="h-1" />
                        </div>
                        <div className="space-y-1 pl-1.5 border-l border-muted max-h-[120px] overflow-y-auto">
                          {assignments.map((a, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px] py-0.5">
                              <div className="flex items-center gap-1">
                                <ArrowRight className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                                <span className="text-muted-foreground truncate max-w-[80px]">{a.bdr}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground tabular-nums">{a.deals}</span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-[10px] px-1 py-0 tabular-nums ${
                                    a.percentage >= 50 
                                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700' 
                                      : a.percentage >= 25 
                                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700'
                                        : 'bg-muted text-muted-foreground border-muted'
                                  }`}
                                >
                                  {a.percentage}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-300">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Top SDRs (Creadores)
                  </h4>
                  <div className="space-y-3">
                    {sdrSummary.filter(s => !excludedSdrs.has(s.sdr)).slice(0, 8).map((s, idx) => {
                      const percentage = (s.totalDeals / maxSdrDeals) * 100;
                      return (
                        <div key={s.sdr} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="truncate font-medium">{idx + 1}. {s.sdr}</span>
                            <Badge variant="outline" className="tabular-nums bg-background">{s.totalDeals}</Badge>
                          </div>
                          <Progress value={percentage} className="h-1" />
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4">
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Top BDRs (Owners)
                  </h4>
                  <div className="space-y-3">
                    {bdrSummary.slice(0, 8).map((b, idx) => {
                      const percentage = (b.totalDeals / maxBdrDeals) * 100;
                      return (
                        <div key={b.bdr} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="truncate font-medium">{idx + 1}. {b.bdr}</span>
                            <Badge variant="outline" className="tabular-nums bg-background border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">{b.totalDeals}</Badge>
                          </div>
                          <Progress value={percentage} className="h-1 [&>div]:bg-emerald-500" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Reuniones Directas por Semana</CardTitle>
              </div>
              <CardDescription>Evolucion semanal de reuniones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number, name: string) => [
                        name === 'count' ? value : `$${value.toLocaleString()}`,
                        name === 'count' ? 'Reuniones' : 'Valor'
                      ]} 
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Reuniones">
                      <LabelList dataKey="count" position="top" fontSize={10} fill="hsl(var(--muted-foreground))" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-base">Valor por Semana</CardTitle>
              </div>
              <CardDescription>USD en reuniones directas por semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Valor']} 
                    />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-base">Top Ejecutivos - Reuniones Directas</CardTitle>
              <CardDescription>Ejecutivos con mas reuniones de origen directo</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Ejecutivo</TableHead>
                    <TableHead className="text-right font-semibold">Reuniones</TableHead>
                    <TableHead className="text-right font-semibold">Valor USD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byPerson.slice(0, 10).map((person, idx) => (
                    <TableRow key={person.name} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {idx + 1}
                          </div>
                          {person.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{person.meetings}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 tabular-nums">
                          ${person.value.toLocaleString()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-base">Reuniones Directas por Region</CardTitle>
              <CardDescription>Distribucion por celula geografica</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byRegion} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis dataKey="region" type="category" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={85} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number, name: string) => [
                        name === 'meetings' ? value : `$${value.toLocaleString()}`,
                        name === 'meetings' ? 'Reuniones' : 'Valor'
                      ]} 
                    />
                    <Bar dataKey="meetings" radius={[0, 6, 6, 0]} name="Reuniones">
                      {byRegion.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={REGION_COLORS[entry.region] || '#6b7280'} />
                      ))}
                      <LabelList dataKey="meetings" position="right" fontSize={11} fill="hsl(var(--foreground))" fontWeight={500} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funnel por SDR */}
        {funnelBySdr.length > 0 && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <CardTitle className="text-base">Funnel por SDR</CardTitle>
                  <CardDescription>Fee mensual de deals abiertos en Proposal Made y Current Sprint por cada SDR</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelBySdr} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <YAxis dataKey="sdrName" type="category" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={120} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number, name: string) => [
                        `$${value.toLocaleString()}`,
                        name === 'proposalValue' ? 'Proposal Made' : 'Current Sprint'
                      ]} 
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px' }}
                      formatter={(value) => value === 'proposalValue' ? 'Proposal Made' : 'Current Sprint'}
                    />
                    <Bar dataKey="proposalValue" stackId="a" fill="#8b5cf6" name="proposalValue" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="sprintValue" stackId="a" fill="#f59e0b" name="sprintValue" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {funnelBySdr.slice(0, 6).map((sdr: any) => (
                  <div key={sdr.sdrId} className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-center">
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium truncate">{sdr.sdrName}</div>
                    <div className="text-lg font-bold text-purple-700 dark:text-purple-300">${Math.round(sdr.totalValue / 1000)}k</div>
                    <div className="text-[10px] text-muted-foreground">{sdr.proposalCount + sdr.sprintCount} deals</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabla Ejecutivos vs SDR */}
        {ejecutivosSdrTable.rows.length > 0 && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Ejecutivos vs SDR - Reuniones Agendadas</CardTitle>
                  <CardDescription>Cantidad de reuniones que cada SDR agendó para cada ejecutivo (solo New Customer)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold sticky left-0 bg-muted/30 z-10 min-w-[160px]">Ejecutivo</TableHead>
                      <TableHead className="text-center font-semibold min-w-[80px]">Total</TableHead>
                      {ejecutivosSdrTable.sdrs.map(sdr => (
                        <TableHead key={sdr} className="text-center font-semibold min-w-[100px] text-xs">
                          {sdr}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ejecutivosSdrTable.rows.map((row, idx) => (
                      <TableRow key={row.ejecutivo} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                        <TableCell className="font-medium sticky left-0 bg-inherit z-10">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {idx + 1}
                            </div>
                            <span className="truncate max-w-[120px]" title={row.ejecutivo}>{row.ejecutivo}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-bold tabular-nums">
                            {row.total}
                          </Badge>
                        </TableCell>
                        {row.sdrs.map(sdrData => (
                          <TableCell key={sdrData.sdr} className="text-center tabular-nums">
                            {sdrData.count > 0 ? (
                              <span className={sdrData.count >= 5 ? 'font-bold text-primary' : sdrData.count >= 2 ? 'font-medium' : 'text-muted-foreground'}>
                                {sdrData.count}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">-</span>
                            )}
                          </TableCell>
                        ))}
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
