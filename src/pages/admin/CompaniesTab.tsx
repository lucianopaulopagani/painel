import { useState } from "react";
import { FileUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
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
import { useCompanies, useDeleteCompany } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import { useUsers } from "@/hooks/use-users";
import CompanyFormDialog from "@/components/admin/CompanyFormDialog";
import CompanyImportDialog from "@/components/admin/CompanyImportDialog";
import { formatCpfCnpj } from "@/lib/utils";
import type { CompanyWithDepartments } from "@/lib/types";

export default function CompaniesTab() {
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: departments } = useDepartments();
  const { data: users } = useUsers();
  const deleteMutation = useDeleteCompany();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyWithDepartments | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<CompanyWithDepartments | null>(null);

  const departmentNameById = new Map(
    (departments ?? []).map((department) => [department.id, department.name])
  );
  const userNameById = new Map(
    (users ?? []).map((user) => [user.id, user.full_name])
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Empresa excluída.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao excluir empresa."
      );
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Empresas</h2>
          <p className="text-sm text-muted-foreground">
            Cadastro central de empresas, usado pelos departamentos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileUp className="h-4 w-4" />
            Importar
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nova empresa
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {isError && (
        <p className="py-12 text-center text-sm text-destructive">
          Não foi possível carregar as empresas.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-9 w-24 px-3">Numero</TableHead>
                <TableHead className="h-9 px-3">Nome</TableHead>
                <TableHead className="h-9 px-3">CPF/CNPJ</TableHead>
                <TableHead className="h-9 px-3">UF</TableHead>
                <TableHead className="h-9 px-3">Departamentos</TableHead>
                <TableHead className="h-9 w-28 px-3 text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies && companies.length > 0 ? (
                companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="px-3 py-1.5 font-medium">
                      {company.numero || "—"}
                    </TableCell>
                    <TableCell className="px-3 py-1.5 font-medium">
                      <span
                        className="block max-w-56 truncate"
                        title={company.name}
                      >
                        {company.name.length > 20
                          ? `${company.name.slice(0, 20)}…`
                          : company.name}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">
                      {formatCpfCnpj(company.documento)}
                    </TableCell>
                    <TableCell className="px-3 py-1.5">
                      {company.uf ? (
                        <Badge variant="outline">{company.uf}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="px-3 py-1.5"
                      title={
                        company.department_links.length > 0
                          ? company.department_links
                              .map((link) => {
                                const deptName =
                                  departmentNameById.get(link.department_id) ??
                                  "—";
                                const names = link.profile_ids
                                  .map((id) => userNameById.get(id))
                                  .filter(
                                    (name): name is string => !!name
                                  );
                                return names.length > 0
                                  ? `- ${deptName}: ${names.join(", ")}`
                                  : `- ${deptName}`;
                              })
                              .join("\n")
                          : undefined
                      }
                    >
                      {company.department_links.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="whitespace-nowrap">
                          {company.department_links.length} depart.
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-1.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => {
                            setEditing(company);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(company)}
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
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Nenhuma empresa cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <CompanyFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        company={editing}
      />

      <CompanyImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="font-semibold">{deleteTarget?.name}</span>? Os
              vínculos com departamentos serão removidos.
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
