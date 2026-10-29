import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";

import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreatePermissao,
  useDeletePermissao,
  usePermissoes,
  useUpdatePermissao,
  type Permissao,
} from "@/hooks/use-permissoes";
import { PERMISSAO_OPCOES, opcaoLabel } from "@/lib/permissoes";

interface FormState {
  nome: string;
  descricao: string;
  opcoes: string[];
}

const FORM_VAZIO: FormState = { nome: "", descricao: "", opcoes: [] };

export default function PermissoesTab() {
  const { data: permissoes, isLoading, isError } = usePermissoes();
  const criar = useCreatePermissao();
  const atualizar = useUpdatePermissao();
  const excluir = useDeletePermissao();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Permissao | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [excluirAlvo, setExcluirAlvo] = useState<Permissao | null>(null);

  useEffect(() => {
    if (!dialogOpen) return;
    setForm(
      editando
        ? {
            nome: editando.nome,
            descricao: editando.descricao ?? "",
            opcoes: editando.opcoes,
          }
        : FORM_VAZIO
    );
  }, [dialogOpen, editando]);

  const abrirNova = () => {
    setEditando(null);
    setDialogOpen(true);
  };

  const abrirEdicao = (permissao: Permissao) => {
    setEditando(permissao);
    setDialogOpen(true);
  };

  const alternarOpcao = (key: string) => {
    setForm((prev) => ({
      ...prev,
      opcoes: prev.opcoes.includes(key)
        ? prev.opcoes.filter((item) => item !== key)
        : [...prev.opcoes, key],
    }));
  };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe o nome da permissão.");
      return;
    }
    if (form.opcoes.length === 0) {
      toast.error("Marque ao menos uma opção.");
      return;
    }

    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      opcoes: form.opcoes,
    };

    try {
      if (editando) {
        await atualizar.mutateAsync({ id: editando.id, ...payload });
        toast.success("Permissão atualizada.");
      } else {
        await criar.mutateAsync(payload);
        toast.success("Permissão criada.");
      }
      setDialogOpen(false);
    } catch (err) {
      const mensagem =
        err instanceof Error && err.message.includes("duplicate")
          ? "Já existe uma permissão com esse nome."
          : err instanceof Error
            ? err.message
            : "Erro ao salvar a permissão.";
      toast.error(mensagem);
    }
  };

  const confirmarExclusao = async () => {
    if (!excluirAlvo) return;
    try {
      await excluir.mutateAsync(excluirAlvo.id);
      toast.success("Permissão excluída.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao excluir a permissão."
      );
    }
    setExcluirAlvo(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Permissões</h2>
          <p className="text-sm text-muted-foreground">
            Crie as permissões do sistema marcando as opções disponíveis. Os
            usuários recebem essas permissões no cadastro.
          </p>
        </div>
        <Button onClick={abrirNova}>
          <Plus className="h-4 w-4" />
          Nova permissão
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {isError && (
        <p className="py-12 text-center text-sm text-destructive">
          Não foi possível carregar as permissões.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permissão</TableHead>
                <TableHead>Opções</TableHead>
                <TableHead className="w-28 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissoes && permissoes.length > 0 ? (
                permissoes.map((permissao) => (
                  <TableRow key={permissao.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <ShieldCheck className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="font-medium">{permissao.nome}</div>
                          {permissao.descricao && (
                            <div className="text-xs text-muted-foreground">
                              {permissao.descricao}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {permissao.opcoes.map((opcao) => (
                          <Badge key={opcao} variant="secondary">
                            {opcaoLabel(opcao)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => abrirEdicao(permissao)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setExcluirAlvo(permissao)}
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
                    colSpan={3}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Nenhuma permissão cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar permissão" : "Nova permissão"}
            </DialogTitle>
            <DialogDescription>
              Dê um nome à permissão e marque as opções que ela libera.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={salvar} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="permissao-nome">Nome</Label>
              <Input
                id="permissao-nome"
                value={form.nome}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Ex.: Administrador"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="permissao-descricao">Descrição</Label>
              <Textarea
                id="permissao-descricao"
                value={form.descricao}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, descricao: e.target.value }))
                }
                placeholder="O que esta permissão libera (opcional)."
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-2 rounded-md border p-3">
              <Label className="text-sm font-medium">Opções disponíveis</Label>
              <p className="text-xs text-muted-foreground">
                As demais opções serão liberadas nas próximas versões.
              </p>
              <div className="flex flex-col gap-2">
                {PERMISSAO_OPCOES.map((opcao) => {
                  const marcada = form.opcoes.includes(opcao.key);
                  return (
                    <label
                      key={opcao.key}
                      className={
                        opcao.disponivel
                          ? "flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-accent/40"
                          : "flex cursor-not-allowed items-start gap-3 rounded-md border border-dashed p-3 opacity-60"
                      }
                    >
                      <Checkbox
                        checked={marcada}
                        disabled={!opcao.disponivel}
                        onCheckedChange={() => alternarOpcao(opcao.key)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">
                            {opcao.label}
                          </span>
                          {!opcao.disponivel && (
                            <Badge variant="outline">Em breve</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {opcao.descricao}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={criar.isPending || atualizar.isPending}
              >
                {editando ? "Salvar alterações" : "Criar permissão"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!excluirAlvo}
        onOpenChange={(open) => !open && setExcluirAlvo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir permissão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="font-semibold">{excluirAlvo?.nome}</span>? Os
              usuários vinculados perdem esta permissão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
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
