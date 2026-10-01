import { useEffect, useState } from "react";
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
import { WEEKDAYS, type Task, type TaskInput } from "./tarefas-data";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDay: number;
  /** Semana exibida no quadro (segunda-feira, AAAA-MM-DD). */
  week: string;
  /** Tarefa em edição (null ou ausente = nova tarefa). */
  task?: Task | null;
  onSubmit: (input: TaskInput) => void;
}

/** Formulário de tarefa: título, descrição e dia (criar ou editar). */
export function TaskDialog({
  open,
  onOpenChange,
  defaultDay,
  week,
  task = null,
  onSubmit,
}: TaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [day, setDay] = useState(String(defaultDay));

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setDay(String(task?.day ?? defaultDay));
  }, [open, task, defaultDay]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (title.trim() === "") return;
    onSubmit({
      title,
      description,
      day: Number(day),
      week: task?.week ?? week,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {task ? "Editar tarefa" : "Nova tarefa"}
          </DialogTitle>
          <DialogDescription>
            {task
              ? "Altere o título, a descrição ou o dia da tarefa."
              : "A tarefa entra como Cadastrada e pode ser arrastada para outro dia."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Título</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Conferir balancete da empresa X"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-description">Descrição (opcional)</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detalhes, links ou observações"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-day">Dia inicial</Label>
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger id="task-day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map((weekday) => (
                  <SelectItem key={weekday.key} value={String(weekday.key)}>
                    {weekday.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={title.trim() === ""}>
              {task ? "Salvar alterações" : "Adicionar tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
