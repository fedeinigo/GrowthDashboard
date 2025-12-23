import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ArrowLeft, Users, Building2, Save, UserPlus, X, Plus, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Team {
  id: number;
  name: string;
  displayName: string;
}

interface Person {
  id: number;
  name: string;
  displayName: string;
  teamId: number | null;
  pipedriveUserId?: number | null;
}

async function fetchTeams(): Promise<Team[]> {
  const res = await fetch("/api/teams");
  if (!res.ok) throw new Error("Failed to fetch teams");
  return res.json();
}

async function fetchPeople(): Promise<Person[]> {
  const res = await fetch("/api/people");
  if (!res.ok) throw new Error("Failed to fetch people");
  return res.json();
}

async function fetchPeopleWithTeams(): Promise<Person[]> {
  const res = await fetch("/api/people/with-teams");
  if (!res.ok) throw new Error("Failed to fetch people with teams");
  return res.json();
}

async function updatePersonTeam(personId: number, teamId: number | null): Promise<void> {
  const res = await fetch(`/api/people/${personId}/team`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamId }),
  });
  if (!res.ok) throw new Error("Failed to update person team");
}

async function addPersonToTeam(pipedriveUserId: number, displayName: string, teamId: number): Promise<void> {
  const res = await fetch("/api/people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pipedriveUserId, displayName, teamId }),
  });
  if (!res.ok) throw new Error("Failed to add person to team");
}

