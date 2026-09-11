import { useEffect, useState, type FormEvent } from "react";
import { toast } from "@/components/ui/sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { useUpsertCertificate } from "@/hooks/use-certificates";
import { joinDateTimeLocal, splitDateTimeLocal } from "@/lib/utils";
import type { CertificateRow } from "@/lib/types";

interface CertificateFormDialogProps {
  row: CertificateRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CertificateFormDialog({
  row,
  open,
  onOpenChange,
}: CertificateFormDialogProps) {
  const upsert = useUpsertCertificate();

  const [vencimento, setVencimento] = useState("");
  const [avisado, setAvisado] = useState("branco");
  const [agendamentoDate, setAgendamentoDate] = useState("");
  const [agendamentoTime, setAgendamentoTime] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (!open || !row) return;
    const certificate = row.certificate;
    setVencimento(certificate?.vencimento ?? "");
    setAvisado(
      certificate?.avisado === true
        ? "sim"
        : certificate?.avisado === false
          ? "nao"
          : "branco"
    );
    const parts = splitDateTimeLocal(certificate?.agendamento_at ?? null);
    setAgendamentoDate(parts.date);
    setAgendamentoTime(parts.time);
    setObservacoes(certificate?.observacoes ?? "");
  }, [open, row]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!row) return;

    // Ao renovar (nova data futura) um certificado vencido ou que vence hoje,
    // limpa automaticamente avisado, agendamento e observações.
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const existingDue = row.certificate?.vencimento ?? null;
    const isExistingOverdue = existingDue !== null && existingDue <= todayStr;
    const isNewFuture = vencimento !== "" && vencimento > todayStr;
    const shouldClear = isExistingOverdue && isNewFuture;

    try {
      await upsert.mutateAsync({
        company_id: row.company.id,
        vencimento: vencimento || null,
        avisado: shouldClear
          ? null
          : avisado === "sim"
            ? true
            : avisado === "nao"
              ? false
              : null,
        agendamento_at: shouldClear
          ? null
          : joinDateTimeLocal(agendamentoDate, agendamentoTime),
        observacoes: shouldClear ? null : observacoes.trim() || null,
      });
      if (shouldClear) {
        toast.info(
          "Vencimento futuro — avisado, agendamento e observações foram limpos."
        );
      } else {
        toast.success("Certificado salvo.");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar o certificado."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Certificado digital</DialogTitle>
          <DialogDescription>{row?.company.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cert-vencimento">Vencimento</Label>
              <Input
                id="cert-vencimento"
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Avisado</Label>
              <Select value={avisado} onValueChange={setAvisado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="branco">Em branco</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cert-agendamento-date">Agendamento (data)</Label>
              <Input
                id="cert-agendamento-date"
                type="date"
                value={agendamentoDate}
                onChange={(e) => setAgendamentoDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cert-agendamento-time">Agendamento (hora)</Label>
              <Input
                id="cert-agendamento-time"
                type="time"
                value={agendamentoTime}
                onChange={(e) => setAgendamentoTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cert-observacoes">Observações</Label>
            <Textarea
              id="cert-observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Anotações sobre o certificado"
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={upsert.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
