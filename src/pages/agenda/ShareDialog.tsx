import { useState } from "react";
import { Check, Clock, Mail, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  ACCESS_LEVEL_LABELS,
  ACCESS_LEVEL_ORDER,
  type AccessLevel,
  type AgendaCalendar,
} from "./agenda-data";
import type { CalendarShareRow } from "./use-agenda";

interface ShareDialogProps {
  calendar: AgendaCalendar | null;
  shares: CalendarShareRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, level: AccessLevel) => void;
  onRemove: (id: string) => void;
}

export function ShareDialog({
  calendar,
  shares,
  open,
  onOpenChange,
  onInvite,
  onRemove,
}: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState<AccessLevel>("view_busy");

  const handleAdd = () => {
    const value = email.trim().toLowerCase();
    if (!value || !value.includes("@")) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (shares.some((share) => share.shared_with_user_email === value)) {
      toast.error("Este e-mail já tem acesso a esta agenda.");
      return;
    }
    onInvite(value, level);
    setEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Configurações e compartilhamento</DialogTitle>
          <DialogDescription>
            {calendar?.name} — defina quem pode ver ou alterar esta agenda.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <Label htmlFor="share-email">Compartilhar com</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="share-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@ou-cliente.com.br"
                className="flex-1"
              />
              <Select
                value={level}
                onValueChange={(value) => setLevel(value as AccessLevel)}
              >
                <SelectTrigger className="sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_LEVEL_ORDER.map((option) => (
                    <SelectItem key={option} value={option}>
                      {ACCESS_LEVEL_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={handleAdd}>
                <Mail className="h-4 w-4" />
                Convidar
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Quem tem acesso</span>
            {shares.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Apenas você tem acesso a esta agenda.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {shares.map((share) => (
                  <li
                    key={share.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {share.shared_with_user_email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ACCESS_LEVEL_LABELS[share.permission_level]}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {share.status === "accepted" ? (
                        <Badge className="gap-1 bg-status-success text-status-success-foreground">
                          <Check className="h-3 w-3" />
                          Aceito
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pendente
                        </Badge>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Remover acesso"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onRemove(share.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PendingSharesPanelProps {
  requests: {
    id: string;
    calendarName: string;
    fromName: string;
    level: AccessLevel;
  }[];
  onRespond: (id: string, accepted: boolean) => void;
}

/** Painel de autorizações pendentes: só aparece a agenda após aceite. */
export function PendingSharesPanel({
  requests,
  onRespond,
}: PendingSharesPanelProps) {
  if (requests.length === 0) return null;

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
        <Clock className="h-4 w-4" />
        Autorizações pendentes ({requests.length})
      </div>
      <ul className="flex flex-col gap-2">
        {requests.map((request) => (
          <li key={request.id} className="rounded-md border bg-card p-2">
            <div className="text-sm font-medium">{request.calendarName}</div>
            <div className="text-xs text-muted-foreground">
              {request.fromName} · {ACCESS_LEVEL_LABELS[request.level]}
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => onRespond(request.id, true)}
              >
                Aceitar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onRespond(request.id, false)}
              >
                Recusar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
