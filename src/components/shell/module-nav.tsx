import { cn } from "@/lib/utils";

interface ModuleNavProps<T extends string> {
  modules: readonly { key: T; label: string }[];
  active: T;
  onSelect: (key: T) => void;
  ariaLabel: string;
}

/** Barra horizontal de recursos/módulos de um departamento. */
export function ModuleNav<T extends string>({
  modules,
  active,
  onSelect,
  ariaLabel,
}: ModuleNavProps<T>) {
  return (
    <nav
      aria-label={ariaLabel}
      className="mb-6 flex gap-1 overflow-x-auto border-b"
    >
      {modules.map((module) => (
        <button
          key={module.key}
          type="button"
          onClick={() => onSelect(module.key)}
          className={cn(
            "-mb-px shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            active === module.key
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {module.label}
        </button>
      ))}
    </nav>
  );
}
