import EmpresasDashboard from "./EmpresasDashboard";

/**
 * Área central dos dashboards do painel de administração. Novos dashboards do
 * painel entram nesta seção, no mesmo formato dos demais.
 */
export default function DashboardsSection() {
  return (
    <div className="space-y-6">
      <EmpresasDashboard />
    </div>
  );
}
