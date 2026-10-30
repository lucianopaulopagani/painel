import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  permissoesKeys,
  salvarPermissoesDoUsuario,
  usePermissoes,
  usePermissoesDoUsuario,
  vinculosKey,
} from "@/hooks/use-permissoes";
import { temOpcaoAdmin } from "@/lib/permissoes";
import { useUpdateUser } from "@/hooks/use-users";
import { fileToDataUrl } from "@/hooks/use-own-profile";
import { getInitials } from "@/lib/utils";
import type { ProfileWithDepartments } from "@/lib/types";

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
  const queryClient = useQueryClient();

  const { data: permissoes } = usePermissoes();
  const { data: permissoesDoUsuario } = usePermissoesDoUsuario(user?.id);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [permissaoIds, setPermissaoIds] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && user) {
      setFullName(user.full_name);
      setEmail(user.email);
      setAvatarUrl(user.avatar_url ?? null);
      setPermissaoIds([]);
    }
  }, [open, user]);

  // Permissões salvas; administradores antigos entram com a permissão Admin marcada.
  useEffect(() => {
    if (!open || !user || !permissoes || !permissoesDoUsuario) return;
    const ids = [...permissoesDoUsuario];
    if (ids.length === 0 && user.role === "admin") {
      const admin = permissoes.find((item) => temOpcaoAdmin(item.opcoes));
      if (admin) ids.push(admin.id);
    }
    setPermissaoIds(ids);
  }, [open, user, permissoes, permissoesDoUsuario]);

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setAvatarUrl(await fileToDataUrl(file));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao processar a imagem."
      );
    }
    event.target.value = "";
  };

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
    if (!user) return;
    if (!permissoes) {
      toast.error("Aguarde o carregamento das permissões.");
      return;
    }
    if (!fullName.trim() || !email.trim()) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: user.id,
        full_name: fullName.trim(),
        email: email.trim(),
        role: isAdminSelecionado ? "admin" : "member",
        department_ids: departmentIds,
        avatar_url: avatarUrl || null,
      });
      await salvarPermissoesDoUsuario(user.id, permissaoIds);
      await queryClient.invalidateQueries({
        queryKey: permissoesKeys.doUsuario(user.id),
      });
      await queryClient.invalidateQueries({ queryKey: vinculosKey });
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>
            Ajuste os dados, as permissões e os departamentos de acesso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
              <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                {getInitials(fullName || user?.full_name || "?")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  Alterar foto
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setAvatarUrl(null)}
                  >
                    Remover foto
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Foto exibida no topo do sistema para este usuário.
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
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
            <Button type="submit" disabled={updateMutation.isPending}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
