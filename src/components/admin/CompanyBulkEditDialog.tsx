import { useEffect, useState, type FormEvent } from "react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useBulkUpdateCompanies } from "@/hooks/use-companies";
import { TRIBUTACOES } from "@/lib/companies";
import { UFS } from "@/lib/ufs";

interface CompanyBulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ids: string[];
}

const NAO_ALTERAR = "nao-alterar";

export default function CompanyBulkEditDialog({
  open,
  onOpenChange,
  ids,
}: CompanyBulkEditDialogProps) {
  const bulkUpdate = useBulkUpdateCompanies();
  const [uf, setUf] = useState(NAO_ALTERAR);
  const [tributacao, setTributacao] = useState(NAO_ALTERAR);
  const [ie, setIe] = useState("");
  const [clearIe, setClearIe] = useState(false);

  useEffect(() => {
    if (open) {
      setUf(NAO_ALTERAR);
      setTributacao(NAO_ALTERAR);
      setIe("");
      setClearIe(false);
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const patch: Record<string, unknown> = {};
    if (uf !== NAO_ALTERAR) patch.uf = uf;
    if (tributacao !== NAO_ALTERAR) patch.tributacao = tributacao;
    if (clearIe) patch.inscricao_estadual = null;
    else if (ie.trim()) patch.inscricao_estadual = ie.trim();

    if (Object.keys(patch).length === 0) {
      toast.error("Selecione pelo menos um campo para alterar.");
      return;
    }

    try {
      await bulkUpdate.mutateAsync({ ids, patch });
      toast.success(
        `${ids.length} empresa(s) atualizada(s) em massa.`
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar em massa."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manutenção em massa</DialogTitle>
          <DialogDescription>
            Aplica as alterações em{" "}
            <span className="font-semibold">{ids.length} empresa(s)</span>.
            Nome, CNPJ e Número não podem ser alterados em massa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>UF</Label>
              <Select value={uf} onValueChange={setUf}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NAO_ALTERAR}>
                    — (não alterar)
                  </SelectItem>
                  {UFS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tributação</Label>
              <Select value={tributacao} onValueChange={setTributacao}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NAO_ALTERAR}>
                    — (não alterar)
                  </SelectItem>
                  {TRIBUTACOES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bulk-ie">Inscrição Estadual</Label>
            <Input
              id="bulk-ie"
              value={ie}
              onChange={(e) => setIe(e.target.value)}
              placeholder="Deixe em branco para não alterar"
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={clearIe}
                onCheckedChange={(checked) =>
                  setClearIe(checked === true)
                }
              />
              Limpar a Inscrição Estadual das empresas selecionadas
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={bulkUpdate.isPending || ids.length === 0}
            >
              Aplicar em {ids.length} empresa(s)
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
