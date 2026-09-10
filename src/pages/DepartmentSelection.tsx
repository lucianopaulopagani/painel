import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, Building2, ShieldCheck, UserPlus } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandLogo } from "@/components/brand/logo";
import InitialAdminDialog from "@/components/admin/InitialAdminDialog";
import { useDepartments } from "@/hooks/use-departments";
import { useHasAdmin } from "@/hooks/use-users";

export default function DepartmentSelection() {
  const queryClient = useQueryClient();
  const { data: departments, isLoading, isError } = useDepartments();
  const { data: hasAdmin } = useHasAdmin();
  const [setupOpen, setSetupOpen] = useState(false);

  return (
    <div className="auth-page flex min-h-screen flex-col overflow-hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-8 sm:px-8">
        <header className="flex items-center">
          <div className="flex items-center rounded-xl bg-white p-1.5 pr-4 shadow-lg shadow-black/20">
            <BrandLogo variant="horizontal" className="h-9 w-auto" />
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-12">
          <div className="mb-10 flex max-w-xl flex-col items-center text-center">
            <div className="mb-6 rounded-2xl bg-white p-4 shadow-xl shadow-black/25">
              <BrandLogo variant="vertical" className="h-24 w-auto sm:h-28" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Selecione seu departamento
            </h1>
            <p className="mt-3 text-sm text-white/70 sm:text-base">
              Escolha o departamento ao qual você pertence para acessar o
              sistema.
            </p>
          </div>

          {isLoading && (
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton
                  key={i}
                  className="h-44 rounded-xl bg-white/10 ring-1 ring-white/10"
                />
              ))}
            </div>
          )}

          {isError && (
            <Alert className="max-w-lg border-white/20 bg-white/10 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Não foi possível carregar os departamentos</AlertTitle>
              <AlertDescription>
                Verifique se o backend (Enter Cloud) está configurado e
                conectado.
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !isError && departments && (
            <>
              {departments.length === 0 ? (
                <p className="text-center text-white/70">
                  Nenhum departamento cadastrado ainda.
                </p>
              ) : (
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {departments.map((d) => (
                    <Link
                      key={d.id}
                      to={`/login/${d.id}`}
                      className="group focus:outline-none"
                    >
                      <Card className="h-full border-white/15 bg-white/10 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-white/30 hover:bg-white/15 hover:shadow-xl hover:shadow-black/20">
                        <CardContent className="flex h-full flex-col gap-4 p-6">
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-lg font-semibold text-white">
                              {d.name}
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm text-white/65">
                              {d.description ?? "Sem descrição"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                            Acessar
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {hasAdmin === false && (
            <div className="mt-10 w-full max-w-xl rounded-xl border border-white/25 bg-white/10 p-6 text-center backdrop-blur">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold text-white">
                <UserPlus className="h-5 w-5 text-brand-cyan" />
                Configuração inicial
              </div>
              <p className="mt-1 text-sm text-white/70">
                Nenhum administrador cadastrado ainda. Crie o primeiro
                administrador para gerenciar os departamentos e os usuários do
                sistema.
              </p>
              <Button
                onClick={() => setSetupOpen(true)}
                className="mt-4 bg-white text-slate-900 hover:bg-white/90"
              >
                <UserPlus className="h-4 w-4" />
                Criar administrador
              </Button>
            </div>
          )}
        </main>

        <footer className="flex items-center justify-center gap-2 pb-2 text-xs text-white/50">
          <ShieldCheck className="h-3.5 w-3.5" />
          Acesso restrito aos usuários autorizados
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
