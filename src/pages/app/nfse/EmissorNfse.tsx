import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  FileKey2,
  FileText,
  Loader2,
  Plus,
  ShieldCheck,
} from "lucide-react";

import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CertificadoDialog } from "@/components/nfse/certificado-dialog";
import { supabase } from "@/lib/supabase";
import { useCompanies } from "@/hooks/use-companies";
import { useNfseConfiguracoes, useNfseNotas } from "@/hooks/use-nfse";

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dataBR = (valor: string | null) =>
  valor ? valor.slice(0, 10).split("-").reverse().join("/") : "—";

/** Mês atual no formato AAAA-MM. */
const mesAtual = () => new Date().toISOString().slice(0, 7);

export function EmissorNfse() {
  const { data: empresas, isLoading: carregandoEmpresas } = useCompanies();
  const { data: configuracoes } = useNfseConfiguracoes();
  const { data: notas, isLoading: carregandoNotas } = useNfseNotas();

  const [companyId, setCompanyId] = useState("");
  const [competencia, setCompetencia] = useState(mesAtual());
  const [certificadoOpen, setCertificadoOpen] = useState(false);
  const [testando, setTestando] = useState(false);

  const listaEmpresas = useMemo(
    () => (empresas ?? []).filter((empresa) => empresa.ativa !== false),
    [empresas]
  );

  const empresaSelecionadaId =
    companyId ||
    (configuracoes ?? [])[0]?.company_id ||
    listaEmpresas[0]?.id ||
    "";

  const empresa = listaEmpresas.find(
    (item) => item.id === empresaSelecionadaId
  );
  const config = (configuracoes ?? []).find(
    (item) => item.company_id === empresaSelecionadaId
  );

  const notasDoMes = (notas ?? []).filter((nota) => {
    if (nota.company_id !== empresaSelecionadaId) return false;
    if (!competencia) return true;
    return (nota.competencia ?? nota.created_at).slice(0, 7) === competencia;
  });

  const totalEmitido = notasDoMes.reduce(
    (soma, nota) => soma + Number(nota.valor ?? 0),
    0
  );

  if (carregandoEmpresas) {
    return (
      <div className="flex items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando empresas…
      </div>
    );
  }

  if (listaEmpresas.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            Nenhuma empresa cadastrada
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Cadastre a empresa em Administração &gt; Empresas para usar o emissor
          de NFS-e.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Emissor NFS-e</h1>
          <p className="text-sm text-muted-foreground">
            Notas de serviço no padrão nacional, com o certificado A1 da empresa.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={empresaSelecionadaId} onValueChange={setCompanyId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Escolha a empresa" />
            </SelectTrigger>
            <SelectContent>
              {listaEmpresas.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.numero ? `${item.numero} — ` : ""}
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={async () => {
              if (!empresaSelecionadaId) return;
              setTestando(true);
              try {
                const { data, error } =
                  await supabase.functions.invoke<{
                    ok?: boolean;
                    status?: number;
                    ambiente?: string;
                    error?: string;
                  }>("nfse-teste", {
                    body: { company_id: empresaSelecionadaId },
                  });

                if (error) {
                  const contexto = (error as { context?: Response }).context;
                  let mensagem = "Não foi possível testar a conexão.";
                  if (contexto && typeof contexto.json === "function") {
                    try {
                      const corpo = await contexto.json();
                      mensagem = corpo?.error ?? mensagem;
                    } catch {
                      /* mantém a mensagem padrão */
                    }
                  }
                  toast.error(mensagem);
                } else if (data?.ok) {
                  toast.success(
                    `Conectado ao NFS-e Nacional (${data.ambiente}) — HTTP ${data.status}.`
                  );
                } else {
                  toast.error(
                    data?.error ??
                      `O NFS-e Nacional respondeu HTTP ${data?.status ?? "?"}.`
                  );
                }
              } finally {
                setTestando(false);
              }
            }}
            disabled={testando || !config?.certificado_path}
          >
            {testando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Testar conexão
          </Button>
          <Button variant="outline" onClick={() => setCertificadoOpen(true)}>
            <FileKey2 className="h-4 w-4" />
            Certificado
          </Button>
        </div>
      </div>

      {!config?.certificado_path && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-status-warning bg-card p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-status-warning" />
            <div>
              <p className="text-sm font-medium">
                Certificado A1 ainda não configurado
              </p>
              <p className="text-xs text-muted-foreground">
                Envie o .pfx e a senha para habilitar a emissão desta empresa.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setCertificadoOpen(true)}>
            Configurar agora
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Notas no mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{notasDoMes.length}</p>
            <p className="text-xs text-muted-foreground">
              Competência {competencia.split("-").reverse().join("/")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Valor emitido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{moeda.format(totalEmitido)}</p>
            <p className="text-xs text-muted-foreground">
              Somente notas desta empresa
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Ambiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {config?.ambiente === "producao" ? "Produção" : "Restrita"}
            </p>
            <p className="text-xs text-muted-foreground">
              {config?.certificado_validade
                ? `Certificado até ${dataBR(config.certificado_validade)}`
                : "Certificado não enviado"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Notas emitidas</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info(
                  "O download em lote será habilitado junto com a transmissão das notas."
                )
              }
            >
              <Download className="h-4 w-4" />
              XMLs do mês
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast.info(
                  config?.certificado_path
                    ? "A transmissão para o NFS-e Nacional está em configuração."
                    : "Configure o certificado A1 para emitir notas."
                )
              }
            >
              <Plus className="h-4 w-4" />
              Emitir NFS-e
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competência</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Tomador</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregandoNotas ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : notasDoMes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {empresa
                      ? `Nenhuma NFS-e emitida para ${empresa.name} nesta competência.`
                      : "Nenhuma nota encontrada."}
                  </TableCell>
                </TableRow>
              ) : (
                notasDoMes.map((nota) => (
                  <TableRow key={nota.id}>
                    <TableCell>{dataBR(nota.competencia)}</TableCell>
                    <TableCell>{nota.numero ?? "—"}</TableCell>
                    <TableCell>{nota.tomador_nome ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {nota.valor != null ? moeda.format(Number(nota.valor)) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          nota.status === "autorizada" ? "default" : "secondary"
                        }
                      >
                        {nota.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CertificadoDialog
        open={certificadoOpen}
        onOpenChange={setCertificadoOpen}
        companies={listaEmpresas}
        companyIdInicial={empresaSelecionadaId}
      />
    </div>
  );
}
