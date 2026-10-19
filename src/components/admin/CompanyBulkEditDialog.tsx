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
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { useBulkUpdateCompanies } from "@/hooks/use-companies";
import { useAllUsersWithDepartments } from "@/hooks/use-all-users";
import { useAllDepartmentSubmenus } from "@/hooks/use-department-submenus";
import { useDepartments } from "@/hooks/use-departments";
import { useMunicipios } from "@/hooks/use-municipios";
import { useAuth } from "@/context/auth";
import { MOTIVOS_INATIVACAO, TRIBUTACOES } from "@/lib/companies";
import { useTributacoes } from "@/hooks/use-tributacoes";
import { UFS } from "@/lib/ufs";
import { formatCpfCnpj } from "@/lib/utils";
import type { EmpresaPermissionKey } from "@/lib/empresas-permissions";
import type { SubdepartmentPeriod } from "@/lib/types";

interface CompanyBulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ids: string[];
  /** Campos liberados para edição (undefined = todos, caso do administrador). */
  allowedFields?: EmpresaPermissionKey[];
}

const NAO_ALTERAR = "nao-alterar";
/** Opção que limpa o campo (em branco) nas empresas selecionadas. */
const LIMPAR = "limpar";

type DeptActionValue = "none" | "set" | "remove";

interface DeptAction {
  action: DeptActionValue;
  subdepartments: string[];
  /** Responsáveis por subdepartamento (nome do subdepartamento → ids). */
  responsibles: Record<string, string[]>;
  /** Período por subdepartamento (nome do subdepartamento → início/fim). */
  periods: Record<string, SubdepartmentPeriod>;
}

/** Estado vazio de um departamento. */
const EMPTY_DEPT_ACTION: DeptAction = {
  action: "none",
  subdepartments: [],
  responsibles: {},
  periods: {},
};

