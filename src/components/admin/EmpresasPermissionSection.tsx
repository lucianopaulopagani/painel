import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EMPRESA_PERMISSION_FIELDS } from "@/lib/empresas-permissions";

interface EmpresasPermissionSectionProps {
  access: boolean;
  fields: string[];
  onAccessChange: (access: boolean) => void;
  onFieldsChange: (fields: string[]) => void;
}

/** Permissão de acesso ao cadastro de empresas + campos liberados por usuário. */
export function EmpresasPermissionSection({
  access,
  fields,
  onAccessChange,
  onFieldsChange,
}: EmpresasPermissionSectionProps) {
  const toggleField = (key: string) => {
    if (fields.includes(key)) {
      onFieldsChange(fields.filter((field) => field !== key));
    } else {
      onFieldsChange([...fields, key]);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label className="text-sm font-medium">Cadastro de empresas</Label>
          <p className="text-xs text-muted-foreground">
            Permite acessar o cadastro de empresas na administração. Os campos
            liberados abaixo são os únicos que o usuário poderá alterar.
          </p>
        </div>
        <Switch
          checked={access}
          onCheckedChange={(value) => {
            onAccessChange(value);
            if (!value) onFieldsChange([]);
          }}
        />
      </div>

      {access && (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {EMPRESA_PERMISSION_FIELDS.map((field) => (
            <label
              key={field.key}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={fields.includes(field.key)}
                onCheckedChange={() => toggleField(field.key)}
              />
              {field.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
