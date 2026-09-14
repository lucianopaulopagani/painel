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
  useDomesticas,
  useDomesticaMovimento,
  useSaveDomestica,
  useSaveDomesticaMovimento,
} from "@/hooks/use-domesticas";
import {
  DOMESTICAS_DAE_OPTIONS,
  DOMESTICAS_ENVIO_OPTIONS,
  DOMESTICAS_FOLHA_OPTIONS,
  DOMESTICAS_MESES_OPTIONS,
  DOMESTICAS_PONTO_OPTIONS,
  DOMESTICAS_STATUS_OPTIONS,
} from "@/lib/domesticas";
import { defaultReferenceMonth } from "@/lib/fiscal-month";
import { cn } from "@/lib/utils";
import { formatCpfCnpj } from "@/lib/utils";
import type {
  DomesticaMovimentoInput,
  DomesticaMovimentoRecord,
  DomesticasRecord,
} from "@/lib/types";

const STORAGE_KEY = "pessoal:domesticas-mes";

function readStoredMes(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? defaultReferenceMonth();
  } catch {
    return defaultReferenceMonth();
  }
}

const CELL = "px-1 py-1 text-[11px]";
const HEAD = "px-1 py-1 text-[11px] font-medium text-muted-foreground";

export default function Domesticas() {
  const [mes, setMes] = useState<string>(readStoredMes);
  const [busca, setBusca] = useState({
    status: "",
    dataBase: "",
    numero: "",
    nome: "",
    cpf: "",
    senha: "",
    folha: "",
    dae: "",
    envio: "",
    ponto: "",
  });

  const setBuscaField = (key: keyof typeof busca, value: string) => {
    setBusca((prev) => ({ ...prev, [key]: value }));
  };

  const { data: domesticas, isLoading, isError } = useDomesticas();
  const { data: records } = useDomesticaMovimento(mes);
  const saveDomesticaMutation = useSaveDomestica();
  const saveMovimentoMutation = useSaveDomesticaMovimento(mes);

  const rows = (domesticas ?? []).sort((a, b) => {
    if (!a.numero && !b.numero) return a.nome.localeCompare(b.nome, "pt-BR");
    if (!a.numero) return 1;
    if (!b.numero) return -1;
    return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });
  });

  const movByDomestica = new Map<string, DomesticaMovimentoRecord>(
    (records ?? []).map((record) => [record.domestica_id, record])
  );

  const semMovimento = (domesticaId: string): boolean => {
    const status = movByDomestica.get(domesticaId)?.status;
    return !status || status === "Desativado";
  };

  const filteredRows = rows.filter((domestica) => {
    const record = movByDomestica.get(domestica.id);
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
      selectOrBlank(record?.status, busca.status) &&
      selectOrBlank(record?.data_base, busca.dataBase) &&
      match(domestica.numero, busca.numero) &&
      match(domestica.nome, busca.nome) &&
      match(domestica.cpf, busca.cpf) &&
      match(domestica.senha, busca.senha) &&
      selectOrBlank(record?.folha, busca.folha) &&
      selectOrBlank(record?.dae, busca.dae) &&
      selectOrBlank(record?.envio, busca.envio) &&
      selectOrBlank(record?.ponto, busca.ponto)
    );
  });

  const activeRows = filteredRows.filter(
    (domestica) => !semMovimento(domestica.id)
  );
  const inactiveRows = filteredRows.filter((domestica) =>
    semMovimento(domestica.id)
  );

  const saveMovimento = (
    domesticaId: string,
    patch: Record<string, unknown>
  ) => {
    const current = movByDomestica.get(domesticaId);
    const base = current ?? {};
    const {
      id: _id,
      created_at: _createdAt,
      updated_at: _updatedAt,
      ...fields
    } = base;
    saveMovimentoMutation.mutate(
      {
        domestica_id: domesticaId,
        mes_referencia: mes,
        ...fields,
        ...patch,
      } as unknown as DomesticaMovimentoInput,
      {
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Erro ao salvar."
          );
        },
      }
    );
  };

  const saveDomestica = (id: string, patch: Record<string, unknown>) => {
    saveDomesticaMutation.mutate(
      { id, ...patch },
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
    domesticaId: string,
    value: string,
    options: readonly string[],
    patchKey: string,
    toneClass: Record<string, string> = {}
  ) => (
    <Select
      value={value === "" ? "none" : value}
      onValueChange={(next) =>
        saveMovimento(domesticaId, {
          [patchKey]: next === "none" ? null : next,
        })
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

  const renderTextCell = (
    domesticaId: string,
    value: string | null,
    patchKey: string,
    format?: (input: string) => string
  ) => (
    <Input
      key={`${domesticaId}:${patchKey}`}
      defaultValue={format ? format(value ?? "") : (value ?? "")}
      title={value ?? ""}
      onBlur={(event) => {
        const raw = format
          ? event.target.value.replace(/\D/g, "")
          : event.target.value.trim();
        const next = raw.trim();
        saveDomestica(domesticaId, {
          [patchKey]: next || null,
        });
      }}
      className="h-7 w-full min-w-0 px-1 text-[11px]"
    />
  );

  const STATUS_TONE = {
    Concluído:
      "bg-status-success text-status-success-foreground hover:bg-status-success/90",
    Pendente:
      "bg-status-danger text-status-danger-foreground hover:bg-status-danger/90",
    "Em Andamento":
      "bg-status-warning text-status-warning-foreground hover:bg-status-warning/90",
    "Em Ajuste": "bg-primary/10 text-primary hover:bg-primary/15",
    Desativado: "bg-muted text-muted-foreground hover:bg-muted/80",
  };
  const ENVIO_TONE = {
    Enviado:
      "bg-status-success text-status-success-foreground hover:bg-status-success/90",
    Pendente:
      "bg-status-danger text-status-danger-foreground hover:bg-status-danger/90",
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

  const renderFilterInput = (key: keyof typeof busca, label: string) => (
    <TableHead className={`${HEAD} align-bottom`}>
      <span className="mb-1 block whitespace-nowrap">{label}</span>
      <Input
        value={busca[key]}
        onChange={(e) => setBuscaField(key, e.target.value)}
        placeholder="Filtrar"
        className="h-6 w-full min-w-0 px-1 text-xs"
      />
    </TableHead>
  );

  const renderRow = (domestica: DomesticasRecord) => {
    const record = movByDomestica.get(domestica.id);
    return (
      <TableRow key={domestica.id}>
        <TableCell className={`${CELL} w-28`}>
          {renderSelectCell(
            domestica.id,
            record?.status ?? "",
            DOMESTICAS_STATUS_OPTIONS,
            "status",
            STATUS_TONE
          )}
        </TableCell>
        <TableCell className={`${CELL} w-28`}>
          {renderSelectCell(
            domestica.id,
            record?.data_base ?? "",
            DOMESTICAS_MESES_OPTIONS,
            "data_base"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-12`}>
          {renderTextCell(domestica.id, domestica.numero, "numero")}
        </TableCell>
        <TableCell className={`${CELL} w-36`}>
          {renderTextCell(domestica.id, domestica.nome, "nome")}
        </TableCell>
        <TableCell className={`${CELL} w-32`}>
          {renderTextCell(domestica.id, domestica.cpf, "cpf", formatCpfCnpj)}
        </TableCell>
        <TableCell className={`${CELL} w-32`}>
          {renderTextCell(domestica.id, domestica.senha, "senha")}
        </TableCell>
        <TableCell className={`${CELL} w-20`}>
          {renderSelectCell(
            domestica.id,
            record?.folha ?? "",
            DOMESTICAS_FOLHA_OPTIONS,
            "folha"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-16`}>
          {renderSelectCell(
            domestica.id,
            record?.dae ?? "",
            DOMESTICAS_DAE_OPTIONS,
            "dae"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-24`}>
          {renderSelectCell(
            domestica.id,
            record?.envio ?? "",
            DOMESTICAS_ENVIO_OPTIONS,
            "envio",
            ENVIO_TONE
          )}
        </TableCell>
        <TableCell className={`${CELL} w-20`}>
          {renderSelectCell(
            domestica.id,
            record?.ponto ?? "",
            DOMESTICAS_PONTO_OPTIONS,
            "ponto"
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Domésticas</h2>
        <p className="text-sm text-muted-foreground">
          Folha de pagamento das domésticas — departamento Pessoal.
        </p>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="dom-mes">Mês de referência</Label>
        <Input
          id="dom-mes"
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
          Não foi possível carregar as domésticas.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border">
          <Table className="table-fixed min-w-[992px]">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                {renderFilterSelect("status", "Status", DOMESTICAS_STATUS_OPTIONS)}
                {renderFilterSelect("dataBase", "Data Base", DOMESTICAS_MESES_OPTIONS)}
                {renderFilterInput("numero", "N°")}
                {renderFilterInput("nome", "Nome")}
                {renderFilterInput("cpf", "CPF")}
                {renderFilterInput("senha", "Senha")}
                {renderFilterSelect("folha", "Folha", DOMESTICAS_FOLHA_OPTIONS)}
                {renderFilterSelect("dae", "DAE", DOMESTICAS_DAE_OPTIONS)}
                {renderFilterSelect("envio", "Envio", DOMESTICAS_ENVIO_OPTIONS)}
                {renderFilterSelect("ponto", "Ponto", DOMESTICAS_PONTO_OPTIONS)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeRows.map(renderRow)}
              {inactiveRows.length > 0 && (
                <TableRow className="bg-muted/50">
                  <TableCell
                    colSpan={10}
                    className="px-2 py-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    SEM MOVIMENTO
                  </TableCell>
                </TableRow>
              )}
              {inactiveRows.map(renderRow)}
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className={`${CELL} py-8 text-center text-muted-foreground`}
                  >
                    {Object.values(busca).some(Boolean) && rows.length > 0
                      ? "Nenhuma doméstica encontrada com os filtros."
                      : "Nenhuma doméstica cadastrada."}
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
