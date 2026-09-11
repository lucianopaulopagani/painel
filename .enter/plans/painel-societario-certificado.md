# Painel do Societário — módulo "Certificado digital"

## Contexto

O usuário quer começar a construir o painel do departamento **Societário**, com o primeiro módulo: **Certificado digital**.

Formato desejado:
- **Na horizontal**: o nome do módulo ("Certificado digital") numa barra de recursos, para permitir **adicionar outros módulos no futuro**.
- **Na vertical**: uma tabela no formato do print anexo, com colunas **VENCIMENTO, SITUAÇÃO, STATUS, EMPRESA**, com cores por situação:
  - **Vencido** (vermelho): situação "Vencido à N dia(s)!" / status **VENCIDO**
  - **Vence hoje** (amarelo): situação "Vence hoje" / status **RENOVAR**
  - **Futuro** (verde): situação "Faltam N dia(s)!" / status **ATIVO**
  - Ordenação por vencimento (como no print).
- As **empresas** da lista são as que têm o **departamento Societário marcado** no cadastro de empresas.

Decisões confirmadas:
- **Avisado** (Sim/Não) e **Agendamento** (data e hora) como **colunas na tabela**; **Observações** (texto) no **formulário** de edição.
- Acesso: **membros do departamento Societário + admin**.
- **RENOVAR** somente quando **vence hoje** (igual ao print).
- **Um certificado por empresa** (o vencimento é editado/renovado).

## Abordagem

### 1. Banco (`supabase_migration`)
Nova tabela `certificates` (um registro por empresa):
```sql
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  vencimento date,
  avisado boolean not null default false,
  agendamento_at timestamptz,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```
**RLS na mesma migração**: admin gerencia tudo; **membro acessa os certificados das empresas vinculadas a um departamento dele**:
```sql
alter table public.certificates enable row level security;
create policy "certificates_admin_all" on public.certificates
  for all using (public.is_admin()) with check (public.is_admin());
create policy "certificates_member_all" on public.certificates
  for all
  using (exists (
    select 1 from public.company_departments cd
    join public.profile_departments pd on pd.department_id = cd.department_id
    where cd.company_id = certificates.company_id and pd.profile_id = auth.uid()))
  with check (exists (
    select 1 from public.company_departments cd
    join public.profile_departments pd on pd.department_id = cd.department_id
    where cd.company_id = certificates.company_id and pd.profile_id = auth.uid()));
```
Também é preciso **liberar leitura** para o membro do departamento em `companies` e `company_departments` (hoje são só admin), senão o painel não lista as empresas:
```sql
create policy "companies_department_read" on public.companies for select using (exists (
  select 1 from public.company_departments cd
  join public.profile_departments pd on pd.department_id = cd.department_id
  where cd.company_id = companies.id and pd.profile_id = auth.uid()));

create policy "company_departments_department_read" on public.company_departments for select using (exists (
  select 1 from public.profile_departments pd
  where pd.department_id = company_departments.department_id and pd.profile_id = auth.uid()));
```
Confirmar com `supabase_get_table_schema`.

### 2. Regra de situação/status — `src/lib/certificate-status.ts` (novo)
Função pura a partir de `vencimento` (date) e da data de hoje (comparação por dia, sem hora):
- `vencimento < hoje` → situação `Vencido à N dia(s)!` (**N** = dias vencidos) e status **VENCIDO**
- `vencimento === hoje` → situação `Vence hoje` e status **RENOVAR**
- `vencimento > hoje` → situação `Faltam N dia(s)!` e status **ATIVO**
- sem vencimento → situação `—` e status **SEM VENCIMENTO**
Retorna também a "cor" (danger/warning/success/neutral) para o estilo.

### 3. Cores de status (`src/index.css` + `tailwind.config.ts`)
Adicionar tokens semânticos (claro/escuro) para os três estados, ex.:
`--status-danger`, `--status-danger-foreground`, `--status-warning`, `--status-warning-foreground`, `--status-success`, `--status-success-foreground` (mapeados em `colors.status.*`), reutilizando as cores do print (vermelho/amarelo/verde suaves).

### 4. Tipos e hook
- `src/lib/types.ts`: `Certificate { id; company_id; vencimento: string | null; avisado: boolean; agendamento_at: string | null; observacoes: string | null }` e `CertificateWithCompany`.
- `src/hooks/use-certificates.ts` (novo): `useCertificates()` (lista) e `useUpsertCertificate()` (grava por `company_id` via `upsert(..., { onConflict: "company_id" })`), invalidando a queryKey.