export default function CompanyBulkEditDialog({
  open,
  onOpenChange,
  ids,
  allowedFields,
}: CompanyBulkEditDialogProps) {
  const bulkUpdate = useBulkUpdateCompanies();
  const { data: departments } = useDepartments();
  const { data: usersWithDepartments } = useAllUsersWithDepartments();
  const { data: allSubmenus } = useAllDepartmentSubmenus();
  const { data: tributacoes } = useTributacoes();
  const { profile } = useAuth();

  /** Tributações cadastradas na administração (com fallback para a lista fixa). */
  const tributacaoOptions =
    (tributacoes ?? []).length > 0
      ? (tributacoes ?? []).map((item) => item.nome)
      : [...TRIBUTACOES];

  const isAdmin = profile?.role === "admin";
  const myDepartmentIds = new Set(
    (profile?.departments ?? []).map((department) => department.id)
  );

  /** Campo liberado quando não há restrição (admin) ou consta na lista. */
  const canEdit = (key: EmpresaPermissionKey): boolean =>
    !allowedFields || allowedFields.includes(key);

  const [uf, setUf] = useState(NAO_ALTERAR);
  const [municipio, setMunicipio] = useState(NAO_ALTERAR);
  const [tributacao, setTributacao] = useState(NAO_ALTERAR);
  const [ie, setIe] = useState("");
  const [clearIe, setClearIe] = useState(false);
  const [socioResponsavel, setSocioResponsavel] = useState("");
  const [clearSocioResponsavel, setClearSocioResponsavel] = useState(false);
  const [socioCpf, setSocioCpf] = useState("");
  const [clearSocioCpf, setClearSocioCpf] = useState(false);
  const [ativa, setAtiva] = useState(NAO_ALTERAR);
  const [motivoInativacao, setMotivoInativacao] = useState("");
  const [dataInativacao, setDataInativacao] = useState("");
  const [deptActions, setDeptActions] = useState<Record<string, DeptAction>>(
    {}
  );

  // Os municípios dependem da UF escolhida no próprio formulário.
  const { data: municipios } = useMunicipios(
    uf === NAO_ALTERAR ? "" : uf
  );

  const setAtivaValue = (value: string) => {
    setAtiva(value);
    if (value !== "nao") {
      setMotivoInativacao("");
      setDataInativacao("");
    }
  };

  useEffect(() => {
    if (open) {
      setUf(NAO_ALTERAR);
      setMunicipio(NAO_ALTERAR);
      setTributacao(NAO_ALTERAR);
      setIe("");
      setClearIe(false);
      setSocioResponsavel("");
      setClearSocioResponsavel(false);
      setSocioCpf("");
      setClearSocioCpf(false);
      setAtiva(NAO_ALTERAR);
      setMotivoInativacao("");
      setDataInativacao("");
      setDeptActions({});
    }
  }, [open]);

  const updateDept = (departmentId: string, patch: Partial<DeptAction>) => {
    setDeptActions((prev) => ({
      ...prev,
      [departmentId]: {
        ...(prev[departmentId] ?? EMPTY_DEPT_ACTION),
        ...patch,
      },
    }));
  };

  /** Define os responsáveis de um subdepartamento (ação "definir"). */
  const setSubdepartmentResponsibles = (
    departmentId: string,
    submenu: string,
    ids: string[]
  ) => {
    setDeptActions((prev) => {
      const current = prev[departmentId] ?? EMPTY_DEPT_ACTION;
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
    setDeptActions((prev) => {
      const current = prev[departmentId] ?? EMPTY_DEPT_ACTION;
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

  /** Mantém os responsáveis apenas dos subdepartamentos ainda marcados. */
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
   * Mantém os períodos apenas dos subdepartamentos ainda marcados e com pelo
   * menos uma data informada.
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
    const patch: Record<string, unknown> = {};
    if (uf !== NAO_ALTERAR) patch.uf = uf;
    if (municipio === LIMPAR) patch.municipio = null;
    else if (municipio !== NAO_ALTERAR) patch.municipio = municipio;
    if (tributacao === LIMPAR) patch.tributacao = null;
    else if (tributacao !== NAO_ALTERAR) patch.tributacao = tributacao;
    if (clearIe) patch.inscricao_estadual = null;
    else if (ie.trim()) patch.inscricao_estadual = ie.trim();
    if (clearSocioResponsavel) patch.socio_responsavel = null;
    else if (socioResponsavel.trim())
      patch.socio_responsavel = socioResponsavel.trim();
    if (clearSocioCpf) patch.socio_cpf = null;
    else if (socioCpf.replace(/\D/g, ""))
      patch.socio_cpf = socioCpf.replace(/\D/g, "");
    if (ativa === "sim") {
      patch.ativa = true;
      patch.motivo_inativacao = null;
      patch.data_inativacao = null;
    } else if (ativa === "nao") {
      patch.ativa = false;
      patch.motivo_inativacao = motivoInativacao || null;
      patch.data_inativacao = dataInativacao || null;
    }

    // Sem a permissão de vínculo, os subdepartamentos e responsáveis atuais são
    // mantidos (não são apagados pela ação em massa).
    const canLink = canEdit("subdepartments") || canEdit("responsaveis");
    const deptActionsList = Object.entries(deptActions)
      .filter(([, value]) => value.action !== "none")
      .map(([department_id, value]) => ({
        department_id,
        action: value.action as "remove" | "set",
        subdepartments: canEdit("subdepartments")
          ? value.subdepartments
          : undefined,
        subdepartment_responsibles: canLink
          ? keepMarkedResponsibles(value.responsibles, value.subdepartments)
          : undefined,
        subdepartment_periods: canEdit("subdepartments")
          ? keepMarkedPeriods(value.periods, value.subdepartments)
          : undefined,
      }));

    if (Object.keys(patch).length === 0 && deptActionsList.length === 0) {
      toast.error("Selecione pelo menos um campo para alterar.");
      return;
    }

    try {
      await bulkUpdate.mutateAsync({ ids, patch, deptActions: deptActionsList });
      toast.success(`${ids.length} empresa(s) atualizada(s) em massa.`);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar em massa."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Manutenção em massa</DialogTitle>
          <DialogDescription>
            Aplica as alterações em{" "}
            <span className="font-semibold">{ids.length} empresa(s)</span>.
            Nome, CNPJ e Número não podem ser alterados em massa; os demais
            campos do cadastro aceitam "não alterar" para preservar o valor
            atual de cada empresa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>UF</Label>
              <Select
                value={uf}
                onValueChange={(value) => {
                  setUf(value);
                  setMunicipio(NAO_ALTERAR);
                }}
                disabled={!canEdit("uf")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NAO_ALTERAR}>
                    — (não alterar)
                  </SelectItem>
                  {UFS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Município</Label>
              <Select
                value={municipio}
                onValueChange={setMunicipio}
                disabled={!canEdit("municipio") || uf === NAO_ALTERAR}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      uf === NAO_ALTERAR
                        ? "Selecione a UF ao lado"
                        : "Selecione o município"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value={NAO_ALTERAR}>
                    — (não alterar)
                  </SelectItem>
                  <SelectItem value={LIMPAR}>(em branco)</SelectItem>
                  {(municipios ?? []).map((nome) => (
                    <SelectItem key={nome} value={nome}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                A lista de municípios acompanha a UF escolhida acima.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tributação</Label>
              <Select
                value={tributacao}
                onValueChange={setTributacao}
                disabled={!canEdit("tributacao")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NAO_ALTERAR}>
                    — (não alterar)
                  </SelectItem>
                  <SelectItem value={LIMPAR}>(em branco)</SelectItem>
                  {tributacaoOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bulk-ie">Inscrição Estadual</Label>
              <Input
                id="bulk-ie"
                value={ie}
                onChange={(e) => setIe(e.target.value)}
                placeholder="Deixe em branco para não alterar"
                disabled={!canEdit("inscricao_estadual") || clearIe}
              />
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={clearIe}
                  disabled={!canEdit("inscricao_estadual")}
                  onCheckedChange={(checked) => setClearIe(checked === true)}
                />
                Limpar a Inscrição Estadual
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bulk-socio">Sócio responsável</Label>
              <Input
                id="bulk-socio"
                value={socioResponsavel}
                onChange={(e) => setSocioResponsavel(e.target.value)}
                placeholder="Deixe em branco para não alterar"
                disabled={!canEdit("socio_responsavel") || clearSocioResponsavel}
              />
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={clearSocioResponsavel}
                  disabled={!canEdit("socio_responsavel")}
                  onCheckedChange={(checked) =>
                    setClearSocioResponsavel(checked === true)
                  }
                />
                Limpar o sócio responsável
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bulk-socio-cpf">CPF do sócio</Label>
              <Input
                id="bulk-socio-cpf"
                value={socioCpf}
                onChange={(e) => setSocioCpf(formatCpfCnpj(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                disabled={!canEdit("socio_cpf") || clearSocioCpf}
              />
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={clearSocioCpf}
                  disabled={!canEdit("socio_cpf")}
                  onCheckedChange={(checked) =>
                    setClearSocioCpf(checked === true)
                  }
                />
                Limpar o CPF do sócio
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Ativa?</Label>
              <Select value={ativa} onValueChange={setAtivaValue}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NAO_ALTERAR}>
                    — (não alterar)
                  </SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Com "Não", a empresa sai de todos os departamentos a partir do
                mês seguinte à data de inativação (o histórico é mantido).
              </p>
            </div>
            {ativa === "nao" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label>Data de inativação</Label>
                  <Input
                    type="date"
                    value={dataInativacao}
                    onChange={(e) => setDataInativacao(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Último dia ativo (ex.: 30/09/2026).
                  </p>
                </div>
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
              </>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Departamentos, subdepartamentos, datas e responsáveis</Label>
            {(departments ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum departamento cadastrado.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {(departments ?? []).map((department) => {
                  const current = deptActions[department.id] ?? EMPTY_DEPT_ACTION;
                  const { action, responsibles, subdepartments, periods } =
                    current;
                  const deptSubmenus = (allSubmenus ?? [])
                    .filter((submenu) => submenu.department_id === department.id)
                    .map((submenu) => submenu.name);
                  const deptUsers = (usersWithDepartments ?? []).filter((user) =>
                    user.department_ids.includes(department.id)
                  );
                  const editableDepartment =
                    isAdmin || myDepartmentIds.has(department.id);
                  return (
                    <div
                      key={department.id}
                      className="flex flex-col gap-2 rounded-md border p-2"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm font-medium">
                          {department.name}
                        </span>
                        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                          <Select
                            value={action}
                            onValueChange={(value) =>
                              updateDept(department.id, {
                                action: value as DeptActionValue,
                              })
                            }
                            disabled={
                              !canEdit("departments") || !editableDepartment
                            }
                          >
                            <SelectTrigger className="h-8 w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não alterar</SelectItem>
                              <SelectItem value="set">
                                Adicionar / definir
                              </SelectItem>
                              <SelectItem value="remove">Remover</SelectItem>
                            </SelectContent>
                          </Select>
                          {action !== "none" && (
                            <MultiSelectDropdown
                              options={deptSubmenus.map((submenu) => ({
                                value: submenu,
                                label: submenu,
                              }))}
                              value={subdepartments}
                              onChange={(values) =>
                                updateDept(department.id, {
                                  subdepartments: values,
                                  responsibles: keepMarkedResponsibles(
                                    responsibles,
                                    values
                                  ),
                                  periods: keepMarkedPeriods(periods, values),
                                })
                              }
                              placeholder={
                                action === "remove"
                                  ? "Subdepartamentos a remover"
                                  : "Subdepartamentos (opcional)"
                              }
                              disabled={
                                !canEdit("subdepartments") ||
                                !editableDepartment ||
                                deptSubmenus.length === 0
                              }
                              className="w-full sm:w-56"
                            />
                          )}
                        </div>
                      </div>

                      {action === "set" &&
                        subdepartments.map((submenu) => {
                          const period = periods[submenu] ?? {
                            inicio: null,
                            fim: null,
                          };
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
                                    htmlFor={`bulk-periodo-inicio-${department.id}-${submenu}`}
                                    className="text-xs text-muted-foreground"
                                  >
                                    Data de Início
                                  </Label>
                                  <Input
                                    id={`bulk-periodo-inicio-${department.id}-${submenu}`}
                                    type="month"
                                    value={period.inicio ?? ""}
                                    onChange={(e) =>
                                      setSubdepartmentPeriod(
                                        department.id,
                                        submenu,
                                        { inicio: e.target.value || null }
                                      )
                                    }
                                    disabled={
                                      !canEdit("subdepartments") ||
                                      !editableDepartment
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <Label
                                    htmlFor={`bulk-periodo-fim-${department.id}-${submenu}`}
                                    className="text-xs text-muted-foreground"
                                  >
                                    Data Final
                                  </Label>
                                  <Input
                                    id={`bulk-periodo-fim-${department.id}-${submenu}`}
                                    type="month"
                                    value={period.fim ?? ""}
                                    onChange={(e) =>
                                      setSubdepartmentPeriod(
                                        department.id,
                                        submenu,
                                        { fim: e.target.value || null }
                                      )
                                    }
                                    disabled={
                                      !canEdit("subdepartments") ||
                                      !editableDepartment
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-xs text-muted-foreground">
                                    Responsáveis
                                  </span>
                                  <MultiSelectDropdown
                                    options={deptUsers.map((user) => ({
                                      value: user.id,
                                      label: user.full_name,
                                    }))}
                                    value={responsibles[submenu] ?? []}
                                    onChange={(values) =>
                                      setSubdepartmentResponsibles(
                                        department.id,
                                        submenu,
                                        values
                                      )
                                    }
                                    placeholder="Responsáveis (opcional)"
                                    disabled={
                                      !canEdit("responsaveis") ||
                                      !editableDepartment
                                    }
                                    className="w-full"
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
              "Adicionar / definir" inclui o departamento nas empresas
              selecionadas e define as datas e os responsáveis de cada
              subdepartamento marcado; "Remover" remove os subdepartamentos
              selecionados (com as datas e os responsáveis deles) e, se nenhum
              for escolhido, desvincula o departamento. As datas em branco não
              alteram o período já cadastrado.
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
            <Button
              type="submit"
              disabled={bulkUpdate.isPending || ids.length === 0}
            >
              Aplicar em {ids.length} empresa(s)
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
