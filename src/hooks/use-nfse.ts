import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export interface NfseConfiguracao {
  id: string;
  company_id: string;
  ambiente: "restrita" | "producao";
  certificado_path: string | null;
  certificado_nome: string | null;
  certificado_validade: string | null;
  certificado_titular: string | null;
  inscricao_municipal: string | null;
  codigo_municipio: string | null;
  codigo_servico: string | null;
  nbs: string | null;
  aliquota_iss: number;
  updated_at: string;
}

export interface NfseNota {
  id: string;
  company_id: string;
  numero: string | null;
  chave: string | null;
  status: string;
  tomador_nome: string | null;
  tomador_documento: string | null;
  valor: number | null;
  competencia: string | null;
  xml_path: string | null;
  mensagem: string | null;
  created_at: string;
}

export const nfseKeys = {
  configuracoes: ["nfse", "configuracoes"] as const,
  notas: ["nfse", "notas"] as const,
};

export function useNfseConfiguracoes() {
  return useQuery({
    queryKey: nfseKeys.configuracoes,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nfse_configuracoes")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NfseConfiguracao[];
    },
  });
}

export function useNfseNotas() {
  return useQuery({
    queryKey: nfseKeys.notas,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nfse_notas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as NfseNota[];
    },
  });
}

export interface CertificadoInput {
  company_id: string;
  pfx_base64: string;
  senha: string;
  certificado_nome: string;
  ambiente: "restrita" | "producao";
  inscricao_municipal?: string;
  codigo_municipio?: string;
  codigo_servico?: string;
  nbs?: string;
  aliquota_iss?: number;
}

/** Envia o .pfx para o backend, que valida a senha e guarda no bucket privado. */
export function useSalvarCertificado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CertificadoInput) => {
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        error?: string;
        titular?: string;
        validade?: string;
      }>("nfse-certificado", { body: input });

      if (error) {
        const contexto = (error as { context?: Response }).context;
        if (contexto && typeof contexto.json === "function") {
          try {
            const corpo = await contexto.json();
            throw new Error(corpo?.error ?? "Não foi possível salvar o certificado.");
          } catch (erroInterno) {
            if (erroInterno instanceof Error && erroInterno.message) {
              throw erroInterno;
            }
          }
        }
        throw new Error("Não foi possível salvar o certificado.");
      }

      if (!data?.ok) {
        throw new Error(data?.error ?? "Não foi possível salvar o certificado.");
      }
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: nfseKeys.configuracoes }),
  });
}
