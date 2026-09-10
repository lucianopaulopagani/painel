import DepartmentSelection from "./pages/DepartmentSelection";
import Login from "./pages/Login";
import DepartmentPanel from "./pages/app/DepartmentPanel";
import AdminPanel from "./pages/admin/AdminPanel";
import ProtectedRoute from "./components/guards/protected-route";
import AdminRoute from "./components/guards/admin-route";
import NotFound from "./pages/NotFound";

export const routers = [
  {
    path: "/",
    name: "departments",
    element: <DepartmentSelection />,
  },
  {
    path: "/login/:departmentId",
    name: "login",
    element: <Login />,
  },
  {
    path: "/app",
    name: "app",
    element: (
      <ProtectedRoute>
        <DepartmentPanel />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    name: "admin",
    element: (
      <AdminRoute>
        <AdminPanel />
      </AdminRoute>
    ),
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
