# Permissões por departamento, submenu e dashboard

## Objetivo

Criar a permissão **Departamento Fiscal** e transformar o cadastro de permissões em algo por departamento: cada permissão libera submenus (com nível **visualizar** ou **alterar**), dashboards (geral do departamento e de cada subdepartamento) e pode restringir o usuário às empresas em que ele é o responsável.

## O que muda para quem usa

### 1. Permissão "Departamento Fiscal" já cadastrada
Vem pronta, vinculada ao **Depart. Fiscal**, com:
- Dashboard geral do Fiscal liberado;
- Submenu **Movimento Fiscal** com nível **alterar**;
- Dashboard do Movimento Fiscal liberado;
- Opção **somente empresas em que é responsável** marcada.

O administrador pode editar tudo isso depois.

### 2. Cadastro de permissões (Administração > Permissões)
Ao criar/editar uma permissão:
- Escolhe o **departamento** da permissão;
- Marca cada **submenu** com três estados: sem acesso, **visualizar** ou **alterar**;
- Marca quais **dashboards** libera: o dashboard geral do departamento e os dashboards de cada subdepartamento;
- Marca **"somente empresas em que o usuário é responsável"**, quando for o caso;
- A opção **Administrador** continua disponível para liberar o painel administrativo inteiro.

Submenus criados depois aparecem automaticamente na lista, começando **sem acesso** — nada precisa ser refeito.

### 3. Painel do usuário
- O usuário vê apenas os departamentos e submenus liberados pelas permissões dele (quem não tem nenhuma permissão continua vendo o que já vê hoje).
- Submenu marcado como **visualizar** abre o módulo em modo leitura: sem botões de criar, editar ou excluir.
- Submenu marcado como **alterar** funciona como hoje.
- Nesta entrega o modo leitura é aplicado ao **Movimento Fiscal** (único submenu do Fiscal). Os módulos dos outros departamentos seguem como estão até receberem suas permissões.

### 4. Empresas somente do responsável
Quando a permissão traz "somente empresas em que é responsável":
- As telas do Fiscal listam apenas as empresas em que o usuário está como responsável;
- Os dashboards do Fiscal também passam a considerar só essas empresas;
- O próprio banco passa a devolver apenas essas empresas, para que o limite não dependa da tela.

Administradores continuam vendo todas as empresas, e usuários sem essa marcação não são afetados.

### 5. Dashboards
- O usuário só vê o **dashboard geral do departamento** se ele estiver liberado na permissão.
- Cada **dashboard de subdepartamento** aparece conforme a marcação.
- Sem dashboard liberado, o departamento abre direto nos submenus permitidos.

## Limites desta entrega

- A restrição "somente empresas do responsável" é aplicada ao **Departamento Fiscal**; os demais departamentos entram quando ganharem suas permissões.
- A leitura/edição por submenu vale para o Fiscal agora; o cadastro já aceita permissões dos outros departamentos, mas os módulos deles ainda não bloqueiam edição.
- Não serão removidas as permissões antigas de empresas, chat, tarefas e agenda no banco — elas apenas não aparecem mais no cadastro de usuários.

## Critérios de sucesso

- [ ] A permissão "Departamento Fiscal" existe e pode ser atribuída a um usuário no cadastro dele.
- [ ] Ao criar um submenu novo no Fiscal, ele aparece no cadastro de permissões e fica sem acesso por padrão.
- [ ] Usuário com "Movimento Fiscal: visualizar" abre o módulo sem conseguir criar, editar ou excluir; com "alterar", consegue.
- [ ] Usuário com "somente responsável" vê somente as empresas em que está como responsável, nas telas e nos dashboards do Fiscal — inclusive após recarregar a página.
- [ ] Usuário sem dashboard liberado não vê o dashboard geral; com o dashboard de um subdepartamento liberado, vê apenas esse.
- [ ] Administrador continua com acesso total, e usuários sem permissões novas mantêm o comportamento atual.
