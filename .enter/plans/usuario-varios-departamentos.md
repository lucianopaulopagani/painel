# Usuário com vários departamentos (N:N)

## Contexto

Hoje o vínculo é **1 usuário → 1 departamento** (`profiles.department_id`, FK única). O usuário pediu que o **mesmo usuário possa acessar vários departamentos ao mesmo tempo**, com os vínculos ajustáveis **no cadastro de usuário, apenas pelo admin**.

Decisões confirmadas:
- Seleção por **lista de checkboxes** (marcar vários).
- Qualquer departamento vinculado dá acesso no login.
- Se escolher um departamento ao qual **não** pertence: **bloqueia e sugere** um dos corretos (comportamento atual, adaptado para vários).
- Admin continua com acesso global (e pode ter 0 vínculos).

## Abordagem

### 1. Banco — tabela de vínculo N:N (`supabase_migration`)
Nova tabela `public.profile_departments` (profile_id, department_id), com **RLS na mesma migração** e integridade por FK:

```sql
create table if not exists public.profile_departments (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, department_id)
);
alter table public.profile_departments enable row level security;
-- usuário lê os próprios vínculos; admin gerencia todos
create policy "profile_departments_read_own" on public.profile_departments
  for select using (auth.uid() = profile_id);
create policy "profile_departments_admin_all" on public.profile_departments
  for all using (public.is_admin()) with check (public.is_admin());

-- backfill do vínculo único atual
insert into public.profile_departments (profile_id, department_id)
select id, department_id from public.profiles where department_id is not null
on conflict do nothing;

alter table public.profiles drop column if exists department_id;
```
Depois, confirmar RLS/políticas com `supabase_get_table_schema`.

### 2. Backend function `manage-users` (`supabase/functions/manage-users/index.ts`)
- `create-user`: passa a receber `department_ids: string[]`; insere o perfil **sem** `department_id` e cria as linhas em `profile_departments`.
- `update-user`: recebe `department_ids?: string[]`; **substitui** os vínculos (apaga os do perfil e insere os novos).
- Redeploy com `supabase_deploy_edge_function`.

### 3. Tipos e mapeamento
- `src/lib/types.ts`: remover `department_id`; adicionar `DepartmentRef { id; name }` e `ProfileWithDepartments extends Profile { departments: DepartmentRef[] }` (substitui `ProfileWithDepartment`).
- Novo `src/lib/mappers.ts`: `toProfileWithDepartments(row)` normaliza o retorno aninhado do PostgREST (`profile_departments[].departments`) em `departments: DepartmentRef[]`.

### 4. Consultas
- `src/context/auth.tsx` (`loadProfile`) e `src/hooks/use-users.ts` (`useUsers`): trocar `*, departments(id, name)` por `*, profile_departments(departments(id, name))` + `toProfileWithDepartments`.
- `use-users.ts`: `CreateUserInput.department_ids: string[]`, `UpdateUserInput.department_ids?: string[]`.

### 5. Componente de seleção múltipla (novo)
- `src/components/admin/department-multi-select.tsx`: lista de departamentos com `Checkbox` (ui/checkbox), `value: string[]`, `onChange`, estado desabilitado/vazio. Reutilizado nos 3 diálogos.

### 6. Diálogos do admin
- `UserFormDialog.tsx`, `UserEditDialog.tsx`, `InitialAdminDialog.tsx`: substituir o `Select` único pelo `DepartmentMultiSelect` e enviar `department_ids`.

### 7. Telas
- `src/pages/Login.tsx`: acesso se `role === 'admin'` **ou** `profile.departments.some(d => d.id === departmentId)`; senão bloqueia e sugere o primeiro departamento vinculado; sem vínculos → erro "contate o administrador".
- `src/pages/app/DepartmentPanel.tsx`: rótulo = "Todos os departamentos" (admin sem vínculo) / nomes unidos por vírgula / "Sem departamento".
- `src/pages/admin/UsersTab.tsx`: exibir `Badge` para cada departamento (ou "—").
- `src/pages/admin/AdminOverview.tsx`: contar usuários por departamento somando todos os vínculos; usuários sem vínculo contam em "Sem departamento".

## Arquivos

**Novos:** `src/lib/mappers.ts`, `src/components/admin/department-multi-select.tsx`
**Modificados:** `src/lib/types.ts`, `src/context/auth.tsx`, `src/hooks/use-users.ts`, `src/components/admin/UserFormDialog.tsx`, `src/components/admin/UserEditDialog.tsx`, `src/components/admin/InitialAdminDialog.tsx`, `src/pages/Login.tsx`, `src/pages/app/DepartmentPanel.tsx`, `src/pages/admin/UsersTab.tsx`, `src/pages/admin/AdminOverview.tsx`, `supabase/functions/manage-users/index.ts`, `src/components/admin/ResetPasswordDialog.tsx` (só o tipo)

**Reuso:** `useDepartments`, `useUsers`, `useCreateUser`/`useUpdateUser`, `Checkbox`, `Badge`, `Card`, `Dialog` do design system.

> Atenção: `src/integrations/supabase/{client,types}.ts` são gerados pelo framework — não editar (os tipos são regenerados após a migração).

## Implementation checklist

- [ ] Aplicar migração: criar `profile_departments` com RLS/políticas, backfill e remover `profiles.department_id`.
- [ ] Confirmar no schema que `profile_departments` tem RLS e as políticas listadas.
- [ ] Atualizar `manage-users` (create-user/update-user com `department_ids`) e reimplantar.
- [ ] Atualizar tipos (`DepartmentRef`, `ProfileWithDepartments`) e criar `toProfileWithDepartments`.
- [ ] Atualizar `loadProfile` (auth) e `useUsers` para `profile_departments(...)` + mapper; ajustar `CreateUserInput`/`UpdateUserInput`.
- [ ] Criar `department-multi-select.tsx` e usá-lo nos 3 diálogos (com `department_ids`).
- [ ] Ajustar `Login.tsx` (acesso por qualquer vínculo; bloqueio + sugestão).
- [ ] Ajustar `DepartmentPanel.tsx`, `UsersTab.tsx` e `AdminOverview.tsx` para múltiplos departamentos.

## Verification checklist

- [ ] `pnpm check` (lint + typecheck) e `pnpm run build` sem erros.
- [ ] `supabase_get_table_schema` mostra `profile_departments` com RLS + políticas e `profiles` sem `department_id`.
- [ ] `select count(*) from profile_departments` bate com os vínculos anteriores (backfill; admin atual sem vínculo → 0).
- [ ] No painel admin (logado como admin): criar usuário marcando **2 departamentos** → aba Usuários mostra os 2; `select * from profile_departments` confirma 2 linhas.
- [ ] Editar o usuário removendo 1 departamento → vínculo some (aba e tabela).
- [ ] Login com esse usuário por **cada** departamento vinculado → entra em `/app`.
- [ ] Login por um departamento **não** vinculado → bloqueia e sugere um correto.
- [ ] Admin sem vínculo → continua acessando `/admin` e todos os departamentos ("Todos os departamentos" no painel).
- [ ] Excluir um departamento com usuários vinculados → os vínculos caem por cascade (usuário fica sem aquele departamento).
- [ ] Responsivo: diálogos com a lista de checkboxes em mobile_390 e desktop_1280.
