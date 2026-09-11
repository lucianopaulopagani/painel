import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  LogIn,
  ShieldCheck,
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
import { useAuth } from "@/context/auth";

export default function AdminLogin() {
  const { session, profile, loading: authLoading, login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Já autenticado como administrador → vai direto para o painel.
  useEffect(() => {
    if (!authLoading && session && profile?.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [authLoading, session, profile, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: loginError, profile: p } = await login(email, password);
    if (loginError) {
      setError(loginError);
      setSubmitting(false);
      return;
    }

    if (p?.role !== "admin") {
      await logout();
      setError("Esta conta não tem permissão de administrador.");
      setSubmitting(false);
      return;
    }

    navigate("/admin", { replace: true });
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
                <CardTitle className="flex items-center gap-2 text-white">
                  <ShieldCheck className="h-5 w-5 text-brand-cyan" />
                  Administração
                </CardTitle>
                <CardDescription className="text-white/65">
                  Acesso restrito aos administradores do sistema
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
                    <Label htmlFor="admin-login-email" className="text-white/85">
                      E-mail
                    </Label>
                    <Input
                      id="admin-login-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@empresa.com.br"
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-white/40"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="admin-login-password"
                      className="text-white/85"
                    >
                      Senha
                    </Label>
                    <Input
                      id="admin-login-password"
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
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="h-4 w-4" />
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
                    Voltar para a seleção de departamentos
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
