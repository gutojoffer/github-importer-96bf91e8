import { lazy, Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Link, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LigaProvider, useLiga } from "@/contexts/LigaContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LigaLogo from "@/components/LigaLogo";
import SkeletonBox from "@/components/SkeletonBox";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight } from "lucide-react";
import Index from "./pages/Index";
import PlayerManager from "@/pages/PlayerManager";
import TournamentHub from "@/pages/TournamentHub";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import LandingPage from "@/pages/LandingPage";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes
const TournamentHistory = lazy(() => import("@/pages/TournamentHistory"));
const TournamentPodium = lazy(() => import("@/pages/TournamentPodium"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const TournamentSignup = lazy(() => import("@/pages/TournamentSignup"));
const Settings = lazy(() => import("@/pages/Settings"));

const queryClient = new QueryClient();

const LazyFallback = () => (
  <div className="p-8 space-y-4">
    <SkeletonBox className="h-8 w-48" />
    <SkeletonBox className="h-4 w-72" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-6">
      {[1,2,3].map(i => <SkeletonBox key={i} className="h-32 w-full" />)}
    </div>
  </div>
);

const BREADCRUMB_MAP: Record<string, { label: string; path: string }> = {
  '/home': { label: 'Home', path: '/home' },
  '/tournament': { label: 'Torneios', path: '/tournament' },
  '/history': { label: 'Histórico', path: '/history' },
  '/rankings': { label: 'Rankings', path: '/rankings' },
  '/players': { label: 'Bladers', path: '/players' },
  '/settings': { label: 'Configurações', path: '/settings' },
};

const AppHeader = () => {
  const location = useLocation();
  const { nomeLiga } = useLiga();

  // Build breadcrumb
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; path: string; active: boolean }[] = [];
  
  if (pathParts.length === 0) {
    breadcrumbs.push({ label: 'Home', path: '/home', active: true });
  } else {
    let accumulated = '';
    pathParts.forEach((part, i) => {
      accumulated += `/${part}`;
      const mapped = BREADCRUMB_MAP[accumulated];
      const isLast = i === pathParts.length - 1;
      if (mapped) {
        breadcrumbs.push({ label: mapped.label, path: mapped.path, active: isLast });
      } else if (i > 0) {
        if (pathParts[i - 1] === 'history') {
          breadcrumbs.push({ label: 'Resultado', path: accumulated, active: isLast });
        }
      }
    });
  }

  return (
    <header className="h-12 flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] bg-[hsl(var(--bg2))/0.8] backdrop-blur-md px-4 sticky top-0 z-50">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />

      {/* Divider */}
      <div className="h-5 w-px bg-[rgba(255,255,255,0.08)]" />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0">
        {breadcrumbs.map((bc, i) => (
          <span key={bc.path} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
            {bc.active ? (
              <span className="font-heading text-sm font-bold text-foreground truncate tracking-wide">{bc.label}</span>
            ) : (
              <Link to={bc.path} className="font-heading text-sm text-muted-foreground hover:text-foreground transition-colors truncate">
                {bc.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Liga badge */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
        <LigaLogo size={22} />
        <span className="font-body text-xs font-medium text-muted-foreground truncate max-w-[140px]">{nomeLiga}</span>
      </div>
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
              <Suspense fallback={<LazyFallback />}>
                <Routes>
                  <Route path="/home" element={<Index />} />
                  <Route path="/tournament" element={<TournamentHub />} />
                  <Route path="/players" element={<PlayerManager />} />
                  <Route path="/history" element={<TournamentHistory />} />
                  <Route path="/history/:id" element={<TournamentPodium />} />
                  <Route path="/rankings" element={<Leaderboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
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
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/recuperar-senha" element={<ForgotPassword />} />
            <Route path="/nova-senha" element={<ResetPassword />} />
            <Route path="/signup/:tournamentId" element={<Suspense fallback={<LazyFallback />}><TournamentSignup /></Suspense>} />
            <Route path="*" element={<ProtectedLayout />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
