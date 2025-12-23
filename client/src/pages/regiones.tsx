import React, { useMemo, useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, Legend, Cell
} from "recharts";
import { ArrowUpDown, ArrowUp, ArrowDown, Loader2, Globe, TrendingUp, Clock, MapPin } from "lucide-react";

type SortField = "meetings" | "proposals" | "closings" | "meetingsValue" | "proposalsValue" | "closingsValue" | null;
type SortOrder = "asc" | "desc";

const REGION_COLORS: Record<string, string> = {
  "Colombia": "#3b82f6",
  "Argentina": "#10b981",
  "Mexico": "#f59e0b",
  "Brasil": "#ef4444",
  "España": "#8b5cf6",
  "Rest Latam": "#6b7280",
};

const REGION_BG_COLORS: Record<string, string> = {
  "Colombia": "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800",
  "Argentina": "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
  "Mexico": "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
  "Brasil": "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800",
  "España": "bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800",
  "Rest Latam": "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700",
};

export default function Regiones() {
  const { 
    regionalData, 
    quarterlyRegionComparison, 
    topOriginsByRegion, 
    salesCycleByRegion,
    isLoading 
  } = useDashboardData();

  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

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

  const sortedRegionalData = useMemo(() => {
    if (!regionalData || !sortField) return regionalData || [];
    
    return [...regionalData].map((region: any) => {
      if (!region.rows || !Array.isArray(region.rows)) return region;
      
      const sortedRows = [...region.rows].sort((a: any, b: any) => {
        const aVal = a[sortField] || 0;
        const bVal = b[sortField] || 0;
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
      
      return { ...region, rows: sortedRows };
    });
  }, [regionalData, sortField, sortOrder]);

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

  return (
    <Layout>
      <div className="space-y-8">
        <div className="relative rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-primary/10 p-4 sm:p-6 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight">Regiones Estratégicas</h2>
              <p className="text-sm text-muted-foreground mt-1">Análisis de rendimiento por región geográfica</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">USD Cerrados por Region - Ultimos 5Q</CardTitle>
              </div>
              <CardDescription>Evolucion de ingresos por region en los ultimos 5 trimestres</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(() => {
                    if (!quarterlyRegionComparison) return [];
                    const qc = quarterlyRegionComparison as any;
                    const quarters = qc.quarters || [];
                    const regions = qc.regions || [];
                    if (!quarters.length || !regions.length) return [];
                    return quarters.map((q: string) => {
                      const point: Record<string, any> = { quarter: q };
                      regions.forEach((r: any) => {
                        const qData = r.data?.find((d: any) => d.quarter === q);
                        point[r.region] = qData?.revenue || 0;
                      });
                      return point;
                    });
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, '']} 
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="Colombia" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} />
                    <Line type="monotone" dataKey="Argentina" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
                    <Line type="monotone" dataKey="Mexico" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} />
                    <Line type="monotone" dataKey="Brasil" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} />
                    <Line type="monotone" dataKey="España" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} />
                    <Line type="monotone" dataKey="Rest Latam" stroke="#6b7280" strokeWidth={2.5} dot={{ r: 4, fill: '#6b7280' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-base">Ciclo de Ventas por Region</CardTitle>
              </div>
              <CardDescription>Promedio de dias para cerrar (deals ganados)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesCycleByRegion} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis dataKey="region" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={85} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`${value} dias`, 'Ciclo Promedio']} 
                    />
                    <Bar dataKey="avgDays" radius={[0, 6, 6, 0]}>
                      {salesCycleByRegion?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={REGION_COLORS[entry.region] || '#6b7280'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Top 5 Origenes por Region</CardTitle>
            </div>
            <CardDescription>Origenes con mayor revenue por cada celula</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {topOriginsByRegion.map((region: any) => (
                <div key={region.region} className={`rounded-lg border p-3 ${REGION_BG_COLORS[region.region] || 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-current/10">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: REGION_COLORS[region.region] || '#6b7280' }}></div>
                    <h4 className="font-semibold text-sm">{region.region}</h4>
                  </div>
                  <div className="space-y-2">
                    {region.origins?.slice(0, 5).map((origin: any, idx: number) => (
                      <div key={`${region.region}-${origin.origin}-${idx}`} className="flex justify-between text-xs gap-2">
                        <span className="truncate text-muted-foreground" title={origin.origin}>{origin.origin}</span>
                        <span className="font-semibold text-foreground whitespace-nowrap">${origin.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <CardTitle className="text-lg">Comparativo Ultimos 5 Trimestres por Region</CardTitle>
            <CardDescription>Reuniones, Logos Vendidos y USD Total</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[120px] font-semibold">Region</TableHead>
                    {quarterlyRegionComparison?.quarters?.map((q: string) => (
                      <TableHead key={q} className="text-center font-semibold border-l" colSpan={3}>
                        {q}
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow className="bg-muted/20">
                    <TableHead></TableHead>
                    {quarterlyRegionComparison?.quarters?.map((q: string) => (
                      <React.Fragment key={`sub-${q}`}>
                        <TableHead className="text-right text-xs font-medium text-blue-600 dark:text-blue-400 border-l">Reuniones</TableHead>
                        <TableHead className="text-right text-xs font-medium text-amber-600 dark:text-amber-400">Logos</TableHead>
                        <TableHead className="text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">USD</TableHead>
                      </React.Fragment>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quarterlyRegionComparison?.regions?.map((region: any, idx: number) => (
                    <TableRow key={region.region} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: REGION_COLORS[region.region] || '#6b7280' }}></div>
                          {region.region}
                        </div>
                      </TableCell>
                      {region.data?.map((d: any) => (
                        <React.Fragment key={`${region.region}-${d.quarter}`}>
                          <TableCell className="text-right border-l tabular-nums">{d.meetings}</TableCell>
                          <TableCell className="text-right tabular-nums">{d.logos}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums text-emerald-700 dark:text-emerald-400">${d.revenue.toLocaleString()}</TableCell>
                        </React.Fragment>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <CardTitle className="text-lg">Metricas por Region Estrategica</CardTitle>
            <CardDescription>Analisis de conversion por celula y origen</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b-2 bg-muted/30">
                    <TableHead className="w-[180px] font-semibold">Celulas x Region</TableHead>
                    <TableHead className="w-[220px] font-semibold">Origen</TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 select-none font-semibold"
                      onClick={() => handleSort('meetings')}
                    >
                      <div className="flex items-center justify-end">
                        Reuniones {getSortIcon('meetings')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 select-none font-semibold"
                      onClick={() => handleSort('proposals')}
                    >
                      <div className="flex items-center justify-end">
                        Propuesta {getSortIcon('proposals')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 select-none font-semibold"
                      onClick={() => handleSort('closings')}
                    >
                      <div className="flex items-center justify-end">
                        Cierre {getSortIcon('closings')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-semibold">Conversion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRegionalData.map((region: any, index: number) => {
                    if (region.rows && Array.isArray(region.rows)) {
                      return (
                        <React.Fragment key={region.region}>
                          {region.rows.map((row: any, rowIndex: number) => (
                            <TableRow 
                              key={`${region.region}-${row.origin}`} 
                              className={`hover:bg-muted/30 ${rowIndex === 0 ? 'border-t-2' : ''}`}
                            >
                              <TableCell className="font-medium align-top">
                                {rowIndex === 0 ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: REGION_COLORS[region.region] || '#6b7280' }}></div>
                                    <span className="font-semibold">{region.region}</span>
                                  </div>
                                ) : ""}
                              </TableCell>
                              <TableCell className="text-sm">{row.origin}</TableCell>
                              <TableCell className="text-right tabular-nums">{row.meetings}</TableCell>
                              <TableCell className="text-right tabular-nums">{row.proposals}</TableCell>
                              <TableCell className="text-right tabular-nums font-medium">{row.closings}</TableCell>
                              <TableCell className="text-right">
                                {row.meetings > 0 && (
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      (row.closings / row.meetings) >= 0.15 
                                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700" 
                                        : (row.closings / row.meetings) >= 0.05 
                                          ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                                    }
                                  >
                                    {((row.closings / row.meetings) * 100).toFixed(1)}%
                                  </Badge>
                                )}
                                {row.meetings === 0 && (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    }
                    return null;
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <CardTitle className="text-lg">Ingresos por Region Estrategica</CardTitle>
            <CardDescription>Volumen de negocio en reuniones, propuestas y cierres (USD)</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b-2 bg-muted/30">
                    <TableHead className="w-[180px] font-semibold">Celulas x Region</TableHead>
                    <TableHead className="w-[220px] font-semibold">Origen</TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 select-none font-semibold"
                      onClick={() => handleSort('meetingsValue')}
                    >
                      <div className="flex items-center justify-end">
                        Reuniones ($) {getSortIcon('meetingsValue')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 select-none font-semibold"
                      onClick={() => handleSort('proposalsValue')}
                    >
                      <div className="flex items-center justify-end">
                        Propuesta ($) {getSortIcon('proposalsValue')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 select-none font-semibold"
                      onClick={() => handleSort('closingsValue')}
                    >
                      <div className="flex items-center justify-end">
                        Cierre ($) {getSortIcon('closingsValue')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-semibold">Ticket Prom.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRegionalData.map((region: any, index: number) => {
                    if (region.rows && Array.isArray(region.rows)) {
                      return (
                        <React.Fragment key={`rev-${region.region}`}>
                          {region.rows.map((row: any, rowIndex: number) => (
                            <TableRow 
                              key={`rev-${region.region}-${row.origin}`} 
                              className={`hover:bg-muted/30 ${rowIndex === 0 ? 'border-t-2' : ''}`}
                            >
                              <TableCell className="font-medium align-top">
                                {rowIndex === 0 ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: REGION_COLORS[region.region] || '#6b7280' }}></div>
                                    <span className="font-semibold">{region.region}</span>
                                  </div>
                                ) : ""}
                              </TableCell>
                              <TableCell className="text-sm">{row.origin}</TableCell>
                              <TableCell className="text-right text-muted-foreground tabular-nums">
                                ${row.meetingsValue ? row.meetingsValue.toLocaleString() : "0"}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground tabular-nums">
                                ${row.proposalsValue ? row.proposalsValue.toLocaleString() : "0"}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                ${row.closingsValue ? row.closingsValue.toLocaleString() : "0"}
                              </TableCell>
                              <TableCell className="text-right">
                                {row.closings > 0 ? (
                                  <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-foreground tabular-nums">
                                    ${Math.round(row.closingsValue / row.closings).toLocaleString()}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    }
                    return null;
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
