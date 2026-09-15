import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/context/auth";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { hasEmpresasAccess } from "@/lib/empresas-permissions";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session || !profile) return <Navigate to="/" replace />;
  if (!hasEmpresasAccess(profile)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}
