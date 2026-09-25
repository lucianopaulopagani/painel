import { useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Camera,
  ChevronDown,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Palette,
  RefreshCw,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/lib/theme-context";
import { APP_VERSION } from "@/lib/app-version";
import { fileToDataUrl, useUpdateOwnProfile } from "@/hooks/use-own-profile";
import { ChangePasswordDialog } from "@/components/user/ChangePasswordDialog";
import { getInitials } from "@/lib/utils";

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PanelHeader({ title, subtitle, children }: PanelHeaderProps) {
  const { profile, logout, refreshProfile } = useAuth();
  const { theme, themes, setThemeKey } = useTheme();
  const navigate = useNavigate();
  const photoMutation = useUpdateOwnProfile();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      await photoMutation.mutateAsync({ avatar_url: dataUrl });
      await refreshProfile();
      toast.success("Foto atualizada.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar a foto."
      );
    }
    event.target.value = "";
  };

  const handleRemovePhoto = async () => {
    try {
      await photoMutation.mutateAsync({ avatar_url: "" });
      await refreshProfile();
      toast.success("Foto removida.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao remover a foto."
      );
    }
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
          <a
            href="/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
            title="Abrir o Chat interno em nova janela"
          >
            <Button variant="ghost" size="sm" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
          </a>
          <a
            href="/agenda"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
            title="Abrir a Agenda em nova janela"
          >
            <Button variant="ghost" size="sm" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Agenda</span>
            </Button>
          </a>
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

          {profile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full outline-none ring-ring focus-visible:ring-2"
                  title={profile.full_name}
                >
                  <Avatar className="h-8 w-8">
                    {profile.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="truncate">
                  {profile.full_name}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => fileRef.current?.click()}>
                  <Camera className="h-4 w-4" />
                  Alterar foto
                </DropdownMenuItem>
                {profile.avatar_url && (
                  <DropdownMenuItem onClick={handleRemovePhoto}>
                    <Trash2 className="h-4 w-4" />
                    Remover foto
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
                  <KeyRound className="h-4 w-4" />
                  Alterar senha
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <Star className="h-4 w-4" />
                  Versão Atual: {APP_VERSION}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
      </div>

      <ChangePasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
      />
    </header>
  );
}
