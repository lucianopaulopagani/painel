import { useState } from "react";
import {
  AlertCircle,
  CloudDownload,
  Loader2,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  invokeAcessorias,
  useAcessoriasImport,
  type AcessoriasCompanyRow,
  type AcessoriasResult,
} from "@/hooks/use-acessorias";
import { formatCpfCnpj } from "@/lib/utils";

/** Compara textos ignorando acentos, maiúsculas e espaços nas pontas. */
function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

/**
 * Integração com o sistema Acessórias — consulta as empresas cadastradas lá e
 * cria aqui apenas as que ainda não existem (comparação pelo CNPJ/CPF).
 * Nenhuma empresa existente é alterada e os departamentos/responsáveis não são
 * importados.
 */
export default function AcessoriasTab() {
  const [result, setResult] = useState<AcessoriasResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [onlyNew, setOnlyNew] = useState(true);
  /* Empresas escolhidas para importar (documentos = CNPJ/CPF). */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const importMutation = useAcessoriasImport();

  const fetchPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeAcessorias("preview");
      setResult(data);
      if (data.erros.length > 0) {
        toast.error("A consulta terminou com avisos do Acessórias.");
      } else {
        toast.success(
          `${data.total_acessorias} empresa(s) encontrada(s) no Acessórias.`
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao consultar o Acessórios.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (documentos?: string[]) => {
    try {
      const data = await importMutation.mutateAsync(documentos);
      setSelected(new Set());
      setResult(data);
      toast.success(
        data.criadas === 1
          ? "1 empresa importada do Acessórias."
          : `${data.criadas ?? 0} empresas importadas do Acessórias.`
      );
      if (data.erros.length > 0) {
        toast.error("Algumas empresas não puderam ser importadas.");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao importar empresas."
      );
    }
  };

  // Busca por razão social, CNPJ/CPF ou número, ignorando acentos e caixa.
  const term = normalizeText(query);
  const matched = (result?.empresas ?? []).filter((empresa) => {
    if (!term) return true;
    const digits = term.replace(/\D/g, "");
    return (
      normalizeText(empresa.name).includes(term) ||
      normalizeText(empresa.fantasia ?? "").includes(term) ||
      (digits.length > 0 &&
        (empresa.documento.includes(digits) ||
          (empresa.numero ?? "").includes(digits)))
    );
  });

  const empresas = onlyNew
    ? matched.filter((empresa) => !empresa.existente && !empresa.problema)
    : matched;

  /** Correspondências escondidas pelo filtro "somente as novas". */
  const hiddenByFilter = onlyNew
    ? matched.filter((empresa) => empresa.existente || empresa.problema).length
    : 0;

  const novas = (result?.empresas ?? []).filter(
    (empresa) => !empresa.existente && !empresa.problema
  ).length;

  /** Só é possível escolher empresas novas e sem pendência. */
  const selectable = (empresa: AcessoriasCompanyRow) =>
    !empresa.existente && !empresa.problema;

  const visibleSelectable = empresas.filter(selectable);
  const allVisibleSelected =
    visibleSelectable.length > 0 &&
    visibleSelectable.every((empresa) => selected.has(empresa.documento));
  const someVisibleSelected = visibleSelectable.some((empresa) =>
    selected.has(empresa.documento)
  );

  const toggleSelected = (documento: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(documento)) next.delete(documento);
      else next.add(documento);
      return next;
    });
  };

  /** Marca/desmarca todas as empresas visíveis com os filtros atuais. */
  const toggleAllVisible = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const empresa of visibleSelectable) {
        if (checked) next.add(empresa.documento);
        else next.delete(empresa.documento);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CloudDownload className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">Acessórias</h2>
          <p className="text-sm text-muted-foreground">
            Traz do sistema Acessórias as empresas que ainda não estão no
            cadastro. Nenhuma empresa existente é alterada.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-4 shadow-sm">
        <Button
          type="button"
          variant="outline"
          className="h-9 gap-2"
          onClick={() => void fetchPreview()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Buscar empresas no Acessórias
        </Button>

        {result && (
          <>
            <Button
              type="button"
              className="h-9 gap-2"
              onClick={() => handleImport(Array.from(selected))}
              disabled={selected.size === 0 || importMutation.isPending}
            >
              {importMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Importar selecionada(s) ({selected.size})
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-2"
              onClick={() => handleImport()}
              disabled={novas === 0 || importMutation.isPending}
            >
              Importar todas as novas ({novas})
            </Button>
            {selected.size > 0 && (
              <Button
                type="button"
                variant="ghost"
                className="h-9"
                onClick={() => setSelected(new Set())}
              >
                Limpar seleção
              </Button>
            )}
          </>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          Número (ID do Acessórias), CNPJ/CPF, Razão Social, UF, Inscrição
          Estadual, Tributação e situação (Ativa/Inativa).
        </span>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível consultar o Acessórias</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && result.erros.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Avisos do Acessórias</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {result.erros.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {result.total_acessorias} no Acessórias
            </Badge>
            <Badge className="bg-status-success text-status-success-foreground hover:bg-status-success">
              {novas} nova(s)
            </Badge>
            <Badge variant="outline">{result.existentes} já cadastrada(s)</Badge>
            {result.com_problema > 0 && (
              <Badge className="bg-status-warning text-status-warning-foreground hover:bg-status-warning">
                {result.com_problema} com pendência
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por razão social ou CNPJ/CPF"
                className="h-9 rounded-lg pl-9"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={onlyNew}
                onCheckedChange={(checked) => setOnlyNew(checked === true)}
              />
              Mostrar somente as novas
            </label>
            <span className="text-xs text-muted-foreground">
              {empresas.length} linha(s) · {selected.size} selecionada(s)
            </span>
            {hiddenByFilter > 0 && (
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {hiddenByFilter} resultado(s) também correspondem à busca e não
                aparecem por não serem novas
                <Button
                  type="button"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => setOnlyNew(false)}
                >
                  Mostrar também
                </Button>
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        allVisibleSelected
                          ? true
                          : someVisibleSelected
                            ? "indeterminate"
                            : false
                      }
                      disabled={visibleSelectable.length === 0}
                      onCheckedChange={(checked) =>
                        toggleAllVisible(checked === true)
                      }
                      aria-label="Selecionar todas as empresas visíveis"
                    />
                  </TableHead>
                  <TableHead className="w-24">Situação</TableHead>
                  <TableHead className="w-16">Nº</TableHead>
                  <TableHead>Razão social</TableHead>
                  <TableHead className="w-40">CNPJ/CPF</TableHead>
                  <TableHead className="w-14">UF</TableHead>
                  <TableHead className="w-32">Insc. Estadual</TableHead>
                  <TableHead className="w-40">Tributação</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresas.map((empresa) => (
                  <TableRow key={empresa.documento || empresa.name}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(empresa.documento)}
                        disabled={!selectable(empresa)}
                        onCheckedChange={() =>
                          toggleSelected(empresa.documento)
                        }
                        aria-label={`Selecionar ${empresa.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      {empresa.problema ? (
                        <Badge
                          className="bg-status-warning text-status-warning-foreground hover:bg-status-warning"
                          title={empresa.problema}
                        >
                          Pendência
                        </Badge>
                      ) : empresa.existente ? (
                        <Badge variant="outline">Já existe</Badge>
                      ) : (
                        <Badge className="bg-status-success text-status-success-foreground hover:bg-status-success">
                          Nova
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {empresa.numero || "—"}
                    </TableCell>
                    <TableCell className="max-w-80">
                      <span className="block truncate" title={empresa.name}>
                        {empresa.name || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {empresa.documento
                        ? formatCpfCnpj(empresa.documento)
                        : "—"}
                    </TableCell>
                    <TableCell>{empresa.uf || "—"}</TableCell>
                    <TableCell className="truncate">
                      {empresa.inscricao_estadual || "—"}
                    </TableCell>
                    <TableCell className="truncate">
                      {empresa.tributacao || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          empresa.ativa
                            ? "text-status-success-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {empresa.ativa ? "Ativa" : "Inativa"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {empresas.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      {query.trim()
                        ? `Nenhuma empresa encontrada para "${query.trim()}".${
                            onlyNew
                              ? " As empresas já cadastradas aqui não aparecem com o filtro \"somente as novas\"."
                              : ""
                          }`
                        : "Nenhuma empresa para mostrar com os filtros atuais."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            As empresas importadas entram como Matriz, com o Número do
            Acessórias e sem vínculo de departamento/responsável (isso continua
            sendo feito no cadastro de empresas). Empresas com pendência
            (CNPJ/CPF ou UF ausente no Acessórias, ou número já usado por outra
            matriz daqui) não são importadas.
          </p>
        </>
      )}
    </div>
  );
}
