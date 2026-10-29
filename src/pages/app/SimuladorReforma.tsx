import { useEffect, useState } from "react";

import { PanelHeader } from "@/components/shell/panel-header";
import {
  AnaliseIaDialog,
  type AnaliseSimuladorDados,
  type AnaliseSimuladorPerfil,
} from "@/components/simulador/analise-ia-dialog";

interface PedidoAnalise {
  perfil: AnaliseSimuladorPerfil;
  dados: AnaliseSimuladorDados;
}

/**
 * Simulador da Reforma Tributária — Simples Nacional 2027.
 *
 * A página do simulador fica em `public/simulador` (HTML/CSS/JS próprios, com a
 * marca da P4) e é exibida em tela cheia dentro do sistema. Quando o usuário
 * pede a análise por IA dentro de um caso, o simulador envia os números por
 * postMessage e a análise é gerada e exibida aqui, com a sessão do sistema.
 */
export default function SimuladorReforma() {
  const [pedido, setPedido] = useState<PedidoAnalise | null>(null);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const aoReceber = (evento: MessageEvent) => {
      if (evento.origin !== window.location.origin) return;
      const mensagem = evento.data as
        | { origem?: string; tipo?: string; perfil?: string; dados?: unknown }
        | null;
      if (!mensagem || mensagem.origem !== "p4-simulador") return;
      if (mensagem.tipo !== "analise-ia") return;
      if (!mensagem.dados || typeof mensagem.dados !== "object") return;

      setPedido({
        perfil: mensagem.perfil === "comercio" ? "comercio" : "servicos",
        dados: mensagem.dados as AnaliseSimuladorDados,
      });
      setAberto(true);
    };

    window.addEventListener("message", aoReceber);
    return () => window.removeEventListener("message", aoReceber);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PanelHeader
        title="Simulador da Reforma Tributária"
        subtitle="Simples Nacional — híbrido ou DAS integral em 2027"
      />
      <iframe
        src="/simulador/index.html"
        title="Simulador da Reforma Tributária — Simples Nacional 2027"
        className="min-h-[calc(100dvh-4rem)] w-full flex-1 border-0"
      />
      <AnaliseIaDialog
        open={aberto}
        onOpenChange={setAberto}
        perfil={pedido?.perfil ?? "servicos"}
        dados={pedido?.dados ?? null}
      />
    </div>
  );
}