### 5. Painel do Societário (novo)
- `src/pages/app/societario/SocietarioPanel.tsx`: barra **horizontal** de módulos (`SOCIETARIO_MODULES`, hoje só `{ key: "certificado-digital", label: "Certificado digital" }`) + área vertical com o módulo ativo. Estrutura pronta para novos módulos.
- `src/pages/app/societario/CertificadoDigital.tsx`: a tabela.
  - Resolve o departamento **Societário** pelo nome (`useDepartments`) e filtra as empresas cujo `department_links` contém esse departamento (reutilizando `useCompanies()`).
  - Busca os certificados dessas empresas (`useCertificates()`), ordena por **vencimento** (nulos ao final) e monta as linhas com **VENCIMENTO, SITUAÇÃO, STATUS, EMPRESA, AVISADO, AGENDAMENTO** + ação de editar.
  - Colunas: badges de situação/status coloridos; AVISADO como Sim/Não; AGENDAMENTO formatado `dd/mm/aaaa hh:mm`; linha clicável abre o formulário.
  - Estado vazio: "Nenhuma empresa vinculada ao Societário" (orientando a marcar o departamento no cadastro de empresas).

### 6. Formulário — `src/components/societario/CertificateFormDialog.tsx` (novo)
- Campos: **Vencimento** (`type="date"`), **Avisado** (`Select` Sim/Não), **Agendamento** (`type="date"` + `type="time"` combinados em `agendamento_at`), **Observações** (`Textarea`).
- Mostra o nome da empresa no título; salva via `useUpsertCertificate`.

### 7. Roteamento do painel — `src/pages/app/DepartmentPanel.tsx`
- Se o usuário tem acesso ao Societário (é **admin** ou está vinculado ao departamento de nome **"Societário"**), renderiza o `SocietarioPanel`.
- Caso contrário, mantém o placeholder atual.

## Arquivos

**Novos:** `src/pages/app/societario/SocietarioPanel.tsx`, `src/pages/app/societario/CertificadoDigital.tsx`, `src/components/societario/CertificateFormDialog.tsx`, `src/hooks/use-certificates.ts`, `src/lib/certificate-status.ts`
**Modificados:** `src/pages/app/DepartmentPanel.tsx`, `src/lib/types.ts`, `src/index.css`, `tailwind.config.ts`

**Reuso:** `useCompanies` (empresas já vinculadas aos departamentos), `useDepartments`, `PanelHeader`, `Table`/`Badge`/`Dialog`/`Select`/`Input`/`Textarea`/`Button`, padrão de diálogo de `DepartmentFormDialog`.

> `src/integrations/supabase/{client,types}.ts` são gerados pelo framework — não editar.

## Implementation checklist

- [ ] Aplicar migração: tabela `certificates` com RLS (admin + membro do departamento) e políticas de leitura para membro em `companies` e `company_departments`.
- [ ] Confirmar no schema as tabelas/colunas e as políticas.
- [ ] Criar `certificate-status.ts` (situação/status/cor por data) e validar com teste.
- [ ] Adicionar tokens de cor de status em `index.css` + `tailwind.config.ts`.
- [ ] Adicionar `Certificate` em `types.ts` e criar `use-certificates.ts` (list + upsert).
- [ ] Criar `SocietarioPanel.tsx` com a barra horizontal de módulos e o módulo `Certificado digital`.
- [ ] Criar `CertificadoDigital.tsx` (tabela com VENCIMENTO, SITUAÇÃO, STATUS, EMPRESA, AVISADO, AGENDAMENTO e ação de editar).
- [ ] Criar `CertificateFormDialog.tsx` (vencimento, avisado, agendamento data/hora, observações).
- [ ] Ajustar `DepartmentPanel.tsx` para renderizar o painel do Societário quando houver acesso.

## Verification checklist

- [ ] `pnpm check` (lint + typecheck) e `pnpm run build` sem erros.
- [ ] `supabase_get_table_schema` mostra `certificates` com RLS + políticas e as políticas de leitura de membro em `companies`/`company_departments`.
- [ ] Regra de status: teste com datas passada/hoje/futura → `Vencido à N dia(s)!`/VENCIDO, `Vence hoje`/RENOVAR, `Faltam N dia(s)!`/ATIVO (N correto).
- [ ] Painel (logado como membro do Societário ou admin): barra horizontal com "Certificado digital"; tabela lista apenas as empresas com o departamento Societário marcado.
- [ ] Sem empresa vinculada → estado vazio orientando a marcar o departamento no cadastro de empresas.
- [ ] Editar uma linha: salvar vencimento, avisado, agendamento e observações reflete na tabela (ordenação por vencimento e cores corretas).
- [ ] Empresa vinculada a outro departamento (sem Societário) **não** aparece na lista.
- [ ] Membro de outro departamento **não** acessa os certificados (RLS) e não vê a tabela (vê o placeholder).
- [ ] Responsivo: tabela e diálogo em mobile_390 e desktop_1280.
