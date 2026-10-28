import { PanelHeader } from "@/components/shell/panel-header";

/**
 * Simulador da Reforma Tributária — Simples Nacional 2027.
 *
 * A página do simulador fica em `public/simulador` (HTML/CSS/JS próprios, com a
 * marca da P4) e é exibida em tela cheia dentro do sistema.
 */
export default function SimuladorReforma() {
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
    </div>
  );
}
