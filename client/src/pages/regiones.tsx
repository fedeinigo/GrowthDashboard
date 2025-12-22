import React, { useMemo, useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, Legend 
} from "recharts";
import { ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";

type SortField = "meetings" | "proposals" | "closings" | "meetingsValue" | "proposalsValue" | "closingsValue" | null;
type SortOrder = "asc" | "desc";

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
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight">Regiones Estratégicas</h2>
          <p className="text-muted-foreground mt-1">Análisis de rendimiento por región geográfica</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">USD Cerrados por Región - Últimos 5Q</CardTitle>
              <CardDescription>Evolución de ingresos por región en los últimos 5 trimestres</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="quarter" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="Colombia" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Argentina" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Mexico" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Brasil" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="España" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Rest Latam" stroke="#6b7280" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Ciclo de Ventas por Región</CardTitle>
              <CardDescription>Promedio de días para cerrar (deals ganados)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesCycleByRegion} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="region" type="category" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip formatter={(value: any) => [`${value} días`, 'Ciclo Promedio']} />
                    <Bar dataKey="avgDays" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Comparativo Últimos 5 Trimestres por Región</CardTitle>
              <CardDescription>Reuniones, Logos Vendidos y USD Total</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Región</TableHead>
                      {quarterlyRegionComparison?.quarters?.map((q: string) => (
                        <TableHead key={q} className="text-center" colSpan={3}>
                          {q}
                        </TableHead>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableHead></TableHead>
                      {quarterlyRegionComparison?.quarters?.map((q: string) => (
                        <React.Fragment key={`sub-${q}`}>
                          <TableHead className="text-right text-xs">Reuniones</TableHead>
                          <TableHead className="text-right text-xs">Logos</TableHead>
                          <TableHead className="text-right text-xs">USD</TableHead>
                        </React.Fragment>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quarterlyRegionComparison?.regions?.map((region: any) => (
                      <TableRow key={region.region}>
                        <TableCell className="font-medium">{region.region}</TableCell>
                        {region.data?.map((d: any) => (
                          <React.Fragment key={`${region.region}-${d.quarter}`}>
                            <TableCell className="text-right">{d.meetings}</TableCell>
                            <TableCell className="text-right">{d.logos}</TableCell>
                            <TableCell className="text-right">${d.revenue.toLocaleString()}</TableCell>
                          </React.Fragment>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Top 5 Orígenes por Región</CardTitle>
              <CardDescription>Orígenes con mayor revenue por cada célula</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {topOriginsByRegion.map((region: any) => (
                  <div key={region.region} className="space-y-2">
                    <h4 className="font-semibold text-sm border-b pb-1">{region.region}</h4>
                    {region.origins?.slice(0, 5).map((origin: any, idx: number) => (
                      <div key={`${region.region}-${origin.origin}-${idx}`} className="flex justify-between text-xs">
                        <span className="truncate max-w-[80px]" title={origin.origin}>{origin.origin}</span>
                        <span className="font-medium">${origin.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Métricas por Región Estratégica</CardTitle>
            <CardDescription>Análisis de conversión por célula y origen</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="w-[200px]">Células x Región</TableHead>
                  <TableHead className="w-[250px]">Origen</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('meetings')}
                  >
                    <div className="flex items-center justify-end">
                      Reuniones {getSortIcon('meetings')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('proposals')}
                  >
                    <div className="flex items-center justify-end">
                      Propuesta {getSortIcon('proposals')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('closings')}
                  >
                    <div className="flex items-center justify-end">
                      Cierre {getSortIcon('closings')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Conversión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRegionalData.map((region: any, index: number) => {
                  if (region.rows && Array.isArray(region.rows)) {
                    return (
                      <React.Fragment key={region.region}>
                        {region.rows.map((row: any, rowIndex: number) => (
                          <TableRow key={`${region.region}-${row.origin}`} className="hover:bg-muted/30 border-b">
                            <TableCell className={`font-medium align-top ${rowIndex === 0 ? "text-foreground" : ""}`}>
                              {rowIndex === 0 ? region.region : ""}
                            </TableCell>
                            <TableCell>{row.origin}</TableCell>
                            <TableCell className="text-right">{row.meetings}</TableCell>
                            <TableCell className="text-right">{row.proposals}</TableCell>
                            <TableCell className="text-right">{row.closings}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={row.closings > 0 ? "outline" : "secondary"} className={row.closings > 0 ? "border-emerald-200 text-emerald-700 bg-emerald-50" : ""}>
                                {row.meetings > 0 ? ((row.closings / row.meetings) * 100).toFixed(1) + "%" : "0%"}
                              </Badge>
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
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Ingresos por Región Estratégica</CardTitle>
            <CardDescription>Volumen de negocio en reuniones, propuestas y cierres (USD)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="w-[200px]">Células x Región</TableHead>
                  <TableHead className="w-[250px]">Origen</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('meetingsValue')}
                  >
                    <div className="flex items-center justify-end">
                      Reuniones ($) {getSortIcon('meetingsValue')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('proposalsValue')}
                  >
                    <div className="flex items-center justify-end">
                      Propuesta ($) {getSortIcon('proposalsValue')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('closingsValue')}
                  >
                    <div className="flex items-center justify-end">
                      Cierre ($) {getSortIcon('closingsValue')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Ticket Promedio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRegionalData.map((region: any, index: number) => {
                  if (region.rows && Array.isArray(region.rows)) {
                    return (
                      <React.Fragment key={`rev-${region.region}`}>
                        {region.rows.map((row: any, rowIndex: number) => (
                          <TableRow key={`rev-${region.region}-${row.origin}`} className="hover:bg-muted/30 border-b">
                            <TableCell className={`font-medium align-top ${rowIndex === 0 ? "text-foreground" : ""}`}>
                              {rowIndex === 0 ? region.region : ""}
                            </TableCell>
                            <TableCell>{row.origin}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              ${row.meetingsValue ? row.meetingsValue.toLocaleString() : "0"}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              ${row.proposalsValue ? row.proposalsValue.toLocaleString() : "0"}
                            </TableCell>
                            <TableCell className="text-right font-medium text-foreground">
                              ${row.closingsValue ? row.closingsValue.toLocaleString() : "0"}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-xs text-muted-foreground">
                                {row.closings > 0 ? "$" + Math.round(row.closingsValue / row.closings).toLocaleString() : "-"}
                              </span>
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
