import { createClient } from "@supabase/supabase-js";

/**
 * Configuração do cliente Supabase.
 *
 * IMPORTANTE: Preencha os dois valores abaixo com as credenciais do SEU
 * projeto Supabase (Dashboard -> Settings -> API):
 *   - SUPABASE_URL: Project URL (ex.: https://xyzcompany.supabase.co)
 *   - SUPABASE_ANON_KEY: anon public key (chave pública, pode ficar no app)
 *
 * A chave "service_role" NÃO deve nunca ser usada no frontend.
 */
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "SUA-ANON-KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
