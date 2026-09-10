# Rebranding P4 Contabilidade + Criação do Admin

## Contexto

O usuário quer três coisas:

1. **Aplicar as cores da P4 Contabilidade** no sistema inteiro. A marca usa: azul escuro `#155198` (≈ `hsl(212 76% 34%)`) e ciano `#19B2EC` (≈ `hsl(197 85% 51%)`). Hoje o tema usa índigo/roxo genérico.
2. **Inserir a logo** na página inicial de departamentos e em locais estratégicos (confirmado: home, login, painéis e favicon). As 4 imagens da logo estão em CDN (fundos sólidos azul ou branco), ainda não estão no projeto.
3. **Permitir criar o usuário administrador** (confirmado: tela de configuração inicial no app). Hoje não existe admin e a criação de usuários passa pela função de backend `manage-users`, que **ainda não está implantada** — sem ela nenhum usuário (nem admin) pode ser criado pela interface.

## Abordagem

### 1. Cores da marca (`src/index.css`)
- Trocar `--primary` para `212 76% 34%` (azul `#155198`) nos modos claro e escuro; `--ring` idêntico.
- Adicionar token `--brand-cyan: 197 85% 51%` (`#19B2EC`), mapeado no `tailwind.config.ts` (`colors.brand.cyan`) para uso pontual.
- Redesenhar `.auth-page` (fundo das telas de seleção/login) com tons P4: gradiente de azuis `#155198` + brilho radial ciano, removendo os tons índigo/roxo atuais.

### 2. Logo (`public/brand/` + componente reutilizável)
- Baixar as 4 imagens do CDN para `public/brand/` e identificar por visão qual variante é qual (horizontal/vertical × fundo branco/azul).
- Criar `src/components/brand/logo.tsx`: renderiza a logo via `<img>` (com `crossOrigin="anonymous"`), com variantes `horizontal` e `vertical` (fundo branco) — colocada dentro de um contêiner branco arredondado quando o fundo da página for azul (páginas de auth).
- **Onde inserir** (todas com a variante de fundo branco):
  - `DepartmentSelection.tsx` (home): header — substituir o ícone `Building2` pela logo horizontal; hero — logo vertical centralizada acima do título, dentro de cartão branco arredondado.
  - `Login.tsx`: mesmo tratamento do header da home.
  - `panel-header.tsx` (compartilhado pelos painéis app e admin): substituir o bloco `Building2` primário pela logo horizontal (fundo branco funde com o header claro).
  - `index.html`: favicon → arquivo da logo (escudo P4) e título da aba → "P4 Contabilidade".
- Ajustar textos visíveis: substituir "Portal de Departamentos" pela logo (header) e corrigir o texto "backend (Supabase)" na home para "backend (Enter Cloud)".

### 3. Criação do primeiro admin (função de backend + tela de setup)
- Atualizar `supabase/functions/manage-users/index.ts`:
  - Nova ação `has-admin` (sem exigir login): retorna `{ ok: true, has_admin }` via cliente service-role.
  - **Bootstrap do primeiro admin**: nas ações que exigem admin, permitir `create-user` sem login **apenas** quando `role === 'admin'` **e** ainda não existir nenhum admin no `profiles`. Com um admin existente, o bootstrap fecha e só admins criam usuários.
- Implantar com `supabase_deploy_edge_function` (nome `manage-users`).
- Frontend:
  - `src/hooks/use-users.ts`: adicionar `useHasAdmin()` (invoca `has-admin`).
  - Novo `src/components/admin/InitialAdminDialog.tsx`: formulário (nome, e-mail, senha ≥ 6, departamento opcional), papel fixo `admin`, reutiliza `useCreateUser`.
  - `src/pages/DepartmentSelection.tsx`: se `hasAdmin === false`, exibir card "Configuração inicial — Criar administrador" abrindo o dialog; tratar carregamento/erro da consulta sem bloquear a página.

## Arquivos

**Modificar:** `src/index.css`, `src/pages/DepartmentSelection.tsx`, `src/pages/Login.tsx`, `src/components/shell/panel-header.tsx`, `index.html`, `src/hooks/use-users.ts`, `supabase/functions/manage-users/index.ts`, `tailwind.config.ts`
**Novos:** `src/components/brand/logo.tsx`, `src/components/admin/InitialAdminDialog.tsx`, `public/brand/*.png` (baixados do CDN)
**Implantação:** função `manage-users` (`supabase_deploy_edge_function`)

**Reuso:** `useCreateUser`/`useUsers` em `use-users.ts`, `PanelHeader`, tokens existentes (troca de `--primary` re-colore botões/avatars/badges automaticamente).

## Implementation checklist

- [ ] Baixar as 4 logos do CDN para `public/brand/` e identificar cada variante (horizontal/vertical × fundo).
- [ ] `index.css`: `--primary`/`--ring` = `212 76% 34%`, `--brand-cyan` = `197 85% 51%`, gradiente `.auth-page` em tons P4 (claro e escuro); `tailwind.config.ts` com `colors.brand.cyan`.
- [ ] Criar `src/components/brand/logo.tsx` (variantes horizontal/vertical).
- [ ] Inserir a logo na home (header + hero) e no login (header) em `DepartmentSelection.tsx` e `Login.tsx`.
- [ ] Substituir o ícone `Building2` por logo no `panel-header.tsx`.
- [ ] `index.html`: favicon com a logo e título "P4 Contabilidade"; corrigir texto "Supabase" visível na home.
- [ ] `manage-users/index.ts`: ação `has-admin` + bootstrap do primeiro admin; implantar a função.
- [ ] `use-users.ts`: hook `useHasAdmin`.
- [ ] Criar `InitialAdminDialog.tsx` e exibir o card de setup na home quando não houver admin.

## Verification checklist

- [ ] `pnpm check` (lint + typecheck) e `pnpm run build` sem erros.
- [ ] Preview `/` (desktop_1280 e mobile_390): tema azul P4, logo no header e no hero, departamentos em ordem alfabética, card "Criar administrador" visível (sem admin existente).
- [ ] Criar admin pela tela de setup → sucesso; conferir no banco via `supabase_read_query` que existe 1 perfil `role='admin'`.
- [ ] Recarregar `/` → card de setup não aparece mais (bootstrap fechado).
- [ ] Login com o admin criado → `/app` acessível; `/admin` acessível e aba Usuários lista o admin; criar um usuário membro e um admin pelo painel funciona.
- [ ] Login com usuário sem perfil/departamento incompatível continua bloqueando (comportamento atual preservado).
- [ ] Headers dos painéis (app/admin) e do login exibem a logo; favicon atualizado na aba.
