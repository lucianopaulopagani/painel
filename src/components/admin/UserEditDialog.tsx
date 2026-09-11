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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DepartmentMultiSelect } from "@/components/admin/department-multi-select";
import { useUpdateUser } from "@/hooks/use-users";
import type { ProfileWithDepartments, Role } from "@/lib/types";

interface UserEditDialogProps {
  user: ProfileWithDepartments | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserEditDialog({
  user,
  open,
  onOpenChange,
}: UserEditDialogProps) {
  const updateMutation = useUpdateUser();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);

  useEffect(() => {
    if (open && user) {
      setFullName(user.full_name);
      setEmail(user.email);
      setRole(user.role);
      setDepartmentIds(user.departments.map((d) => d.id));
    }
  }, [open, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!fullName.trim() || !email.trim()) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: user.id,
        full_name: fullName.trim(),
        email: email.trim(),
        role,
        department_ids: departmentIds,
      });
      toast.success("Usuário atualizado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar usuário."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>
            Ajuste o papel e os departamentos de acesso do usuário.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Nome completo</Label>
            <Input
              id="edit-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-email">E-mail (login)</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Papel</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Membro</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Departamentos de acesso</Label>
            <DepartmentMultiSelect
              value={departmentIds}
              onChange={setDepartmentIds}
            />
            <p className="text-xs text-muted-foreground">
              Marque um ou mais departamentos. Sem vínculo, o usuário não
              acessa nenhum departamento.
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
            <Button type="submit" disabled={updateMutation.isPending}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
