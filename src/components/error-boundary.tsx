import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Texto do erro (vindo do ErrorBoundary ou do React Router). */
function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Não foi possível concluir a operação.";
}

interface ErrorScreenProps {
  message: string;
}

/** Tela amigável de erro, com opção de recarregar o aplicativo. */
export function ErrorScreen({ message }: ErrorScreenProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Erro inesperado no aplicativo
          </CardTitle>
          <CardDescription>
            Algo saiu do previsto nesta tela. Recarregue a página para
            continuar — se o problema persistir, avise o administrador do
            sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            {message}
          </p>
          <Button
            type="button"
            className="gap-2"
            onClick={() => window.location.reload()}
          >
            <RotateCw className="h-4 w-4" />
            Recarregar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface AppErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Captura erros de renderização do aplicativo e mostra uma tela amigável em vez
 * da tela de erro padrão do React Router.
 */
export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  { message: string | null }
> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: unknown) {
    return { message: errorMessage(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Erro não tratado no aplicativo:", error, info);
  }

  render() {
    if (this.state.message) {
      return <ErrorScreen message={this.state.message} />;
    }
    return this.props.children;
  }
}

/** Erro de rota (errorElement) — mostra a mesma tela amigável. */
export function RouteErrorBoundary() {
  const error = useRouteError();
  return <ErrorScreen message={errorMessage(error)} />;
}
