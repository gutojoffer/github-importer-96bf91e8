import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Link } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { LigaProvider } from "@/contexts/LigaContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LigaLogo from "@/components/LigaLogo";
import { Search, Plus } from "lucide-react";
import Index from "./pages/Index";
import PlayerManager from "@/pages/PlayerManager";
import TournamentHub from "@/pages/TournamentHub";
import TournamentHistory from "@/pages/TournamentHistory";
import TournamentPodium from "@/pages/TournamentPodium";
import Leaderboard from "@/pages/Leaderboard";
import TournamentSignup from "@/pages/TournamentSignup";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/tournament': 'Torneio',
  '/history': 'Histórico',
  '/rankings': 'Rankings',
  '/players': 'Bladers',
  '/settings': 'Configurações',
};

const AppHeader = () => {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Arena X';

  return (
    <header className="h-14 flex items-center gap-3 border-b border-[rgba(255,255,255,0.07)] bg-[hsl(var(--bg2))] px-4 sticky top-0 z-50">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
      <LigaLogo size={28} />
      <h1 className="font-heading text-lg font-bold tracking-wider text-foreground flex-1">
        {title}
      </h1>
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.12)] text-sm text-muted-foreground hover:bg-[hsl(var(--surface))] hover:text-foreground transition-all font-body">
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Buscar</span>
      </button>
      <Link
        to="/tournament"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors font-body"
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Novo Torneio</span>
      </Link>
    </header>
  );
};

const ProtectedLayout = () => (
  <ProtectedRoute>
    <LigaProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <AppHeader />
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/tournament" element={<TournamentHub />} />
                <Route path="/players" element={<PlayerManager />} />
                <Route path="/history" element={<TournamentHistory />} />
                <Route path="/history/:id" element={<TournamentPodium />} />
                <Route path="/rankings" element={<Leaderboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </LigaProvider>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/recuperar-senha" element={<ForgotPassword />} />
            <Route path="/nova-senha" element={<ResetPassword />} />
            <Route path="/signup/:tournamentId" element={<TournamentSignup />} />
            <Route path="*" element={<ProtectedLayout />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
