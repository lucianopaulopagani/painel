# Sistema de Acesso por Departamento

## Contexto

Criar um sistema em que o acesso é controlado por departamento:

1. Primeira tela: o usuário **escolhe o departamento**.
2. Em seguida: **login** (e-mail + senha) usando autenticação do Supabase.
3. O perfil do usuário define a **qual departamento ele pertence**; se o departamento escolhido não for o dele, o acesso é bloqueado.
4. Um usuário com papel **admin** gerencia **departamentos** e **usuários** (criar usuário com e-mail/senha, vincular a um departamento).
5. Após login, o usuário entra no **painel do departamento** (por enquanto uma base/placeholder, pois as funcionalidades específicas serão descritas pelo usuário depois).

**Backend:** o projeto Supabase **existente do usuário** (supabase.com). O pacote `@supabase/supabase-js` já está instalado. Não serão usadas variáveis de ambiente `VITE_*` (não suportadas) — as credenciais públicas (URL + anon key) ficam num arquivo de configuração.

## Decisões acordadas

- Usar o **projeto Supabase próprio** do usuário (URL + anon key fornecidas por ele).
- Papel **admin separado** (perfil com `role = 'admin'`) com painel próprio.
- Admin **cria usuários novos** (nome, e-mail, senha, departamento).
- Painel do departamento: **placeholder extensível** (funcionalidades serão descritas depois).

## Arquitetura / Fluxo

```
/                    → Seleção de departamento (lista pública de "departments")
/login/:departmentId → Login (e-mail + senha) + validação de vínculo com o departamento
/app                 → Painel do departamento (protegido; placeholder para funcionalidades futuras)
/admin               → Painel admin (protegido por papel admin): abas "Departamentos" e "Usuários"
```

**Regra de acesso:** após `signInWithPassword`, busca o perfil (`profiles`). Se `profile.department_id !== departmentId` escolhido → bloqueia com mensagem clara e oferece ir ao departamento correto. Se não houver perfil → bloqueia com "contate o administrador".

**Estado de auth:** `AuthProvider` escutando `supabase.auth.onAuthStateChange`, expõe sessão, perfil e métodos `login`/`logout`.

## Banco de dados (SQL que o usuário roda no seu projeto Supabase)

Arquivo: `supabase/migrations/0001_init.sql` (o usuário executa no SQL Editor do dashboard do Supabase).

```sql
-- helper anti-recursão de RLS
create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
alter table public.departments enable row level security;
-- leitura pública (necessária na tela de seleção, antes do login); escrita só admin
create policy "departments_read"  on public.departments for select using (true);
create policy "departments_admin_all" on public.departments for all using (public.is_admin()) with check (public.is_admin());

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'member' check (role in ('admin','member')),
  department_id uuid references public.departments(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
-- usuário lê o próprio perfil; admin lê/gerencia todos (bloqueia auto-promoção)
create policy "profiles_read_own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles_read_admin" on public.profiles for select using (public.is_admin());
create policy "profiles_admin_all"  on public.profiles for all using (public.is_admin()) with check (public.is_admin());
```

Instruções de execução e comentários ficam no topo do próprio arquivo SQL.

## Função de backend (Edge Function) — única peça que o usuário implanta

Criar usuário com e-mail/senha pelo frontend **não é possível** com a anon key (segurança do Supabase). A criação de usuários exige o `service_role_key`, que **nunca** deve ir para o frontend. Solução: uma Edge Function que roda no próprio projeto Supabase (o `service_role_key` é injetado automaticamente nela).

Arquivo: `supabase/functions/manage-users/index.ts` — o usuário cria a função no dashboard do Supabase (Functions → Create), cola o código e deploya (a URL fica `https://<projeto>.functions.supabase.co/manage-users`).

Rotas da função (chamadas via `supabase.functions.invoke('manage-users')`):
- `create-user` — valida que o chamador é admin (lendo o token Bearer), cria usuário com `auth.admin.createUser` e insere o `profiles` correspondente.
- `delete-user` — remove usuário (`auth.admin.deleteUser`; perfil remove em cascata).
- `reset-password` — define nova senha do usuário.
- `update-user` — altera nome/role/departamento via `auth.admin.updateUserById` + update no `profiles`.

A alteração de perfil (nome/role/departamento) e o CRUD de departamentos pelo admin também podem ser feitos direto via cliente (RLS admin). A Edge Function fica responsável **só** pelo que exige `service_role`: criar/excluir usuário de autenticação e resetar senha.

## Frontend

