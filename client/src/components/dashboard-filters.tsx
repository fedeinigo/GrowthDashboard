import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { teams, people, sources, FilterOption } from "@/lib/mock-data";
import { useState } from "react";
import { es } from "date-fns/locale";

interface DashboardFiltersProps {
  onFilterChange: (filters: any) => void;
}

export function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 20),
    to: new Date(2025, 1, 9),
  });

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-card border border-border rounded-lg shadow-sm">
      
      {/* Date Picker */}
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

      {/* Team Filter */}
      <div className="flex-1 min-w-[200px]">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Equipo</label>
        <Select defaultValue="all" onValueChange={(val) => onFilterChange({ team: val })}>
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
      <div className="flex-1 min-w-[200px]">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Persona</label>
        <Select defaultValue="all" onValueChange={(val) => onFilterChange({ person: val })}>
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
       <div className="flex-1 min-w-[200px]">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Origen del Lead</label>
        <Select defaultValue="all" onValueChange={(val) => onFilterChange({ source: val })}>
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
  );
}
