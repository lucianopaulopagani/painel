-- =============================================================================
-- Sistema de Acesso por Departamento — Esquema inicial
--
-- COMO USAR:
--  1) Abra o dashboard do seu projeto Supabase.
--  2) Vá em "SQL Editor" -> "New query".
--  3) Cole este script inteiro e clique em "Run".
--  4) (Opcional, para criar o primeiro admin) siga as instruções no final.
-- =============================================================================

-- 1) Helper que verifica se o usuário autenticado é administrador.
--    (security definer evita recursão das políticas de RLS)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 2) Tabela de departamentos (leitura pública na tela de seleção)
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.departments enable row level security;

drop policy if exists "departments_read" on public.departments;
create policy "departments_read" on public.departments
  for select using (true);

drop policy if exists "departments_admin_all" on public.departments;
create policy "departments_admin_all" on public.departments
  for all using (public.is_admin()) with check (public.is_admin());

-- 3) Tabela de perfis: vincula auth.users ao departamento e ao papel
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  department_id uuid references public.departments(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- usuário lê apenas o próprio perfil
drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own" on public.profiles
  for select using (auth.uid() = id);

-- admin lê todos os perfis
drop policy if exists "profiles_read_admin" on public.profiles;
create policy "profiles_read_admin" on public.profiles
  for select using (public.is_admin());

-- admin gerencia todos os perfis (criar/editar/excluir)
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- =============================================================================
-- PASSO OPCIONAL: criar o primeiro usuário administrador
--
--  1) Crie o usuário no dashboard: Authentication -> Users -> Add user
--     (informe e-mail e senha).
--  2) Copie o UUID do usuário criado.
--  3) Execute os comandos abaixo no SQL Editor, substituindo os valores
--     entre colchetes:
--
--     insert into public.departments (name, description)
--     values ('Administração', 'Departamento administrativo')
--     returning id;
--
--     insert into public.profiles (id, email, full_name, role, department_id)
--     values (
--       '<UUID_DO_USUARIO>',
--       '<EMAIL_DO_USUARIO>',
--       '<NOME_COMPLETO>',
--       'admin',
--       '<UUID_DO_DEPARTAMENTO_RETORNADO_ACIMA>'
--     );
--
--  Depois disso, selecione o departamento "Administração" na tela inicial
--  e entre com o e-mail/senha desse usuário.
-- =============================================================================
