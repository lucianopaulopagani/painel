import { CadastroColunaEditor } from "@/components/admin/CadastroColunaEditor";
import type { TabelaCadastro } from "@/lib/cadastro-tabelas";

interface CadastroTabelaEditorProps {
  departamento: string;
  tabela: TabelaCadastro;
}

/**
 * Colunas de uma tabela do departamento — nome do cabeçalho de todas elas e,
 * nas colunas de menu suspenso, as opções com nome e cor.
 */
export function CadastroTabelaEditor({
  departamento,
  tabela,
}: CadastroTabelaEditorProps) {
  return (
    <div className="flex flex-col gap-3 border-t bg-muted/40 px-3 py-3 sm:px-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Colunas da tabela ({tabela.nome})
      </p>

      {tabela.colunas.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Esta tabela ainda não tem colunas cadastradas.
        </p>
      ) : (
        tabela.colunas.map((coluna) => (
          <CadastroColunaEditor
            key={coluna.campo}
            departamento={departamento}
            tabela={tabela.nome}
            coluna={coluna}
          />
        ))
      )}

      <p className="text-xs text-muted-foreground">
        O primeiro campo de cada coluna é o nome exibido no cabeçalho e vale
        para todas as tabelas do departamento. Nas colunas de menu suspenso,
        renomeie cada opção (Enter ou sair para salvar) e escolha a cor; sem
        opções cadastradas a tabela usa a lista padrão.
      </p>
    </div>
  );
}
