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
import { TabelasDeModulos } from "@/components/admin/TabelasDeModulos";
import TabelasFiscal from "@/components/admin/TabelasFiscal";
import { useAllDepartmentSubmenus } from "@/hooks/use-department-submenus";
import { useDepartments } from "@/hooks/use-departments";
import {
  FISCAL_DEPARTMENT_NAME,
  departmentMenuLabel,
  sortDepartments,
} from "@/lib/departments";
import { DEPARTAMENTOS_INTEGRADOS } from "@/lib/cadastro-tabelas";

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
  const { data: allSubmenus } = useAllDepartmentSubmenus();
  const nomes = sortDepartments((departments ?? []).map((item) => item.name));
  const [selecionado, setSelecionado] = useState(
    departamento ?? FISCAL_DEPARTMENT_NAME
  );

  /* O submenu escolhido no painel define o departamento exibido. */
  useEffect(() => {
    if (departamento) setSelecionado(departamento);
  }, [departamento]);

  const departamentoId = (departments ?? []).find(
    (item) => item.name === selecionado
  )?.id;
  const submenus = (allSubmenus ?? [])
    .filter((submenu) => submenu.department_id === departamentoId)
    .sort((a, b) => a.position - b.position)
    .map((submenu) => submenu.name);

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
        <Label
          htmlFor="cadastro-departamento"
          className="text-xs text-muted-foreground"
        >
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

      {selecionado === FISCAL_DEPARTMENT_NAME && <TabelasFiscal />}

      <TabelasDeModulos departamento={selecionado} submenus={submenus} />

      {!integrado && (
        <p className="text-xs text-muted-foreground">
          Em preparação: as tabelas deste departamento ainda não leem este
          cadastro.
        </p>
      )}
    </div>
  );
}
