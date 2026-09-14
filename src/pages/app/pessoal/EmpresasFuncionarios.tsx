import {
  type PointerEvent as ReactPointerEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useEmpresasFuncionarios, useEmpresasFuncionariosAll, useSaveEmpresasFuncionarios } from "@/hooks/use-empresas-funcionarios";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import { PESSOAL_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import {
  EMPRESAS_FUNC_DCTFWEB_OPTIONS,
  EMPRESAS_FUNC_EMPRESTIMO_OPTIONS,
  EMPRESAS_FUNC_ENVIO_OPTIONS,
  EMPRESAS_FUNC_FGTS_OPTIONS,
  EMPRESAS_FUNC_FLAG_OPTIONS,
  EMPRESAS_FUNC_FOLHA_OPTIONS,
  EMPRESAS_FUNC_MESES_OPTIONS,
  EMPRESAS_FUNC_STATUS_OPTIONS,
} from "@/lib/empresas-funcionarios";
import { defaultReferenceMonth } from "@/lib/fiscal-month";
import { formatCpfCnpj } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { EmpresasFuncionariosInput } from "@/lib/types";

const STORAGE_KEY = "pessoal:empresas-funcionarios-mes";

function readStoredMes(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? defaultReferenceMonth();
  } catch {
    return defaultReferenceMonth();
  }
}

const CELL = "px-1 py-1 text-[11px]";
const HEAD = "px-1 py-1 text-[11px] font-medium text-muted-foreground";

/* Colunas fixas até "Empresa": offsets acompanham w-32 (128px) + w-10 (40px). */
const STICKY_HEAD = "sticky top-0 z-20 bg-muted";
const VHEAD = "sticky top-0 z-10 bg-muted";
const STICKY_CELL = "sticky z-10 bg-background";
const N_LEFT = "left-[128px]";
const EMPRESA_LEFT = "left-[168px]";
const EMPRESA_EDGE = "border-r border-border";