Arquivos novos:
- `src/lib/supabase.ts` — cliente Supabase com constantes `SUPABASE_URL` / `SUPABASE_ANON_KEY` (marcadas para substituição pelos valores do projeto do usuário; anon key é pública).
- `src/lib/types.ts` — tipos `Department` e `Profile`.
- `src/context/auth.tsx` — `AuthProvider` + hook `useAuth` (sessão, perfil, login, logout, guardas).
- `src/hooks/use-departments.ts` e `src/hooks/use-users.ts` — hooks React Query (listar departamentos, listar/criar/atualizar/excluir usuários).
- `src/components/guards/protected-route.tsx` e `src/components/guards/admin-route.tsx` — rotas protegidas (sessão + papel).
- `src/pages/DepartmentSelection.tsx` — substitui `Index.tsx`: grade de cards dos departamentos; clique → `/login/:departmentId`.
- `src/pages/Login.tsx` — formulário e-mail/senha, valida vínculo com o departamento escolhido, trata erros (credenciais inválidas, departamento incompatível, perfil inexistente).
- `src/pages/app/DepartmentPanel.tsx` — painel protegido do departamento: cabeçalho com nome do usuário + departamento, botão logout e área placeholder para as funcionalidades a definir.
- `src/pages/admin/AdminPanel.tsx` — painel admin com abas:
  - **Departamentos:** listar, criar, editar, excluir.
  - **Usuários:** listar (com nome/departamento), criar (invoca edge function), editar vínculo/role, redefinir senha, excluir.

Arquivos alterados:
- `src/router.tsx` — adicionar rotas `/login/:departmentId`, `/app`, `/admin`.
- `src/pages/Index.tsx` — removido (substituído pela seleção de departamento).

Design: usar o design system existente (tokens em `index.css` + componentes shadcn). Durante a implementação, refinar tokens/estilos para uma tela de seleção de departamento e login bem apresentadas (responsivo mobile/desktop). Textos do novo fluxo em português.

## Passos manuais do usuário (no seu projeto Supabase)

1. Executar `supabase/migrations/0001_init.sql` no SQL Editor do dashboard.
2. Criar a Edge Function `manage-users` (colar `supabase/functions/manage-users/index.ts`) e clicar em Deploy.
3. Informar no chat a **Project URL** e a **anon key** (chave pública) do projeto para eu preencher `src/lib/supabase.ts`.
4. (Opcional) Criar o primeiro admin: na dashboard → Authentication → Users → Add user; depois no SQL Editor:
   `insert into public.profiles (id, full_name, role) values ('<uuid>', 'Administrador', 'admin');`

> Sem esses passos o app roda, mas login/lista de departamentos dependem do backend. A tela de seleção mostrará estado de erro/loading adequado enquanto não houver conexão.

## Implementation checklist

- [ ] Criar `src/lib/supabase.ts` com cliente Supabase (constantes URL/anon key preenchidas com os valores do usuário).
- [ ] Criar `src/lib/types.ts` com `Department` e `Profile`.
- [ ] Criar `src/context/auth.tsx`: sessão via `onAuthStateChange`, perfil carregado quando autenticado, métodos `login`, `logout`, `refreshProfile`.
- [ ] Criar hooks React Query `use-departments.ts` e `use-users.ts` (queryKeys estáveis, invalidação após mutações).
- [ ] Criar guardas `protected-route.tsx` (requer sessão + perfil) e `admin-route.tsx` (requer `role === 'admin'`).
- [ ] Criar `src/pages/DepartmentSelection.tsx` listando departamentos via hook; substituir `Index.tsx` (deletar o arquivo antigo).
- [ ] Criar `src/pages/Login.tsx`: login + validação `profile.department_id === departmentId`; erros claros para credencial inválida, departamento incompatível e perfil inexistente.
- [ ] Criar `src/pages/app/DepartmentPanel.tsx`: placeholder do painel com usuário/departamento/logout.
- [ ] Criar `src/pages/admin/AdminPanel.tsx` com abas Departamentos (CRUD) e Usuários (criar via edge function, editar vínculo/role, reset senha, excluir).
- [ ] Atualizar `src/router.tsx` com as novas rotas.
- [ ] Criar `supabase/migrations/0001_init.sql` e `supabase/functions/manage-users/index.ts` com instruções no topo.
- [ ] Refinar design tokens em `index.css` para tela de seleção/login/painéis (responsivo).

## Verification checklist

- [ ] `pnpm check` (lint + typecheck) e `pnpm run build` sem erros.
- [ ] Preview: `/` renderiza grade de departamentos (estado de erro/loading correto antes de o backend ser conectado).
- [ ] Seleção de departamento navega para `/login/:departmentId`.
- [ ] Login com credenciais válidas do departamento certo → redireciona para `/app`.
- [ ] Login de usuário cujo `department_id` difere do departamento escolhido → bloqueio com mensagem e opção de ir ao departamento correto.
- [ ] Login de usuário sem perfil → bloqueio com "contate o administrador".
- [ ] `/app` inacessível sem sessão (redireciona para `/`).
- [ ] `/admin` inacessível para `role = 'member'` (redireciona/bloqueia); acessível apenas para admin.
- [ ] Admin: criar departamento, editar e excluir refletem na lista da tela de seleção.
- [ ] Admin: criar usuário (via edge function) lista o novo usuário; editar departamento/role e redefinir senha funcionam; excluir remove o usuário.
- [ ] Visual responsivo verificado em mobile_390 e desktop_1280 na rota afetada.
