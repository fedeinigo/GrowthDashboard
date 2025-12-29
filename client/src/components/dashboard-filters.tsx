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

// Derive quarter from a date string (YYYY-MM-DD) - parse directly to avoid timezone issues
function getQuarterFromDate(dateStr: string | undefined): string {
  if (!dateStr) return getCurrentQuarter();
  // Parse YYYY-MM-DD directly to avoid timezone conversion issues
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    return `q${Math.floor(month / 3) + 1}`;
  }
  return getCurrentQuarter();
}

function getYearFromDate(dateStr: string | undefined): string {
  if (!dateStr) return new Date().getFullYear().toString();
  // Parse YYYY-MM-DD directly to avoid timezone conversion issues
  const parts = dateStr.split('-');
  if (parts.length >= 1) {
    return parts[0];
  }
  return new Date().getFullYear().toString();
}

// Detect what type of date selection the current filters represent
function detectDateType(startDate: string | undefined, endDate: string | undefined): "quarter" | "year" | "range" {
  if (!startDate || !endDate) return "quarter";
  
  const startParts = startDate.split('-');
  const endParts = endDate.split('-');
  
  if (startParts.length < 3 || endParts.length < 3) return "range";
  
  const startYear = parseInt(startParts[0]);
  const startMonth = parseInt(startParts[1]);
  const startDay = parseInt(startParts[2]);
  const endYear = parseInt(endParts[0]);
  const endMonth = parseInt(endParts[1]);
  const endDay = parseInt(endParts[2]);
  
  // Check if it's a full year (Jan 1 to Dec 31)
  if (startMonth === 1 && startDay === 1 && endMonth === 12 && endDay === 31 && startYear === endYear) {
    return "year";
  }
  
  // Check if it's a standard quarter
  // Q1: Jan 1 - Mar 31, Q2: Apr 1 - Jun 30, Q3: Jul 1 - Sep 30, Q4: Oct 1 - Dec 31
  const quarterStarts = [
    { month: 1, day: 1 },   // Q1
    { month: 4, day: 1 },   // Q2
    { month: 7, day: 1 },   // Q3
    { month: 10, day: 1 },  // Q4
  ];
  const quarterEnds = [
    { month: 3, day: 31 },  // Q1
    { month: 6, day: 30 },  // Q2
    { month: 9, day: 30 },  // Q3
    { month: 12, day: 31 }, // Q4
  ];
  
  for (let q = 0; q < 4; q++) {
    if (
      startMonth === quarterStarts[q].month && 
      startDay === quarterStarts[q].day &&
      endMonth === quarterEnds[q].month && 
      endDay === quarterEnds[q].day &&
      startYear === endYear
    ) {
      return "quarter";
    }
  }
  
  return "range";
}

