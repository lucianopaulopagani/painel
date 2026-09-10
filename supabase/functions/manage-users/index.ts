// =============================================================================
// Edge Function "manage-users" — administração de usuários do sistema.
//
// Por que existe: criar/alterar/excluir usuários de autenticação e redefinir
// senhas exige a chave "service_role", que NUNCA pode ficar no frontend.
// Esta função roda no próprio projeto Supabase, onde a chave é injetada
// automaticamente como variável de ambiente.
//
// COMO IMPLANTAR (uma única vez, no seu projeto Supabase):
//  1) Abra o dashboard do seu projeto -> "Edge Functions" -> "Create a new function".
//  2) Dê o nome exato:  manage-users
//  3) Substitua o conteúdo pelo código deste arquivo e clique em "Deploy".
//  4) Pronto: o app já encontrará a função em
//     https://<seu-projeto-ref>.functions.supabase.co/manage-users
//
// As rotas são chamadas pelo frontend com supabase.functions.invoke(...) e o
// token do usuário logado é enviado automaticamente no header Authorization.
// Somente perfis com papel "admin" têm permissão de executar as ações.
// =============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const VALID_ROLES = ["admin", "member"];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Verifica se o chamador (token do header Authorization) é administrador.
async function isAdmin(authorization: string | null): Promise<boolean> {
  if (!authorization || !authorization.startsWith("Bearer ")) return false;
  const token = authorization.replace("Bearer ", "");

  const caller = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await caller.from("profiles").select("role").maybeSingle();
  if (error || !data) return false;
  return data.role === "admin";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "Método não permitido." }, 405);
  }

  if (!(await isAdmin(req.headers.get("Authorization")))) {
    return json(
      { ok: false, error: "Somente administradores podem executar esta ação." },
      401
    );
  }

  try {
    const { action, ...payload } = await req.json();

    switch (action) {
      case "create-user": {
        const { email, password, full_name, role = "member", department_id } = payload;
        if (!email || !password || !full_name) {
          return json({ ok: false, error: "Informe nome, e-mail e senha." });
        }
        if (typeof password !== "string" || password.length < 6) {
          return json({ ok: false, error: "A senha deve ter pelo menos 6 caracteres." });
        }
        if (!VALID_ROLES.includes(role)) {
          return json({ ok: false, error: "Papel inválido." });
        }

        const { data: created, error: createError } =
          await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
          });
        if (createError) return json({ ok: false, error: createError.message });

        const { error: profileError } = await admin.from("profiles").insert({
          id: created.user.id,
          email,
          full_name,
          role,
          department_id: department_id ?? null,
        });
        if (profileError) {
          await admin.auth.admin.deleteUser(created.user.id);
          return json({ ok: false, error: profileError.message });
        }
        return json({ ok: true, user_id: created.user.id });
      }

      case "update-user": {
        const { id, full_name, email, role, department_id } = payload;
        if (!id) return json({ ok: false, error: "Usuário não informado." });
        if (role !== undefined && !VALID_ROLES.includes(role)) {
          return json({ ok: false, error: "Papel inválido." });
        }

        const authUpdate: Record<string, unknown> = {};
        if (email !== undefined) authUpdate.email = email;
        if (Object.keys(authUpdate).length > 0) {
          const { error: authError } = await admin.auth.admin.updateUserById(id, authUpdate);
          if (authError) return json({ ok: false, error: authError.message });
        }

        const profileUpdate: Record<string, unknown> = {};
        if (full_name !== undefined) profileUpdate.full_name = full_name;
        if (role !== undefined) profileUpdate.role = role;
        if (department_id !== undefined) profileUpdate.department_id = department_id;
        if (email !== undefined) profileUpdate.email = email;
        if (Object.keys(profileUpdate).length > 0) {
          const { error: profileError } = await admin
            .from("profiles")
            .update(profileUpdate)
            .eq("id", id);
          if (profileError) return json({ ok: false, error: profileError.message });
        }
        return json({ ok: true });
      }

      case "reset-password": {
        const { id, password } = payload;
        if (!id || !password) {
          return json({ ok: false, error: "Usuário e nova senha são obrigatórios." });
        }
        if (typeof password !== "string" || password.length < 6) {
          return json({ ok: false, error: "A senha deve ter pelo menos 6 caracteres." });
        }
        const { error } = await admin.auth.admin.updateUserById(id, { password });
        if (error) return json({ ok: false, error: error.message });
        return json({ ok: true });
      }

      case "delete-user": {
        const { id } = payload;
        if (!id) return json({ ok: false, error: "Usuário não informado." });
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) return json({ ok: false, error: error.message });
        return json({ ok: true });
      }

      default:
        return json({ ok: false, error: "Ação desconhecida." }, 400);
    }
  } catch (err) {
    console.error("manage-users error:", err);
    return json({ ok: false, error: "Erro interno do servidor." }, 500);
  }
});
