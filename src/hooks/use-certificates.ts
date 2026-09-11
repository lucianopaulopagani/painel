import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Certificate } from "@/lib/types";

export const certificatesKeys = {
  all: ["certificates"] as const,
};

export function useCertificates() {
  return useQuery({
    queryKey: certificatesKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase.from("certificates").select("*");
      if (error) throw error;
      return data as Certificate[];
    },
  });
}

export interface CertificateInput {
  company_id: string;
  vencimento: string | null;
  avisado: boolean | null;
  agendamento_at: string | null;
  observacoes: string | null;
  produtos: string[];
}

/** Cria ou atualiza o certificado da empresa (um por empresa). */
export function useUpsertCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CertificateInput) => {
      const { error } = await supabase.from("certificates").upsert(
        {
          ...input,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id" }
      );
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: certificatesKeys.all }),
  });
}
