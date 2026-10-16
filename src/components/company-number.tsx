import { cn } from "@/lib/utils";
import type { CompanyWithDepartments } from "@/lib/types";

interface CompanyNumberProps {
  company: CompanyWithDepartments;
  /** Classes extras aplicadas ao conjunto (ex.: alinhamento da célula). */
  className?: string;
}

/**
 * Número da empresa nas tabelas dos subdepartamentos.
 *
 * Empresas do tipo Filial recebem uma TAG compacta "F" (com explicação no
 * tooltip) ao lado do número — a marca ocupa poucos pixels para não alterar a
 * largura das colunas nem o alinhamento das tabelas.
 */
export function CompanyNumber({ company, className }: CompanyNumberProps) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {company.numero || "—"}
      {company.tipo === "filial" && (
        <span
          aria-label="Filial"
          title="Filial — mesmo número da matriz"
          className="inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] bg-primary/15 text-[8px] font-bold uppercase leading-none text-primary"
        >
          F
        </span>
      )}
    </span>
  );
}
