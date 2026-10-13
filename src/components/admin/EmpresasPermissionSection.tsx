import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  EMPRESA_FIELD_CHECKBOXES,
  EMPRESA_LINK_PERMISSION_KEYS,
} from "@/lib/empresas-permissions";

const LINK_KEYS = EMPRESA_LINK_PERMISSION_KEYS as readonly string[];

interface EmpresasPermissionSectionProps {
  access: boolean;
  fields: string[];
  criar: boolean;
  importar: boolean;
  bulk: boolean;
  onAccessChange: (access: boolean) => void;
  onFieldsChange: (fields: string[]) => void;
  onCriarChange: (value: boolean) => void;
  onImportarChange: (value: boolean) => void;
  onBulkChange: (value: boolean) => void;
}

/** Permissões do cadastro de empresas (acesso + campos + ações). */
export function EmpresasPermissionSection({
  access,
  fields,
  criar,
  importar,
  bulk,
  onAccessChange,
  onFieldsChange,
  onCriarChange,
  onImportarChange,
  onBulkChange,
}: EmpresasPermissionSectionProps) {
  const toggleField = (key: string) => {
    if (fields.includes(key)) {
      onFieldsChange(fields.filter((field) => field !== key));
    } else {
      onFieldsChange([...fields, key]);
    }
  };

  /** Interruptor que libera subdepartamentos e responsáveis juntos. */
  const linkPermissions = LINK_KEYS.some((key) => fields.includes(key));
  const toggleLinkPermissions = (value: boolean) => {
    const others = fields.filter((field) => !LINK_KEYS.includes(field));
    onFieldsChange(value ? [...others, ...LINK_KEYS] : others);
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
            if (!value) {
              onFieldsChange([]);
              onCriarChange(false);
              onImportarChange(false);
              onBulkChange(false);
            }
          }}
        />
      </div>

      {access && (
        <>
          <div className="flex flex-col gap-3 rounded-md bg-muted/40 p-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium">Nova empresa</Label>
                <p className="text-xs text-muted-foreground">
                  Permite cadastrar novas empresas.
                </p>
              </div>
              <Switch checked={criar} onCheckedChange={onCriarChange} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium">Importar</Label>
                <p className="text-xs text-muted-foreground">
                  Permite importar empresas de planilha.
                </p>
              </div>
              <Switch
                checked={importar}
                onCheckedChange={onImportarChange}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium">
                  Subdepartamentos e responsáveis
                </Label>
                <p className="text-xs text-muted-foreground">
                  Permite vincular os subdepartamentos e os responsáveis das
                  empresas, somente nos departamentos em que o usuário
                  participa.
                </p>
              </div>
              <Switch
                checked={linkPermissions}
                onCheckedChange={toggleLinkPermissions}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium">
                  Manutenção em massa
                </Label>
                <p className="text-xs text-muted-foreground">
                  Permite alterar várias empresas de uma vez (somente os
                  campos liberados acima).
                </p>
              </div>
              <Switch checked={bulk} onCheckedChange={onBulkChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {EMPRESA_FIELD_CHECKBOXES.map((field) => (
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
        </>
      )}
    </div>
  );
}
