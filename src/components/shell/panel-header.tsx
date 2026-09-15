import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Palette, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/lib/theme-context";
import { getInitials } from "@/lib/utils";

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PanelHeader({ title, subtitle, children }: PanelHeaderProps) {
  const { profile, logout } = useAuth();
  const { theme, themes, setThemeKey } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-border">
            <img
              src="/brand/logo-panel-nova.png"
              alt="P4 Contabilidade"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{title}</div>
            {subtitle && (
              <div className="truncate text-xs text-muted-foreground">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {children}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                title="Tema do site"
              >
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">{theme.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {themes.map((option) => (
                <DropdownMenuItem
                  key={option.key}
                  onClick={() => setThemeKey(option.key)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/app" className="shrink-0">
            <Button variant="ghost" size="sm" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Meu painel</span>
            </Button>
          </Link>
          {(profile?.role === "admin" || profile?.empresas_access) && (
            <Link to="/admin" className="shrink-0">
              <Button variant="ghost" size="sm" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Administração</span>
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
          {profile && (
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </header>
  );
}
