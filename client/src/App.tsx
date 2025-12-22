import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
import Regiones from "@/pages/regiones";
import ReunionesDirecto from "@/pages/reuniones-directo";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/regiones" component={Regiones} />
      <Route path="/reuniones-directo" component={ReunionesDirecto} />
      <Route path="/configuracion" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
