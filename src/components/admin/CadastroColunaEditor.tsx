import { useState, type FormEvent } from "react";
import { ListPlus, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUS_COLOR_OPTIONS,
  type ColunaCadastro,
} from "@/lib/cadastro-tabelas";
import {
  useCadastroLabels,
  useCadastroOpcoes,
  useCreateCadastroOpcao,
  useDeleteCadastroOpcao,
  useUpdateCadastroLabel,
  useUpdateCadastroOpcao,
} from "@/hooks/use-cadastro-tabelas";
import { cn } from "@/lib/utils";
import type { CadastroOpcao } from "@/lib/types";

interface CadastroColunaEditorProps {
  departamento: string;
  tabela: string;
  coluna: ColunaCadastro;
}

const normalize = (value: string) => value.trim().toLocaleLowerCase("pt-BR");

const swatchClass = (cor: string | null | undefined): string =>
  STATUS_COLOR_OPTIONS.find((option) => option.key === cor)?.swatch ??
  "bg-muted";

/**
 * Cadastro de uma coluna: o nome que aparece no cabeçalho e, quando a coluna
 * tem menu suspenso, a lista de opções com nome e cor.
 */
export function CadastroColunaEditor({
  departamento,
  tabela,
  coluna,
}: CadastroColunaEditorProps) {
  const { data: opcoes } = useCadastroOpcoes();
  const columnLabel = useCadastroLabels(departamento);
  const updateLabel = useUpdateCadastroLabel();
  const createMutation = useCreateCadastroOpcao();
  const updateMutation = useUpdateCadastroOpcao();
  const deleteMutation = useDeleteCadastroOpcao();

  const [labelDraft, setLabelDraft] = useState<string | null>(null);
  const [novo, setNovo] = useState("");
  const [novaCor, setNovaCor] = useState<string>("neutral");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const list = (opcoes ?? []).filter(
    (opcao) =>
      opcao.departamento === departamento &&
      opcao.tabela === tabela &&
      opcao.campo === coluna.campo
  );

  const saveColumnLabel = async () => {
    const label = (labelDraft ?? "").trim();
    setLabelDraft(null);
    if (!label || label === columnLabel(coluna.campo, coluna.label)) return;
    try {
      await updateLabel.mutateAsync({ departamento, campo: coluna.campo, label });
      toast.success("Nome da coluna atualizado.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar o nome."
      );
    }
  };

  const saveName = async (opcao: CadastroOpcao) => {
    const nome = (drafts[opcao.id] ?? opcao.nome).trim();
    if (!nome || nome === opcao.nome) {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[opcao.id];
        return next;
      });
      return;
    }
    if (
      list.some(
        (item) => item.id !== opcao.id && normalize(item.nome) === normalize(nome)
      )
    ) {
      toast.error(`A opção "${nome}" já existe em ${coluna.label}.`);
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: opcao.id, nome });
      toast.success("Opção atualizada.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar a opção."
      );
    }
  };

  const saveColor = async (opcao: CadastroOpcao, cor: string) => {
    try {
      await updateMutation.mutateAsync({ id: opcao.id, cor });
      toast.success("Cor atualizada.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar a cor."
      );
    }
  };

  const add = async (event: FormEvent) => {
    event.preventDefault();
    const nome = novo.trim();
    if (!nome) {
      toast.error("Informe o nome da opção.");
      return;
    }
    if (list.some((item) => normalize(item.nome) === normalize(nome))) {
      toast.error(`A opção "${nome}" já existe em ${coluna.label}.`);
      return;
    }
    try {
      await createMutation.mutateAsync({
        departamento,
        tabela,
        campo: coluna.campo,
        nome,
        cor: novaCor,
      });
      setNovo("");
      setNovaCor("neutral");
      toast.success("Opção incluída.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao incluir a opção."
      );
    }
  };

  const remove = async (opcao: CadastroOpcao) => {
    try {
      await deleteMutation.mutateAsync(opcao.id);
      toast.success("Opção excluída.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao excluir a opção."
      );
    }
  };

  const renderColorSelect = (
    value: string,
    onChange: (cor: string) => void
  ) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-32 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_COLOR_OPTIONS.map((option) => (
          <SelectItem key={option.key} value={option.key}>
            <span className="flex items-center gap-2">
              <span
                className={cn("h-3 w-3 rounded-full", option.swatch)}
                aria-hidden="true"
              />
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card/60 p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={labelDraft ?? columnLabel(coluna.campo, coluna.label)}
          onChange={(event) => setLabelDraft(event.target.value)}
          onBlur={() => void saveColumnLabel()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void saveColumnLabel();
            }
            if (event.key === "Escape") setLabelDraft(null);
          }}
          aria-label={`Nome da coluna ${coluna.label}`}
          title="Nome da coluna no cabeçalho das tabelas do departamento"
          className="h-8 w-44 text-xs font-semibold"
        />
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {coluna.opcoes ? (
            <>
              <ListPlus className="h-3.5 w-3.5" aria-hidden="true" />
              menu suspenso
            </>
          ) : coluna.nota ? (
            "opções do sistema"
          ) : (
            "texto"
          )}
        </span>
      </div>

      {coluna.opcoes ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {list.length} opç{list.length === 1 ? "ão" : "ões"}
            </span>
            {list.length === 0 && (
              <span className="text-[11px] text-muted-foreground">
                {coluna.opcoes.length === 0
                  ? "Padrão: lista da tabela"
                  : `Padrão: ${coluna.opcoes.join(" · ")}`}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {list.map((opcao) => (
              <div
                key={opcao.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-1.5 shadow-sm"
              >
                <span
                  className={cn(
                    "h-6 w-1.5 shrink-0 rounded-full",
                    swatchClass(opcao.cor)
                  )}
                  aria-hidden="true"
                />
                <Input
                  value={drafts[opcao.id] ?? opcao.nome}
                  onChange={(event) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [opcao.id]: event.target.value,
                    }))
                  }
                  onBlur={() => void saveName(opcao)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void saveName(opcao);
                    }
                    if (event.key === "Escape") {
                      setDrafts((prev) => {
                        const next = { ...prev };
                        delete next[opcao.id];
                        return next;
                      });
                    }
                  }}
                  aria-label={`${coluna.label}: ${opcao.nome}`}
                  className="h-8 min-w-32 flex-1"
                />
                {renderColorSelect(opcao.cor, (cor) =>
                  void saveColor(opcao, cor)
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                  title="Excluir opção"
                  onClick={() => void remove(opcao)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <form onSubmit={add} className="flex flex-wrap items-center gap-2">
            <Input
              value={novo}
              onChange={(event) => setNovo(event.target.value)}
              placeholder={`Nova opção de ${columnLabel(coluna.campo, coluna.label)}`}
              className="h-8 w-52 rounded-lg"
            />
            {renderColorSelect(novaCor, setNovaCor)}
            <Button
              type="submit"
              size="sm"
              className="h-8 gap-1"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Incluir
            </Button>
          </form>
        </>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          {coluna.nota ??
            "Coluna de texto — apenas o nome do cabeçalho pode ser alterado."}
        </p>
      )}
    </div>
  );
}
