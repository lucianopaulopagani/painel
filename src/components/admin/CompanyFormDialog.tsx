import { useEffect, useState, type FormEvent } from "react";
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
import { DepartmentMultiSelect } from "@/components/admin/department-multi-select";
import { UfMultiSelect } from "@/components/admin/uf-multi-select";
import { useCreateCompany, useUpdateCompany } from "@/hooks/use-companies";
import { formatCpfCnpj, isValidCpfCnpj } from "@/lib/utils";
import type { CompanyWithDepartments } from "@/lib/types";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: CompanyWithDepartments | null;
}

export default function CompanyFormDialog({
  open,
  onOpenChange,
  company,
}: CompanyFormDialogProps) {
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const isEditing = !!company;

  const [numero, setNumero] = useState("");
  const [name, setName] = useState("");
  const [documento, setDocumento] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [ufs, setUfs] = useState<string[]>([]);
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setNumero(company?.numero ?? "");
      setName(company?.name ?? "");
      setDocumento(company ? formatCpfCnpj(company.documento) : "");
      setInscricaoEstadual(company?.inscricao_estadual ?? "");
      setUfs(company?.ufs ?? []);
      setDepartmentIds(company?.department_ids ?? []);
    }
  }, [open, company]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!numero.trim() || !name.trim()) {
      toast.error("Preencha o numero e o nome da empresa.");
      return;
    }
    if (!isValidCpfCnpj(documento)) {
      toast.error("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.");
      return;
    }
    if (ufs.length === 0) {
      toast.error("Selecione pelo menos uma UF.");
      return;
    }

    const payload = {
      numero: numero.trim(),
      name: name.trim(),
      documento,
      inscricao_estadual: inscricaoEstadual,
      ufs,
      department_ids: departmentIds,
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
              ? "Atualize os dados da empresa e seus departamentos."
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
                placeholder="Ex.: 001"
                required
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
            <UfMultiSelect value={ufs} onChange={setUfs} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Departamentos que utilizam a empresa</Label>
            <DepartmentMultiSelect
              value={departmentIds}
              onChange={setDepartmentIds}
            />
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
