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
import { dropdownFieldsFor, type DropdownField } from "@/lib/fiscal-fields";
import { cn } from "@/lib/utils";
import type { Tributacao, TributacaoStatus } from "@/lib/types";

interface TributacaoOptionsEditorProps {
  tributacao: Tributacao;
}

const normalize = (value: string) => value.trim().toLocaleLowerCase("pt-BR");

const swatchClass = (cor: string | null | undefined): string =>
  STATUS_COLOR_OPTIONS.find((option) => option.key === cor)?.swatch ??
  "bg-muted";

/** Opções da coluna de menu suspenso de uma tributação. */
function FieldOptions({
  tributacao,
  field,
}: {
  tributacao: Tributacao;
  field: DropdownField;
}) {
  const { data: statuses } = useTributacaoStatus();
  const createMutation = useCreateTributacaoStatus();
  const updateMutation = useUpdateTributacaoStatus();
  const deleteMutation = useDeleteTributacaoStatus();

  const [novo, setNovo] = useState("");
  const [novaCor, setNovaCor] = useState<string>("neutral");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const list = (statuses ?? []).filter(
    (status) =>
      status.tributacao_id === tributacao.id && status.campo === field.key
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
      toast.error(`A opção "${nome}" já existe em ${field.label}.`);
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: status.id, nome });
      toast.success("Opção atualizada.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar a opção."
      );
    }
  };

  const saveColor = async (status: TributacaoStatus, cor: string) => {
    try {
      await updateMutation.mutateAsync({ id: status.id, cor });
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
      toast.error(`A opção "${nome}" já existe em ${field.label}.`);
      return;
    }
    try {
      await createMutation.mutateAsync({
        tributacao_id: tributacao.id,
        campo: field.key,
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

  const remove = async (status: TributacaoStatus) => {
    try {
      await deleteMutation.mutateAsync(status.id);
      toast.success("Opção excluída.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao excluir a opção."
      );
    }
  };

  const renderColorSelect = (
    value: string,
    onChange: (cor: string) => void,
    id?: string
  ) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="h-8 w-32 text-xs">
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
        <span className="text-xs font-semibold">{field.label}</span>
        <span className="text-[11px] text-muted-foreground">
          {list.length} opç{list.length === 1 ? "ão" : "ões"}
          {list.length === 0 && " — usa a lista padrão"}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {list.map((status) => (
          <div
            key={status.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-1.5 shadow-sm"
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
              aria-label={`${field.label}: ${status.nome}`}
              className="h-8 min-w-32 flex-1"
            />
            {renderColorSelect(status.cor, (cor) => void saveColor(status, cor))}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
              title="Excluir opção"
              onClick={() => void remove(status)}
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
          placeholder={`Nova opção de ${field.label}`}
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
    </div>
  );
}

/**
 * Editor das opções das colunas com menu suspenso de uma tributação — Status,
 * DAS, Guia, DESTDA, Envios, Prestados/Tomados, ISS, Carne Leão e as obrigações
 * do Lucro Real/Presumido. Cada opção tem nome e cor, usados nas tabelas do
 * Movimento Fiscal. Alterar aqui não muda os lançamentos já gravados.
 */
export function TributacaoOptionsEditor({
  tributacao,
}: TributacaoOptionsEditorProps) {
  const fields = dropdownFieldsFor(tributacao.nome);

  return (
    <div className="flex flex-col gap-3 border-t bg-muted/40 px-3 py-3 sm:px-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Opções das colunas com menu suspenso ({tributacao.nome})
      </p>
      {fields.map((field) => (
        <FieldOptions key={field.key} tributacao={tributacao} field={field} />
      ))}
      <p className="text-xs text-muted-foreground">
        Renomeie no campo de texto (Enter ou sair para salvar) e escolha a cor ao
        lado de cada opção.
      </p>
    </div>
  );
}
