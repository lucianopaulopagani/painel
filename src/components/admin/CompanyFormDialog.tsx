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
import { useCreateCompany, useUpdateCompany } from "@/hooks/use-companies";
import { useAllUsersWithDepartments } from "@/hooks/use-all-users";
import { useMunicipios } from "@/hooks/use-municipios";
import { useDepartments } from "@/hooks/use-departments";
import { useAuth } from "@/context/auth";
import { TRIBUTACOES } from "@/lib/companies";
import { UFS } from "@/lib/ufs";
import type { EmpresaPermissionKey } from "@/lib/empresas-permissions";
import { formatCpfCnpj, isValidCpfCnpj } from "@/lib/utils";
import type { CompanyWithDepartments } from "@/lib/types";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: CompanyWithDepartments | null;
  /** Campos liberados para edição (undefined = todos, caso do administrador). */
  allowedFields?: EmpresaPermissionKey[];
}

interface DepartmentAssignment {
  selected: boolean;
  profileIds: string[];
}

export default function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  allowedFields,
}: CompanyFormDialogProps) {
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const { data: departments } = useDepartments();
  const { data: usersWithDepartments } = useAllUsersWithDepartments();
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
  const [name, setName] = useState("");
  const [documento, setDocumento] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [uf, setUf] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [tributacao, setTributacao] = useState("");
  const [socioResponsavel, setSocioResponsavel] = useState("");
  const [socioCpf, setSocioCpf] = useState("");
  const [assignments, setAssignments] = useState<
    Record<string, DepartmentAssignment>
  >({});

  const { data: municipios } = useMunicipios(uf);

  const departmentsKey = (departments ?? []).map((d) => d.id).join(",");

  useEffect(() => {
    if (!open) return;
    setNumero(company?.numero ?? "");
    setName(company?.name ?? "");
    setDocumento(company ? formatCpfCnpj(company.documento) : "");
    setInscricaoEstadual(company?.inscricao_estadual ?? "");
    setUf(company?.uf ?? "");
    setMunicipio(company?.municipio ?? "");
    setTributacao(company?.tributacao ?? "");
    setSocioResponsavel(company?.socio_responsavel ?? "");
    setSocioCpf(company ? formatCpfCnpj(company.socio_cpf ?? "") : "");

    const initial: Record<string, DepartmentAssignment> = {};
    for (const department of departments ?? []) {
      const link = company?.department_links.find(
        (item) => item.department_id === department.id
      );
      initial[department.id] = {
        selected: !!link,
        profileIds: link?.profile_ids ?? [],
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
        ...(prev[departmentId] ?? { selected: false, profileIds: [] }),
        ...patch,
      },
    }));
  };

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
    if (!uf) {
      toast.error("Selecione a UF.");
      return;
    }

    const department_links = (departments ?? [])
      .filter((department) => assignments[department.id]?.selected)
      .map((department) => ({
        department_id: department.id,
        profile_ids: assignments[department.id]?.profileIds ?? [],
      }));

    const payload = {
      numero: numero.trim(),
      name: name.trim(),
      documento,
      inscricao_estadual: inscricaoEstadual,
      uf,
      municipio: municipio || null,
      tributacao: tributacao || null,
      socio_responsavel: socioResponsavel.trim() || null,
      socio_cpf: socioCpf.replace(/\D/g, "") || null,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar empresa" : "Nova empresa"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados da empresa, seus departamentos e responsáveis."
              : "Cadastre uma empresa e vincule os departamentos que a utilizam."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-numero">Numero</Label>
              <Input
                id="company-numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ex.: 001 (opcional)"
                disabled={!canEdit("numero")}
              />
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
                    profileIds: [],
                  };
                  const editableDepartment =
                    isAdmin || myDepartmentIds.has(department.id);
                  return (
                    <div
                      key={department.id}
                      className="flex flex-col gap-2 rounded-md border p-2 sm:flex-row sm:items-center sm:justify-between"
                    >
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
                      <UserMultiSelect
                        value={assignment.profileIds}
                        onChange={(ids) =>
                          updateAssignment(department.id, { profileIds: ids })
                        }
                        disabled={
                          !assignment.selected ||
                          !canEdit("responsaveis") ||
                          !editableDepartment
                        }
                        users={(usersWithDepartments ?? []).filter((user) =>
                          user.department_ids.includes(department.id)
                        )}
                        className="w-full justify-between font-normal sm:w-56"
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              O usuário responsável é opcional.
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
