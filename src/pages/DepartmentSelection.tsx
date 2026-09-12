import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Loader2,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
import InitialAdminDialog from "@/components/admin/InitialAdminDialog";
import { useDepartments } from "@/hooks/use-departments";
import { useHasAdmin } from "@/hooks/use-users";

export default function DepartmentSelection() {
  const queryClient = useQueryClient();
  const { data: departments, isLoading, isError } = useDepartments();
  const { data: hasAdmin } = useHasAdmin();
  const { session, profile, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();

  const [setupOpen, setSetupOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Já autenticado: vai direto para o painel.
  useEffect(() => {
    if (!authLoading && session && profile) {
      navigate("/app", { replace: true });
    }
  }, [authLoading, session, profile, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: loginError } = await login(email, password);
    if (loginError) {
      setError(loginError);
      setSubmitting(false);
      return;
    }
    // O efeito acima redireciona para /app assim que o perfil carrega.
  };

  return (
    <div className="auth-page flex min-h-screen flex-col overflow-hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-6 sm:px-8">
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-2">
          {/* Coluna esquerda: Hub P4 + departamentos + administração */}
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Hub <span className="text-brand-cyan">P4</span>
              </h1>
              <p className="mt-2 max-w-md text-sm text-white/70">
                Escolha o departamento ao qual você pertence para acessar o
                sistema.
              </p>
            </div>

            {isLoading && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-24 rounded-xl bg-white/10 ring-1 ring-white/10"
                  />
                ))}
              </div>
            )}

            {isError && (
              <Alert className="border-white/20 bg-white/10 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Não foi possível carregar os departamentos</AlertTitle>
                <AlertDescription>
                  Verifique se o backend (Enter Cloud) está configurado e
                  conectado.
                </AlertDescription>
              </Alert>
            )}

            {!isLoading && !isError && departments && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {departments.map((d) => (
                  <Link
                    key={d.id}
                    to={`/login/${d.id}`}
                    className="group focus:outline-none"
                  >
                    <Card className="h-full border-white/15 bg-white/10 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15">
                      <CardContent className="flex h-full flex-col gap-2 p-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                          <Building2 className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">
                            {d.name}
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-xs text-white/65">
                            {d.description ?? "Sem descrição"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-white/80">
                          Acessar
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {hasAdmin === false && (
              <Button
                onClick={() => setSetupOpen(true)}
                className="w-fit bg-white text-slate-900 hover:bg-white/90"
              >
                <UserPlus className="h-4 w-4" />
                Configuração inicial — criar administrador
              </Button>
            )}

            <Link
              to="/admin/login"
              className="inline-flex w-fit items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              <ShieldCheck className="h-4 w-4" />
              Administração
            </Link>
          </div>

          {/* Coluna direita: login */}
          <div className="mx-auto w-full max-w-md">
            <div className="mb-4 flex justify-center">
              <img
                src="/brand/logo-home-nova.png"
                alt="P4 Contabilidade"
                className="h-14 w-auto drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
              />
            </div>
            <Card className="border-white/15 bg-white/10 shadow-2xl shadow-black/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">
                  Entre em sua conta
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

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="home-email" className="text-white/85">
                      E-mail
                    </Label>
                    <Input
                      id="home-email"
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
                    <Label htmlFor="home-password" className="text-white/85">
                      Senha
                    </Label>
                    <Input
                      id="home-password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-white/40"
                    />
                  </div>

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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <InitialAdminDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onCreated={() =>
          queryClient.invalidateQueries({ queryKey: ["has-admin"] })
        }
      />
    </div>
  );
}
