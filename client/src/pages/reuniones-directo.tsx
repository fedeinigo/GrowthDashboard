import React, { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line 
} from "recharts";
import { Loader2, Calendar, DollarSign, TrendingUp, FilterX, RefreshCw } from "lucide-react";
import { KPICard } from "@/components/kpi-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { fetchPeople, fetchCountries, fetchCacheStatus, refreshCache } from "@/lib/api";

interface DirectMeetingsData {
  weeklyMeetings: Array<{ week: string; count: number; value: number }>;
  byPerson: Array<{ name: string; meetings: number; value: number }>;
  byRegion: Array<{ region: string; meetings: number; value: number }>;
  totals: { meetings: number; value: number; avgTicket: number };
}

function getCurrentQuarterDates() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
  const quarterEndMonth = quarterStartMonth + 2;
  
  const startDate = new Date(currentYear, quarterStartMonth, 1);
  const endDate = new Date(currentYear, quarterEndMonth + 1, 0);
  
  return { startDate, endDate, quarter: Math.floor(currentMonth / 3) + 1, year: currentYear };
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

function getQuarterFromDate(dateStr: string | undefined): string {
  if (!dateStr) return getCurrentQuarter();
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    const month = parseInt(parts[1], 10) - 1;
    return `q${Math.floor(month / 3) + 1}`;
  }
  return getCurrentQuarter();
}

function getYearFromDate(dateStr: string | undefined): string {
  if (!dateStr) return new Date().getFullYear().toString();
  const parts = dateStr.split('-');
  if (parts.length >= 1) {
    return parts[0];
  }
  return new Date().getFullYear().toString();
}

