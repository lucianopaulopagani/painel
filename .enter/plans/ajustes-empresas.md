# Ajustes no cadastro de Empresas (ordem, UF única, responsáveis por departamento)

## Contexto

Três ajustes pedidos no módulo de Empresas do painel de Administração:

1. A lista deve ficar **ordenada pelo numero da empresa**.
2. **UF** deixa de ser múltipla escolha e vira **menu suspenso de escolha única**.
3. Na seção "departamentos que utilizam a empresa", adicionar **ao lado de cada departamento um menu suspenso de múltipla escolha com o usuário responsável** (a partir dos usuários cadastrados), **opcional** (não obrigatório).

## Abordagem

### 1. Banco (`supabase_migration`)
- `companies`: substituir `ufs text[]` por **`uf text not null`** (UF única). A tabela está vazia (0 registros), então a alteração é segura.
- `company_departments`: adicionar **`responsible_profile_ids uuid[] not null default '{}'`** (responsáveis por empresa×departamento).
- Trigger para limpar referências quando um usuário é excluído:
```sql
create or replace function public.cleanup_company_responsibles()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.company_departments
    set responsible_profile_ids = array_remove(responsible_profile_ids, old.id)
    where old.id = any(responsible_profile_ids);
  return old;
end; $$;

drop trigger if exists profiles_cleanup_company_responsibles on public.profiles;
create trigger profiles_cleanup_company_responsibles
  after delete on public.profiles
  for each row execute function public.cleanup_company_responsibles();
```
Confirmar o resultado com `supabase_get_table_schema`.

### 2. Tipos e mapeamento
- `src/lib/types.ts`: `Company.ufs: string[]` → **`uf: string`**; `CompanyWithDepartments.department_ids` → **`department_links: { department_id: string; profile_ids: string[] }[]`**.
- `src/lib/mappers.ts`: ajustar `RawCompanyRow` (ler `uf` e `company_departments(department_id, responsible_profile_ids)`) e `toCompanyWithDepartments`.

### 3. Dados — `src/hooks/use-companies.ts`
- `useCompanies`: `select("*, company_departments(department_id, responsible_profile_ids)")` e **ordenar por numero** com ordenação natural (`localeCompare(..., { numeric: true })`, para "2" vir antes de "10").
- `CompanyInput`: `uf: string` e `department_links: { department_id; profile_ids }[]`.
- `replaceCompanyDepartments`: gravar `responsible_profile_ids` em cada vínculo.

### 4. Componente de responsáveis — `src/components/admin/user-multi-select.tsx` (novo)
- **Menu suspenso** (`Popover` + `Checkbox`) com os usuários de `useUsers()`; `value: string[]`, `onChange`, `disabled`, `placeholder`. Mostra os nomes selecionados no gatilho.

### 5. Formulário — `src/components/admin/CompanyFormDialog.tsx`
- Trocar a seção de UF por um **`Select` de escolha única** (27 UFs de `src/lib/ufs.ts`).
- Seção de departamentos vira **linhas**: `[checkbox do departamento] + [nome] + [UserMultiSelect do responsável]` (dropdown à direita; desabilitado quando o departamento não está marcado). Responsáveis são **opcionais**.
- Estado: `Record<departmentId, { selected: boolean; profileIds: string[] }>`; ao salvar, enviar apenas os departamentos marcados com seus responsáveis.
- Remover o uso de `UfMultiSelect` e **deletar** `src/components/admin/uf-multi-select.tsx` (código morto após a UF virar única).

### 6. Lista — `src/pages/admin/CompaniesTab.tsx`
- Coluna **UF**: badge único.
- Coluna **Departamentos**: para cada vínculo, badge do departamento e, quando houver, os **responsáveis** (nomes) em texto pequeno abaixo.
- A ordem já vem do hook (por numero).

## Arquivos

**Novos:** `src/components/admin/user-multi-select.tsx`
**Modificados:** `src/lib/types.ts`, `src/lib/mappers.ts`, `src/hooks/use-companies.ts`, `src/components/admin/CompanyFormDialog.tsx`, `src/pages/admin/CompaniesTab.tsx`
**Removido:** `src/components/admin/uf-multi-select.tsx` (sem uso)

**Reuso:** `Select`/`Popover`/`Checkbox`/`Badge`/`Button`, `useUsers`, `useDepartments`, `UFS` (`src/lib/ufs.ts`), `useQueryClient`.

> `src/integrations/supabase/{client,types}.ts` são gerados pelo framework — não editar.

## Implementation checklist

- [ ] Aplicar migração: `companies.ufs` → `uf text not null`; adicionar `company_departments.responsible_profile_ids uuid[]`; criar trigger de limpeza em `profiles`.
- [ ] Confirmar no schema as colunas novas e o trigger.
- [ ] Ajustar `types.ts` (`uf`, `department_links`) e `mappers.ts`.
- [ ] Ajustar `use-companies.ts`: select dos vínculos com responsáveis, ordenação por numero (natural), `CompanyInput` e gravação dos responsáveis.
- [ ] Criar `user-multi-select.tsx` (dropdown de múltipla escolha de usuários).
- [ ] Atualizar `CompanyFormDialog.tsx`: UF em `Select` único e linhas de departamento com o dropdown de responsáveis.
- [ ] Atualizar `CompaniesTab.tsx`: UF como badge único e responsáveis por departamento na coluna de departamentos.
- [ ] Remover `uf-multi-select.tsx` (sem uso).

## Verification checklist

- [ ] `pnpm check` (lint + typecheck) e `pnpm run build` sem erros.
- [ ] `supabase_get_table_schema` mostra `companies.uf text` e `company_departments.responsible_profile_ids`.
- [ ] No painel admin → Empresas: a lista aparece **ordenada pelo numero** (ex.: 1, 2, 10 — e não 1, 10, 2).
- [ ] UF é um **menu suspenso de escolha única** (seleciona 1; obrigatório).
- [ ] Em cada departamento há um **menu suspenso de múltipla escolha** de usuários; marcar 2 usuários salva os 2 e a lista mostra os nomes.
- [ ] Responsáveis são opcionais: criar empresa só com departamentos e sem responsáveis funciona.
- [ ] Editar empresa: trocar a UF, marcar/desmarcar departamentos e alterar responsáveis reflete na lista e no banco.
- [ ] Excluir um usuário responsável → o id sai de `responsible_profile_ids` (trigger) e a lista deixa de exibir o nome.
- [ ] Excluir uma empresa → vínculos removidos (cascade).
- [ ] Responsivo: diálogo com os dropdowns em mobile_390 e desktop_1280.
