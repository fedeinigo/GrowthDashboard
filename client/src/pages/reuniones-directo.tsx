import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line 
} from "recharts";
import { Loader2, Calendar, DollarSign, TrendingUp, Users, Settings } from "lucide-react";
import { KPICard } from "@/components/kpi-card";
import { DashboardFilters } from "@/components/dashboard-filters";
import { Checkbox } from "@/components/ui/checkbox";
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight">Reuniones Directo</h2>
            <p className="text-muted-foreground mt-1">Analisis de deals de origen directo (Pipeline 1 - Inbound + Outbound)</p>
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
            className="border-l-4 border-l-primary"
          />
          <KPICard 
            title="Valor Total" 
            value={totals.value} 
            change={0} 
            trend="neutral" 
            prefix="$"
            icon={DollarSign}
          />
          <KPICard 
            title="Ticket Promedio" 
            value={totals.avgTicket} 
            change={0} 
            trend="neutral" 
            prefix="$"
            icon={TrendingUp}
          />
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Asignacion SDR - BDR (Owner Actual)
                </CardTitle>
                <CardDescription>
                  Muestra quien creo el deal (SDR) y quien es el propietario actual (BDR). El porcentaje indica la proporcion de deals del SDR asignados a cada BDR.
                </CardDescription>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Ajustar
                    {excludedSdrs.size > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {excludedSdrs.size} ocultos
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="end">
                  <div className="p-3 border-b">
                    <h4 className="font-medium text-sm">Filtrar Creadores (SDRs)</h4>
                    <p className="text-xs text-muted-foreground mt-1">Deselecciona los creadores que no quieres mostrar</p>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    {sdrSummary.map((s) => (
                      <div 
                        key={s.sdr} 
                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                        onClick={() => toggleSdrExclusion(s.sdr)}
                      >
                        <Checkbox
                          id={`sdr-${s.sdr}`}
                          checked={!excludedSdrs.has(s.sdr)}
                          onCheckedChange={() => toggleSdrExclusion(s.sdr)}
                        />
                        <label htmlFor={`sdr-${s.sdr}`} className="text-sm cursor-pointer flex-1 flex justify-between">
                          <span>{s.sdr}</span>
                          <span className="text-muted-foreground">{s.totalDeals}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  {excludedSdrs.size > 0 && (
                    <div className="border-t p-2">
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
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h4 className="text-sm font-medium mb-3">
                  Detalle por SDR 
                  {excludedSdrs.size > 0 && (
                    <span className="text-muted-foreground font-normal ml-2">
                      (mostrando {sortedSdrs.length} de {sdrSummary.length})
                    </span>
                  )}
                </h4>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {sortedSdrs.map((sdr) => {
                    const assignments = groupedBySdr[sdr] || [];
                    const sdrTotal = sdrSummary.find(s => s.sdr === sdr)?.totalDeals || 0;
                    return (
                      <div key={sdr} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">{sdr}</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {sdrTotal} deals creados
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {assignments.map((a, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">-</span>
                                <span>{a.bdr}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">{a.deals} deals</span>
                                <Badge variant="secondary" className="text-xs">
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
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-3">Top SDRs (Creadores)</h4>
                  <div className="space-y-2">
                    {sdrSummary.filter(s => !excludedSdrs.has(s.sdr)).slice(0, 8).map((s, idx) => (
                      <div key={s.sdr} className="flex justify-between items-center text-sm">
                        <span className="truncate">{idx + 1}. {s.sdr}</span>
                        <Badge variant="outline">{s.totalDeals}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-3">Top BDRs (Owners)</h4>
                  <div className="space-y-2">
                    {bdrSummary.slice(0, 8).map((b, idx) => (
                      <div key={b.bdr} className="flex justify-between items-center text-sm">
                        <span className="truncate">{idx + 1}. {b.bdr}</span>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{b.totalDeals}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Reuniones Directas por Semana</CardTitle>
              <CardDescription>Evolucion semanal de reuniones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'count' ? value : `$${value.toLocaleString()}`,
                        name === 'count' ? 'Reuniones' : 'Valor'
                      ]} 
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Reuniones" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Valor por Semana</CardTitle>
              <CardDescription>USD en reuniones directas por semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Valor']} />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Top Ejecutivos - Reuniones Directas</CardTitle>
              <CardDescription>Ejecutivos con mas reuniones de origen directo</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ejecutivo</TableHead>
                    <TableHead className="text-right">Reuniones</TableHead>
                    <TableHead className="text-right">Valor USD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byPerson.slice(0, 10).map((person, idx) => (
                    <TableRow key={person.name}>
                      <TableCell className="font-medium">{idx + 1}. {person.name}</TableCell>
                      <TableCell className="text-right">{person.meetings}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          ${person.value.toLocaleString()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Reuniones Directas por Region</CardTitle>
              <CardDescription>Distribucion por celula geografica</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byRegion} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="region" type="category" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'meetings' ? value : `$${value.toLocaleString()}`,
                        name === 'meetings' ? 'Reuniones' : 'Valor'
                      ]} 
                    />
                    <Bar dataKey="meetings" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Reuniones" />
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
