import { useState, type FormEvent } from "react";
import { ChevronDown, Loader2, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { CadastroTabelaEditor } from "@/components/admin/CadastroTabelaEditor";
import { useCompanies } from "@/hooks/use-companies";
import {
  useCreateTributacao,
  useDeleteTributacao,
  useTributacoes,
  useUpdateTributacao,
} from "@/hooks/use-tributacoes";
import {
  useDeleteCadastroTabela,
  useRenameCadastroTabela,
} from "@/hooks/use-cadastro-tabelas";
import { FISCAL_DEPARTMENT_NAME } from "@/lib/departments";
import { tabelasDoDepartamento } from "@/lib/cadastro-tabelas";
import { cn } from "@/lib/utils";
import type { Tributacao } from "@/lib/types";

const normalize = (value: string) => value.trim().toLocaleLowerCase("pt-BR");

/**
 * Tabelas do departamento Fiscal — cada tributação é uma tabela do Movimento
 * Fiscal, com as suas colunas e opções de menu suspenso. As tributações também
 * são a lista usada no cadastro de empresas (e na importação): renomear aqui
 * não altera o texto já gravado nas empresas.
 */
export default function TabelasFiscal() {
  const { data: tributacoes, isLoading, isError } = useTributacoes();
  const { data: companies } = useCompanies();
  const createMutation = useCreateTributacao();
  const updateMutation = useUpdateTributacao();
  const deleteMutation = useDeleteTributacao();
  const renameTabela = useRenameCadastroTabela();
  const deleteTabela = useDeleteCadastroTabela();

  const [novoNome, setNovoNome] = useState("");
  const [editing, setEditing] = useState<Tributacao | null>(null);
  const [editingNome, setEditingNome] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Tributacao | null>(null);
  /* Tabelas com o editor de colunas aberto. */
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const tabelas = tabelasDoDepartamento(FISCAL_DEPARTMENT_NAME, { tributacoes });

  /** Quantas empresas usam a tributação (para avisar antes de excluir). */
  const usageOf = (nome: string): number =>
    (companies ?? []).filter(
      (company) => normalize(company.tributacao ?? "") === normalize(nome)
    ).length;

  const exists = (nome: string, ignoreId?: string): boolean =>
    (tributacoes ?? []).some(
      (item) => item.id !== ignoreId && normalize(item.nome) === normalize(nome)
    );

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const nome = novoNome.trim();
    if (!nome) {
      toast.error("Informe o nome da tabela.");
      return;
    }
    if (exists(nome)) {
      toast.error(`A tabela "${nome}" já está cadastrada.`);
      return;
    }
    try {
      await createMutation.mutateAsync(nome);
      setNovoNome("");
      toast.success("Tabela cadastrada.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao cadastrar a tabela."
      );
    }
  };

  const handleRename = async () => {
    if (!editing) return;
    const nome = editingNome.trim();
    if (!nome) {
      toast.error("Informe o nome da tabela.");
      return;
    }
    if (exists(nome, editing.id)) {
      toast.error(`A tabela "${nome}" já está cadastrada.`);
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: editing.id, nome });
      /* Mantém as opções cadastradas ligadas à tabela renomeada. */
      await renameTabela.mutateAsync({
        departamento: FISCAL_DEPARTMENT_NAME,
        de: editing.nome,
        para: nome,
      });
      setEditing(null);
      toast.success("Tabela atualizada.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar a tabela."
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTabela.mutateAsync({
        departamento: FISCAL_DEPARTMENT_NAME,
        tabela: deleteTarget.nome,
      });
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Tabela excluída.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao excluir a tabela."
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Tags className="h-4 w-4 text-muted-foreground" />
        <div>
          <h3 className="text-sm font-semibold">
            Tabelas do Departamento Fiscal
          </h3>
          <p className="text-xs text-muted-foreground">
            Cada tabela corresponde a uma tributação do Movimento Fiscal.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="nova-tabela" className="text-xs text-muted-foreground">
            Nova tabela (tributação)
          </Label>
          <Input
            id="nova-tabela"
            value={novoNome}
            onChange={(event) => setNovoNome(event.target.value)}
            placeholder="Ex.: Lucro Arbitrado"
            className="h-9"
          />
        </div>
        <Button
          type="submit"
          className="h-9 gap-2"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Adicionar
        </Button>
      </form>

      {isLoading && (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {isError && (
        <p className="py-10 text-center text-sm text-destructive">
          Não foi possível carregar as tabelas.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="divide-y rounded-xl border bg-card shadow-sm">
          {(tributacoes ?? []).length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma tabela cadastrada. Adicione a primeira acima.
            </p>
          )}

          {(tributacoes ?? []).map((tributacao) => {
            const usage = usageOf(tributacao.nome);
            const tabela = tabelas.find((item) => item.nome === tributacao.nome);
            return (
              <div key={tributacao.id} className="flex flex-col">
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {tributacao.nome}
                    </span>
                    <Badge variant="secondary" className="tabular-nums">
                      {usage} {usage === 1 ? "empresa" : "empresas"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title={
                        expanded[tributacao.id]
                          ? "Ocultar colunas"
                          : "Ver/editar colunas e opções da tabela"
                      }
                      aria-expanded={expanded[tributacao.id] === true}
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [tributacao.id]: !prev[tributacao.id],
                        }))
                      }
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expanded[tributacao.id] && "rotate-180"
                        )}
                      />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Renomear tabela"
                      onClick={() => {
                        setEditingNome(tributacao.nome);
                        setEditing(tributacao);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      title={
                        usage > 0
                          ? `Não é possível excluir: ${usage} empresa(s) usam esta tributação.`
                          : "Excluir tabela"
                      }
                      disabled={usage > 0}
                      onClick={() => setDeleteTarget(tributacao)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expanded[tributacao.id] && tabela && (
                  <CadastroTabelaEditor
                    departamento={FISCAL_DEPARTMENT_NAME}
                    tabela={tabela}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Renomear */}
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renomear tabela</DialogTitle>
            <DialogDescription>
              O novo nome passa a aparecer no cadastro de empresas e na tabela
              do Movimento Fiscal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tabela-nome">Nome</Label>
            <Input
              id="tabela-nome"
              value={editingNome}
              onChange={(event) => setEditingNome(event.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleRename}
              disabled={updateMutation.isPending || renameTabela.isPending}
            >
              {(updateMutation.isPending || renameTabela.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excluir */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tabela</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="font-medium">{deleteTarget?.nome}</span>? Ela
              deixará de aparecer no cadastro de empresas e as opções das suas
              colunas serão removidas.
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
