import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  LogIn,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth";
import { useDepartment } from "@/hooks/use-departments";
import type { ProfileWithDepartment } from "@/lib/types";

export default function Login() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const { session, profile, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const {
    data: department,
    isLoading: departmentLoading,
  } = useDepartment(departmentId);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [correctDept, setCorrectDept] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [startedLoggedIn, setStartedLoggedIn] = useState<boolean | null>(null);

  // Detecta se o usuário já estava autenticado ao abrir esta tela.
  useEffect(() => {
    if (!authLoading && startedLoggedIn === null) {
      setStartedLoggedIn(!!session);
    }
  }, [authLoading, session, startedLoggedIn]);

  // Visitante que já estava logado: redireciona para o fluxo do departamento dele.
  useEffect(() => {
    if (startedLoggedIn !== true) return;
    if (!session) return;
    if (profile?.department_id === departmentId) {
      navigate("/app", { replace: true });
    } else if (profile?.departments) {
      navigate(`/login/${profile.departments.id}`, { replace: true });
    } else if (profile) {
      setError(
        "Seu perfil não está vinculado a um departamento. Contate o administrador."
      );
    } else {
      navigate("/", { replace: true });
    }
  }, [startedLoggedIn, session, profile, departmentId, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setCorrectDept(null);
    setSubmitting(true);

    const { error: loginError, profile: p } = await login(email, password);
    if (loginError) {
      setError(loginError);
      setSubmitting(false);
      return;
    }

    const pWithDept = p as ProfileWithDepartment;
    if (pWithDept.department_id === departmentId) {
      navigate("/app", { replace: true });
      return;
    }
    if (pWithDept.departments) {
      setCorrectDept(pWithDept.departments);
    } else {
      setError(
        "Seu perfil ainda não está vinculado a um departamento. Contate o administrador."
      );
    }
    setSubmitting(false);
  };

  return (
    <div className="auth-page flex min-h-screen flex-col overflow-hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-8 sm:px-8">
        <header className="flex items-center">
          <div className="flex items-center rounded-xl bg-white p-1.5 pr-4 shadow-lg shadow-black/20">
            <BrandLogo variant="horizontal" className="h-9 w-auto" />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md">
            <Card className="border-white/15 bg-white/10 shadow-2xl shadow-black/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">
                  {departmentLoading || !department ? (
                    <Skeleton className="h-6 w-40 bg-white/10" />
                  ) : (
                    department.name
                  )}
                </CardTitle>
                <CardDescription className="text-white/65">
                  Informe suas credenciais para acessar o sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Não foi possível entrar</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {correctDept && (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Acesso bloqueado</AlertTitle>
                    <AlertDescription>
                      Suas credenciais são válidas, mas você pertence ao
                      departamento{" "}
                      <span className="font-semibold">{correctDept.name}</span>.
                      Acesse pelo departamento correto.
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email" className="text-white/85">
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@empresa.com.br"
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-white/40"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="password" className="text-white/85">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-white/40"
                    />
                  </div>

                  {correctDept && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        navigate(`/login/${correctDept.id}`, { replace: true })
                      }
                    >
                      <LogIn className="h-4 w-4" />
                      Ir para {correctDept.name}
                    </Button>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-white text-slate-900 hover:bg-white/90"
                  >
                    {submitting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Entrar
                  </Button>
                </form>

                <div className="mt-6 border-t border-white/15 pt-4">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Trocar de departamento
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
