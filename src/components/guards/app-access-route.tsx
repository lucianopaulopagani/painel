import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/context/auth";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { hasAppAccess, type AppAccessKey } from "@/lib/app-access";

interface AppAccessRouteProps {
  /** Aplicativo exigido pela rota (Chat, Tarefas ou Agenda). */
  app: AppAccessKey;
  children: ReactNode;
}

/**
 * Exige usuário autenticado e a liberação do aplicativo no cadastro de
 * usuários. Sem a liberação, o usuário volta para o seu painel.
 */
export default function AppAccessRoute({
  app,
  children,
}: AppAccessRouteProps) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!session || !profile) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  if (!hasAppAccess(profile, app)) {
    return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
}
