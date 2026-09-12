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
import { useDepartments } from "@/hooks/use-departments";
import { useUsers } from "@/hooks/use-users";
import { TRIBUTACOES } from "@/lib/companies";
import { UFS } from "@/lib/ufs";

interface CompanyBulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ids: string[];
}

const NAO_ALTERAR = "nao-alterar";

type DeptActionValue = "none" | "set" | "remove";

interface DeptAction {
  action: DeptActionValue;
  responsibleIds: string[];
}

export default function CompanyBulkEditDialog({
  open,
  onOpenChange,
  ids,
}: CompanyBulkEditDialogProps) {
  const bulkUpdate = useBulkUpdateCompanies();
  const { data: departments } = useDepartments();
  const { data: users } = useUsers();

  const [uf, setUf] = useState(NAO_ALTERAR);
  const [tributacao, setTributacao] = useState(NAO_ALTERAR);
  const [ie, setIe] = useState("");
  const [clearIe, setClearIe] = useState(false);
  const [deptActions, setDeptActions] = useState<Record<string, DeptAction>>(
    {}
  );

  useEffect(() => {
    if (open) {
      setUf(NAO_ALTERAR);
      setTributacao(NAO_ALTERAR);
      setIe("");
      setClearIe(false);
      setDeptActions({});
    }
  }, [open]);

  const updateDept = (departmentId: string, patch: Partial<DeptAction>) => {
    setDeptActions((prev) => ({
      ...prev,
      [departmentId]: {
        action: "none",
        responsibleIds: [],
        ...prev[departmentId],
        ...patch,
      },
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const patch: Record<string, unknown> = {};
    if (uf !== NAO_ALTERAR) patch.uf = uf;
    if (tributacao !== NAO_ALTERAR) patch.tributacao = tributacao;
    if (clearIe) patch.inscricao_estadual = null;
    else if (ie.trim()) patch.inscricao_estadual = ie.trim();

    const deptActionsList = Object.entries(deptActions)
      .filter(([, value]) => value.action !== "none")
      .map(([department_id, value]) => ({
        department_id,
        action: value.action as "remove" | "set",
        responsible_ids: value.responsibleIds,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manutenção em massa</DialogTitle>
          <DialogDescription>
            Aplica as alterações em{" "}
            <span className="font-semibold">{ids.length} empresa(s)</span>.
            Nome, CNPJ e Número não podem ser alterados em massa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>UF</Label>
              <Select value={uf} onValueChange={setUf}>
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
              <Label>Tributação</Label>
              <Select value={tributacao} onValueChange={setTributacao}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NAO_ALTERAR}>
                    — (não alterar)
                  </SelectItem>
                  {TRIBUTACOES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bulk-ie">Inscrição Estadual</Label>
            <Input
              id="bulk-ie"
              value={ie}
              onChange={(e) => setIe(e.target.value)}
              placeholder="Deixe em branco para não alterar"
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={clearIe}
                onCheckedChange={(checked) => setClearIe(checked === true)}
              />
              Limpar a Inscrição Estadual das empresas selecionadas
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Departamentos e responsáveis</Label>
            {(departments ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum departamento cadastrado.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {(departments ?? []).map((department) => {
                  const action =
                    deptActions[department.id]?.action ?? "none";
                  const responsibleIds =
                    deptActions[department.id]?.responsibleIds ?? [];
                  return (
                    <div
                      key={department.id}
                      className="flex flex-col gap-2 rounded-md border p-2 sm:flex-row sm:items-center sm:justify-between"
                    >
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
                        {action === "set" && (
                          <MultiSelectDropdown
                            options={(users ?? []).map((user) => ({
                              value: user.id,
                              label: user.full_name,
                            }))}
                            value={responsibleIds}
                            onChange={(values) =>
                              updateDept(department.id, {
                                responsibleIds: values,
                              })
                            }
                            placeholder="Responsáveis (opcional)"
                            className="w-full sm:w-60"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              "Adicionar / definir" inclui o departamento nas empresas
              selecionadas (e troca os responsáveis, se informados);
              "Remover" desvincula o departamento.
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
