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
import { useDepartments } from "@/hooks/use-departments";
import { TRIBUTACOES } from "@/lib/companies";
import { UFS } from "@/lib/ufs";
import { formatCpfCnpj, isValidCpfCnpj } from "@/lib/utils";
import type { CompanyWithDepartments } from "@/lib/types";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: CompanyWithDepartments | null;
}

interface DepartmentAssignment {
  selected: boolean;
  profileIds: string[];
}

export default function CompanyFormDialog({
  open,
  onOpenChange,
  company,
}: CompanyFormDialogProps) {
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const { data: departments } = useDepartments();
  const isEditing = !!company;

  const [numero, setNumero] = useState("");
  const [name, setName] = useState("");
  const [documento, setDocumento] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [uf, setUf] = useState("");
  const [tributacao, setTributacao] = useState("");
  const [assignments, setAssignments] = useState<
    Record<string, DepartmentAssignment>
  >({});

  const departmentsKey = (departments ?? []).map((d) => d.id).join(",");

  useEffect(() => {
    if (!open) return;
    setNumero(company?.numero ?? "");
    setName(company?.name ?? "");
    setDocumento(company ? formatCpfCnpj(company.documento) : "");
    setInscricaoEstadual(company?.inscricao_estadual ?? "");
    setUf(company?.uf ?? "");
    setTributacao(company?.tributacao ?? "");

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
      tributacao: tributacao || null,
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
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>UF</Label>
              <Select value={uf} onValueChange={setUf}>
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
            <Label>Tributação</Label>
            <Select
              value={tributacao === "" ? "none" : tributacao}
              onValueChange={setTributacao}
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
                  return (
                    <div
                      key={department.id}
                      className="flex flex-col gap-2 rounded-md border p-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={assignment.selected}
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
                        disabled={!assignment.selected}
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
