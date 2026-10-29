import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";

import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  useAllDepartmentSubmenus,
  useDepartmentSubmenus,
} from "@/hooks/use-department-submenus";
import { useDepartments } from "@/hooks/use-departments";
import {
  CHAVE_ADMIN,
  CHAVE_DASH_GERAL,
  CHAVE_EMPRESAS_RESPONSAVEL,
  chaveDashboardSub,
  chaveSubmenu,
  rotuloOpcao,
  temOpcaoAdmin,
  type PermissaoNivel,
} from "@/lib/permissoes";

interface FormState {
  nome: string;
  descricao: string;
  departmentId: string | null;
  opcoes: string[];
}

const FORM_VAZIO: FormState = {
  nome: "",
  descricao: "",
  departmentId: null,
  opcoes: [],
};

type NivelEscolhido = "none" | PermissaoNivel;

/** Opções que dependem do departamento escolhido. */
const ehOpcaoDeDepartamento = (opcao: string) =>
  opcao.startsWith("sub:") ||
  opcao.startsWith("dash:") ||
  opcao === CHAVE_EMPRESAS_RESPONSAVEL;

export default function PermissoesTab() {
  const { data: permissoes, isLoading, isError } = usePermissoes();
  const { data: departments } = useDepartments();
  const criar = useCreatePermissao();
  const atualizar = useUpdatePermissao();
  const excluir = useDeletePermissao();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Permissao | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [excluirAlvo, setExcluirAlvo] = useState<Permissao | null>(null);

  const { data: submenus } = useDepartmentSubmenus(form.departmentId ?? "");
  const { data: todosSubmenus } = useAllDepartmentSubmenus();

  /** Nomes de todos os submenus, para as etiquetas da listagem. */
  const nomesSubmenus = useMemo(() => {
    const mapa: Record<string, string> = {};
    for (const item of todosSubmenus ?? []) mapa[item.id] = item.name;
    return mapa;
  }, [todosSubmenus]);

  useEffect(() => {
    if (!dialogOpen) return;
    setForm(
      editando
        ? {
            nome: editando.nome,
            descricao: editando.descricao ?? "",
            departmentId: editando.department_id,
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

  const alterarOpcoes = (transformar: (opcoes: string[]) => string[]) => {
    setForm((prev) => ({ ...prev, opcoes: transformar(prev.opcoes) }));
  };

  const alternar = (chave: string) => {
    alterarOpcoes((opcoes) =>
      opcoes.includes(chave)
        ? opcoes.filter((item) => item !== chave)
        : [...opcoes, chave]
    );
  };

  const trocarDepartamento = (valor: string) => {
    const departmentId = valor === "nenhum" ? null : valor;
    setForm((prev) => ({
      ...prev,
      departmentId,
      // Opções de submenu/dash pertencem ao departamento anterior.
      opcoes: prev.opcoes.filter((opcao) => !ehOpcaoDeDepartamento(opcao)),
    }));
  };

  const nivelDoSubmenu = (submenuId: string): NivelEscolhido => {
    if (form.opcoes.includes(chaveSubmenu(submenuId, "edit"))) return "edit";
    if (form.opcoes.includes(chaveSubmenu(submenuId, "view"))) return "view";
    return "none";
  };

  const definirNivel = (submenuId: string, nivel: NivelEscolhido) => {
    alterarOpcoes((opcoes) => {
      const limpas = opcoes.filter(
        (opcao) =>
          opcao !== chaveSubmenu(submenuId, "edit") &&
          opcao !== chaveSubmenu(submenuId, "view")
      );
      return nivel === "none"
        ? limpas
        : [...limpas, chaveSubmenu(submenuId, nivel)];
    });
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
      department_id: form.departmentId,
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

  const rotuloCompleto = useMemo(() => {
    return (opcao: string) => {
      if (opcao.startsWith("sub:")) {
        const [, id, nivel] = opcao.split(":");
        const nome = nomesSubmenus[id];
        if (!nome) return rotuloOpcao(opcao);
        return `${nome} · ${nivel === "edit" ? "alterar" : "visualizar"}`;
      }
      return rotuloOpcao(opcao);
    };
  }, [nomesSubmenus]);

  const nomeDepartamento = (id: string | null) =>
    departments?.find((item) => item.id === id)?.name ?? "Sem departamento";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Permissões</h2>
          <p className="text-sm text-muted-foreground">
            Cada permissão libera submenus (visualizar ou alterar), dashboards e
            o escopo de empresas de um departamento.
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
                <TableHead className="hidden md:table-cell">
                  Departamento
                </TableHead>
                <TableHead>Liberações</TableHead>
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
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {nomeDepartamento(permissao.department_id)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {permissao.opcoes.map((opcao) => (
                          <Badge
                            key={opcao}
                            variant={
                              opcao === CHAVE_ADMIN ? "default" : "secondary"
                            }
                          >
                            {rotuloCompleto(opcao)}
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
                    colSpan={4}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar permissão" : "Nova permissão"}
            </DialogTitle>
            <DialogDescription>
              Escolha o departamento e marque o que esta permissão libera.
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
                placeholder="Ex.: Departamento Fiscal"
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
            <div className="flex flex-col gap-1.5">
              <Label>Departamento</Label>
              <Select
                value={form.departmentId ?? "nenhum"}
                onValueChange={trocarDepartamento}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">
                    Sem departamento (uso geral)
                  </SelectItem>
                  {(departments ?? []).map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.departmentId && (
              <div className="flex flex-col gap-2 rounded-md border p-3">
                <Label className="text-sm font-medium">
                  Submenus do departamento
                </Label>
                <p className="text-xs text-muted-foreground">
                  Submenus criados depois aparecem aqui automaticamente, sem
                  acesso até serem marcados.
                </p>
                {(submenus ?? []).length === 0 && (
                  <p className="py-1 text-sm text-muted-foreground">
                    Este departamento ainda não tem submenus cadastrados.
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  {(submenus ?? []).map((submenu) => {
                    const nivel = nivelDoSubmenu(submenu.id);
                    const dash = form.opcoes.includes(
                      chaveDashboardSub(submenu.id)
                    );
                    return (
                      <div
                        key={submenu.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-2.5"
                      >
                        <span className="text-sm font-medium">
                          {submenu.name}
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                            <Checkbox
                              checked={dash}
                              onCheckedChange={() =>
                                alternar(chaveDashboardSub(submenu.id))
                              }
                            />
                            Dashboard
                          </label>
                          <Select
                            value={nivel}
                            onValueChange={(valor) =>
                              definirNivel(
                                submenu.id,
                                valor as NivelEscolhido
                              )
                            }
                          >
                            <SelectTrigger className="h-8 w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem acesso</SelectItem>
                              <SelectItem value="view">Visualizar</SelectItem>
                              <SelectItem value="edit">Alterar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {form.departmentId && (
              <div className="flex flex-col gap-2 rounded-md border p-3">
                <Label className="text-sm font-medium">Dashboards</Label>
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-accent/40">
                  <Checkbox
                    checked={form.opcoes.includes(CHAVE_DASH_GERAL)}
                    onCheckedChange={() => alternar(CHAVE_DASH_GERAL)}
                    className="mt-0.5"
                  />
                  <span className="text-sm">
                    Dashboard geral do departamento
                  </span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Os dashboards de cada subdepartamento são marcados na lista de
                  submenus acima.
                </p>
              </div>
            )}

            {form.departmentId && (
              <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-accent/40">
                <Checkbox
                  checked={form.opcoes.includes(
                    CHAVE_EMPRESAS_RESPONSAVEL
                  )}
                  onCheckedChange={() => alternar(CHAVE_EMPRESAS_RESPONSAVEL)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium">
                    Somente empresas em que é responsável
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    O usuário só enxerga as empresas em que está como
                    responsável no departamento.
                  </p>
                </div>
              </label>
            )}

            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-accent/40">
              <Checkbox
                checked={form.opcoes.includes(CHAVE_ADMIN)}
                onCheckedChange={() => alternar(CHAVE_ADMIN)}
                className="mt-0.5"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">Administrador</span>
                  {temOpcaoAdmin(form.opcoes) && (
                    <Badge variant="default">Acesso total</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Libera o painel de administração inteiro (usuários,
                  permissões, departamentos, empresas e dashboards).
                </p>
              </div>
            </label>

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