async function createTeam(name: string, displayName: string): Promise<Team> {
  const res = await fetch("/api/teams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, displayName }),
  });
  if (!res.ok) throw new Error("Failed to create team");
  return res.json();
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [addingPerson, setAddingPerson] = useState<number | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [personPopoverOpen, setPersonPopoverOpen] = useState(false);
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDisplayName, setNewTeamDisplayName] = useState("");

  const teamsQuery = useQuery({ queryKey: ["teams"], queryFn: fetchTeams });
  const pipedriveUsersQuery = useQuery({ queryKey: ["people"], queryFn: fetchPeople });
  const peopleWithTeamsQuery = useQuery({ queryKey: ["people-with-teams"], queryFn: fetchPeopleWithTeams });

  const updateTeamMutation = useMutation({
    mutationFn: ({ personId, teamId }: { personId: number; teamId: number | null }) => 
      updatePersonTeam(personId, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people-with-teams"] });
      toast({ title: "Equipo actualizado", description: "El cambio se guardó correctamente." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar el equipo.", variant: "destructive" });
    },
  });

  const addPersonMutation = useMutation({
    mutationFn: ({ pipedriveUserId, displayName, teamId }: { pipedriveUserId: number; displayName: string; teamId: number }) =>
      addPersonToTeam(pipedriveUserId, displayName, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people-with-teams"] });
      setAddingPerson(null);
      setSelectedPerson("");
      toast({ title: "Persona agregada", description: "La persona fue agregada al equipo." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo agregar la persona.", variant: "destructive" });
    },
  });

  const removePersonMutation = useMutation({
    mutationFn: (personId: number) => updatePersonTeam(personId, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people-with-teams"] });
      toast({ title: "Persona removida", description: "La persona fue removida del equipo." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo remover la persona.", variant: "destructive" });
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: ({ name, displayName }: { name: string; displayName: string }) =>
      createTeam(name, displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setShowNewTeamForm(false);
      setNewTeamName("");
      setNewTeamDisplayName("");
      toast({ title: "Equipo creado", description: "El nuevo equipo fue creado correctamente." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear el equipo.", variant: "destructive" });
    },
  });

  const teams = teamsQuery.data || [];
  const pipedriveUsers = pipedriveUsersQuery.data || [];
  const peopleWithTeams = peopleWithTeamsQuery.data || [];

  const getTeamMembers = (teamId: number) => {
    return peopleWithTeams.filter(p => p.teamId === teamId);
  };

  const getAvailableUsers = () => {
    const assignedPipedriveIds = new Set(
      peopleWithTeams
        .filter(p => p.pipedriveUserId !== null && p.pipedriveUserId !== undefined)
        .map(p => p.pipedriveUserId)
    );
    return pipedriveUsers.filter(u => !assignedPipedriveIds.has(u.id));
  };

  const handleAddPerson = (teamId: number) => {
    if (!selectedPerson) return;
    const user = pipedriveUsers.find(u => u.id.toString() === selectedPerson);
    if (user) {
      addPersonMutation.mutate({ 
        pipedriveUserId: user.id, 
        displayName: user.displayName,
        teamId 
      });
    }
  };

  const handleCreateTeam = () => {
    if (!newTeamName.trim() || !newTeamDisplayName.trim()) return;
    createTeamMutation.mutate({
      name: newTeamName.toLowerCase().replace(/\s+/g, '_'),
      displayName: newTeamDisplayName.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
            <p className="text-muted-foreground text-sm">Gestiona equipos y asignación de personas</p>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Equipos y Personas
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Asigna personas de Pipedrive a los equipos internos para filtrar correctamente los datos del dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => {
            const members = getTeamMembers(team.id);
            const isAddingToThisTeam = addingPerson === team.id;

            return (
              <Card key={team.id} data-testid={`card-team-${team.id}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      {team.displayName}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {members.length} miembros
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {members.map(member => (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                        data-testid={`row-member-${member.id}`}
                      >
                        <span className="text-sm text-foreground">{member.displayName}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removePersonMutation.mutate(member.id)}
                          disabled={removePersonMutation.isPending}
                          data-testid={`button-remove-${member.id}`}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                        </Button>
                      </div>
                    ))}

                    {members.length === 0 && !isAddingToThisTeam && (
                      <p className="text-sm text-muted-foreground text-center py-2">Sin miembros asignados</p>
                    )}

                    {isAddingToThisTeam ? (
                      <div className="space-y-2 mt-3 pt-3 border-t">
                        <Popover open={personPopoverOpen} onOpenChange={setPersonPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={personPopoverOpen}
                              className="w-full justify-between"
                              data-testid={`select-person-${team.id}`}
                            >
                              {selectedPerson
                                ? pipedriveUsers.find(u => u.id.toString() === selectedPerson)?.displayName
                                : "Buscar persona..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[280px] p-0">
                            <Command>
                              <CommandInput placeholder="Escribir para buscar..." />
                              <CommandList>
                                <CommandEmpty>No se encontraron personas.</CommandEmpty>
                                <CommandGroup>
                                  {getAvailableUsers().map(user => (
                                    <CommandItem
                                      key={user.id}
                                      value={user.displayName}
                                      onSelect={() => {
                                        setSelectedPerson(user.id.toString());
                                        setPersonPopoverOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedPerson === user.id.toString() ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {user.displayName}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleAddPerson(team.id)}
                            disabled={!selectedPerson || addPersonMutation.isPending}
                            data-testid={`button-confirm-add-${team.id}`}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Guardar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => { setAddingPerson(null); setSelectedPerson(""); setPersonPopoverOpen(false); }}
                            data-testid={`button-cancel-add-${team.id}`}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => setAddingPerson(team.id)}
                        data-testid={`button-add-person-${team.id}`}
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Agregar persona
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Card para crear nuevo equipo */}
          <Card className="border-dashed border-2" data-testid="card-new-team">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <Plus className="h-4 w-4" />
                Nuevo Equipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showNewTeamForm ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="teamDisplayName">Nombre del equipo</Label>
                    <Input
                      id="teamDisplayName"
                      placeholder="Ej: Águilas"
                      value={newTeamDisplayName}
                      onChange={(e) => {
                        setNewTeamDisplayName(e.target.value);
                        setNewTeamName(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                      }}
                      data-testid="input-team-display-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamName" className="text-xs text-muted-foreground">ID interno (generado automáticamente)</Label>
                    <Input
                      id="teamName"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="text-sm"
                      data-testid="input-team-name"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={handleCreateTeam}
                      disabled={!newTeamName.trim() || !newTeamDisplayName.trim() || createTeamMutation.isPending}
                      data-testid="button-confirm-create-team"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Crear
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowNewTeamForm(false);
                        setNewTeamName("");
                        setNewTeamDisplayName("");
                      }}
                      data-testid="button-cancel-create-team"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowNewTeamForm(true)}
                  data-testid="button-show-new-team-form"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar nuevo equipo
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {teamsQuery.isLoading && (
          <div className="text-center py-12 text-muted-foreground">Cargando equipos...</div>
        )}
      </main>
    </div>
  );
}
