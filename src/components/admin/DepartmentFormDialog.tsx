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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateDepartment,
  useUpdateDepartment,
} from "@/hooks/use-departments";
import type { Department } from "@/lib/types";

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
}

export default function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
}: DepartmentFormDialogProps) {
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const isEditing = !!department;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setName(department?.name ?? "");
      setDescription(department?.description ?? "");
    }
  }, [open, department]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome do departamento.");
      return;
    }
    try {
      if (isEditing && department) {
        await updateMutation.mutateAsync({
          id: department.id,
          name,
          description,
        });
        toast.success("Departamento atualizado.");
      } else {
        await createMutation.mutateAsync({ name, description });
        toast.success("Departamento criado.");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar departamento."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar departamento" : "Novo departamento"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do departamento."
              : "Cadastre um novo departamento para o sistema de acesso."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-name">Nome</Label>
            <Input
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Recursos Humanos"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-description">Descrição</Label>
            <Textarea
              id="dept-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional do departamento"
              rows={3}
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
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEditing ? "Salvar alterações" : "Criar departamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
