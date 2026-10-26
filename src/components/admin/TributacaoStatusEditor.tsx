import { useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateTributacaoStatus,
  useDeleteTributacaoStatus,
  useTributacaoStatus,
  useUpdateTributacaoStatus,
} from "@/hooks/use-tributacao-status";
import type { Tributacao, TributacaoStatus } from "@/lib/types";

interface TributacaoStatusEditorProps {
  tributacao: Tributacao;
}

const normalize = (value: string) => value.trim().toLocaleLowerCase("pt-BR");

/**
 * Editor dos Status de uma tributação — são as opções que aparecem na coluna
 * Status das tabelas do Movimento Fiscal. Alterar aqui não muda os lançamentos
 * já gravados; serve para os próximos meses.
 */
export function TributacaoStatusEditor({
  tributacao,
}: TributacaoStatusEditorProps) {
  const { data: statuses, isLoading } = useTributacaoStatus();
  const createMutation = useCreateTributacaoStatus();
  const updateMutation = useUpdateTributacaoStatus();
  const deleteMutation = useDeleteTributacaoStatus();

  const [novo, setNovo] = useState("");
  /** Texto em edição por status (antes de salvar). */
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const list = (statuses ?? []).filter(
    (status) => status.tributacao_id === tributacao.id
  );

  const save = async (status: TributacaoStatus) => {
    const nome = (drafts[status.id] ?? status.nome).trim();
    if (!nome || nome === status.nome) return;
    if (list.some((item) => item.id !== status.id && normalize(item.nome) === normalize(nome))) {
      toast.error(`O status "${nome}" já está cadastrado nesta tributação.`);
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: status.id, nome });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[status.id];
        return next;
      });
      toast.success("Status atualizado.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar o status."
      );
    }
  };

  const add = async (event: FormEvent) => {
    event.preventDefault();
    const nome = novo.trim();
    if (!nome) {
      toast.error("Informe o nome do status.");
      return;
    }
    if (list.some((item) => normalize(item.nome) === normalize(nome))) {
      toast.error(`O status "${nome}" já está cadastrado nesta tributação.`);
      return;
    }
    try {
      await createMutation.mutateAsync({ tributacao_id: tributacao.id, nome });
      setNovo("");
      toast.success("Status incluído.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao incluir o status."
      );
    }
  };

  const remove = async (status: TributacaoStatus) => {
    try {
      await deleteMutation.mutateAsync(status.id);
      toast.success("Status excluído.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao excluir o status."
      );
    }
  };

  return (
    <div className="flex flex-col gap-2 border-t bg-muted/40 px-3 py-3 sm:px-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Status disponíveis na tabela do Movimento Fiscal
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {list.map((status) => (
          <div
            key={status.id}
            className="flex items-center gap-1 rounded-lg border bg-card pl-2 pr-1 shadow-sm"
          >
            <Input
              value={drafts[status.id] ?? status.nome}
              onChange={(event) =>
                setDrafts((prev) => ({
                  ...prev,
                  [status.id]: event.target.value,
                }))
              }
              onBlur={() => void save(status)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void save(status);
                }
                if (event.key === "Escape") {
                  setDrafts((prev) => {
                    const next = { ...prev };
                    delete next[status.id];
                    return next;
                  });
                }
              }}
              aria-label={`Status ${status.nome}`}
              className="h-7 w-32 border-0 bg-transparent px-1 text-xs font-medium shadow-none focus-visible:ring-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              title="Excluir status"
              onClick={() => void remove(status)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {!isLoading && list.length === 0 && (
          <span className="text-xs text-muted-foreground">
            Nenhum status cadastrado — a tabela usa a lista padrão.
          </span>
        )}
      </div>

      <form onSubmit={add} className="flex flex-wrap items-center gap-2">
        <Input
          value={novo}
          onChange={(event) => setNovo(event.target.value)}
          placeholder="Novo status (ex.: EM ANÁLISE)"
          className="h-8 w-56 rounded-lg"
        />
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
        <span className="text-xs text-muted-foreground">
          Clique no status para renomear e dê Enter/ saia do campo para salvar.
        </span>
      </form>
    </div>
  );
}
