import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/context/auth";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session || !profile) return <Navigate to="/" replace />;
  if (profile.role !== "admin") return <Navigate to="/app" replace />;
  return <>{children}</>;
}
