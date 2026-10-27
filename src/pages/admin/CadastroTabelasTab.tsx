import { useEffect, useState } from "react";
import { Table } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TabelasFiscal from "@/components/admin/TabelasFiscal";
import { useDepartments } from "@/hooks/use-departments";
import {
  FISCAL_DEPARTMENT_NAME,
  departmentMenuLabel,
  sortDepartments,
} from "@/lib/departments";
import { DEPARTAMENTOS_INTEGRADOS, tabelasDoDepartamento } from "@/lib/cadastro-tabelas";

interface CadastroTabelasTabProps {
  /** Departamento aberto pelo submenu (vazio = escolhido na tela). */
  departamento?: string;
}

/**
 * Cadastro de Tabelas — nomes das colunas e opções das colunas de menu
 * suspenso das tabelas de cada departamento. O que é salvo aqui vale para as
 * tabelas do departamento selecionado.
 */
export default function CadastroTabelasTab({
  departamento,
}: CadastroTabelasTabProps) {
  const { data: departments } = useDepartments();
  const nomes = sortDepartments((departments ?? []).map((item) => item.name));
  const [selecionado, setSelecionado] = useState(
    departamento ?? FISCAL_DEPARTMENT_NAME
  );

  /* O submenu escolhido no painel define o departamento exibido. */
  useEffect(() => {
    if (departamento) setSelecionado(departamento);
  }, [departamento]);

  const integrado = DEPARTAMENTOS_INTEGRADOS.includes(selecionado);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Table className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">Cadastro de Tabelas</h2>
          <p className="text-sm text-muted-foreground">
            Nomes das colunas e opções dos menus suspensos das tabelas do
            sistema.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="cadastro-departamento" className="text-xs text-muted-foreground">
          Departamento
        </Label>
        <Select value={selecionado} onValueChange={setSelecionado}>
          <SelectTrigger id="cadastro-departamento" className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {nomes.map((nome) => (
              <SelectItem key={nome} value={nome}>
                {departmentMenuLabel(nome)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selecionado === FISCAL_DEPARTMENT_NAME ? (
        <TabelasFiscal />
      ) : (
        <TabelasEmPreparacao departamento={selecionado} integrado={integrado} />
      )}
    </div>
  );
}

/**
 * Departamento cujas tabelas ainda não leem o cadastro: mostra os módulos
 * existentes para o cadastro das colunas ser ligado em seguida.
 */
function TabelasEmPreparacao({
  departamento,
  integrado,
}: {
  departamento: string;
  integrado: boolean;
}) {
  const tabelas = tabelasDoDepartamento(departamento, undefined);

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-sm font-medium">
        {departmentMenuLabel(departamento)}
      </p>
      {tabelas.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Este departamento ainda não tem tabelas cadastradas.
        </p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {tabelas.map((tabela) => (
            <li
              key={tabela.nome}
              className="rounded-lg border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
            >
              {tabela.nome}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        {integrado
          ? "As colunas destas tabelas já leem este cadastro."
          : "Em preparação: as colunas destas tabelas ainda não leem este cadastro. A ligação será feita em seguida, na ordem que você definir."}
      </p>
    </div>
  );
}