export default function EmpresasFuncionarios() {
  const [mes, setMes] = useState<string>(readStoredMes);
  const [busca, setBusca] = useState({
    status: "",
    numero: "",
    empresa: "",
    cnpj: "",
    tributacao: "",
    dataBase: "",
    folha: "",
    emprestimo: "",
    fgts: "",
    taxaSindical: "",
    dctfweb: "",
    envio: "",
    notas: "",
  });

  const setBuscaField = (key: keyof typeof busca, value: string) => {
    setBusca((prev) => ({ ...prev, [key]: value }));
  };

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = useEmpresasFuncionarios(mes);
  const { data: allRecords } = useEmpresasFuncionariosAll();
  const saveMutation = useSaveEmpresasFuncionarios(mes);

  /* Barra horizontal fixa no rodapé da tela (customizada, sempre visível). */
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number } | null>(null);
  const [tableMetrics, setTableMetrics] = useState({
    scrollWidth: 0,
    clientWidth: 0,
  });
  const [scrollLeft, setScrollLeft] = useState(0);

  /* Diálogo de edição das notas (obs. fechamento, info. sindicato etc.). */
  const [noteDialog, setNoteDialog] = useState<{
    companyId: string;
    observacao: string;
    infoSindicato: string;
    infoSindicatoPatronal: string;
  } | null>(null);

  useLayoutEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const update = () =>
      setTableMetrics({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoading]);

  const hasOverflow = tableMetrics.scrollWidth > tableMetrics.clientWidth;
  const maxScroll = Math.max(
    0,
    tableMetrics.scrollWidth - tableMetrics.clientWidth
  );
  const thumbWidthPct =
    tableMetrics.scrollWidth > 0
      ? Math.max(
          16,
          (tableMetrics.clientWidth / tableMetrics.scrollWidth) * 100
        )
      : 100;
  const thumbLeftPct =
    maxScroll > 0 ? (scrollLeft / maxScroll) * (100 - thumbWidthPct) : 0;

  const scrollTableTo = (targetLeft: number) => {
    const table = tableScrollRef.current;
    if (!table) return;
    table.scrollLeft = Math.max(0, Math.min(targetLeft, maxScroll));
  };

  const handleTrackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || maxScroll <= 0) return;
    const rect = track.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const thumbStart = (thumbLeftPct / 100) * rect.width;
    const thumbWidth = (thumbWidthPct / 100) * rect.width;
    const clickedOnThumb = x >= thumbStart && x <= thumbStart + thumbWidth;
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: clickedOnThumb ? x - thumbStart : thumbWidth / 2,
    };
    track.setPointerCapture(event.pointerId);
    if (!clickedOnThumb) scrollTableTo((x / rect.width) * maxScroll);
  };

  const handleTrackPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const track = trackRef.current;
    if (!drag || !track || drag.pointerId !== event.pointerId) return;
    const rect = track.getBoundingClientRect();
    const x = event.clientX - rect.left - drag.offsetX;
    scrollTableTo((x / rect.width) * maxScroll);
  };

  const handleTrackPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  const noteDialogCompany = noteDialog
    ? companies?.find((company) => company.id === noteDialog.companyId)
    : null;

  const handleNoteSave = () => {
    if (!noteDialog) return;
    save(noteDialog.companyId, {
      observacao: noteDialog.observacao.trim() || null,
      info_sindicato: noteDialog.infoSindicato.trim() || null,
      info_sindicato_patronal:
        noteDialog.infoSindicatoPatronal.trim() || null,
    });
    setNoteDialog(null);
  };

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
   * Status efetivo: usa o registro do mês; se não existir, mantém
   * "Desativado" fixo caso o mês anterior mais recente seja Desativado.
   */
  const effectiveStatus = (companyId: string): string | null => {
    const current = recordByCompany.get(companyId);
    if (current) return current.status;
    const prior = (allRecords ?? [])
      .filter(
        (record) =>
          record.company_id === companyId && record.mes_referencia < mes
      )
      .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia));
    return prior[0]?.status === "Desativado" ? "Desativado" : null;
  };

  const isDesativada = (companyId: string): boolean =>
    effectiveStatus(companyId) === "Desativado";

  /**
   * Data Base efetiva: usa o registro do mês; se não existir, herda a do mês
   * anterior mais recente (levada para os meses seguintes).
   */
  const effectiveDataBase = (companyId: string): string | null => {
    const current = recordByCompany.get(companyId);
    if (current) return current.data_base;
    const prior = (allRecords ?? [])
      .filter(
        (record) =>
          record.company_id === companyId && record.mes_referencia < mes
      )
      .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia));
    return prior[0]?.data_base ?? null;
  };

  /**
   * Empréstimo efetivo: usa o registro do mês; se não existir, herda o do
   * mês anterior mais recente (levado para os meses seguintes).
   */
  const effectiveEmprestimo = (companyId: string): string | null => {
    const current = recordByCompany.get(companyId);
    if (current) return current.emprestimo;
    const prior = (allRecords ?? [])
      .filter(
        (record) =>
          record.company_id === companyId && record.mes_referencia < mes
      )
      .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia));
    return prior[0]?.emprestimo ?? null;
  };

  const filteredRows = rows.filter((company) => {
    const record = recordByCompany.get(company.id);
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
      selectOrBlank(effectiveStatus(company.id), busca.status) &&
      match(company.numero, busca.numero) &&
      match(company.name, busca.empresa) &&
      match(company.documento, busca.cnpj) &&
      match(company.tributacao, busca.tributacao) &&
      match(effectiveDataBase(company.id), busca.dataBase) &&
      match(record?.folha, busca.folha) &&
      selectOrBlank(effectiveEmprestimo(company.id), busca.emprestimo) &&
      selectOrBlank(record?.fgts, busca.fgts) &&
      selectOrBlank(record?.taxa_sindical, busca.taxaSindical) &&
      selectOrBlank(record?.dctfweb, busca.dctfweb) &&
      selectOrBlank(record?.envio, busca.envio) &&
      match(
        [record?.observacao, record?.info_sindicato, record?.info_sindicato_patronal]
          .filter(Boolean)
          .join(" "),
        busca.notas
      )
    );
  });

  const activeRows = filteredRows.filter(
    (company) => !isDesativada(company.id)
  );
  const inactiveRows = filteredRows.filter((company) =>
    isDesativada(company.id)
  );

  const save = (companyId: string, patch: Record<string, unknown>) => {
    const effStatus = effectiveStatus(companyId);
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
        mes_referencia: mes,
        ...fields,
        status: effStatus ?? null,
        data_base: effectiveDataBase(companyId) ?? null,
        emprestimo: effectiveEmprestimo(companyId) ?? null,
        ...patch,
      } as unknown as EmpresasFuncionariosInput,
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

  const renderActionsCell = (company: (typeof rows)[number]) => {
    const record = recordByCompany.get(company.id);
    return (
      <TableCell className={`${CELL} w-20 text-center`}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Editar notas (obs. fechamento, sindicato)"
          onClick={() =>
            setNoteDialog({
              companyId: company.id,
              observacao: record?.observacao ?? "",
              infoSindicato: record?.info_sindicato ?? "",
              infoSindicatoPatronal: record?.info_sindicato_patronal ?? "",
            })
          }
          className="h-7 w-7"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    );
  };

  const renderFilterSelect = (
    key: keyof typeof busca,
    label: string,
    options: readonly string[],
    widthClass = "w-28",
    stickyClass = ""
  ) => (
    <TableHead className={`${HEAD} ${widthClass} ${stickyClass || VHEAD} align-bottom`}>
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

  const renderFilterInput = (
    key: keyof typeof busca,
    label: string,
    widthClass = "",
    stickyClass = ""
  ) => (
    <TableHead className={`${HEAD} ${widthClass} ${stickyClass || VHEAD} align-bottom`}>
      <span className="mb-1 block whitespace-nowrap">{label}</span>
      <Input
        value={busca[key]}
        onChange={(e) => setBuscaField(key, e.target.value)}
        placeholder="Filtrar"
        className="h-6 w-full min-w-0 px-1 text-xs"
      />
    </TableHead>
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
    Enviado: "bg-status-success text-status-success-foreground hover:bg-status-success/90",
    Pendente: "bg-status-danger text-status-danger-foreground hover:bg-status-danger/90",
  };

  const renderRow = (company: (typeof rows)[number]) => {
    const record = recordByCompany.get(company.id);
    return (
      <TableRow key={company.id}>
        <TableCell className={`${CELL} w-32 left-0 ${STICKY_CELL}`}>
          {renderSelectCell(
            company.id,
            effectiveStatus(company.id) ?? "",
            EMPRESAS_FUNC_STATUS_OPTIONS,
            "status",
            STATUS_TONE
          )}
        </TableCell>
        <TableCell
          className={`${CELL} w-10 whitespace-nowrap text-center font-medium ${STICKY_CELL} ${N_LEFT}`}
        >
          {company.numero || "—"}
        </TableCell>
        <TableCell
          className={`${CELL} w-24 ${STICKY_CELL} ${EMPRESA_LEFT} ${EMPRESA_EDGE}`}
        >
          <span className="block truncate font-medium" title={company.name}>
            {company.name}
          </span>
        </TableCell>
        <TableCell className={`${CELL} text-muted-foreground`}>
          <span className="block truncate" title={company.documento}>
            {formatCpfCnpj(company.documento)}
          </span>
        </TableCell>
        <TableCell className={`${CELL} w-24`}>
          <span
            className="block truncate"
            title={company.tributacao ?? undefined}
          >
            {company.tributacao || "—"}
          </span>
        </TableCell>
        <TableCell className={`${CELL} w-20`}>
          {renderSelectCell(
            company.id,
            effectiveDataBase(company.id) ?? "",
            EMPRESAS_FUNC_MESES_OPTIONS,
            "data_base"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-24`}>
          {renderSelectCell(
            company.id,
            record?.folha ?? "",
            EMPRESAS_FUNC_FOLHA_OPTIONS,
            "folha"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-24`}>
          {renderSelectCell(
            company.id,
            effectiveEmprestimo(company.id) ?? "",
            EMPRESAS_FUNC_EMPRESTIMO_OPTIONS,
            "emprestimo"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-20`}>
          {renderSelectCell(
            company.id,
            record?.fgts ?? "",
            EMPRESAS_FUNC_FGTS_OPTIONS,
            "fgts"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-24`}>
          {renderSelectCell(
            company.id,
            record?.taxa_sindical ?? "",
            EMPRESAS_FUNC_FLAG_OPTIONS,
            "taxa_sindical"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-20`}>
          {renderSelectCell(
            company.id,
            record?.dctfweb ?? "",
            EMPRESAS_FUNC_DCTFWEB_OPTIONS,
            "dctfweb"
          )}
        </TableCell>
        <TableCell className={`${CELL} w-20`}>
          {renderSelectCell(
            company.id,
            record?.envio ?? "",
            EMPRESAS_FUNC_ENVIO_OPTIONS,
            "envio",
            ENVIO_TONE
          )}
        </TableCell>
        {renderActionsCell(company)}
      </TableRow>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Empresas com funcionários</h2>
        <p className="text-sm text-muted-foreground">
          Empresas vinculadas ao departamento {PESSOAL_DEPARTMENT_NAME}.
        </p>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="efun-mes">Mês de referência</Label>
        <Input
          id="efun-mes"
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
        <>
          <div
            ref={tableScrollRef}
            onScroll={(event) =>
              setScrollLeft(event.currentTarget.scrollLeft)
            }
            className="overflow-x-auto rounded-lg border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
          <Table className="table-fixed min-w-[1144px]">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                {renderFilterSelect("status", "Status", EMPRESAS_FUNC_STATUS_OPTIONS, "w-32", `${STICKY_HEAD} left-0`)}
                {renderFilterInput("numero", "Nº", "w-10", `${STICKY_HEAD} ${N_LEFT}`)}
                {renderFilterInput("empresa", "Empresa", "w-24", `${STICKY_HEAD} ${EMPRESA_LEFT} ${EMPRESA_EDGE}`)}
                {renderFilterInput("cnpj", "CNPJ", "w-24")}
                {renderFilterInput("tributacao", "Tributação", "w-24")}
                {renderFilterSelect("dataBase", "Data Base", EMPRESAS_FUNC_MESES_OPTIONS, "w-20")}
                {renderFilterSelect("folha", "Folha", EMPRESAS_FUNC_FOLHA_OPTIONS, "w-24")}
                {renderFilterSelect("emprestimo", "Empréstimo", EMPRESAS_FUNC_EMPRESTIMO_OPTIONS, "w-24")}
                {renderFilterSelect("fgts", "FGTS", EMPRESAS_FUNC_FGTS_OPTIONS, "w-20")}
                {renderFilterSelect("taxaSindical", "Taxa Sindical", EMPRESAS_FUNC_FLAG_OPTIONS, "w-24")}
                {renderFilterSelect("dctfweb", "DCTFWEB", EMPRESAS_FUNC_DCTFWEB_OPTIONS, "w-20")}
                {renderFilterSelect("envio", "Envio", EMPRESAS_FUNC_ENVIO_OPTIONS, "w-20")}
                {renderFilterInput("notas", "Notas", "w-20")}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeRows.map(renderRow)}
              {inactiveRows.length > 0 && (
                <TableRow className="bg-muted/50">
                  <TableCell
                    colSpan={13}
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
                    colSpan={13}
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
          {hasOverflow && (
            <div className="sticky bottom-0 z-10 bg-background py-2">
              <div
                ref={trackRef}
                onPointerDown={handleTrackPointerDown}
                onPointerMove={handleTrackPointerMove}
                onPointerUp={handleTrackPointerUp}
                onPointerCancel={handleTrackPointerUp}
                className="relative h-2 w-full cursor-pointer select-none touch-none rounded-full bg-muted"
              >
                <div
                  className="absolute top-0 h-full rounded-full bg-primary/70"
                  style={{
                    left: `${thumbLeftPct}%`,
                    width: `${thumbWidthPct}%`,
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}

      <Dialog
        open={!!noteDialog}
        onOpenChange={(open) => !open && setNoteDialog(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Notas da empresa</DialogTitle>
            <DialogDescription>
              {noteDialogCompany?.name ?? "Empresa"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nota-obs">Obs. Fechamento</Label>
              <Textarea
                id="nota-obs"
                value={noteDialog?.observacao ?? ""}
                onChange={(event) =>
                  setNoteDialog((prev) =>
                    prev
                      ? { ...prev, observacao: event.target.value }
                      : prev
                  )
                }
                placeholder="Observações do fechamento"
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nota-sind">Info. Sindicato</Label>
              <Textarea
                id="nota-sind"
                value={noteDialog?.infoSindicato ?? ""}
                onChange={(event) =>
                  setNoteDialog((prev) =>
                    prev
                      ? { ...prev, infoSindicato: event.target.value }
                      : prev
                  )
                }
                placeholder="Informações do sindicato"
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nota-sind-patronal">
                Info. Sindicato Patronal
              </Label>
              <Textarea
                id="nota-sind-patronal"
                value={noteDialog?.infoSindicatoPatronal ?? ""}
                onChange={(event) =>
                  setNoteDialog((prev) =>
                    prev
                      ? { ...prev, infoSindicatoPatronal: event.target.value }
                      : prev
                  )
                }
                placeholder="Informações do sindicato patronal"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNoteDialog(null)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleNoteSave}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
