import { useState } from "react";
import {
  FileUp,
  Loader2,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import CompanyBulkEditDialog from "@/components/admin/CompanyBulkEditDialog";
import { formatCpfCnpj } from "@/lib/utils";
import type { CompanyWithDepartments } from "@/lib/types";

export default function CompaniesTab() {
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: departments } = useDepartments();
  const { data: users } = useUsers();
  const deleteMutation = useDeleteCompany();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<{
    nome?: string;
    documento?: string;
    uf?: string;
    tributacao?: string;
  }>({});
  const [editing, setEditing] = useState<CompanyWithDepartments | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<CompanyWithDepartments | null>(null);

  const departmentNameById = new Map(
    (departments ?? []).map((department) => [department.id, department.name])
  );
  const userNameById = new Map(
    (users ?? []).map((user) => [user.id, user.full_name])
  );

  const filteredCompanies = (companies ?? []).filter((company) => {
    if (filters.nome && company.name !== filters.nome) return false;
    if (filters.documento && company.documento !== filters.documento)
      return false;
    if (filters.uf && (company.uf ?? "") !== filters.uf) return false;
    if (filters.tributacao && (company.tributacao ?? "") !== filters.tributacao)
      return false;
    return true;
  });

  const setFilter = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilter = (key: keyof typeof filters) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const activeFilters = Object.entries(filters).filter(
    ([, value]) => Boolean(value)
  );

  const allSelected =
    filteredCompanies.length > 0 &&
    filteredCompanies.every((company) => selected.has(company.id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else
      setSelected(new Set(filteredCompanies.map((company) => company.id)));
  };

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
          <Button
            variant="outline"
            onClick={() => setBulkOpen(true)}
            disabled={selected.size === 0}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Manutenção em massa
            {selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
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
        <>
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
              <span className="text-xs text-muted-foreground">
                Filtros ativos:
              </span>
              {activeFilters.map(([key, value]) => (
                <Badge key={key} variant="secondary" className="gap-1">
                  {key}: {value}
                  <button
                    type="button"
                    onClick={() => clearFilter(key as keyof typeof filters)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Remover filtro ${key}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button size="sm" variant="ghost" onClick={() => setFilters({})}>
                Limpar
              </Button>
            </div>
          )}

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-9 w-10 px-3">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => toggleAll()}
                    aria-label="Selecionar todas"
                  />
                </TableHead>
                <TableHead className="h-9 w-24 px-3">Numero</TableHead>
                <TableHead className="h-9 px-3">Nome</TableHead>
                <TableHead className="h-9 px-3">CPF/CNPJ</TableHead>
                <TableHead className="h-9 px-3">UF</TableHead>
                <TableHead className="h-9 px-3">Tributação</TableHead>
                <TableHead className="h-9 px-3">Departamentos</TableHead>
                <TableHead className="h-9 w-28 px-3 text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="px-3 py-1.5">
                      <Checkbox
                        checked={selected.has(company.id)}
                        onCheckedChange={() => toggleSelect(company.id)}
                        aria-label={`Selecionar ${company.name}`}
                      />
                    </TableCell>
                    <TableCell className="px-3 py-1.5 font-medium">
                      {company.numero || "—"}
                    </TableCell>
                    <TableCell className="px-3 py-1.5 font-medium">
                      <button
                        type="button"
                        onClick={() => setFilter("nome", company.name)}
                        title={`Filtrar por "${company.name}"`}
                        className="block max-w-56 truncate text-left hover:underline"
                      >
                        {company.name.length > 20
                          ? `${company.name.slice(0, 20)}…`
                          : company.name}
                      </button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => setFilter("documento", company.documento)}
                        title={`Filtrar por "${formatCpfCnpj(
                          company.documento
                        )}"`}
                        className="hover:underline"
                      >
                        {formatCpfCnpj(company.documento)}
                      </button>
                    </TableCell>
                    <TableCell className="px-3 py-1.5">
                      {company.uf ? (
                        <button
                          type="button"
                          onClick={() => setFilter("uf", company.uf)}
                          title={`Filtrar por UF "${company.uf}"`}
                        >
                          <Badge variant="outline">{company.uf}</Badge>
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setFilter("tributacao", company.tributacao ?? "")
                        }
                        disabled={!company.tributacao}
                        title={
                          company.tributacao
                            ? `Filtrar por "${company.tributacao}"`
                            : undefined
                        }
                        className="block max-w-36 truncate text-left hover:underline disabled:pointer-events-none"
                      >
                        {company.tributacao || "—"}
                      </button>
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
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {activeFilters.length > 0
                      ? "Nenhuma empresa encontrada com os filtros aplicados."
                      : "Nenhuma empresa cadastrada."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        </>
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

      <CompanyBulkEditDialog
        open={bulkOpen}
        onOpenChange={(open) => {
          setBulkOpen(open);
          if (!open) setSelected(new Set());
        }}
        ids={Array.from(selected)}
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
