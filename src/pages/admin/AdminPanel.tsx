import { useState } from "react";
import { PanelHeader } from "@/components/shell/panel-header";
import { useAuth } from "@/context/auth";
import {
  AdminSidebar,
  type AdminSection,
} from "@/components/admin/admin-sidebar";
import AdminOverview from "./AdminOverview";
import CompaniesTab from "./CompaniesTab";
import DashboardsSection from "./DashboardsSection";
import DepartmentsTab from "./DepartmentsTab";
import UsersTab from "./UsersTab";

export default function AdminPanel() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const allowed: AdminSection[] = isAdmin
    ? ["overview", "users", "departments", "companies", "dashboards"]
    : ["companies"];

  const [section, setSection] = useState<AdminSection>(
    isAdmin ? "overview" : "companies"
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PanelHeader
        title={isAdmin ? "Painel de Administração" : "Cadastro de empresas"}
        subtitle={
          isAdmin
            ? "Central de usuários, departamentos e dashboards"
            : "Acesso liberado ao cadastro de empresas"
        }
      />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="lg:w-56 lg:shrink-0">
            <AdminSidebar
              active={section}
              onSelect={setSection}
              allowed={allowed}
            />
          </aside>
          <div className="min-w-0 flex-1">
            {section === "overview" && <AdminOverview />}
            {section === "users" && <UsersTab />}
            {section === "departments" && <DepartmentsTab />}
            {section === "companies" && <CompaniesTab />}
            {section === "dashboards" && <DashboardsSection />}
          </div>
        </div>
      </main>
    </div>
  );
}
