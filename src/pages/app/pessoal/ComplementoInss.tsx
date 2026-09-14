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
  useComplementoInss,
  useComplementoInssAll,
  useSaveComplementoInss,
} from "@/hooks/use-complemento-inss";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import { PESSOAL_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import {
  COMPLEMENTO_INSS_DARF_OPTIONS,
  COMPLEMENTO_INSS_ENVIO_OPTIONS,
} from "@/lib/complemento-inss";
import { defaultReferenceMonth } from "@/lib/fiscal-month";
import { cn } from "@/lib/utils";
import type { ComplementoInssInput } from "@/lib/types";

const STORAGE_KEY = "pessoal:complemento-inss-mes";

function readStoredMes(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? defaultReferenceMonth();
  } catch {
    return defaultReferenceMonth();
  }
}

const CELL = "px-1 py-1 text-[11px]";
const HEAD = "px-1 py-1 text-[11px] font-medium text-muted-foreground";

export default function ComplementoInss() {
  const [mes, setMes] = useState<string>(readStoredMes);
  const [busca, setBusca] = useState({
    numero: "",
    empresa: "",
    darf: "",
    envio: "",
  });

  const setBuscaField = (key: keyof typeof busca, value: string) => {
    setBusca((prev) => ({ ...prev, [key]: value }));
  };

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = useComplementoInss(mes);
  const { data: allRecords } = useComplementoInssAll();
  const saveMutation = useSaveComplementoInss(mes);

  const pessoal = findDepartmentByName(departments, PESSOAL_DEPARTMENT_NAME);

  const rows = (companies ?? [])
    .filter((company) =>
      pessoal
        ? company.department_links.some(
            (link) => link.department_id === pessoal.id
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

  /**
   * Envio efetivo: usa o registro do mês; se não existir, mantém "Desativado"
   * fixo caso o mês anterior mais recente seja Desativado.
   */
  const effectiveEnvio = (companyId: string): string | null => {
    const current = recordByCompany.get(companyId);
    if (current) return current.envio;
    const prior = (allRecords ?? [])
      .filter(
        (record) =>
          record.company_id === companyId && record.mes_referencia < mes
      )
      .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia));
    return prior[0]?.envio === "Desativado" ? "Desativado" : null;
  };

  const isDesativada = (companyId: string): boolean =>
    effectiveEnvio(companyId) === "Desativado";

  const filteredRows = rows.filter((company) => {
    const record = recordByCompany.get(company.id);
    const envio = effectiveEnvio(company.id) ?? "";
    const match = (
      value: string | null | undefined,
      query: string
    ): boolean =>
      !query ||
      (value ?? "")
        .toLocaleLowerCase("pt-BR")
        .includes(query.toLocaleLowerCase("pt-BR"));
    const selectOrBlank = (
      value: string | null | undefined,
      query: string
    ): boolean => {
      if (query === "branco") return !value;
      return !query || (value ?? "") === query;
    };
    return (
      match(company.numero, busca.numero) &&
      match(company.name, busca.empresa) &&
      selectOrBlank(record?.darf, busca.darf) &&
      selectOrBlank(envio, busca.envio)
    );
  });

  const activeRows = filteredRows.filter(
    (company) => !isDesativada(company.id)
  );
  const inactiveRows = filteredRows.filter((company) =>
    isDesativada(company.id)
  );

  const save = (companyId: string, patch: Record<string, unknown>) => {
    const current = recordByCompany.get(companyId);
    saveMutation.mutate(
      {
        company_id: companyId,
        mes_referencia: mes,
        envio: effectiveEnvio(companyId) ?? null,
        darf: current?.darf ?? null,
        ...patch,
      } as unknown as ComplementoInssInput,
      {
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Erro ao salvar."
          );
        },
      }
    );
  };

  const handleMonthChange = (value: string) => {
    setMes(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignora armazenamento indisponível
    }
  };

  const renderSelectCell = (
    companyId: string,
    value: string,
    options: readonly string[],
    patchKey: string,
    toneClass: Record<string, string> = {}
  ) => (
    <Select
      value={value === "" ? "none" : value}
      onValueChange={(next) =>
        save(companyId, { [patchKey]: next === "none" ? null : next })
      }
    >
      <SelectTrigger
        className={cn(
          "h-7 w-full min-w-0 px-1 text-xs font-semibold",
          toneClass[value]
        )}
      >
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">—</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const ENVIO_TONE = {
    Enviado:
      "bg-status-success text-status-success-foreground hover:bg-status-success/90",
    Pendente:
      "bg-status-danger text-status-danger-foreground hover:bg-status-danger/90",
    Desativado: "bg-muted text-muted-foreground hover:bg-muted/80",
  };

  const renderFilterSelect = (
    key: keyof typeof busca,
    label: string,
    options: readonly string[]
  ) => (
    <TableHead className={`${HEAD} w-28 align-bottom`}>
      <span className="mb-1 block whitespace-nowrap">{label}</span>
      <Select
        value={busca[key] === "" ? "todos" : busca[key]}
        onValueChange={(value) =>
          setBuscaField(key, value === "todos" ? "" : value)
        }
      >
        <SelectTrigger className="h-6 w-full min-w-0 px-1 text-xs">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="branco">Em branco</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TableHead>
  );

  const renderRow = (company: (typeof rows)[number]) => {
    const record = recordByCompany.get(company.id);
    const envio = effectiveEnvio(company.id) ?? "";
    return (
      <TableRow key={company.id}>
        <TableCell className={`${CELL} whitespace-nowrap font-medium`}>
          {company.numero || "—"}
        </TableCell>
        <TableCell className={`${CELL}`}>
          <span className="block truncate font-medium" title={company.name}>
            {company.name}
          </span>
        </TableCell>
        <TableCell className={`${CELL} w-24`}>
          {renderSelectCell(
            company.id,
            record?.darf ?? "",
            COMPLEMENTO_INSS_DARF_OPTIONS,
            "darf"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-28`}>
          {renderSelectCell(
            company.id,
            envio,
            COMPLEMENTO_INSS_ENVIO_OPTIONS,
            "envio",
            ENVIO_TONE
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Complemento INSS</h2>
        <p className="text-sm text-muted-foreground">
          Empresas vinculadas ao departamento {PESSOAL_DEPARTMENT_NAME}.
        </p>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="cinss-mes">Mês de referência</Label>
        <Input
          id="cinss-mes"
          type="month"
          value={mes}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="mt-1.5"
        />
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
          <Table className="table-fixed min-w-[720px]">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className={`${HEAD} w-14 align-bottom`}>
                  <span className="mb-1 block">Nº</span>
                  <Input
                    value={busca.numero}
                    onChange={(e) => setBuscaField("numero", e.target.value)}
                    placeholder="Filtrar"
                    className="h-6 w-full min-w-0 px-1 text-xs"
                  />
                </TableHead>
                <TableHead className={`${HEAD} w-48 align-bottom`}>
                  <span className="mb-1 block">Empresa</span>
                  <Input
                    value={busca.empresa}
                    onChange={(e) => setBuscaField("empresa", e.target.value)}
                    placeholder="Filtrar"
                    className="h-6 w-full min-w-0 px-1 text-xs"
                  />
                </TableHead>
                {renderFilterSelect("darf", "DARF", COMPLEMENTO_INSS_DARF_OPTIONS)}
                {renderFilterSelect("envio", "Envio", COMPLEMENTO_INSS_ENVIO_OPTIONS)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeRows.map(renderRow)}
              {inactiveRows.length > 0 && (
                <TableRow className="bg-muted/50">
                  <TableCell
                    colSpan={4}
                    className="px-2 py-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    Empresas desativadas
                  </TableCell>
                </TableRow>
              )}
              {inactiveRows.map(renderRow)}
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className={`${CELL} py-8 text-center text-muted-foreground`}
                  >
                    {Object.values(busca).some(Boolean) && rows.length > 0
                      ? "Nenhuma empresa encontrada com os filtros."
                      : `Nenhuma empresa vinculada ao departamento ${PESSOAL_DEPARTMENT_NAME}. Marque esse departamento no cadastro de empresas para que elas apareçam aqui.`}
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
