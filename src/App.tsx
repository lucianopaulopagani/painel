import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/auth";
import { ThemeProvider } from "./lib/theme";
import { routers } from "./router";
import {
  AppErrorBoundary,
  RouteErrorBoundary,
} from "./components/error-boundary";

const queryClient = new QueryClient();

// Cada rota ganha a tela de erro amigável (substitui a padrão do React Router).
const routes = routers.map((route) => ({
  ...route,
  errorElement: <RouteErrorBoundary />,
}));

const App = () => {
  const router = createBrowserRouter(routes);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppErrorBoundary>
              <RouterProvider router={router} />
            </AppErrorBoundary>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
