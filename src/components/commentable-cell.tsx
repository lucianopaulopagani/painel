import { useState, type ReactNode } from "react";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CommentableCellProps {
  /** Texto do comentário existente (null = sem comentário). */
  comment: string | null;
  /** Título da célula exibido no diálogo (ex.: "JAN 2026"). */
  label: string;
  children: ReactNode;
  onSave: (value: string) => void;
  onRemove: () => void;
  /** Bloqueado pela Data de Início da empresa: sem menu de comentário. */
  disabled?: boolean;
}

/**
 * Célula com comentário estilo Excel: botão direito abre o menu de contexto
 * com "Adicionar Comentário"; havendo nota, aparece um marcador discreto no
 * canto superior direito que, ao passar o mouse, exibe o comentário.
 */
export function CommentableCell({
  comment,
  label,
  children,
  onSave,
  onRemove,
  disabled = false,
}: CommentableCellProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [text, setText] = useState("");

  const marker = comment ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label="Comentário"
          className="absolute right-0 top-0 h-0 w-0 cursor-help border-l-[7px] border-t-[7px] border-l-transparent border-t-destructive"
        />
      </TooltipTrigger>
      <TooltipContent className="max-w-64 whitespace-pre-wrap">
        {comment}
      </TooltipContent>
    </Tooltip>
  ) : null;

  // Período bloqueado (anterior à Data de Início): sem edição de comentário.
  if (disabled) {
    return (
      <div className="relative h-full w-full">
        {children}
        {marker}
      </div>
    );
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="relative h-full w-full">
            {children}
            {marker}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() => {
              setText(comment ?? "");
              setDialogOpen(true);
            }}
          >
            <MessageSquarePlus className="h-4 w-4" />
            {comment ? "Editar Comentário" : "Adicionar Comentário"}
          </ContextMenuItem>
          {comment && (
            <ContextMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
              Remover Comentário
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Comentário</DialogTitle>
            <DialogDescription>{label}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Escreva o comentário desta célula"
            rows={4}
            autoFocus
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                const value = text.trim();
                if (value) onSave(value);
                else onRemove();
                setDialogOpen(false);
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
