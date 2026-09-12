import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Building2,
  Calculator,
  FileText,
  Loader2,
  Receipt,
  Scale,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth";
import InitialAdminDialog from "@/components/admin/InitialAdminDialog";
import { useDepartments } from "@/hooks/use-departments";
import { useHasAdmin } from "@/hooks/use-users";

/** Ícone do card de acordo com o nome/descrição do departamento. */
function departmentIcon(name: string): LucideIcon {
  const normalized = name.toLowerCase();
  if (normalized.includes("fiscal")) return Receipt;
  if (normalized.includes("cont")) return Calculator;
  if (normalized.includes("pessoal")) return Users;
  if (normalized.includes("nota")) return FileText;
  if (normalized.includes("socie")) return Scale;
  return Building2;
}

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
  const [remember, setRemember] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotSending, setForgotSending] = useState(false);

  const REMEMBER_KEY = "p4:remember-login";

  // Pré-preenche e-mail/senha salvos ("Lembrar login").
  useEffect(() => {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { email?: string; password?: string };
        if (saved.email) setEmail(saved.email);
        if (saved.password) setPassword(saved.password);
        setRemember(true);
      }
    } catch {
      // ignora armazenamento indisponível
    }
  }, [REMEMBER_KEY]);

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
    try {
      if (remember) {
        localStorage.setItem(
          REMEMBER_KEY,
          JSON.stringify({ email, password })
        );
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      // ignora armazenamento indisponível
    }
    // O efeito acima redireciona para /app assim que o perfil carrega.
  };

  const handleRememberChange = (checked: boolean) => {
    setRemember(checked);
    if (!checked) {
      try {
        localStorage.removeItem(REMEMBER_KEY);
      } catch {
        // ignora
      }
    }
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError("Informe o e-mail cadastrado.");
      return;
    }
    setError(null);
    setForgotSending(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      forgotEmail.trim(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );
    setForgotSending(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setForgotSent(true);
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
                {departments.map((d) => {
                  const Icon = departmentIcon(d.name);
                  return (
                    <div key={d.id}>
                      <Card className="h-full border-white/15 bg-white/10 backdrop-blur">
                        <CardContent className="flex items-center gap-3 p-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="text-sm font-semibold text-white">
                            {d.name}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
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

                {forgotMode ? (
                  <form onSubmit={handleForgot} className="flex flex-col gap-4">
                    <p className="text-sm text-white/70">
                      Informe seu e-mail e enviaremos um link para redefinir
                      sua senha.
                    </p>
                    {forgotSent && (
                      <Alert className="border-white/20 bg-white/10 text-white">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Link enviado</AlertTitle>
                        <AlertDescription>
                          Verifique sua caixa de entrada e siga o link para
                          redefinir a senha.
                        </AlertDescription>
                      </Alert>
                    )}
                    {!forgotSent && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <Label
                            htmlFor="forgot-email"
                            className="text-white/85"
                          >
                            E-mail
                          </Label>
                          <Input
                            id="forgot-email"
                            type="email"
                            autoComplete="email"
                            required
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="voce@empresa.com.br"
                            className="border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-white/40"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={forgotSending}
                          className="w-full bg-white text-slate-900 hover:bg-white/90"
                        >
                          {forgotSending && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          Enviar link
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-white/70 hover:text-white"
                      onClick={() => {
                        setForgotMode(false);
                        setForgotSent(false);
                        setForgotEmail("");
                        setError(null);
                      }}
                    >
                      Voltar ao login
                    </Button>
                  </form>
                ) : (
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

                    <div className="flex items-center justify-between gap-2">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-white/85">
                        <Checkbox
                          checked={remember}
                          onCheckedChange={(checked) =>
                            handleRememberChange(checked === true)
                          }
                        />
                        Lembrar login
                      </label>
                      <button
                        type="button"
                        onClick={() => setForgotMode(true)}
                        className="text-sm font-medium text-white/85 underline-offset-4 hover:text-brand-cyan hover:underline"
                      >
                        Esqueceu a senha?
                      </button>
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
                )}
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
