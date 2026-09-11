# Painel Administração Central (hub com sidebar + dashboards)

## Contexto

Hoje o painel `/admin` existe (abas Departamentos e Usuários), mas:

- Só é alcançável **depois** de logar por um departamento e clicar em "Administração" no cabeçalho do painel — não há acesso a partir da tela inicial.
- A gestão de usuários e departamentos está em abas, sem um espaço claro para os **dashboards** que serão criados ao longo do projeto.

Objetivo (confirmado com o usuário):

1. **Acesso pelo início**: botão "Administração" na tela inicial que abre um **login dedicado de admin**.
2. **Centralizar** cadastros de usuários e departamentos nesse painel.
3. **Dashboard inicial de resumo** (usuários, departamentos, usuários por departamento) **+ área pronta** para novos dashboards.
4. **Layout com menu lateral (sidebar)**, mais escalável para vários dashboards.

## Abordagem

### 1. Login dedicado de administrador — `src/pages/admin/AdminLogin.tsx` (novo)
- Formulário e-mail + senha, no mesmo visual das telas de auth (fundo `auth-page` + logo).
- Reutiliza `useAuth().login`. Após autenticar, exige `profile.role === 'admin'`; se não for admin, faz `logout` e mostra erro ("Esta conta não tem permissão de administrador").
- Se já houver sessão de admin, redireciona direto para `/admin`.
- Link "Voltar" para a tela inicial.

### 2. Rota nova — `src/router.tsx`
- Adicionar `{ path: "/admin/login", name: "admin-login", element: <AdminLogin /> }` (pública; a própria tela valida o papel).
- Manter `/admin` protegido por `AdminRoute` (inalterado).

### 3. Botão de acesso no início — `src/pages/DepartmentSelection.tsx`
- Adicionar no topo (header vazio hoje) um botão "Administração" (ícone `ShieldCheck`) alinhado à direita, com estilo adequado ao fundo azul, apontando para `/admin/login`.

### 4. Hub com menu lateral — `src/pages/admin/AdminPanel.tsx` (refatorado) + `src/components/admin/admin-sidebar.tsx` (novo)
- Mantém o `PanelHeader` no topo (logo + usuário/sair).
- Abaixo: `flex-col lg:flex-row` — **sidebar** à esquerda (horizontal/rolável no mobile) e área de conteúdo.
- Seções (estado interno `useState<AdminSection>`):
  - **Visão geral** (`overview`, padrão) — `AdminOverview`
  - **Usuários** (`users`) — reutiliza `UsersTab` existente
  - **Departamentos** (`departments`) — reutiliza `DepartmentsTab` existente
  - **Dashboards** (`dashboards`) — `DashboardsSection`
- Ícones `lucide-react`: `LayoutDashboard`, `Users`, `Building2`, `BarChart3`.

### 5. Dashboard de resumo — `src/pages/admin/AdminOverview.tsx` (novo)
- Cards com métricas derivadas dos hooks existentes (sem novas consultas/tabelas):
  - **Usuários** — `useUsers().data.length`
  - **Departamentos** — `useDepartments().data.length`
  - **Administradores** — perfis com `role === 'admin'`
  - **Usuários por departamento** — lista/agrupamento a partir de `useUsers` (nome do departamento + contagem), incluindo "Sem departamento".
- Estados de carregamento/erro usando `Loader2`/mensagem, como nas abas atuais.

### 6. Área extensível de dashboards — `src/pages/admin/DashboardsSection.tsx` (novo)
- Bloco "Dashboards" com texto explicando que os dashboards do projeto aparecerão aqui.
- Grid de cards "em breve" (placeholder) com ícone — estrutura pronta para receber os dashboards futuros (basta adicionar um card/roteamento quando existirem).

## Arquivos

**Novos:** `src/pages/admin/AdminLogin.tsx`, `src/pages/admin/AdminOverview.tsx`, `src/pages/admin/DashboardsSection.tsx`, `src/components/admin/admin-sidebar.tsx`
**Modificados:** `src/router.tsx`, `src/pages/admin/AdminPanel.tsx`, `src/pages/DepartmentSelection.tsx`

**Reuso:** `useUsers`/`useDepartments` (contagens e agrupamento), `useAuth` (login/logout/perfil), `PanelHeader`, `DepartmentsTab`, `UsersTab`, componentes `Card`/`Badge`/`Button`, padrão visual `auth-page` + `BrandLogo`.

## Implementation checklist

- [ ] Criar `AdminLogin.tsx`: login e-mail/senha, exige `role === 'admin'` (senão logout + erro), redireciona para `/admin`; já logado como admin → `/admin`.
- [ ] Adicionar a rota `/admin/login` em `src/router.tsx`.
- [ ] Adicionar o botão "Administração" no topo de `DepartmentSelection.tsx` apontando para `/admin/login`.
- [ ] Criar `admin-sidebar.tsx` com as 4 seções e estado ativo.
- [ ] Refatorar `AdminPanel.tsx` para layout com `PanelHeader` + sidebar + conteúdo por seção, reutilizando `UsersTab` e `DepartmentsTab`.
- [ ] Criar `AdminOverview.tsx` com métricas de usuários, departamentos, admins e usuários por departamento.
- [ ] Criar `DashboardsSection.tsx` com a área extensível/placeholder.

## Verification checklist

- [ ] `pnpm check` (lint + typecheck) e `pnpm run build` sem erros.
- [ ] Home (`/`) mostra o botão "Administração" → abre `/admin/login`.
- [ ] `/admin/login` com credenciais de **admin** → entra em `/admin` (Visão geral).
- [ ] `/admin/login` com credenciais de **membro** → bloqueia com mensagem e não entra.
- [ ] `/admin/login` com credenciais inválidas → erro de credenciais, permanece na tela.
- [ ] `/admin` sem sessão → redireciona para `/` (comportamento do `AdminRoute` preservado).
- [ ] Sidebar alterna entre Visão geral, Usuários, Departamentos e Dashboards; Usuários e Departamentos continuam funcionando (criar/editar/excluir).
- [ ] Visão geral exibe contagens corretas (ex.: 1 usuário admin, 5 departamentos) e o agrupamento por departamento.
- [ ] Visão responsiva: sidebar vira barra horizontal/rolável no mobile (verificar `/admin` em mobile_390 e desktop_1280) — validado com o admin logado.
