import { useState } from "react";
import {
  BarChart3,
  Briefcase,
  Building2,
  ChevronDown,
  CloudDownload,
  LayoutDashboard,
  Percent,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminSection =
  | "overview"
  | "users"
  | "departments"
  | "companies"
  | "tributacoes"
  | "acessorias"
  | "dashboards";

interface NavChild {
  key: AdminSection;
  label: string;
  icon: LucideIcon;
}

interface NavItem {
  key: AdminSection;
  label: string;
  icon: LucideIcon;
  /** Submenus exibidos abaixo do item principal. */
  children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Visão geral", icon: LayoutDashboard },
  { key: "users", label: "Usuários", icon: Users },
  { key: "departments", label: "Departamentos", icon: Building2 },
  {
    key: "companies",
    label: "Empresas",
    icon: Briefcase,
    // Submenus do cadastro de empresas.
    children: [
      { key: "acessorias", label: "Acessórias", icon: CloudDownload },
      { key: "tributacoes", label: "Tributações", icon: Percent },
    ],
  },
  { key: "dashboards", label: "Dashboards", icon: BarChart3 },
];

interface AdminSidebarProps {
  active: AdminSection;
  onSelect: (section: AdminSection) => void;
  /** Se informado, mostra apenas estas seções (ex.: usuário com acesso só a Empresas). */
  allowed?: AdminSection[];
}

export function AdminSidebar({
  active,
  onSelect,
  allowed,
}: AdminSidebarProps) {
  const isAllowed = (key: AdminSection) =>
    !allowed || allowed.includes(key);

  const items = NAV_ITEMS.map((item) => ({
    ...item,
    children: (item.children ?? []).filter((child) => isAllowed(child.key)),
  })).filter((item) => isAllowed(item.key));

  // Submenus começam recolhidos e abrem ao clicar no menu principal (ou quando
  // um submenu está ativo).
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const hasActiveChild = (item: NavItem): boolean =>
    (item.children ?? []).some((child) => child.key === active);
  const groupOpen = (item: NavItem): boolean =>
    hasActiveChild(item) || expanded[item.key] === true;

  /** Clicar no menu principal seleciona a seção e revela os submenus. */
  const handleParentClick = (item: NavItem) => {
    onSelect(item.key);
    if ((item.children ?? []).length > 0) {
      setExpanded((prev) => ({ ...prev, [item.key]: true }));
    }
  };

  const toggleGroup = (item: NavItem) => {
    if (hasActiveChild(item)) return;
    setExpanded((prev) => ({ ...prev, [item.key]: !prev[item.key] }));
  };

  const renderButton = (
    key: AdminSection,
    label: string,
    Icon: LucideIcon,
    options: { isChild?: boolean; onClick?: () => void } = {}
  ) => (
    <button
      type="button"
      onClick={options.onClick ?? (() => onSelect(key))}
      aria-current={active === key ? "page" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        options.isChild && "ml-3 px-2.5 py-1.5 text-[13px]",
        active === key
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className={cn("h-4 w-4", options.isChild && "h-3.5 w-3.5")} />
      {label}
    </button>
  );

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {items.map((item) => {
        const Icon = item.icon;
        const hasChildren = (item.children ?? []).length > 0;
        const open = hasChildren && groupOpen(item);

        return (
          <div key={item.key} className="flex shrink-0 flex-col gap-1">
            <div className="flex items-center gap-0.5">
              {renderButton(item.key, item.label, Icon, {
                onClick: () => handleParentClick(item),
              })}
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleGroup(item)}
                  aria-expanded={open}
                  aria-label={
                    open
                      ? `Recolher submenus de ${item.label}`
                      : `Expandir submenus de ${item.label}`
                  }
                  className={cn(
                    "inline-flex h-7 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    active === item.key && "text-primary-foreground/80"
                  )}
                >
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      open && "rotate-180"
                    )}
                  />
                </button>
              )}
            </div>

            {open &&
              (item.children ?? []).map((child) =>
                renderButton(child.key, child.label, child.icon, {
                  isChild: true,
                })
              )}
          </div>
        );
      })}
    </nav>
  );
}
