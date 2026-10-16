import { useEffect, useState, type FormEvent } from "react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserMultiSelect } from "@/components/admin/user-multi-select";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { useCreateCompany, useCompanies, useUpdateCompany } from "@/hooks/use-companies";
import { useAllUsersWithDepartments } from "@/hooks/use-all-users";
import { useMunicipios } from "@/hooks/use-municipios";
import { useAllDepartmentSubmenus } from "@/hooks/use-department-submenus";
import { useDepartments } from "@/hooks/use-departments";
import { useAuth } from "@/context/auth";
import { TRIBUTACOES, MOTIVOS_INATIVACAO } from "@/lib/companies";
import { UFS } from "@/lib/ufs";
import type { EmpresaPermissionKey } from "@/lib/empresas-permissions";
import { formatCpfCnpj, isValidCpfCnpj } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CompanyWithDepartments, SubdepartmentPeriod } from "@/lib/types";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: CompanyWithDepartments | null;
  /** Campos liberados para edição (undefined = todos, caso do administrador). */
  allowedFields?: EmpresaPermissionKey[];
}

/** Matriz ou filial — o número é único entre matrizes. */
type CompanyType = "matriz" | "filial";

interface DepartmentAssignment {
  selected: boolean;
  subdepartments: string[];
  /** Responsáveis por subdepartamento (nome do subdepartamento → ids). */
  responsibles: Record<string, string[]>;
  /** Período por subdepartamento (nome do subdepartamento → início/fim). */
  periods: Record<string, SubdepartmentPeriod>;
}

