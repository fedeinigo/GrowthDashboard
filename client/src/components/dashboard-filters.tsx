import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Calendar as CalendarIcon, FilterX } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { fetchTeams, fetchPeople, fetchSources } from "@/lib/api";

interface DashboardFiltersProps {
  filters?: any;
  onFilterChange: (filters: any) => void;
}

export function DashboardFilters({ filters, onFilterChange }: DashboardFiltersProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 20),
    to: new Date(2025, 1, 9),
  });

  const [dateType, setDateType] = useState("range"); // "range", "quarter", or "year"

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

  // Transform API data to FilterOption format
  const teams: FilterOption[] = [
    { value: "all", label: "Todos los Equipos" },
    ...teamsData.map((team: any) => ({ value: team.id.toString(), label: team.displayName }))
  ];

  const people: FilterOption[] = [
    { value: "all", label: "Todas las Personas" },
    ...peopleData.map((person: any) => ({ value: person.id.toString(), label: person.displayName }))
  ];

  const sources: FilterOption[] = [
    { value: "all", label: "Todos los Orígenes" },
    ...sourcesData.map((source: any) => ({ value: source.id.toString(), label: source.displayName }))
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
           <Select defaultValue="range" onValueChange={setDateType}>
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
                  onSelect={setDate}
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
                  <Select defaultValue="q1" onValueChange={(val) => onFilterChange({ quarter: val })}>
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
                  <Select defaultValue={new Date().getFullYear().toString()} onValueChange={(val) => onFilterChange({ year: val })}>
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
                <Select defaultValue={new Date().getFullYear().toString()} onValueChange={(val) => onFilterChange({ year: val })}>
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
  
         {/* Source Filter */}
         <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Origen del Lead</label>
          <Select value={filters?.source || "all"} onValueChange={(val) => onFilterChange({ source: val })}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Seleccionar origen" />
            </SelectTrigger>
            <SelectContent>
              {sources.map((source: FilterOption) => (
                <SelectItem key={source.value} value={source.value}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
  
      </div>
    </div>
  );
}
