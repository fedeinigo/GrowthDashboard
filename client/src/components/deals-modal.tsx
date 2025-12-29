import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, FileX, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Deal {
  id: number;
  title: string;
  value: number;
  currency: string;
  status: string;
  personName: string;
  teamName: string;
  createdDate: string;
  wonDate: string | null;
  lostDate: string | null;
}

interface DealsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: string;
  metricTitle: string;
  filters: Record<string, any>;
}

const ITEMS_PER_PAGE = 10;

const metricTitles: Record<string, string> = {
  revenue: "Deals Ganados (Revenue)",
  closureRate: "Deals Cerrados (Tasa de Cierre)",
  meetings: "Tarjetas NC Creadas",
  logos: "Logos Ganados",
  avgSalesCycle: "Deals con Ciclo de Venta",
  avgTicket: "Deals Ganados (Ticket Promedio)",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  won: { label: "Ganado", variant: "default" },
  lost: { label: "Perdido", variant: "destructive" },
  open: { label: "Abierto", variant: "secondary" },
};

export function DealsModal({ isOpen, onClose, metricType, metricTitle, filters }: DealsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const queryParams = new URLSearchParams();
  if (filters.startDate) queryParams.set("startDate", filters.startDate);
  if (filters.endDate) queryParams.set("endDate", filters.endDate);
  if (filters.countries?.length) queryParams.set("countries", filters.countries.join(","));
  if (filters.sources?.length) queryParams.set("sources", filters.sources.join(","));
  // Support multi-select format (teams/people arrays)
  if (filters.teams?.length) queryParams.set("teamIds", filters.teams.join(","));
  if (filters.people?.length) queryParams.set("personIds", filters.people.join(","));
  if (filters.dealType) queryParams.set("dealType", filters.dealType);
  queryParams.set("metricType", metricType);

  const { data: deals, isLoading, isError } = useQuery<Deal[]>({
    queryKey: ["deals-modal", metricType, filters],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/deals?${queryParams.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch deals");
      }
      return response.json();
    },
    enabled: isOpen,
  });

  const filteredDeals = useMemo(() => {
    if (!deals) return [];
    if (!searchQuery.trim()) return deals;
    
    const query = searchQuery.toLowerCase();
    return deals.filter(deal =>
      deal.title.toLowerCase().includes(query) ||
      deal.personName.toLowerCase().includes(query) ||
      deal.teamName.toLowerCase().includes(query)
    );
  }, [deals, searchQuery]);

  const totalPages = Math.ceil(filteredDeals.length / ITEMS_PER_PAGE);
  const paginatedDeals = filteredDeals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: es });
    } catch {
      return "-";
    }
  };

  const getDisplayDate = (deal: Deal) => {
    if (metricType === "revenue" || metricType === "logos" || metricType === "avgTicket" || metricType === "avgSalesCycle") {
      return formatDate(deal.wonDate);
    }
    if (metricType === "closureRate") {
      return formatDate(deal.wonDate || deal.lostDate);
    }
    return formatDate(deal.createdDate);
  };

  const handleClose = () => {
    setSearchQuery("");
    setCurrentPage(1);
    onClose();
  };

  const exportToCSV = () => {
    if (!filteredDeals.length) return;
    
    const headers = ["Nombre", "Valor", "Moneda", "Estado", "Equipo", "Vendedor", "Fecha"];
    const rows = filteredDeals.map(deal => [
      `"${deal.title.replace(/"/g, '""')}"`,
      deal.value,
      deal.currency || "USD",
      statusLabels[deal.status]?.label || deal.status,
      `"${deal.teamName.replace(/"/g, '""')}"`,
      `"${deal.personName.replace(/"/g, '""')}"`,
      getDisplayDate(deal),
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${metricTitles[metricType] || metricTitle}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-4xl max-h-[85vh] flex flex-col"
        data-testid="deals-modal"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle data-testid="deals-modal-title">
                {metricTitles[metricType] || metricTitle}
              </DialogTitle>
              <DialogDescription>
                Mostrando hasta 100 deals más recientes
              </DialogDescription>
            </div>
            {filteredDeals.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToCSV}
                className="gap-2"
                data-testid="deals-modal-export"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, vendedor o equipo..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
            data-testid="deals-modal-search"
          />
        </div>

        <ScrollArea className="flex-1 min-h-0">
          {isLoading ? (
            <div className="space-y-3" data-testid="deals-modal-loading">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-12 w-32" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div 
              className="flex flex-col items-center justify-center py-12 text-center"
              data-testid="deals-modal-error"
            >
              <FileX className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Error al cargar los deals</p>
            </div>
          ) : filteredDeals.length === 0 ? (
            <div 
              className="flex flex-col items-center justify-center py-12 text-center"
              data-testid="deals-modal-empty"
            >
              <FileX className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No se encontraron deals que coincidan con la búsqueda" : "No hay deals disponibles"}
              </p>
            </div>
          ) : (
            <Table data-testid="deals-modal-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Nombre</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDeals.map((deal) => {
                  const statusInfo = statusLabels[deal.status] || { label: deal.status, variant: "outline" as const };
                  return (
                    <TableRow key={deal.id} data-testid={`deal-row-${deal.id}`}>
                      <TableCell className="font-medium max-w-[250px] truncate" title={deal.title}>
                        {deal.title}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        {formatCurrency(deal.value, deal.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant} data-testid={`deal-status-${deal.id}`}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[100px] truncate" title={deal.teamName}>
                        {deal.teamName}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate" title={deal.personName}>
                        {deal.personName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getDisplayDate(deal)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        {filteredDeals.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredDeals.length)} de {filteredDeals.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                data-testid="deals-modal-prev"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex items-center px-3 text-sm">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                data-testid="deals-modal-next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
