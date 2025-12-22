import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  Bell,
  Globe,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import wiseCxLogo from "@assets/logo_blanco_1766330983084.png";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Globe, label: "Regiones Estrategicas", href: "/regiones" },
  { icon: Calendar, label: "Reuniones Directo", href: "/reuniones-directo" },
  { icon: Settings, label: "Configuracion", href: "/configuracion" },
];

function SidebarContent({ onLogout, collapsed = false }: { onLogout?: () => void; collapsed?: boolean }) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col h-full text-sidebar-foreground">
      <div className={cn("h-16 flex items-center border-b border-sidebar-border", collapsed ? "px-3 justify-center" : "px-6")}>
        {collapsed ? (
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold text-sm">W</div>
        ) : (
          <img src={wiseCxLogo} alt="WiseCX" className="h-8 w-auto" />
        )}
      </div>

      <div className={cn("flex-1 py-6 space-y-1", collapsed ? "px-2" : "px-4")}>
        {navItems.map((item) => {
          const isActive = location === item.href;
          const linkContent = (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center rounded-md text-sm font-medium transition-all duration-200 group relative",
              collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
              isActive 
                ? "bg-sidebar-accent text-white shadow-sm" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
            )}>
              <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-sidebar-foreground/70 group-hover:text-white")} />
              {!collapsed && item.label}
              {isActive && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          );
          
          if (collapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-sidebar text-white border-sidebar-border">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }
          
          return linkContent;
        })}
      </div>

      <div className={cn("p-4 border-t border-sidebar-border", collapsed && "px-2")}>
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="w-full text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50"
                onClick={onLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-sidebar text-white border-sidebar-border">
              Cerrar Sesion
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50"
            onClick={onLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesion
          </Button>
        )}
      </div>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.email?.split('@')[0] || 'Usuario';
  
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : displayName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:block bg-sidebar border-r border-sidebar-border shadow-xl z-20 fixed h-screen transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent onLogout={logout} collapsed={isCollapsed} />
        
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-sidebar border border-sidebar-border rounded-full flex items-center justify-center text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent transition-colors shadow-md"
          data-testid="button-toggle-sidebar"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="p-0 bg-sidebar border-sidebar-border w-64">
           <VisuallyHidden.Root>
             <SheetTitle>Navigation Menu</SheetTitle>
           </VisuallyHidden.Root>
           <SidebarContent onLogout={logout} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 bg-secondary/30 transition-all duration-300",
        isCollapsed ? "md:ml-16" : "md:ml-64"
      )}>
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
              <p className="text-xs text-muted-foreground hidden sm:block">Resumen de metricas comerciales</p>
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
                <p className="text-sm font-medium text-foreground" data-testid="text-user-name">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
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
