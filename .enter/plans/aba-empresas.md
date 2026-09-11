# Aba "Empresas" no painel de Administração

## Contexto

O usuário precisa de um cadastro de **empresas** centralizado no painel de Administração, para ser reutilizado pelos departamentos. Cada empresa é vinculada a um ou mais departamentos por **checkboxes**.

Campos do cadastro (confirmados):
- **numero** (editável, obrigatório)
- **UF** (estados do Brasil, sigla de 2 letras, **múltipla escolha**, obrigatório)
- **nome da empresa** (obrigatório)
- **CNPJ** (obrigatório; validar 14 dígitos e aplicar máscara `00.000.000/0000-00`)
- **inscrição estadual** (opcional)

Decisões confirmadas: por enquanto o cadastro é **somente no painel de Administração** (sem lista no painel do departamento); CNPJ com máscara + validação de 14 dígitos.

## Abordagem

### 1. Banco (`supabase_migration`)
```sql
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  numero text not null,
  name text not null,
  cnpj text not null,
  inscricao_estadual text,
  ufs text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.company_departments (
  company_id uuid not null references public.companies(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  primary key (company_id, department_id)
);
```
**RLS nas duas tabelas na mesma migração**, com política única de admin (`is_admin()`), pois o cadastro é restrito ao administrador:
```sql
alter table public.companies enable row level security;
create policy "companies_admin_all" on public.companies
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.company_departments enable row level security;
create policy "company_departments_admin_all" on public.company_departments
  for all using (public.is_admin()) with check (public.is_admin());
```
Depois confirmar RLS/políticas com `supabase_get_table_schema`.

### 2. Tipos e utilitários
- `src/lib/types.ts`: `Company { id; numero; name; cnpj; inscricao_estadual; ufs: string[]; created_at }` e `CompanyWithDepartments extends Company { department_ids: string[] }`.
- `src/lib/mappers.ts`: `toCompanyWithDepartments(row)` (normaliza `company_departments[].department_id`).
- `src/lib/utils.ts`: `formatCnpj(value)` (máscara) e `isValidCnpj(value)` (14 dígitos).
- `src/lib/ufs.ts` (novo): lista das 27 UFs (sigla + nome) para o seletor.

### 3. Hook de dados — `src/hooks/use-companies.ts` (novo)
Segue o padrão de `use-departments.ts` (React Query, RLS admin via cliente):
- `useCompanies()` — `select("*, company_departments(department_id)")` + mapper.
- `useCreateCompany()` — insere a empresa e depois os vínculos.
- `useUpdateCompany()` — atualiza, substitui os vínculos (apaga + insere).
- `useDeleteCompany()` — apaga (vínculos caem por cascade).
- Invalidação da queryKey `["companies"]` após mutações.

### 4. Componentes de seleção
- Novo `src/components/admin/checkbox-list.tsx`: lista genérica de checkboxes (`options: {value,label}[]`, `value`, `onChange`, `columns?`, `emptyMessage?`).
- Novo `src/components/admin/uf-multi-select.tsx`: usa o `CheckboxList` com as UFs (layout em colunas).
- `src/components/admin/department-multi-select.tsx`: refatorar para usar o `CheckboxList` (mesma aparência, uma única implementação).

### 5. UI do painel
- Novo `src/components/admin/CompanyFormDialog.tsx`: campos numero, nome, CNPJ (com máscara/validação), inscrição estadual, UF (múltipla) e departamentos (checkboxes). Valida obrigatórios: numero, nome, UF e CNPJ.
- Nova `src/pages/admin/CompaniesTab.tsx`: título + botão "Nova empresa", tabela (Numero, Nome, CNPJ, UF, Departamentos, Ações) com editar/excluir e diálogo de confirmação (padrão de `DepartmentsTab`).
- `src/components/admin/admin-sidebar.tsx`: adicionar a seção **Empresas** (`AdminSection = ... | "companies"`, ícone `Briefcase`).
- `src/pages/admin/AdminPanel.tsx`: renderizar `CompaniesTab` na seção `companies`.

## Arquivos

**Novos:** `src/hooks/use-companies.ts`, `src/pages/admin/CompaniesTab.tsx`, `src/components/admin/CompanyFormDialog.tsx`, `src/components/admin/checkbox-list.tsx`, `src/components/admin/uf-multi-select.tsx`, `src/lib/ufs.ts`
**Modificados:** `src/lib/types.ts`, `src/lib/mappers.ts`, `src/lib/utils.ts`, `src/components/admin/department-multi-select.tsx`, `src/components/admin/admin-sidebar.tsx`, `src/pages/admin/AdminPanel.tsx`

**Reuso:** padrão de `DepartmentsTab`/`DepartmentFormDialog` (tabela + diálogo), `Select`/`Input`/`Checkbox`/`Table`/`AlertDialog`/`Badge`, `useDepartments`, `useQueryClient`.

> `src/integrations/supabase/{client,types}.ts` são gerados pelo framework — não editar (tipos regenerados após a migração).

## Implementation checklist

- [ ] Aplicar migração: criar `companies` e `company_departments` com RLS e políticas de admin.
- [ ] Confirmar no schema que as duas tabelas têm RLS e as políticas listadas.
- [ ] Adicionar `Company`/`CompanyWithDepartments` em `types.ts`, `toCompanyWithDepartments` em `mappers.ts` e `formatCnpj`/`isValidCnpj` em `utils.ts` + lista de UFs.
- [ ] Criar `use-companies.ts` com list/create/update/delete (incluindo vínculos de departamento) e invalidação.
- [ ] Criar `checkbox-list.tsx`, `uf-multi-select.tsx` e refatorar `department-multi-select.tsx` para reusar o `CheckboxList`.
- [ ] Criar `CompanyFormDialog.tsx` com os 5 campos, máscara/validação de CNPJ, UF múltipla e checkboxes de departamentos.
- [ ] Criar `CompaniesTab.tsx` (tabela + criar/editar/excluir) e adicionar a seção no `admin-sidebar.tsx` e `AdminPanel.tsx`.

## Verification checklist

- [ ] `pnpm check` (lint + typecheck) e `pnpm run build` sem erros.
- [ ] `supabase_get_table_schema` mostra `companies` e `company_departments` com RLS + política de admin.
- [ ] Home e login continuam renderizando (sem regressão) e a rota `/admin` segue protegida.
- [ ] No painel admin (logado como administrador): a sidebar mostra **Empresas** e a aba abre.
- [ ] Criar empresa com numero, nome, CNPJ, 2 UFs e 2 departamentos → aparece na tabela com 2 UFs e 2 departamentos; `select * from company_departments` confirma 2 linhas.
- [ ] CNPJ inválido (menos de 14 dígitos) → bloqueia com mensagem; CNPJ válido é salvo no formato `00.000.000/0000-00`.
- [ ] Sem numero/nome/UF/CNPJ → bloqueia com mensagem de campo obrigatório.
- [ ] Editar empresa trocando UFs e departamentos → tabela e vínculos atualizados.
- [ ] Excluir empresa → some da tabela; vínculos removidos.
- [ ] Excluir um departamento vinculado a empresas → o vínculo cai por cascade sem afetar as empresas.
- [ ] Responsivo: aba e diálogo em mobile_390 e desktop_1280.
