import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDepartments } from "@/hooks/use-departments";
import { useUsers } from "@/hooks/use-users";
import { useImportCompanies } from "@/hooks/use-companies";
import {
  buildCompanyImportTemplate,
  parseCompanyImportFile,
  validateCompanyImportRows,
  type CompanyImportValidation,
} from "@/lib/company-import";

interface CompanyImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CompanyImportDialog({
  open,
  onOpenChange,
}: CompanyImportDialogProps) {
  const { data: departments } = useDepartments();
  const { data: users } = useUsers();
  const importMutation = useImportCompanies();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validations, setValidations] = useState<
    CompanyImportValidation[] | null
  >(null);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    if (!open) {
      setValidations(null);
      setFileName("");
    }
  }, [open]);

  const handleDownloadModel = () => {
    buildCompanyImportTemplate(departments ?? [], users ?? []);
  };

  const handleFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const rows = parseCompanyImportFile(buffer);
      setFileName(file.name);
      setValidations(
        validateCompanyImportRows(rows, departments ?? [], users ?? [])
      );
      if (rows.length === 0) {
        toast.error("Nenhuma linha de dados encontrada no arquivo.");
      }
    } catch {
      toast.error(
        "Não foi possível ler o arquivo. Use o modelo em .xlsx/.xls/.csv."
      );
      setValidations(null);
      setFileName("");
    }
  };

  const validItems = (validations ?? []).filter((v) => v.errors.length === 0);
  const validCount = validItems.length;
  const invalidCount = (validations?.length ?? 0) - validCount;

  const handleImport = async () => {
    try {
      const { imported, failed } = await importMutation.mutateAsync(
        validItems.map((v) => ({
          numero: v.row.numero,
          name: v.row.name,
          documento: v.row.documento,
          uf: v.row.uf,
          inscricao_estadual: v.row.inscricaoEstadual || null,
          department_ids: v.department_ids,
          responsible_ids: v.responsible_ids,
        }))
      );
      toast.success(`${imported} empresa(s) importada(s).`);
      if (failed > 0) toast.error(`${failed} registro(s) falharam.`);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao importar empresas."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar empresas</DialogTitle>
          <DialogDescription>
            Baixe o modelo em Excel, preencha com as empresas e importe aqui.
            Colunas obrigatórias: Nome, CPF/CNPJ e UF.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadModel}
            className="w-fit"
          >
            <Download className="h-4 w-4" />
            Baixar modelo (Excel)
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="w-fit"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Selecionar arquivo (.xlsx, .xls, .csv)
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
          {fileName && (
            <p className="text-xs text-muted-foreground">
              Arquivo: {fileName}
            </p>
          )}
        </div>

        {validations && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary">{validations.length} linha(s)</Badge>
              <Badge className="bg-status-success text-status-success-foreground hover:bg-status-success">
                {validCount} válida(s)
              </Badge>
              <Badge className="bg-status-danger text-status-danger-foreground hover:bg-status-danger">
                {invalidCount} com erro
              </Badge>
            </div>

            <div className="max-h-72 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Linha</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validations.map((v) => (
                    <TableRow key={v.line}>
                      <TableCell className="text-muted-foreground">
                        {v.line}
                      </TableCell>
                      <TableCell className="max-w-56 truncate">
                        {v.row.name || "—"}
                      </TableCell>
                      <TableCell>
                        {v.errors.length === 0 ? (
                          <Badge className="bg-status-success text-status-success-foreground hover:bg-status-success">
                            OK
                          </Badge>
                        ) : (
                          <span
                            className="cursor-help text-xs font-medium text-destructive"
                            title={v.errors.join(" · ")}
                          >
                            {v.errors.join(", ")}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={validCount === 0 || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Importar {validCount > 0 ? `${validCount} empresa(s)` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
