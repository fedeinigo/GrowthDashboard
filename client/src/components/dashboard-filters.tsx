import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { format, formatDistanceToNow } from "date-fns";
import { Calendar as CalendarIcon, FilterX, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FilterOption } from "@/lib/mock-data";
import { useState, useEffect } from "react";
import { es } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTeams, fetchPeople, fetchSources, fetchDealTypes, fetchCountries, fetchCacheStatus, refreshCache } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";

// Helper to get current quarter dates
function getCurrentQuarterDates() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
  const quarterEndMonth = quarterStartMonth + 2;
  
  const startDate = new Date(currentYear, quarterStartMonth, 1);
  const endDate = new Date(currentYear, quarterEndMonth + 1, 0); // Last day of quarter
  
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

interface DashboardFiltersProps {
  filters?: any;
  onFilterChange: (filters: any) => void;
}

export function DashboardFilters({ filters, onFilterChange }: DashboardFiltersProps) {
  // Default to current quarter
  const currentQ = getCurrentQuarterDates();
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: currentQ.startDate,
    to: currentQ.endDate,
  });

  const [dateType, setDateType] = useState("quarter"); // Default to quarter
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Send initial quarter filter on mount - only if no date filters exist
  useEffect(() => {
    if (!filters?.startDate && !filters?.endDate) {
      const qDates = getQuarterDates(selectedQuarter, parseInt(selectedYear));
      onFilterChange({ 
        startDate: format(qDates.startDate, 'yyyy-MM-dd'),
        endDate: format(qDates.endDate, 'yyyy-MM-dd'),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch filter options from API
  const { data: teamsData = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });

  const { data: peopleData = [] } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
  });

  const { data: sourcesData = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: fetchSources,
  });

  const { data: dealTypesData = [] } = useQuery({
    queryKey: ['dealTypes'],
    queryFn: fetchDealTypes,
  });

  const { data: countriesData = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
  });

  const queryClient = useQueryClient();
  
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

  const countries: FilterOption[] = countriesData.map((c: any) => ({ value: c.id, label: c.label }));

  const handleCountryToggle = (countryId: string) => {
    const currentCountries = filters?.countries || [];
    const newCountries = currentCountries.includes(countryId)
      ? currentCountries.filter((c: string) => c !== countryId)
      : [...currentCountries, countryId];
    onFilterChange({ countries: newCountries.length > 0 ? newCountries : undefined });
  };

  const handleSourceToggle = (sourceId: string) => {
    const currentSources = filters?.sources || [];
    const newSources = currentSources.includes(sourceId)
      ? currentSources.filter((s: string) => s !== sourceId)
      : [...currentSources, sourceId];
    onFilterChange({ sources: newSources.length > 0 ? newSources : undefined });
  };

  // Transform API data to FilterOption format
  const teams: FilterOption[] = [
    { value: "all", label: "Todos los Equipos" },
    ...teamsData.map((team: any) => ({ value: team.id.toString(), label: team.displayName }))
  ];

  const people: FilterOption[] = [
    { value: "all", label: "Todas las Personas" },
    ...peopleData.map((person: any) => ({ value: person.id.toString(), label: person.displayName }))
  ];

  const sources: FilterOption[] = sourcesData.map((source: any) => ({ value: source.id.toString(), label: source.displayName }));

  const dealTypes: FilterOption[] = [
    { value: "all", label: "Todos los Tipos" },
    ...dealTypesData.map((dt: any) => ({ value: dt.id.toString(), label: dt.displayName }))
  ];

  const quarters = [
    { value: "q1", label: "Q1" },
    { value: "q2", label: "Q2" },
    { value: "q3", label: "Q3" },
    { value: "q4", label: "Q4" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i;
    return { value: year.toString(), label: year.toString() };
  });

  // Sync internal state with props if needed (optional for fully controlled)
  // For now we just use the props 'filters' to show active selections if we wanted to fully control inputs.
  // We'll keep inputs uncontrolled but trigger callbacks.

  return (
    <div className="flex flex-col gap-4">
      {/* Active Filters Display */}
      {filters && Object.keys(filters).length > 0 && (
         <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Filtros Activos:</span>
            {Object.entries(filters).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center bg-primary/10 text-primary text-xs px-2 py-1 rounded-full border border-primary/20">
                    <span className="font-semibold mr-1">{key === "companySize" ? "Tamaño Empresa" : key}:</span>
                    {value}
                    <button 
                        onClick={() => onFilterChange({ [key]: undefined })}
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
                onClick={() => onFilterChange({ reset: true })}
            >
                Limpiar todo
            </Button>
         </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 p-4 bg-card border border-border rounded-lg shadow-sm flex-wrap">
        
        {/* Date Type Selector */}
        <div className="flex-1 min-w-[140px] max-w-[180px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo de Fecha</label>
           <Select value={dateType} onValueChange={setDateType}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="range">Rango Específico</SelectItem>
              <SelectItem value="quarter">Trimestre (Q)</SelectItem>
              <SelectItem value="year">Año Completo</SelectItem>
            </SelectContent>
          </Select>
        </div>
  
        {/* Date Picker or Quarter/Year Selects */}
        {dateType === "range" && (
          <div className="flex-1 min-w-[240px]">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Rango de Fechas</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal bg-background hover:bg-accent/50",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "dd MMM", { locale: es })} -{" "}
                        {format(date.to, "dd MMM, yyyy", { locale: es })}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y", { locale: es })
                    )
                  ) : (
                    <span>Seleccionar fechas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate);
                    if (newDate?.from && newDate?.to) {
                      onFilterChange({
                        startDate: format(newDate.from, 'yyyy-MM-dd'),
                        endDate: format(newDate.to, 'yyyy-MM-dd'),
                      });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {dateType === "quarter" && (
          <>
              <div className="flex-1 min-w-[100px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Trimestre</label>
                  <Select value={selectedQuarter} onValueChange={(val) => {
                    setSelectedQuarter(val);
                    const qDates = getQuarterDates(val, parseInt(selectedYear));
                    onFilterChange({ 
                      startDate: format(qDates.startDate, 'yyyy-MM-dd'),
                      endDate: format(qDates.endDate, 'yyyy-MM-dd'),
                    });
                  }}>
                  <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Q" />
                  </SelectTrigger>
                  <SelectContent>
                      {quarters.map((q) => (
                      <SelectItem key={q.value} value={q.value}>
                          {q.label}
                      </SelectItem>
                      ))}
                  </SelectContent>
                  </Select>
              </div>
               <div className="flex-1 min-w-[100px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Año</label>
                  <Select value={selectedYear} onValueChange={(val) => {
                    setSelectedYear(val);
                    const qDates = getQuarterDates(selectedQuarter, parseInt(val));
                    onFilterChange({ 
                      startDate: format(qDates.startDate, 'yyyy-MM-dd'),
                      endDate: format(qDates.endDate, 'yyyy-MM-dd'),
                    });
                  }}>
                  <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                      {years.map((y) => (
                      <SelectItem key={y.value} value={y.value}>
                          {y.label}
                      </SelectItem>
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
                  setSelectedYear(val);
                  const yearNum = parseInt(val);
                  onFilterChange({ 
                    startDate: format(new Date(yearNum, 0, 1), 'yyyy-MM-dd'),
                    endDate: format(new Date(yearNum, 11, 31), 'yyyy-MM-dd'),
                  });
                }}>
                <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                    {years.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                        {y.label}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
        )}
  
        {/* Team Filter */}
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Equipo</label>
          <Select value={filters?.team || "all"} onValueChange={(val) => onFilterChange({ team: val })}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Seleccionar equipo" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team: FilterOption) => (
                <SelectItem key={team.value} value={team.value}>
                  {team.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
  
        {/* Person Filter */}
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Persona</label>
          <Select value={filters?.person || "all"} onValueChange={(val) => onFilterChange({ person: val })}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Seleccionar persona" />
            </SelectTrigger>
            <SelectContent>
              {people.map((person: FilterOption) => (
                <SelectItem key={person.value} value={person.value}>
                  {person.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
  
         {/* Source Filter - Multi-select */}
         <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Origen del Lead</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start bg-background font-normal">
                {filters?.sources && filters.sources.length > 0
                  ? `${filters.sources.length} origen${filters.sources.length > 1 ? 'es' : ''} seleccionado${filters.sources.length > 1 ? 's' : ''}`
                  : "Todos los orígenes"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <div className="max-h-[300px] overflow-y-auto p-2">
                {sources.map((source: FilterOption) => (
                  <div key={source.value} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer" onClick={() => handleSourceToggle(source.value)}>
                    <Checkbox
                      id={`source-${source.value}`}
                      checked={filters?.sources?.includes(source.value) || false}
                      onCheckedChange={() => handleSourceToggle(source.value)}
                    />
                    <label htmlFor={`source-${source.value}`} className="text-sm cursor-pointer flex-1">
                      {source.label}
                    </label>
                  </div>
                ))}
              </div>
              {filters?.sources && filters.sources.length > 0 && (
                <div className="border-t p-2">
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => onFilterChange({ sources: undefined })}>
                    Limpiar selección
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Deal Type Filter */}
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo de Deal</label>
          <Select value={filters?.dealType || "all"} onValueChange={(val) => onFilterChange({ dealType: val === "all" ? undefined : val })}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              {dealTypes.map((dt: FilterOption) => (
                <SelectItem key={dt.value} value={dt.value}>
                  {dt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Country Filter - Multi-select */}
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
                {countries.map((country: FilterOption) => (
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
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => onFilterChange({ countries: undefined })}>
                    Limpiar selección
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Refresh Data Button */}
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
            <span className="text-xs text-muted-foreground mt-1" data-testid="text-last-updated">
              Actualizado {formatDistanceToNow(new Date(cacheStatus.lastSyncAt), { addSuffix: true, locale: es })}
            </span>
          )}
        </div>
  
      </div>
    </div>
  );
}
