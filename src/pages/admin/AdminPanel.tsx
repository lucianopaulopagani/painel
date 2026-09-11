import { useState } from "react";
import { PanelHeader } from "@/components/shell/panel-header";
import {
  AdminSidebar,
  type AdminSection,
} from "@/components/admin/admin-sidebar";
import AdminOverview from "./AdminOverview";
import DashboardsSection from "./DashboardsSection";
import DepartmentsTab from "./DepartmentsTab";
import UsersTab from "./UsersTab";

export default function AdminPanel() {
  const [section, setSection] = useState<AdminSection>("overview");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PanelHeader
        title="Painel de Administração"
        subtitle="Central de usuários, departamentos e dashboards"
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="lg:w-56 lg:shrink-0">
            <AdminSidebar active={section} onSelect={setSection} />
          </aside>
          <div className="min-w-0 flex-1">
            {section === "overview" && <AdminOverview />}
            {section === "users" && <UsersTab />}
            {section === "departments" && <DepartmentsTab />}
            {section === "dashboards" && <DashboardsSection />}
          </div>
        </div>
      </main>
    </div>
  );
}
