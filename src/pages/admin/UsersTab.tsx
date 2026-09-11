import { useState } from "react";
import { KeyRound, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUsers, useDeleteUser } from "@/hooks/use-users";
import { getInitials } from "@/lib/utils";
import UserFormDialog from "@/components/admin/UserFormDialog";
import UserEditDialog from "@/components/admin/UserEditDialog";
import ResetPasswordDialog from "@/components/admin/ResetPasswordDialog";
import type { ProfileWithDepartments } from "@/lib/types";

type DialogState =
  | { type: "create" }
  | { type: "edit"; user: ProfileWithDepartments }
  | { type: "reset"; user: ProfileWithDepartments }
  | null;

export default function UsersTab() {
  const { data: users, isLoading, isError } = useUsers();
  const deleteMutation = useDeleteUser();

  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<ProfileWithDepartments | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Usuário excluído.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao excluir usuário."
      );
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Usuários</h2>
          <p className="text-sm text-muted-foreground">
            Usuários do sistema e seus departamentos de acesso.
          </p>
        </div>
        <Button onClick={() => setDialog({ type: "create" })}>
          <Plus className="h-4 w-4" />
          Novo usuário
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {isError && (
        <p className="py-12 text-center text-sm text-destructive">
          Não foi possível carregar os usuários.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.length > 0 ? (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                            {getInitials(u.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{u.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.departments.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {u.departments.map((department) => (
                            <Badge key={department.id} variant="secondary">
                              {department.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.role === "admin" ? "default" : "secondary"}
                      >
                        {u.role === "admin" ? "Admin" : "Membro"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => setDialog({ type: "edit", user: u })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Redefinir senha"
                          onClick={() => setDialog({ type: "reset", user: u })}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Nenhum usuário cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {dialog?.type === "create" && (
        <UserFormDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
      {dialog?.type === "edit" && (
        <UserEditDialog
          user={dialog.user}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
      {dialog?.type === "reset" && (
        <ResetPasswordDialog
          user={dialog.user}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="font-semibold">{deleteTarget?.full_name}</span> (
              {deleteTarget?.email})? O acesso será removido imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