export default function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  allowedFields,
}: CompanyFormDialogProps) {
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const { data: companies } = useCompanies();
  const { data: departments } = useDepartments();
  const { data: usersWithDepartments } = useAllUsersWithDepartments();
  const { data: allSubmenus } = useAllDepartmentSubmenus();
  const { profile } = useAuth();
  const isEditing = !!company;

  const isAdmin = profile?.role === "admin";
  const myDepartmentIds = new Set(
    (profile?.departments ?? []).map((department) => department.id)
  );

  /** Campo liberado quando não há restrição (admin) ou consta na lista. */
  const canEdit = (key: EmpresaPermissionKey): boolean =>
    !allowedFields || allowedFields.includes(key);

  const [numero, setNumero] = useState("");
  const [tipo, setTipo] = useState<CompanyType>("matriz");
  const [name, setName] = useState("");
  const [documento, setDocumento] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [uf, setUf] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [tributacao, setTributacao] = useState("");
  const [socioResponsavel, setSocioResponsavel] = useState("");
  const [socioCpf, setSocioCpf] = useState("");
  const [ativa, setAtiva] = useState(true);
  const [motivoInativacao, setMotivoInativacao] = useState("");
  const [dataInativacao, setDataInativacao] = useState("");
  const [assignments, setAssignments] = useState<
    Record<string, DepartmentAssignment>
  >({});

  const { data: municipios } = useMunicipios(uf);

  const departmentsKey = (departments ?? []).map((d) => d.id).join(",");

  useEffect(() => {
    if (!open) return;
    setNumero(company?.numero ?? "");
    setTipo(company?.tipo === "filial" ? "filial" : "matriz");
    setName(company?.name ?? "");
    setDocumento(company ? formatCpfCnpj(company.documento) : "");
    setInscricaoEstadual(company?.inscricao_estadual ?? "");
    setUf(company?.uf ?? "");
    setMunicipio(company?.municipio ?? "");
    setTributacao(company?.tributacao ?? "");
    setSocioResponsavel(company?.socio_responsavel ?? "");
    setSocioCpf(company ? formatCpfCnpj(company.socio_cpf ?? "") : "");
    setAtiva(company?.ativa ?? true);
    setMotivoInativacao(company?.motivo_inativacao ?? "");
    setDataInativacao(company?.data_inativacao ?? "");

    const initial: Record<string, DepartmentAssignment> = {};
    for (const department of departments ?? []) {
      const link = company?.department_links.find(
        (item) => item.department_id === department.id
      );
      initial[department.id] = {
        selected: !!link,
        subdepartments: link?.subdepartments ?? [],
        responsibles: link?.subdepartment_responsibles ?? {},
        periods: link?.subdepartment_periods ?? {},
      };
    }
    setAssignments(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, company, departmentsKey]);

  const updateAssignment = (
    departmentId: string,
    patch: Partial<DepartmentAssignment>
  ) => {
    setAssignments((prev) => ({
      ...prev,
      [departmentId]: {
        ...(prev[departmentId] ?? {
          selected: false,
          subdepartments: [],
          responsibles: {},
          periods: {},
        }),
        ...patch,
      },
    }));
  };

  /** Define os responsáveis de um subdepartamento do departamento. */
  const setSubdepartmentResponsibles = (
    departmentId: string,
    submenu: string,
    ids: string[]
  ) => {
    setAssignments((prev) => {
      const current = prev[departmentId] ?? {
        selected: false,
        subdepartments: [],
        responsibles: {},
        periods: {},
      };
      return {
        ...prev,
        [departmentId]: {
          ...current,
          responsibles: { ...current.responsibles, [submenu]: ids },
        },
      };
    });
  };

  /** Define o período (mês de início e mês final) de um subdepartamento. */
  const setSubdepartmentPeriod = (
    departmentId: string,
    submenu: string,
    patch: Partial<SubdepartmentPeriod>
  ) => {
    setAssignments((prev) => {
      const current = prev[departmentId] ?? {
        selected: false,
        subdepartments: [],
        responsibles: {},
        periods: {},
      };
      const period = current.periods[submenu] ?? { inicio: null, fim: null };
      return {
        ...prev,
        [departmentId]: {
          ...current,
          periods: { ...current.periods, [submenu]: { ...period, ...patch } },
        },
      };
    });
  };

  /**
   * Mantém os responsáveis apenas dos subdepartamentos ainda marcados e
   * limpa os que foram desmarcados.
   */
  const keepMarkedResponsibles = (
    responsibles: Record<string, string[]>,
    subdepartments: string[]
  ): Record<string, string[]> =>
    Object.fromEntries(
      Object.entries(responsibles).filter(
        ([submenu, ids]) => subdepartments.includes(submenu) && ids.length > 0
      )
    );

  /**
   * Mantém os períodos apenas dos subdepartamentos ainda marcados e limpa os
   * que foram desmarcados (ou ficaram sem data).
   */
  const keepMarkedPeriods = (
    periods: Record<string, SubdepartmentPeriod>,
    subdepartments: string[]
  ): Record<string, SubdepartmentPeriod> =>
    Object.fromEntries(
      Object.entries(periods).filter(
        ([submenu, period]) =>
          subdepartments.includes(submenu) && (period.inicio || period.fim)
      )
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Preencha o nome da empresa.");
      return;
    }
    if (!isValidCpfCnpj(documento)) {
      toast.error("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.");
      return;
    }
    // O número da empresa não pode repetir entre matrizes; uma filial pode
    // repetir o número da matriz (CPF/CNPJ também pode ser duplicado).
    const numeroLimpo = numero.trim();
    const numeroRepetido =
      numeroLimpo !== "" &&
      tipo === "matriz" &&
      (companies ?? []).some(
        (item) =>
          item.id !== company?.id &&
          item.tipo !== "filial" &&
          (item.numero ?? "").trim() === numeroLimpo
      );
    if (numeroRepetido) {
      toast.error(
        `O número ${numeroLimpo} já está cadastrado em outra matriz. Para uma filial, marque o tipo Filial.`
      );
      return;
    }
    if (!uf) {
      toast.error("Selecione a UF.");
      return;
    }

    const department_links = (departments ?? [])
      .filter((department) => assignments[department.id]?.selected)
      .map((department) => {
        const assignment = assignments[department.id];
        const subdepartments = assignment?.subdepartments ?? [];
        return {
          department_id: department.id,
          profile_ids: [],
          subdepartments,
          subdepartment_responsibles: keepMarkedResponsibles(
            assignment?.responsibles ?? {},
            subdepartments
          ),
          subdepartment_periods: keepMarkedPeriods(
            assignment?.periods ?? {},
            subdepartments
          ),
        };
      });

    const payload = {
      numero: numero.trim(),
      tipo,
      name: name.trim(),
      documento,
      inscricao_estadual: inscricaoEstadual,
      uf,
      municipio: municipio || null,
      tributacao: tributacao || null,
      socio_responsavel: socioResponsavel.trim() || null,
      socio_cpf: socioCpf.replace(/\D/g, "") || null,
      ativa,
      motivo_inativacao: ativa ? null : motivoInativacao || null,
      data_inativacao: ativa ? null : dataInativacao || null,
      department_links,
    };

    try {
      if (isEditing && company) {
        await updateMutation.mutateAsync({ id: company.id, ...payload });
        toast.success("Empresa atualizada.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Empresa criada.");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar empresa."
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar empresa" : "Nova empresa"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados da empresa, seus departamentos e responsáveis."
              : "Cadastre uma empresa (matriz ou filial) e vincule os departamentos que a utilizam."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className={cn(
            "flex flex-col gap-4",
            !ativa &&
              "[&_label]:text-destructive [&_input]:border-destructive [&_input]:text-destructive [&_[role=combobox]]:border-destructive [&_[role=combobox]]:text-destructive"
          )}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[12rem_14rem_1fr]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-numero">Número</Label>
              <Input
                id="company-numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ex.: 001"
                className="text-center font-medium tabular-nums"
                disabled={!canEdit("numero")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tipo</Label>
              <div
                role="group"
                aria-label="Matriz ou filial"
                className="inline-flex w-fit rounded-lg border bg-muted p-0.5 shadow-inner"
              >
                {(["matriz", "filial"] as const).map((value) => {
                  const selected = tipo === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      disabled={!canEdit("numero")}
                      onClick={() => setTipo(value)}
                      className={cn(
                        "rounded-md px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all",
                        selected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                        !canEdit("numero") && "cursor-not-allowed opacity-60"
                      )}
                    >
                      {value === "matriz" ? "Matriz" : "Filial"}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-documento">CPF/CNPJ</Label>
              <Input
                id="company-documento"
                value={documento}
                onChange={(e) => setDocumento(formatCpfCnpj(e.target.value))}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                inputMode="numeric"
                required
                disabled={!canEdit("documento")}
              />
            </div>
          </div>

          {tipo === "filial" && (
            <p className="text-xs text-muted-foreground">
              Filial pode usar o mesmo número da matriz. Preencha o número da
              matriz à qual esta filial pertence.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-name">Nome da empresa</Label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: P4 Contabilidade Ltda"
              required
              disabled={!canEdit("name")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-ie">Inscrição Estadual</Label>
              <Input
                id="company-ie"
                value={inscricaoEstadual}
                onChange={(e) => setInscricaoEstadual(e.target.value)}
                placeholder="Opcional"
                disabled={!canEdit("inscricao_estadual")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>UF</Label>
              <Select
                value={uf}
                onValueChange={(value) => {
                  setUf(value);
                  setMunicipio("");
                }}
                disabled={!canEdit("uf")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a UF" />
                </SelectTrigger>
                <SelectContent>
                  {UFS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Tributação</Label>
              <Select
                value={tributacao === "" ? "none" : tributacao}
                onValueChange={setTributacao}
                disabled={!canEdit("tributacao")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a tributação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {TRIBUTACOES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Município</Label>
              <Select
                value={municipio === "" ? "none" : municipio}
                onValueChange={(value) =>
                  setMunicipio(value === "none" ? "" : value)
                }
                disabled={!canEdit("municipio") || uf.length !== 2}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      uf.length !== 2
                        ? "Selecione a UF primeiro"
                        : (municipios ?? []).length === 0
                          ? "Carregando municípios…"
                          : "Selecione o município"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value="none">—</SelectItem>
                  {(municipios ?? []).map((nome) => (
                    <SelectItem key={nome} value={nome}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-socio">Sócio responsável</Label>
              <Input
                id="company-socio"
                value={socioResponsavel}
                onChange={(e) => setSocioResponsavel(e.target.value)}
                placeholder="Nome do sócio responsável"
                disabled={!canEdit("socio_responsavel")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-socio-cpf">CPF do sócio</Label>
              <Input
                id="company-socio-cpf"
                value={socioCpf}
                onChange={(e) => setSocioCpf(formatCpfCnpj(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                disabled={!canEdit("socio_cpf")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Ativa?</Label>
              <Select
                value={ativa ? "sim" : "nao"}
                onValueChange={(value) => setAtiva(value === "sim")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!ativa && (
              <div className="flex flex-col gap-1.5">
                <Label>Data de inativação</Label>
                <Input
                  type="date"
                  value={dataInativacao}
                  onChange={(e) => setDataInativacao(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Último dia ativo (ex.: 30/09/2026). A partir de 01/10/2026 a
                  empresa é desabilitada em todos os departamentos. Meses
                  anteriores não mudam.
                </p>
              </div>
            )}
          </div>

          {!ativa && (
            <div className="flex flex-col gap-1.5">
              <Label>Motivo da inativação</Label>
              <Select
                value={motivoInativacao === "" ? "none" : motivoInativacao}
                onValueChange={(value) =>
                  setMotivoInativacao(value === "none" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {MOTIVOS_INATIVACAO.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>Departamentos que utilizam a empresa</Label>
            {(departments ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum departamento cadastrado.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {(departments ?? []).map((department) => {
                  const assignment = assignments[department.id] ?? {
                    selected: false,
                    subdepartments: [],
                    responsibles: {},
                    periods: {},
                  };
                  const editableDepartment =
                    isAdmin || myDepartmentIds.has(department.id);
                  const deptSubmenus = (allSubmenus ?? [])
                    .filter((submenu) => submenu.department_id === department.id)
                    .map((submenu) => submenu.name);
                  const deptUsers = (usersWithDepartments ?? []).filter((user) =>
                    user.department_ids.includes(department.id)
                  );
                  return (
                    <div
                      key={department.id}
                      className="flex flex-col gap-2 rounded-md border p-2"
                    >
                      <div className="flex flex-col gap-2">
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={assignment.selected}
                            disabled={
                              !canEdit("departments") || !editableDepartment
                            }
                            onCheckedChange={(checked) =>
                              updateAssignment(department.id, {
                                selected: checked === true,
                              })
                            }
                          />
                          <span>{department.name}</span>
                        </label>
                        <MultiSelectDropdown
                          options={deptSubmenus.map((submenu) => ({
                            value: submenu,
                            label: submenu,
                          }))}
                          value={assignment.subdepartments}
                          onChange={(values) =>
                            updateAssignment(department.id, {
                              subdepartments: values,
                              responsibles: keepMarkedResponsibles(
                                assignment.responsibles,
                                values
                              ),
                              periods: keepMarkedPeriods(
                                assignment.periods,
                                values
                              ),
                            })
                          }
                          placeholder="Subdepartamentos (opcional)"
                          disabled={
                            !assignment.selected ||
                            !canEdit("subdepartments") ||
                            !editableDepartment ||
                            deptSubmenus.length === 0
                          }
                          className="w-full"
                        />
                      </div>

                      {assignment.subdepartments.map((submenu) => {
                        const period = assignment.periods[submenu] ?? {
                          inicio: null,
                          fim: null,
                        };
                        const periodDisabled =
                          !assignment.selected ||
                          !canEdit("subdepartments") ||
                          !editableDepartment;
                        const responsibleDisabled =
                          !assignment.selected ||
                          !canEdit("responsaveis") ||
                          !editableDepartment;
                        return (
                          <div
                            key={submenu}
                            className="rounded-md border border-dashed bg-muted/30 p-2 lg:ml-6"
                          >
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(8rem,1fr)_9rem_9rem_minmax(13rem,1.7fr)] lg:items-end lg:gap-3">
                              <span
                                className="truncate text-xs font-semibold lg:pb-2.5"
                                title={submenu}
                              >
                                {submenu}
                              </span>
                              <div className="flex flex-col gap-1.5">
                                <Label
                                  htmlFor={`periodo-inicio-${department.id}-${submenu}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  Data de Início
                                </Label>
                                <Input
                                  id={`periodo-inicio-${department.id}-${submenu}`}
                                  type="month"
                                  value={period.inicio ?? ""}
                                  onChange={(e) =>
                                    setSubdepartmentPeriod(
                                      department.id,
                                      submenu,
                                      { inicio: e.target.value || null }
                                    )
                                  }
                                  disabled={periodDisabled}
                                  className="h-8"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <Label
                                  htmlFor={`periodo-fim-${department.id}-${submenu}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  Data Final
                                </Label>
                                <Input
                                  id={`periodo-fim-${department.id}-${submenu}`}
                                  type="month"
                                  value={period.fim ?? ""}
                                  onChange={(e) =>
                                    setSubdepartmentPeriod(
                                      department.id,
                                      submenu,
                                      { fim: e.target.value || null }
                                    )
                                  }
                                  disabled={periodDisabled}
                                  className="h-8"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <span className="text-xs text-muted-foreground">
                                  Responsáveis
                                </span>
                                <UserMultiSelect
                                  value={assignment.responsibles[submenu] ?? []}
                                  onChange={(ids) =>
                                    setSubdepartmentResponsibles(
                                      department.id,
                                      submenu,
                                      ids
                                    )
                                  }
                                  disabled={responsibleDisabled}
                                  users={deptUsers}
                                  className="w-full justify-between font-normal"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Cada subdepartamento tem suas próprias datas: a empresa entra nas
              tabelas do módulo no mês da Data de Início e sai depois do mês da
              Data Final (os meses já lançados continuam no histórico). Sem
              datas, a empresa aparece em todos os meses. Os responsáveis também
              são por subdepartamento: cada módulo (ex.: Movimento Fiscal,
              Controle de Parcelamentos) usa os usuários responsáveis do seu
              próprio subdepartamento. O usuário responsável é opcional.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEditing ? "Salvar alterações" : "Criar empresa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
