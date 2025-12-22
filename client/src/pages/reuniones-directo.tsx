import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, Cell
} from "recharts";
import { Loader2, Calendar, DollarSign, TrendingUp, Users, Settings, ArrowRight, Zap } from "lucide-react";
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
  totals: { meetings: number; value: number; avgTicket: number };
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
    if (filters.personId) params.append('personId', filters.personId);
    if (filters.teamId) params.append('teamId', filters.teamId);
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
  const totals = data?.totals || { meetings: 0, value: 0, avgTicket: 0 };

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
        <div className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight">Reuniones Directo</h2>
              <p className="text-muted-foreground mt-1">Analisis de deals de origen directo (Pipeline 1 - Inbound + Outbound)</p>
            </div>
          </div>
        </div>

        <DashboardFilters filters={filters} onFilterChange={handleFilterChange} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard 
            title="Total Reuniones" 
            value={totals.meetings} 
            change={0} 
            trend="neutral" 
            icon={Calendar}
            className="border-l-4 border-l-primary bg-gradient-to-br from-white to-blue-50/30"
          />
          <KPICard 
            title="Valor Total" 
            value={totals.value} 
            change={0} 
            trend="neutral" 
            prefix="$"
            icon={DollarSign}
            className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/30"
          />
          <KPICard 
            title="Ticket Promedio" 
            value={totals.avgTicket} 
            change={0} 
            trend="neutral" 
            prefix="$"
            icon={TrendingUp}
            className="border-l-4 border-l-amber-500 bg-gradient-to-br from-white to-amber-50/30"
          />
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-gradient-to-r from-slate-50 to-blue-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
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
                  <Button variant="outline" size="sm" className="gap-2 bg-white">
                    <Settings className="w-4 h-4" />
                    Ajustar
                    {excludedSdrs.size > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs bg-amber-100 text-amber-700">
                        {excludedSdrs.size} ocultos
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0" align="end">
                  <div className="p-4 border-b bg-slate-50">
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
                    <div className="border-t p-3 bg-slate-50">
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
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-foreground">Detalle por SDR</h4>
                  {excludedSdrs.size > 0 && (
                    <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded-full">
                      {sortedSdrs.length} de {sdrSummary.length} SDRs
                    </span>
                  )}
                </div>
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                  {sortedSdrs.map((sdr, idx) => {
                    const assignments = groupedBySdr[sdr] || [];
                    const sdrTotal = sdrSummary.find(s => s.sdr === sdr)?.totalDeals || 0;
                    const percentage = (sdrTotal / maxSdrDeals) * 100;
                    return (
                      <div 
                        key={sdr} 
                        className="border rounded-xl p-4 bg-gradient-to-r from-white to-slate-50/50 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                              {idx + 1}
                            </div>
                            <span className="font-semibold text-sm">{sdr}</span>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
                            {sdrTotal} deals
                          </Badge>
                        </div>
                        <div className="mb-3">
                          <Progress value={percentage} className="h-1.5" />
                        </div>
                        <div className="space-y-2 pl-2 border-l-2 border-slate-200">
                          {assignments.map((a, i) => (
                            <div key={i} className="flex items-center justify-between text-sm py-1">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{a.bdr}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground tabular-nums">{a.deals} deals</span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs tabular-nums ${
                                    a.percentage >= 50 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : a.percentage >= 25 
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-slate-50 text-slate-600 border-slate-200'
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
                <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4">
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2 text-blue-800">
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
                            <Badge variant="outline" className="tabular-nums bg-white">{s.totalDeals}</Badge>
                          </div>
                          <Progress value={percentage} className="h-1" />
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-4">
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2 text-emerald-800">
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
                            <Badge variant="outline" className="tabular-nums bg-white border-emerald-200 text-emerald-700">{b.totalDeals}</Badge>
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
          <Card className="border shadow-sm bg-gradient-to-br from-white to-slate-50">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number, name: string) => [
                        name === 'count' ? value : `$${value.toLocaleString()}`,
                        name === 'count' ? 'Reuniones' : 'Valor'
                      ]} 
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Reuniones" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-base">Valor por Semana</CardTitle>
              </div>
              <CardDescription>USD en reuniones directas por semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
            <CardHeader className="pb-3 border-b bg-slate-50/50">
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
                    <TableRow key={person.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
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
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 tabular-nums">
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
            <CardHeader className="pb-3 border-b bg-slate-50/50">
              <CardTitle className="text-base">Reuniones Directas por Region</CardTitle>
              <CardDescription>Distribucion por celula geografica</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byRegion} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis dataKey="region" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={85} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number, name: string) => [
                        name === 'meetings' ? value : `$${value.toLocaleString()}`,
                        name === 'meetings' ? 'Reuniones' : 'Valor'
                      ]} 
                    />
                    <Bar dataKey="meetings" radius={[0, 6, 6, 0]} name="Reuniones">
                      {byRegion.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={REGION_COLORS[entry.region] || '#6b7280'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
