import { useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
  useCreateTributacaoStatus,
  useDeleteTributacaoStatus,
  useTributacaoStatus,
  useUpdateTributacaoStatus,
} from "@/hooks/use-tributacao-status";
import { cn } from "@/lib/utils";
import type { Tributacao, TributacaoStatus } from "@/lib/types";

interface TributacaoStatusEditorProps {
  tributacao: Tributacao;
}

const normalize = (value: string) => value.trim().toLocaleLowerCase("pt-BR");

const swatchClass = (cor: string | null | undefined): string =>
  STATUS_COLOR_OPTIONS.find((option) => option.key === cor)?.swatch ??
  "bg-muted";

/**
 * Editor dos Status de uma tributação — são as opções que aparecem na coluna
 * Status das tabelas do Movimento Fiscal, com a cor de cada uma. Alterar aqui
 * não muda os lançamentos já gravados; serve para os próximos meses.
 */
export function TributacaoStatusEditor({
  tributacao,
}: TributacaoStatusEditorProps) {
  const { data: statuses, isLoading } = useTributacaoStatus();
  const createMutation = useCreateTributacaoStatus();
  const updateMutation = useUpdateTributacaoStatus();
  const deleteMutation = useDeleteTributacaoStatus();

  const [novo, setNovo] = useState("");
  const [novaCor, setNovaCor] = useState<string>("neutral");
  /** Texto em edição por status (antes de salvar). */
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const list = (statuses ?? []).filter(
    (status) => status.tributacao_id === tributacao.id
  );

  const saveName = async (status: TributacaoStatus) => {
    const nome = (drafts[status.id] ?? status.nome).trim();
    if (!nome || nome === status.nome) {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[status.id];
        return next;
      });
      return;
    }
    if (
      list.some(
        (item) => item.id !== status.id && normalize(item.nome) === normalize(nome)
      )
    ) {
      toast.error(`O status "${nome}" já está cadastrado nesta tributação.`);
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: status.id, nome });
      toast.success("Status atualizado.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar o status."
      );
    }
  };

  const saveColor = async (status: TributacaoStatus, cor: string) => {
    try {
      await updateMutation.mutateAsync({ id: status.id, cor });
      toast.success("Cor do status atualizada.");
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
      toast.error("Informe o nome do status.");
      return;
    }
    if (list.some((item) => normalize(item.nome) === normalize(nome))) {
      toast.error(`O status "${nome}" já está cadastrado nesta tributação.`);
      return;
    }
    try {
      await createMutation.mutateAsync({
        tributacao_id: tributacao.id,
        nome,
        cor: novaCor,
      });
      setNovo("");
      setNovaCor("neutral");
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

  const renderColorSelect = (
    value: string,
    onChange: (cor: string) => void,
    id?: string
  ) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="h-8 w-36 text-xs">
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
    <div className="flex flex-col gap-3 border-t bg-muted/40 px-3 py-3 sm:px-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Status desta tributação (nome e cor na tabela do Movimento Fiscal)
      </p>

      <div className="flex flex-col gap-1.5">
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}

        {list.map((status) => (
          <div
            key={status.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2 shadow-sm"
          >
            <span
              className={cn(
                "h-6 w-1.5 shrink-0 rounded-full",
                swatchClass(status.cor)
              )}
              aria-hidden="true"
            />
            <Input
              value={drafts[status.id] ?? status.nome}
              onChange={(event) =>
                setDrafts((prev) => ({
                  ...prev,
                  [status.id]: event.target.value,
                }))
              }
              onBlur={() => void saveName(status)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void saveName(status);
                }
                if (event.key === "Escape") {
                  setDrafts((prev) => {
                    const next = { ...prev };
                    delete next[status.id];
                    return next;
                  });
                }
              }}
              aria-label={`Nome do status ${status.nome}`}
              className="h-8 min-w-40 flex-1"
            />
            {renderColorSelect(status.cor, (cor) => void saveColor(status, cor))}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
              title="Excluir status"
              onClick={() => void remove(status)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {!isLoading && list.length === 0 && (
          <span className="text-xs text-muted-foreground">
            Nenhum status cadastrado — a tabela usa a lista padrão.
          </span>
        )}
      </div>

      <form
        onSubmit={add}
        className="flex flex-wrap items-center gap-2 border-t pt-3"
      >
        <Input
          value={novo}
          onChange={(event) => setNovo(event.target.value)}
          placeholder="Novo status (ex.: EM ANÁLISE)"
          className="h-8 w-56 rounded-lg"
        />
        {renderColorSelect(novaCor, setNovaCor, "novo-status-cor")}
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
          Renomeie no campo de texto (Enter ou sair para salvar) e escolha a cor
          ao lado.
        </span>
      </form>
    </div>
  );
}
