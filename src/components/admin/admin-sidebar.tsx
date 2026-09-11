import {
  BarChart3,
  Building2,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminSection = "overview" | "users" | "departments" | "dashboards";

const NAV_ITEMS: { key: AdminSection; label: string; icon: LucideIcon }[] = [
  { key: "overview", label: "Visão geral", icon: LayoutDashboard },
  { key: "users", label: "Usuários", icon: Users },
  { key: "departments", label: "Departamentos", icon: Building2 },
  { key: "dashboards", label: "Dashboards", icon: BarChart3 },
];

interface AdminSidebarProps {
  active: AdminSection;
  onSelect: (section: AdminSection) => void;
}

export function AdminSidebar({ active, onSelect }: AdminSidebarProps) {
  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active === key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </nav>
  );
}
