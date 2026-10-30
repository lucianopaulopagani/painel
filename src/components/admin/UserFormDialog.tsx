import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { PermissoesMultiSelect } from "@/components/admin/PermissoesMultiSelect";
import {
  salvarPermissoesDoUsuario,
  usePermissoes,
  vinculosKey,
} from "@/hooks/use-permissoes";
import { temOpcaoAdmin } from "@/lib/permissoes";
import { useCreateUser } from "@/hooks/use-users";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserFormDialog({
  open,
  onOpenChange,
}: UserFormDialogProps) {
  const createMutation = useCreateUser();
  const queryClient = useQueryClient();
  const { data: permissoes } = usePermissoes();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [permissaoIds, setPermissaoIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setFullName("");
      setEmail("");
      setPassword("");
      setPermissaoIds([]);
    }
  }, [open]);

  /** Departamentos vêm das permissões marcadas. */
  const departmentIds = Array.from(
    new Set(
      (permissoes ?? [])
        .filter((permissao) => permissaoIds.includes(permissao.id))
        .map((permissao) => permissao.department_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const isAdminSelecionado = (permissoes ?? [])
    .filter((permissao) => permissaoIds.includes(permissao.id))
    .some((permissao) => temOpcaoAdmin(permissao.opcoes));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!permissoes) {
      toast.error("Aguarde o carregamento das permissões.");
      return;
    }
    if (!fullName.trim() || !email.trim() || !password) {
      toast.error("Preencha nome, e-mail e senha.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    try {
      const userId = await createMutation.mutateAsync({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role: isAdminSelecionado ? "admin" : "member",
        department_ids: departmentIds,
      });
      if (userId) {
        await salvarPermissoesDoUsuario(userId, permissaoIds);
        await queryClient.invalidateQueries({ queryKey: vinculosKey });
      }
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>
            Cria o acesso (e-mail e senha) e vincula as permissões e os
            departamentos do usuário.
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
          <PermissoesMultiSelect
            value={permissaoIds}
            onChange={setPermissaoIds}
          />
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
