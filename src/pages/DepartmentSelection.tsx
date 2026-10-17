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
  Sparkles,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth";
import InitialAdminDialog from "@/components/admin/InitialAdminDialog";
import { useDepartments } from "@/hooks/use-departments";
import { useHasAdmin } from "@/hooks/use-users";
import { APP_VERSION } from "@/lib/app-version";

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

  const inputClass =
    "h-11 border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:border-brand-cyan/70 focus-visible:ring-2 focus-visible:ring-brand-cyan/30";

  return (
    <div className="auth-page relative flex min-h-screen flex-col overflow-hidden">
      {/* Brilhos da marca ao fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="auth-orb absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand-cyan/25 blur-3xl" />
        <div
          className="auth-orb absolute -left-32 bottom-[-10rem] h-96 w-96 rounded-full bg-white/10 blur-3xl"
          style={{ animationDelay: "-7s" }}
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-6 sm:px-8 sm:py-10">
        <header className="auth-rise flex items-center justify-between gap-4">
          <div className="inline-flex items-center rounded-2xl bg-white px-4 py-2.5 shadow-xl shadow-black/25 ring-1 ring-white/25">
            <img
              src="/brand/logo-white-horizontal.png"
              alt="P4 Contabilidade"
              className="h-8 w-auto sm:h-9"
            />
          </div>

          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-medium text-white/85 backdrop-blur transition hover:border-brand-cyan/50 hover:bg-white/15 hover:text-white sm:text-sm"
          >
            <ShieldCheck className="h-4 w-4" />
            Administração
          </Link>
        </header>

        <div className="mt-8 grid flex-1 items-start gap-8 sm:mt-12 lg:grid-cols-[1.05fr_minmax(0,25rem)] lg:items-center lg:gap-14">
          {/* Login — primeiro no mobile, à direita no desktop */}
          <aside
            className="auth-rise order-1 mx-auto w-full max-w-md lg:order-2 lg:max-w-none"
            style={{ animationDelay: "60ms" }}
          >
            <div className="auth-panel p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-white">
                  Entre em sua conta
                </h2>
                <p className="mt-1 text-sm text-white/65">
                  Informe suas credenciais para acessar o sistema
                </p>
              </div>

              {error && (
                <Alert
                  variant="destructive"
                  className="mb-4 border-status-danger/40 bg-status-danger/15 text-white"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Não foi possível entrar</AlertTitle>
                  <AlertDescription className="text-white/80">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {forgotMode ? (
                <form onSubmit={handleForgot} className="flex flex-col gap-4">
                  <p className="text-sm text-white/70">
                    Informe seu e-mail e enviaremos um link para redefinir sua
                    senha.
                  </p>
                  {forgotSent && (
                    <Alert className="border-white/20 bg-white/10 text-white">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Link enviado</AlertTitle>
                      <AlertDescription className="text-white/80">
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
                          className={inputClass}
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={forgotSending}
                        className="auth-cta h-11 w-full text-sm font-semibold"
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
                    className="text-white/70 hover:bg-white/10 hover:text-white"
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
                      className={inputClass}
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
                      className={inputClass}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-white/85">
                      <Checkbox
                        checked={remember}
                        onCheckedChange={(checked) =>
                          handleRememberChange(checked === true)
                        }
                        className="border-white/50 data-[state=checked]:border-brand-cyan data-[state=checked]:bg-brand-cyan data-[state=checked]:text-white"
                      />
                      Lembrar login
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-sm font-medium text-white/85 underline-offset-4 transition hover:text-brand-cyan hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="auth-cta h-11 w-full text-sm font-semibold"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                </form>
              )}
            </div>
          </aside>

          {/* Apresentação + departamentos */}
          <section
            className="auth-rise order-2 flex flex-col gap-6 lg:order-1"
            style={{ animationDelay: "120ms" }}
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
                Hub interno
              </span>
              <h1 className="auth-title mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
                Hub P4
              </h1>
              <p className="mt-2 max-w-md text-sm text-white/70 sm:text-base">
                Fiscal, Pessoal, Contábil, Societário e Nota Fiscal no mesmo
                lugar. Entre com suas credenciais para acessar o painel.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Departamentos
              </h2>
              {!isLoading && !isError && (departments?.length ?? 0) > 0 && (
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/70 ring-1 ring-white/15">
                  {departments?.length}
                </span>
              )}
            </div>

            {isLoading && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-[68px] rounded-2xl bg-white/10 ring-1 ring-white/10"
                  />
                ))}
              </div>
            )}

            {isError && (
              <Alert className="border-white/20 bg-white/10 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  Não foi possível carregar os departamentos
                </AlertTitle>
                <AlertDescription className="text-white/80">
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
                    <div
                      key={d.id}
                      className="auth-glass group flex items-center gap-3 p-3.5 hover:-translate-y-0.5 hover:border-brand-cyan/40 hover:bg-white/[0.12] hover:shadow-xl hover:shadow-black/25"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-cyan/35 to-primary/50 ring-1 ring-white/25 transition group-hover:from-brand-cyan/50 group-hover:to-primary/60">
                        <Icon className="h-5 w-5 text-white" />
                      </span>
                      <span
                        className="min-w-0 flex-1 truncate text-sm font-semibold text-white sm:text-[15px]"
                        title={d.name}
                      >
                        {d.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {hasAdmin === false && (
              <Button
                onClick={() => setSetupOpen(true)}
                variant="outline"
                className="h-11 w-fit border-white/30 bg-white/10 text-sm font-semibold text-white hover:border-white/50 hover:bg-white/20 hover:text-white"
              >
                <UserPlus className="h-4 w-4" />
                Configuração inicial — criar administrador
              </Button>
            )}
          </section>
        </div>

        <footer className="relative mt-8 flex flex-wrap items-center justify-between gap-2 text-xs text-white/50">
          <span>© {new Date().getFullYear()} P4 Contabilidade</span>
          <span className="tabular-nums">v{APP_VERSION}</span>
        </footer>
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
