import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { APP_ACCESS_OPTIONS, type AppAccessKey } from "@/lib/app-access";

interface AppAccessSectionProps {
  /** Permissões por aplicativo (Chat, Tarefas e Agenda). */
  apps: Record<AppAccessKey, boolean>;
  onChange: (key: AppAccessKey, value: boolean) => void;
}

/** Liberações dos aplicativos do hub: Chat, Tarefas e Agenda. */
export function AppAccessSection({ apps, onChange }: AppAccessSectionProps) {
  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      <div>
        <Label className="text-sm font-medium">Aplicativos</Label>
        <p className="text-xs text-muted-foreground">
          Libera o acesso ao Chat, às Tarefas e à Agenda. O administrador sempre
          tem acesso; os demais precisam ser liberados aqui.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-md bg-muted/40 p-3">
        {APP_ACCESS_OPTIONS.map((option) => (
          <div
            key={option.key}
            className="flex items-center justify-between gap-4"
          >
            <div>
              <Label className="text-sm font-medium">{option.label}</Label>
              <p className="text-xs text-muted-foreground">
                {option.description}
              </p>
            </div>
            <Switch
              checked={apps[option.key]}
              onCheckedChange={(value) => onChange(option.key, value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
