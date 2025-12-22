import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">WiseCX Growth Dashboard</CardTitle>
          <CardDescription className="mt-2">
            Dashboard de metricas comerciales del equipo Growth
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>Inicia sesion con tu cuenta de Google corporativa</p>
            <p className="mt-1 font-medium text-primary">Solo usuarios @wisecx.com</p>
          </div>
          
          <Button 
            onClick={handleLogin} 
            className="w-full h-12 text-base gap-2"
            data-testid="button-login"
          >
            <LogIn className="w-5 h-5" />
            Iniciar Sesion con Google
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Al iniciar sesion, aceptas las politicas de uso interno de WiseCX
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
