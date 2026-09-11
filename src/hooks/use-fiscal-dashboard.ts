import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface FiscalDashboardRow {
  company_id: string;
  numero: string | null;
  name: string;
  uf: string | null;
  situacao: string | null;
}

/**
 * Dados do dashboard geral: todas as empresas do departamento Fiscal com a
 * situação do mês de referência (disponível para qualquer usuário).
 */
export function useFiscalDashboard(mes: string) {
  return useQuery({
    queryKey: ["fiscal-dashboard", mes] as const,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_fiscal", { mes });
      if (error) throw error;
      return (data ?? []) as FiscalDashboardRow[];
    },
  });
}
