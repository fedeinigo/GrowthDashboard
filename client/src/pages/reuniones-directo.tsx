import React, { useMemo, useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, Legend 
} from "recharts";
import { Loader2, Calendar, Users, DollarSign, TrendingUp } from "lucide-react";
import { KPICard } from "@/components/kpi-card";

interface DirectMeetingsData {
  weeklyMeetings: Array<{ week: string; count: number; value: number }>;
  byPerson: Array<{ name: string; meetings: number; value: number }>;
  byRegion: Array<{ region: string; meetings: number; value: number }>;
  totals: { meetings: number; value: number; avgTicket: number };
}

export default function ReunionesDirecto() {
  const { data, isLoading } = useQuery<DirectMeetingsData>({
    queryKey: ["/api/dashboard/direct-meetings"],
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
        <div>
          <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight">Reuniones Directo</h2>
          <p className="text-muted-foreground mt-1">Análisis de reuniones de origen directo (Inbound + Outbound)</p>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Reuniones Directas por Semana</CardTitle>
              <CardDescription>Evolución semanal de reuniones (últimas 12 semanas)</CardDescription>
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
