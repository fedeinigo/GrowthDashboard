import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Settings, label: "Configuración", href: "/settings" },
];

function SidebarContent() {
  const [location] = useLocation();

  return (
    <div className="flex flex-col h-full text-sidebar-foreground">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        {/* Placeholder for Logo - In real app use SVG */}
        <div className="flex items-center gap-2 font-heading font-bold text-xl tracking-tight text-white">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
            W
          </div>
          <span>wisecx</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group relative",
              isActive 
                ? "bg-sidebar-accent text-white shadow-sm" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
            )}>
              <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-sidebar-foreground/70 group-hover:text-white")} />
              {item.label}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50">
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-sidebar border-r border-sidebar-border shadow-xl z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="p-0 bg-sidebar border-sidebar-border w-64">
           <VisuallyHidden.Root>
             <SheetTitle>Navigation Menu</SheetTitle>
           </VisuallyHidden.Root>
           <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-secondary/30">
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 backdrop-blur-sm bg-background/80">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-heading font-bold text-foreground">Growth Dashboard</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Resumen de métricas comerciales</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
            </Button>
            <div className="h-8 w-[1px] bg-border mx-1" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">Franco Landoni</p>
                <p className="text-xs text-muted-foreground">Head of Growth</p>
              </div>
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>FL</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
