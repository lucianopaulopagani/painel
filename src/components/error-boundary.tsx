import {
  Component,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
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

/** Erros típicos de DOM alterado por fora do React (ex.: tradutor do navegador). */
const DOM_MUTATION_ERRORS = [
  "removeChild",
  "insertBefore",
  "appendChild",
  "not a child",
  "não é filho",
];

/** Recuperação automática: recarrega uma única vez por sessão. */
const RECOVERY_KEY = "p4:auto-recovery";

function isDomMutationError(message: string): boolean {
  return DOM_MUTATION_ERRORS.some((fragment) =>
    message.toLowerCase().includes(fragment.toLowerCase())
  );
}

function tryAutoRecovery(message: string): boolean {
  if (!isDomMutationError(message)) return false;
  try {
    if (sessionStorage.getItem(RECOVERY_KEY) === "1") return false;
    sessionStorage.setItem(RECOVERY_KEY, "1");
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/**
 * Captura erros de renderização do aplicativo e mostra uma tela amigável em vez
 * da tela de erro padrão do React Router. Erros de DOM (normalmente causados
 * pelo tradutor automático do navegador) tentam uma recarga única antes disso.
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
    const message = errorMessage(error);
    if (tryAutoRecovery(message)) return;
    if (this.state.message !== message) this.setState({ message });
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
  const message = errorMessage(error);

  const [recovering, setRecovering] = useState(false);

  // Erro de DOM (tradutor do navegador): recarrega uma vez antes de avisar.
  useEffect(() => {
    if (tryAutoRecovery(message)) setRecovering(true);
  }, [message]);

  if (recovering) return <LoadingScreen />;

  return <ErrorScreen message={message} />;
}
