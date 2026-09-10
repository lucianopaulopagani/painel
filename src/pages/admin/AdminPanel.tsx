import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PanelHeader } from "@/components/shell/panel-header";
import DepartmentsTab from "./DepartmentsTab";
import UsersTab from "./UsersTab";

export default function AdminPanel() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PanelHeader
        title="Painel de Administração"
        subtitle="Gerencie departamentos e usuários do sistema"
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Tabs defaultValue="departments">
          <TabsList>
            <TabsTrigger value="departments">Departamentos</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>
          <TabsContent value="departments">
            <DepartmentsTab />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
