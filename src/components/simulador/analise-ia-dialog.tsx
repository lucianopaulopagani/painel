import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, RotateCcw, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type AnaliseSimuladorDados = Record<string, string>;
export type AnaliseSimuladorPerfil = "servicos" | "comercio";

interface AnaliseIaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfil: AnaliseSimuladorPerfil;
  dados: AnaliseSimuladorDados | null;
}

/** Destaca trechos entre **asteriscos** sem depender de biblioteca de markdown. */
function TextoAnalise({ texto }: { texto: string }) {
  const blocos = texto
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {blocos.map((bloco, i) => {
        const partes = bloco.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
        return (
          <p
            key={i}
            className="whitespace-pre-line text-sm leading-relaxed text-foreground/90"
          >
            {partes.map((parte, j) =>
              parte.startsWith("**") && parte.endsWith("**") ? (
                <strong key={j} className="font-semibold text-foreground">
                  {parte.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{parte}</span>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

export function AnaliseIaDialog({
  open,
  onOpenChange,
  perfil,
  dados,
}: AnaliseIaDialogProps) {
  const [analise, setAnalise] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const nomeCaso = dados?.Caso ?? "Caso simulado";

  const analisar = useCallback(async () => {
    if (!dados) return;
    setCarregando(true);
    setErro(null);
    setAnalise("");
    setCopiado(false);

    const { data, error } = await supabase.functions.invoke<{
      analise?: string;
      error?: { message?: string };
    }>("analise-simulador", { body: { perfil, dados } });

    setCarregando(false);

    if (error) {
      let mensagem = "Não foi possível gerar a análise agora.";
      const contexto = (error as { context?: Response }).context;
      if (contexto && typeof contexto.json === "function") {
        try {
          const corpo = await contexto.json();
          mensagem = corpo?.error?.message ?? mensagem;
        } catch {
          /* mantém a mensagem padrão */
        }
      }
      setErro(mensagem);
      return;
    }

    if (!data?.analise) {
      setErro(data?.error?.message ?? "A IA não devolveu texto. Tente novamente.");
      return;
    }

    setAnalise(data.analise);
  }, [dados, perfil]);

  useEffect(() => {
    if (open && dados) void analisar();
  }, [open, dados, analisar]);

  const copiar = async () => {
    if (!analise) return;
    try {
      await navigator.clipboard.writeText(analise);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard bloqueado pelo navegador */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="gap-1 border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-base">Análise do caso com IA</DialogTitle>
              <DialogDescription className="truncate text-xs">
                {nomeCaso}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[58vh] overflow-y-auto px-6 py-5">
          {carregando && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Lendo os números da simulação…
            </div>
          )}

          {!carregando && erro && (
            <div className="space-y-3">
              <p className="text-sm text-destructive">{erro}</p>
              <Button variant="outline" size="sm" onClick={() => void analisar()}>
                <RotateCcw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          )}

          {!carregando && !erro && analise && <TextoAnalise texto={analise} />}
        </div>

        <DialogFooter className="items-center gap-2 border-t px-6 py-4 sm:justify-between">
          <p className="text-[11px] leading-snug text-muted-foreground">
            Leitura gerada por IA sobre as premissas da simulação. Confirme com a
            equipe P4 antes de decidir.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void copiar()}
              disabled={!analise || carregando}
            >
              {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiado ? "Copiado" : "Copiar"}
            </Button>
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
