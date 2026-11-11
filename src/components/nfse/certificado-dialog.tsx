import { useEffect, useRef, useState } from "react";
import { FileKey2, Loader2, ShieldCheck } from "lucide-react";

import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useNfseConfiguracoes,
  useSalvarCertificado,
} from "@/hooks/use-nfse";
import type { CompanyWithDepartments } from "@/lib/types";

interface CertificadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: CompanyWithDepartments[];
  companyIdInicial?: string | null;
}

function lerArquivoBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result ?? ""));
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    leitor.readAsDataURL(arquivo);
  });
}

export function CertificadoDialog({
  open,
  onOpenChange,
  companies,
  companyIdInicial,
}: CertificadoDialogProps) {
  const salvar = useSalvarCertificado();
  const { data: configuracoes } = useNfseConfiguracoes();

  const [companyId, setCompanyId] = useState("");
  const [ambiente, setAmbiente] = useState<"restrita" | "producao">("restrita");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [senha, setSenha] = useState("");
  const [inscricao, setInscricao] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [servico, setServico] = useState("");
  const [nbs, setNbs] = useState("");
  const [aliquota, setAliquota] = useState("0");
  const fileRef = useRef<HTMLInputElement>(null);

  const config = (configuracoes ?? []).find(
    (item) => item.company_id === companyId
  );

  useEffect(() => {
    if (!open) return;
    const inicial = companyIdInicial ?? "";
    setCompanyId(inicial);
    setArquivo(null);
    setSenha("");
    const existente = (configuracoes ?? []).find(
      (item) => item.company_id === inicial
    );
    setAmbiente(existente?.ambiente ?? "restrita");
    setInscricao(existente?.inscricao_municipal ?? "");
    setMunicipio(existente?.codigo_municipio ?? "");
    setServico(existente?.codigo_servico ?? "");
    setNbs(existente?.nbs ?? "");
    setAliquota(String(existente?.aliquota_iss ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, companyIdInicial]);

  const trocarEmpresa = (valor: string) => {
    setCompanyId(valor);
    const existente = (configuracoes ?? []).find(
      (item) => item.company_id === valor
    );
    setAmbiente(existente?.ambiente ?? "restrita");
    setInscricao(existente?.inscricao_municipal ?? "");
    setMunicipio(existente?.codigo_municipio ?? "");
    setServico(existente?.codigo_servico ?? "");
    setNbs(existente?.nbs ?? "");
    setAliquota(String(existente?.aliquota_iss ?? 0));
  };

  const enviar = async () => {
    if (!companyId) {
      toast.error("Escolha a empresa emissora.");
      return;
    }
    if (!arquivo && !config?.certificado_path) {
      toast.error("Selecione o arquivo .pfx do certificado A1.");
      return;
    }
    if (!senha) {
      toast.error("Informe a senha do certificado.");
      return;
    }

    try {
      let base64 = "";
      if (arquivo) base64 = await lerArquivoBase64(arquivo);

      // Sem novo arquivo: reenvia o existente não é possível (o bucket é
      // privado), então exigimos o .pfx a cada troca de senha.
      if (!base64) {
        toast.error("Selecione novamente o arquivo .pfx para atualizar.");
        return;
      }

      const resultado = await salvar.mutateAsync({
        company_id: companyId,
        pfx_base64: base64,
        senha,
        certificado_nome: arquivo?.name ?? "certificado.pfx",
        ambiente,
        inscricao_municipal: inscricao || undefined,
        codigo_municipio: municipio || undefined,
        codigo_servico: servico || undefined,
        nbs: nbs || undefined,
        aliquota_iss: Number(aliquota.replace(",", ".")) || 0,
      });

      toast.success(
        resultado?.titular
          ? `Certificado salvo — ${resultado.titular}${
              resultado.validade ? ` (válido até ${resultado.validade})` : ""
            }`
          : "Certificado salvo."
      );
      setSenha("");
      onOpenChange(false);
    } catch (erro) {
      toast.error(
        erro instanceof Error ? erro.message : "Erro ao salvar o certificado."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Certificado A1 e dados fiscais
          </DialogTitle>
          <DialogDescription>
            O arquivo e a senha ficam guardados no armazenamento privado do
            sistema. Nada é exibido novamente depois de salvo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Empresa emissora</Label>
            <Select value={companyId} onValueChange={trocarEmpresa}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha a empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.numero ? `${empresa.numero} — ` : ""}
                    {empresa.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {config?.certificado_validade && (
              <p className="text-xs text-muted-foreground">
                Certificado atual válido até {config.certificado_validade}.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Ambiente</Label>
            <Select
              value={ambiente}
              onValueChange={(valor) =>
                setAmbiente(valor as "restrita" | "producao")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restrita">
                  Produção restrita (teste)
                </SelectItem>
                <SelectItem value="producao">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Alíquota de ISS (%)</Label>
            <Input
              value={aliquota}
              onChange={(e) => setAliquota(e.target.value)}
              inputMode="decimal"
              placeholder="Ex.: 5"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Arquivo do certificado (.pfx)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
              >
                <FileKey2 className="h-4 w-4" />
                Selecionar .pfx
              </Button>
              <span className="truncate text-xs text-muted-foreground">
                {arquivo?.name ?? "Nenhum arquivo selecionado"}
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pfx,.p12"
              className="hidden"
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Senha do certificado</Label>
            <Input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha do arquivo .pfx"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Inscrição municipal</Label>
            <Input
              value={inscricao}
              onChange={(e) => setInscricao(e.target.value)}
              placeholder="Somente números"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Código IBGE do município</Label>
            <Input
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              placeholder="Ex.: 3550308"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Código do serviço (cTribNac)</Label>
            <Input
              value={servico}
              onChange={(e) => setServico(e.target.value)}
              placeholder="Ex.: 010701"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>NBS</Label>
            <Input
              value={nbs}
              onChange={(e) => setNbs(e.target.value)}
              placeholder="Código NBS do serviço"
            />
          </div>
        </div>

        <DialogFooter className="items-center gap-2 sm:justify-between">
          <p className="text-[11px] leading-snug text-muted-foreground">
            Emissão em produção exige empresa habilitada no NFS-e Nacional.
            {ambiente === "producao" && (
              <Badge variant="destructive" className="ml-2 align-middle">
                Produção
              </Badge>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void enviar()} disabled={salvar.isPending}>
              {salvar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar certificado
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