export default function ReunionesDirecto() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [dateType, setDateType] = useState("quarter");
  const [isInitialized, setIsInitialized] = useState(false);

  const currentQ = getCurrentQuarterDates();
  const selectedQuarter = getQuarterFromDate(filters?.startDate);
  const selectedYear = getYearFromDate(filters?.startDate);

  useEffect(() => {
    if (!filters?.startDate && !filters?.endDate) {
      const qDates = getQuarterDates(getCurrentQuarter(), new Date().getFullYear());
      setFilters({ 
        startDate: format(qDates.startDate, 'yyyy-MM-dd'),
        endDate: format(qDates.endDate, 'yyyy-MM-dd'),
      });
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }
    const yearNum = parseInt(selectedYear);
    if (dateType === "quarter") {
      const qDates = getQuarterDates(selectedQuarter, yearNum);
      setFilters(prev => ({ 
        ...prev,
        startDate: format(qDates.startDate, 'yyyy-MM-dd'),
        endDate: format(qDates.endDate, 'yyyy-MM-dd'),
      }));
    } else if (dateType === "year") {
      setFilters(prev => ({ 
        ...prev,
        startDate: format(new Date(yearNum, 0, 1), 'yyyy-MM-dd'),
        endDate: format(new Date(yearNum, 11, 31), 'yyyy-MM-dd'),
      }));
    }
  }, [dateType]);

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

  const handleCountryToggle = (countryId: string) => {
    const currentCountries = filters?.countries || [];
    const newCountries = currentCountries.includes(countryId)
      ? currentCountries.filter((c: string) => c !== countryId)
      : [...currentCountries, countryId];
    handleFilterChange({ countries: newCountries.length > 0 ? newCountries : undefined });
  };

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.personId) params.append('personId', filters.personId);
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

  const { data: peopleData = [] } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
  });

  const { data: countriesData = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
  });

  const { data: cacheStatus } = useQuery({
    queryKey: ['cacheStatus'],
    queryFn: fetchCacheStatus,
    refetchInterval: 30000,
  });

  const refreshMutation = useMutation({
    mutationFn: refreshCache,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const people = [
    { value: "all", label: "Todas las Personas" },
    ...peopleData.map((p: any) => ({ value: p.id.toString(), label: p.displayName }))
  ];

  const countries = countriesData.map((c: any) => ({ value: c.id, label: c.label }));

  const quarters = [
    { value: "q1", label: "Q1" },
    { value: "q2", label: "Q2" },
    { value: "q3", label: "Q3" },
    { value: "q4", label: "Q4" },
  ];

  const years = Array.from({ length: 6 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
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
  const totals = data?.totals || { meetings: 0, value: 0, avgTicket: 0 };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight">Reuniones Directo</h2>
            <p className="text-muted-foreground mt-1">Análisis de deals de origen directo (Pipeline 1 - Inbound + Outbound)</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4">
          {filters && Object.keys(filters).filter(k => k !== 'startDate' && k !== 'endDate').length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">Filtros Activos:</span>
              {Object.entries(filters).filter(([key]) => key !== 'startDate' && key !== 'endDate').map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center bg-primary/10 text-primary text-xs px-2 py-1 rounded-full border border-primary/20">
                  <span className="font-semibold mr-1">{key}:</span>
                  {Array.isArray(value) ? `${value.length} seleccionados` : value}
                  <button 
                    onClick={() => handleFilterChange({ [key]: undefined })}
                    className="ml-1 hover:text-destructive transition-colors"
                  >
                    <FilterX className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => handleFilterChange({ reset: true })}
              >
                Limpiar todo
              </Button>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 p-4 bg-card border border-border rounded-lg shadow-sm flex-wrap">
            
            {/* Date Type */}
            <div className="flex-1 min-w-[140px] max-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo de Fecha</label>
              <Select value={dateType} onValueChange={setDateType}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarter">Trimestre (Q)</SelectItem>
                  <SelectItem value="year">Año Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateType === "quarter" && (
              <>
                <div className="flex-1 min-w-[100px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Trimestre</label>
                  <Select value={selectedQuarter} onValueChange={(val) => {
                    const qDates = getQuarterDates(val, parseInt(selectedYear));
                    handleFilterChange({ 
                      startDate: format(qDates.startDate, 'yyyy-MM-dd'),
                      endDate: format(qDates.endDate, 'yyyy-MM-dd'),
                    });
                  }}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Q" />
                    </SelectTrigger>
                    <SelectContent>
                      {quarters.map((q) => (
                        <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Año</label>
                  <Select value={selectedYear} onValueChange={(val) => {
                    const qDates = getQuarterDates(selectedQuarter, parseInt(val));
                    handleFilterChange({ 
                      startDate: format(qDates.startDate, 'yyyy-MM-dd'),
                      endDate: format(qDates.endDate, 'yyyy-MM-dd'),
                    });
                  }}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {dateType === "year" && (
              <div className="flex-1 min-w-[100px]">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Año</label>
                <Select value={selectedYear} onValueChange={(val) => {
                  const yearNum = parseInt(val);
                  handleFilterChange({ 
                    startDate: format(new Date(yearNum, 0, 1), 'yyyy-MM-dd'),
                    endDate: format(new Date(yearNum, 11, 31), 'yyyy-MM-dd'),
                  });
                }}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Person Filter */}
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Persona</label>
              <Select value={filters?.personId || "all"} onValueChange={(val) => handleFilterChange({ personId: val === "all" ? undefined : val })}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Seleccionar persona" />
                </SelectTrigger>
                <SelectContent>
                  {people.map((p: any) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">País</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start bg-background font-normal">
                    {filters?.countries && filters.countries.length > 0
                      ? `${filters.countries.length} país${filters.countries.length > 1 ? 'es' : ''} seleccionado${filters.countries.length > 1 ? 's' : ''}`
                      : "Todos los países"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0" align="start">
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    {countries.map((country: any) => (
                      <div key={country.value} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer" onClick={() => handleCountryToggle(country.value)}>
                        <Checkbox
                          id={`country-${country.value}`}
                          checked={filters?.countries?.includes(country.value) || false}
                          onCheckedChange={() => handleCountryToggle(country.value)}
                        />
                        <label htmlFor={`country-${country.value}`} className="text-sm cursor-pointer flex-1">
                          {country.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {filters?.countries && filters.countries.length > 0 && (
                    <div className="border-t p-2">
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => handleFilterChange({ countries: undefined })}>
                        Limpiar selección
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Refresh Button */}
            <div className="flex-shrink-0 flex flex-col items-end justify-end ml-auto">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending || cacheStatus?.isRefreshing}
                className="gap-2"
                data-testid="button-refresh-data"
              >
                {(refreshMutation.isPending || cacheStatus?.isRefreshing) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Actualizar datos
              </Button>
              {cacheStatus?.lastSyncAt && (
                <span className="text-xs text-muted-foreground mt-1">
                  Actualizado {formatDistanceToNow(new Date(cacheStatus.lastSyncAt), { addSuffix: true, locale: es })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPIs */}
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Reuniones Directas por Semana</CardTitle>
              <CardDescription>Evolución semanal de reuniones</CardDescription>
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

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Top Ejecutivos - Reuniones Directas</CardTitle>
              <CardDescription>Ejecutivos con más reuniones de origen directo</CardDescription>
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
              <CardTitle className="text-base">Reuniones Directas por Región</CardTitle>
              <CardDescription>Distribución por célula geográfica</CardDescription>
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
