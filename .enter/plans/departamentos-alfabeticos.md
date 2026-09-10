# Definir Departamentos no Banco (ordem alfabética)

## Contexto

O usuário quer que o banco de dados contenha exatamente os seguintes departamentos, listados em ordem alfabética:

- Depart. Contábil
- Depart. Fiscal
- Depart. Pessoal
- Nota Fiscal
- Societário

Estado atual: o frontend do sistema de acesso por departamento já está pronto (seleção de departamento, login, painel admin), mas o banco de dados (Enter Cloud) está **vazio** — a tabela `departments` não existe (`42P01: relation "public.departments" does not exist`). Portanto, antes de inserir os departamentos é preciso aplicar o schema.

## Abordagem

1. **Aplicar o schema** com o conteúdo existente de `supabase/migrations/0001_init.sql` (via tool de migração). Ele cria:
   - tabela `departments` (com RLS: leitura pública, escrita só admin)
   - tabela `profiles` (com RLS: usuário lê o próprio perfil, admin gerencia todos)
   - função `public.is_admin()` (anti-recursão de RLS)
   Sem esse passo a tabela `departments` não existe e nada pode ser inserido.
2. **Inserir os 5 departamentos** com os nomes exatos especificados pelo usuário (sem descrição), em ordem alfabética.
3. **Ordem alfabética garantida na exibição**: o hook `useDepartments` (`src/hooks/use-departments.ts`) já consulta com `.order("name")`, então a tela de seleção (`/`) e a aba de departamentos do admin já exibem em ordem alfabética — nenhuma mudança de frontend é necessária.

> Observação: todos os nomes começam com letra maiúscula, então a ordenação padrão do Postgres (`ORDER BY name`) produz exatamente a ordem alfabética pedida.

## Recursos reutilizados

- `supabase/migrations/0001_init.sql` — schema completo já existente no projeto
- `src/hooks/use-departments.ts` — já ordena por `name`

## Implementation checklist

- [ ] Aplicar migração com o conteúdo de `supabase/migrations/0001_init.sql` (cria `departments`, `profiles`, `is_admin()`, políticas RLS).
- [ ] Inserir os 5 departamentos: `Depart. Contábil`, `Depart. Fiscal`, `Depart. Pessoal`, `Nota Fiscal`, `Societário` (exatamente estes nomes, sem descrição).

## Verification checklist

- [ ] `select name from public.departments order by name` retorna exatamente 5 linhas, nesta ordem: `Depart. Contábil`, `Depart. Fiscal`, `Depart. Pessoal`, `Nota Fiscal`, `Societário`.
- [ ] `select count(*) from public.departments` retorna `5` (sem duplicatas).
- [ ] `pnpm check` (lint + typecheck) e `pnpm run build` sem erros (nenhuma mudança de código de frontend é esperada).
- [ ] Preview em `/`: grade lista os 5 departamentos em ordem alfabética.
