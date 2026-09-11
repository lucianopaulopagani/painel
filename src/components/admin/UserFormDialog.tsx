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
import { useCreateUser } from "@/hooks/use-users";
import type { Role } from "@/lib/types";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserFormDialog({
  open,
  onOpenChange,
}: UserFormDialogProps) {
  const createMutation = useCreateUser();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("member");
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
        role,
        department_ids: departmentIds,
      });
      toast.success("Usuário criado com sucesso.");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao criar usuário."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>
            Cria o acesso (e-mail e senha) e vincula o usuário a um ou mais
            departamentos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-name">Nome completo</Label>
            <Input
              id="user-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex.: Maria Souza"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-email">E-mail (login)</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maria@empresa.com.br"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-password">Senha</Label>
            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
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
            <Button type="submit" disabled={createMutation.isPending}>
              Criar usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
