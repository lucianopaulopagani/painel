import { Loader2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { usePermissoes } from "@/hooks/use-permissoes";
import { opcaoLabel } from "@/lib/permissoes";
import { cn } from "@/lib/utils";

interface PermissoesMultiSelectProps {
  value: string[];
  onChange: (ids: string[]) => void;
}

/** Escolha das permissões do usuário — as permissões são cadastradas no painel. */
export function PermissoesMultiSelect({
  value,
  onChange,
}: PermissoesMultiSelectProps) {
  const { data: permissoes, isLoading, isError } = usePermissoes();

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id]
    );
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <Label className="text-sm font-medium">Permissões</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Marque uma ou mais permissões. Elas são cadastradas em Administração
        &gt; Permissões.
      </p>

      {isLoading && (
        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando permissões…
        </div>
      )}

      {isError && (
        <p className="py-2 text-sm text-destructive">
          Não foi possível carregar as permissões.
        </p>
      )}

      {!isLoading && !isError && (permissoes?.length ?? 0) === 0 && (
        <p className="py-2 text-sm text-muted-foreground">
          Nenhuma permissão cadastrada ainda. Crie a primeira em Administração
          &gt; Permissões.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {permissoes?.map((permissao) => {
          const marcada = value.includes(permissao.id);
          return (
            <label
              key={permissao.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                marcada ? "border-primary/60 bg-primary/5" : "hover:bg-accent/40"
              )}
            >
              <Checkbox
                checked={marcada}
                onCheckedChange={() => toggle(permissao.id)}
                className="mt-0.5"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{permissao.nome}</span>
                  {permissao.opcoes.map((opcao) => (
                    <Badge key={opcao} variant="secondary">
                      {opcaoLabel(opcao)}
                    </Badge>
                  ))}
                </div>
                {permissao.descricao && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {permissao.descricao}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
