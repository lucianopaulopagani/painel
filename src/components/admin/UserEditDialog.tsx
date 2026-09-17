import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DepartmentMultiSelect } from "@/components/admin/department-multi-select";
import { EmpresasPermissionSection } from "@/components/admin/EmpresasPermissionSection";
import { useUpdateUser } from "@/hooks/use-users";
import { fileToDataUrl } from "@/hooks/use-own-profile";
import { getInitials } from "@/lib/utils";
import type { ProfileWithDepartments, Role } from "@/lib/types";

interface UserEditDialogProps {
  user: ProfileWithDepartments | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserEditDialog({
  user,
  open,
  onOpenChange,
}: UserEditDialogProps) {
  const updateMutation = useUpdateUser();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [dashboardAccess, setDashboardAccess] = useState(false);
  const [empresasAccess, setEmpresasAccess] = useState(false);
  const [empresasFields, setEmpresasFields] = useState<string[]>([]);
  const [empresasCriar, setEmpresasCriar] = useState(false);
  const [empresasImportar, setEmpresasImportar] = useState(false);
  const [empresasBulk, setEmpresasBulk] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && user) {
      setFullName(user.full_name);
      setEmail(user.email);
      setRole(user.role);
      setDepartmentIds(user.departments.map((d) => d.id));
      setDashboardAccess(user.dashboard_access);
      setEmpresasAccess(user.empresas_access);
      setEmpresasFields(user.empresas_fields ?? []);
      setEmpresasCriar(user.empresas_criar);
      setEmpresasImportar(user.empresas_importar);
      setEmpresasBulk(user.empresas_bulk);
      setAvatarUrl(user.avatar_url ?? null);
    }
  }, [open, user]);

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setAvatarUrl(await fileToDataUrl(file));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao processar a imagem."
      );
    }
    event.target.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!fullName.trim() || !email.trim()) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: user.id,
        full_name: fullName.trim(),
        email: email.trim(),
        role,
        department_ids: departmentIds,
        dashboard_access: dashboardAccess,
        empresas_access: empresasAccess,
        empresas_fields: empresasFields,
        empresas_criar: empresasCriar,
        empresas_importar: empresasImportar,
        empresas_bulk: empresasBulk,
        avatar_url: avatarUrl || null,
      });
      toast.success("Usuário atualizado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar usuário."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>
            Ajuste o papel e os departamentos de acesso do usuário.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
              <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                {getInitials(fullName || user?.full_name || "?")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                Alterar foto
              </Button>
              <p className="text-xs text-muted-foreground">
                Foto exibida no topo do sistema para este usuário.
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Nome completo</Label>
            <Input
              id="edit-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-email">E-mail (login)</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Papel</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Membro</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Departamentos de acesso</Label>
            <DepartmentMultiSelect
              value={departmentIds}
              onChange={setDepartmentIds}
            />
            <p className="text-xs text-muted-foreground">
              Marque um ou mais departamentos. Sem vínculo, o usuário não
              acessa nenhum departamento.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <div>
              <Label htmlFor="edit-dashboard" className="text-sm font-medium">
                Dashboard geral
              </Label>
              <p className="text-xs text-muted-foreground">
                Permite visualizar o dashboard geral com a visão de cada
                departamento (Fiscal, Pessoal e Societário).
              </p>
            </div>
            <Switch
              id="edit-dashboard"
              checked={dashboardAccess}
              onCheckedChange={setDashboardAccess}
            />
          </div>
          <EmpresasPermissionSection
            access={empresasAccess}
            fields={empresasFields}
            criar={empresasCriar}
            importar={empresasImportar}
            bulk={empresasBulk}
            onAccessChange={setEmpresasAccess}
            onFieldsChange={setEmpresasFields}
            onCriarChange={setEmpresasCriar}
            onImportarChange={setEmpresasImportar}
            onBulkChange={setEmpresasBulk}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
