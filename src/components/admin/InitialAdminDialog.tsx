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
import { useCreateUser } from "@/hooks/use-users";

interface InitialAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export default function InitialAdminDialog({
  open,
  onOpenChange,
  onCreated,
}: InitialAdminDialogProps) {
  const createMutation = useCreateUser();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setFullName("");
      setEmail("");
      setPassword("");
      setDepartmentIds([]);
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      toast.error("Preencha nome, e-mail e senha.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role: "admin",
        department_ids: departmentIds,
      });
      toast.success("Administrador criado com sucesso.");
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao criar o administrador."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configuração inicial</DialogTitle>
          <DialogDescription>
            Crie o primeiro administrador do sistema. Ele poderá gerenciar
            departamentos e criar novos usuários.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-name">Nome completo</Label>
            <Input
              id="admin-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex.: Administrador"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-email">E-mail (login)</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@empresa.com.br"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-password">Senha</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Departamentos (opcional)</Label>
            <DepartmentMultiSelect
              value={departmentIds}
              onChange={setDepartmentIds}
            />
            <p className="text-xs text-muted-foreground">
              Sem vínculo, o administrador pode acessar todos os
              departamentos.
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar administrador"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