export function DashboardFilters({ filters, onFilterChange }: DashboardFiltersProps) {
  // Default to current quarter
  const currentQ = getCurrentQuarterDates();
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: currentQ.startDate,
    to: currentQ.endDate,
  });

  const [dateType, setDateType] = useState("quarter"); // Default to quarter
  
  // Derive selectedQuarter and selectedYear from filters to stay in sync
  const selectedQuarter = getQuarterFromDate(filters?.startDate);
  const selectedYear = getYearFromDate(filters?.startDate);

  // Send initial quarter filter on mount - only if no date filters exist
  useEffect(() => {
    if (!filters?.startDate && !filters?.endDate) {
      const qDates = getQuarterDates(getCurrentQuarter(), new Date().getFullYear());
      onFilterChange({ 
        startDate: format(qDates.startDate, 'yyyy-MM-dd'),
        endDate: format(qDates.endDate, 'yyyy-MM-dd'),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track if this is the initial mount to avoid double-triggering
  const [isInitialized, setIsInitialized] = useState(false);

  // Update filters when dateType changes (but not on initial mount)
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }
    const yearNum = parseInt(selectedYear);
    if (dateType === "quarter") {
      const qDates = getQuarterDates(selectedQuarter, yearNum);
      onFilterChange({ 
        startDate: format(qDates.startDate, 'yyyy-MM-dd'),
        endDate: format(qDates.endDate, 'yyyy-MM-dd'),
      });
    } else if (dateType === "year") {
      onFilterChange({ 
        startDate: format(new Date(yearNum, 0, 1), 'yyyy-MM-dd'),
        endDate: format(new Date(yearNum, 11, 31), 'yyyy-MM-dd'),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateType]);

  // Sync dateType state with actual filter values (handles external changes)
  useEffect(() => {
    if (filters?.startDate && filters?.endDate) {
      const detectedType = detectDateType(filters.startDate, filters.endDate);
      if (detectedType !== dateType) {
        setDateType(detectedType);
      }
      // Also sync the date range picker state
      if (detectedType === "range") {
        const startParts = filters.startDate.split('-');
        const endParts = filters.endDate.split('-');
        const fromDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
        const toDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
        setDate({ from: fromDate, to: toDate });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.startDate, filters?.endDate]);

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

  // Transform API data to FilterOption format (no "all" option for multi-select)
  const teams: FilterOption[] = teamsData.map((team: any) => ({ value: team.id.toString(), label: team.displayName }));
  const people: FilterOption[] = peopleData.map((person: any) => ({ value: person.id.toString(), label: person.displayName }));
  const allTeamIds = teams.map(t => t.value);
  const allPersonIds = people.map(p => p.value);

  const handleTeamToggle = (teamId: string) => {
    // When "all" is selected (undefined or empty), start from full list to deselect
    const isAllSelected = !filters?.teams || filters.teams.length === 0;
    const currentTeams = isAllSelected ? allTeamIds : filters.teams;
    
    const newTeams = currentTeams.includes(teamId)
      ? currentTeams.filter((t: string) => t !== teamId)
      : [...currentTeams, teamId];
    
    // If all teams are selected, reset to undefined (shows "All Teams")
    const allSelected = newTeams.length === allTeamIds.length || newTeams.length === 0;
    onFilterChange({ teams: allSelected ? undefined : newTeams });
  };

  const handlePersonToggle = (personId: string) => {
    // When "all" is selected (undefined or empty), start from full list to deselect
    const isAllSelected = !filters?.people || filters.people.length === 0;
    const currentPeople = isAllSelected ? allPersonIds : filters.people;
    
    const newPeople = currentPeople.includes(personId)
      ? currentPeople.filter((p: string) => p !== personId)
      : [...currentPeople, personId];
    
    // If all people are selected, reset to undefined (shows "All People")
    const allSelected = newPeople.length === allPersonIds.length || newPeople.length === 0;
    onFilterChange({ people: allSelected ? undefined : newPeople });
  };

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

  // Show current year and 5 years back (descending order)
  const years = Array.from({ length: 6 }, (_, i) => {
    const year = new Date().getFullYear() - i;
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
  
        {/* Team Filter - Multi-select */}
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Equipo</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start bg-background font-normal">
                {filters?.teams && filters.teams.length > 0 && filters.teams.length < teams.length
                  ? `${filters.teams.length} equipo${filters.teams.length > 1 ? 's' : ''}`
                  : "Todos los Equipos"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
              <div className="max-h-[300px] overflow-y-auto p-2">
                {teams.map((team: FilterOption) => (
                  <div key={team.value} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer">
                    <Checkbox
                      id={`team-${team.value}`}
                      checked={!filters?.teams || filters.teams.length === 0 || filters.teams.includes(team.value)}
                      onCheckedChange={() => handleTeamToggle(team.value)}
                    />
                    <label htmlFor={`team-${team.value}`} className="text-sm cursor-pointer flex-1">
                      {team.label}
                    </label>
                  </div>
                ))}
              </div>
              {filters?.teams && filters.teams.length > 0 && (
                <div className="border-t p-2">
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => onFilterChange({ teams: undefined })}>
                    Seleccionar todos
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
  
        {/* Person Filter - Multi-select */}
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Persona</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start bg-background font-normal">
                {filters?.people && filters.people.length > 0 && filters.people.length < people.length
                  ? `${filters.people.length} persona${filters.people.length > 1 ? 's' : ''}`
                  : "Todas las Personas"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="start">
              <div className="max-h-[300px] overflow-y-auto p-2">
                {people.map((person: FilterOption) => (
                  <div key={person.value} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer">
                    <Checkbox
                      id={`person-${person.value}`}
                      checked={!filters?.people || filters.people.length === 0 || filters.people.includes(person.value)}
                      onCheckedChange={() => handlePersonToggle(person.value)}
                    />
                    <label htmlFor={`person-${person.value}`} className="text-sm cursor-pointer flex-1">
                      {person.label}
                    </label>
                  </div>
                ))}
              </div>
              {filters?.people && filters.people.length > 0 && (
                <div className="border-t p-2">
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => onFilterChange({ people: undefined })}>
                    Seleccionar todos
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
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
                  <div key={source.value} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer">
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
