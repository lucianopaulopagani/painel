import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useBalanceteBalanco,
  useSaveBalanceteBalanco,
} from "@/hooks/use-balancete-balanco";
import { useCompanies } from "@/hooks/use-companies";
import { useContabilUsuarios } from "@/hooks/use-contabil-usuarios";
import { useDepartments } from "@/hooks/use-departments";
import { CONTABIL_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import {
  BALANCETE_MESES,
  BALANCETE_MES_OPTIONS,
  balanceteAnos,
} from "@/lib/contabil";
import { cn } from "@/lib/utils";
import type { BalanceteBalancoInput } from "@/lib/types";

const STORAGE_KEY = "contabil:balancete-ano";

function readStoredAno(): string {
  const anos = balanceteAnos();
  try {
    return (
      localStorage.getItem(STORAGE_KEY) ??
      String(new Date().getFullYear())
    );
  } catch {
    return anos[anos.length - 1];
  }
}

const CELL = "px-1 py-1 text-[11px]";
const HEAD = "px-1 py-1 text-[11px] font-medium text-muted-foreground";

/* Colunas fixas: Nº (w-10 = 40px) e Empresa (w-48 = 192px). */
const STICKY_HEAD = "sticky z-20 bg-muted";
const STICKY_CELL = "sticky z-10 bg-background";
const EMPRESA_LEFT = "left-[40px]";
const EMPRESA_EDGE = "border-r border-border";

export default function BalanceteBalanco() {
  const [ano, setAno] = useState<string>(readStoredAno);
  const [busca, setBusca] = useState<Record<string, string>>({
    usuario: "",
    numero: "",
    empresa: "",
    jan: "",
    fev: "",
    mar: "",
    abr: "",
    mai: "",
    jun: "",
    jul: "",
    ago: "",
    set: "",
    out: "",
    nov: "",
    dez: "",
    fechamento: "",
  });

  const setBuscaField = (key: string, value: string) => {
    setBusca((prev) => ({ ...prev, [key]: value }));
  };

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = useBalanceteBalanco(ano);
  const { data: usuarios } = useContabilUsuarios();
  const saveMutation = useSaveBalanceteBalanco(ano);

  const contabil = findDepartmentByName(departments, CONTABIL_DEPARTMENT_NAME);

  const rows = (companies ?? [])
    .filter((company) =>
      contabil
        ? company.department_links.some(
            (link) => link.department_id === contabil.id
          )
        : false
    )
    .sort((a, b) => {
      if (!a.numero && !b.numero) {
        return a.name.localeCompare(b.name, "pt-BR");
      }
      if (!a.numero) return 1;
      if (!b.numero) return -1;
      return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });
    });

  const recordByCompany = new Map(
    (records ?? []).map((record) => [record.company_id, record])
  );

  const filteredRows = rows.filter((company) => {
    const record = recordByCompany.get(company.id);
    const match = (value: string | null | undefined, query: string): boolean =>
      !query ||
      (value ?? "")
        .toLocaleLowerCase("pt-BR")
        .includes(query.toLocaleLowerCase("pt-BR"));
    const selectOrBlank = (value: string | null | undefined, query: string): boolean => {
      if (query === "branco") return !value;
      return !query || (value ?? "") === query;
    };
    const responsaveis =
      company.department_links.find(
        (link) => link.department_id === contabil?.id
      )?.profile_ids ?? [];
    const matchesUsuario =
      busca.usuario === "" ||
      (busca.usuario === "sem-responsavel"
        ? responsaveis.length === 0
        : responsaveis.includes(busca.usuario));
    return (
      matchesUsuario &&
      match(company.numero, busca.numero) &&
      match(company.name, busca.empresa) &&
      BALANCETE_MESES.every((mes) =>
        selectOrBlank(record?.[mes.key], busca[mes.key])
      ) &&
      match(record?.fechamento, busca.fechamento)
    );
  });

  const save = (companyId: string, patch: Record<string, unknown>) => {
    const current = recordByCompany.get(companyId);
    const base = current ?? {};
    const {
      id: _id,
      created_at: _createdAt,
      updated_at: _updatedAt,
      ...fields
    } = base;
    saveMutation.mutate(
      {
        company_id: companyId,
        ano,
        ...fields,
        ...patch,
      } as unknown as BalanceteBalancoInput,
      {
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Erro ao salvar."
          );
        },
      }
    );
  };

  const handleAnoChange = (value: string) => {
    setAno(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignora armazenamento indisponível
    }
  };

  const renderMonthCell = (
    companyId: string,
    mesKey: (typeof BALANCETE_MESES)[number]["key"]
  ) => (
    <Select
      value={(recordByCompany.get(companyId)?.[mesKey] ?? "") === "" ? "none" : (recordByCompany.get(companyId)?.[mesKey] ?? "")}
      onValueChange={(next) =>
        save(companyId, { [mesKey]: next === "none" ? null : next })
      }
    >
      <SelectTrigger
        className={cn(
          "h-7 w-full min-w-0 px-1 text-xs font-semibold",
          recordByCompany.get(companyId)?.[mesKey] === "OK" &&
            "bg-status-success text-status-success-foreground hover:bg-status-success/90"
        )}
      >
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">—</SelectItem>
        {BALANCETE_MES_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const renderFilterInput = (key: string, label: string) => (
    <TableHead className={`${HEAD} align-bottom`}>
      <span className="mb-1 block whitespace-nowrap">{label}</span>
      <Input
        value={busca[key] ?? ""}
        onChange={(e) => setBuscaField(key, e.target.value)}
        placeholder="Filtrar"
        className="h-6 w-full min-w-0 px-1 text-xs"
      />
    </TableHead>
  );

  const renderFilterMonth = (key: string, label: string) => (
    <TableHead className={`${HEAD} w-14 align-bottom`}>
      <span className="mb-1 block whitespace-nowrap">{label}</span>
      <Select
        value={busca[key] === "" ? "todos" : busca[key]}
        onValueChange={(value) =>
          setBuscaField(key, value === "todos" ? "" : value)
        }
      >
        <SelectTrigger className="h-6 w-full min-w-0 px-1 text-xs">
          <SelectValue placeholder="T" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="branco">Em branco</SelectItem>
          {BALANCETE_MES_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Balancete/Balanço</h2>
        <p className="text-sm text-muted-foreground">
          Empresas vinculadas ao departamento {CONTABIL_DEPARTMENT_NAME}.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label htmlFor="bb-ano">Ano</Label>
          <Select value={ano} onValueChange={handleAnoChange}>
            <SelectTrigger id="bb-ano" className="mt-1.5 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {balanceteAnos().map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="bb-usuario">Usuário do departamento</Label>
          <Select
            value={busca.usuario === "" ? "todos" : busca.usuario}
            onValueChange={(value) =>
              setBuscaField("usuario", value === "todos" ? "" : value)
            }
          >
            <SelectTrigger id="bb-usuario" className="mt-1.5 w-64">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="sem-responsavel">Sem responsável</SelectItem>
              {(usuarios ?? []).map((usuario) => (
                <SelectItem key={usuario.id} value={usuario.id}>
                  {usuario.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {isError && (
        <p className="py-12 text-center text-sm text-destructive">
          Não foi possível carregar as empresas.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border">
          <Table className="table-fixed min-w-[1064px]">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className={`${HEAD} w-10 ${STICKY_HEAD}`}>
                  <span className="mb-1 block">Nº</span>
                  <Input
                    value={busca.numero}
                    onChange={(e) => setBuscaField("numero", e.target.value)}
                    placeholder="Filtrar"
                    className="h-6 w-full min-w-0 px-1 text-xs"
                  />
                </TableHead>
                <TableHead
                  className={`${HEAD} w-48 ${STICKY_HEAD} ${EMPRESA_LEFT} ${EMPRESA_EDGE}`}
                >
                  <span className="mb-1 block">Empresa</span>
                  <Input
                    value={busca.empresa}
                    onChange={(e) => setBuscaField("empresa", e.target.value)}
                    placeholder="Filtrar"
                    className="h-6 w-full min-w-0 px-1 text-xs"
                  />
                </TableHead>
                {BALANCETE_MESES.map((mes) =>
                  renderFilterMonth(mes.key, mes.label)
                )}
                {renderFilterInput("fechamento", "Fechamento")}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((company) => {
                const record = recordByCompany.get(company.id);
                return (
                  <TableRow key={company.id}>
                    <TableCell
                      className={`${CELL} w-10 whitespace-nowrap text-center font-medium ${STICKY_CELL}`}
                    >
                      {company.numero || "—"}
                    </TableCell>
                    <TableCell
                      className={`${CELL} w-48 ${STICKY_CELL} ${EMPRESA_LEFT} ${EMPRESA_EDGE}`}
                    >
                      <span
                        className="block truncate font-medium"
                        title={company.name}
                      >
                        {company.name}
                      </span>
                    </TableCell>
                    {BALANCETE_MESES.map((mes) => (
                      <TableCell key={mes.key} className={`${CELL} w-14`}>
                        {renderMonthCell(company.id, mes.key)}
                      </TableCell>
                    ))}
                    <TableCell className={`${CELL} w-40`}>
                      <Input
                        key={`${company.id}:${ano}:fechamento`}
                        defaultValue={record?.fechamento ?? ""}
                        title={record?.fechamento ?? ""}
                        onBlur={(event) =>
                          save(company.id, {
                            fechamento: event.target.value.trim() || null,
                          })
                        }
                        className="h-7 w-full min-w-0 px-1 text-[11px]"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={15}
                    className={`${CELL} py-8 text-center text-muted-foreground`}
                  >
                    {Object.values(busca).some(Boolean) && rows.length > 0
                      ? "Nenhuma empresa encontrada com os filtros."
                      : `Nenhuma empresa vinculada ao departamento ${CONTABIL_DEPARTMENT_NAME}. Marque esse departamento no cadastro de empresas para que elas apareçam aqui.`}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
