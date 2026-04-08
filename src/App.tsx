import { lazy, Suspense } from 'react';
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
import { Search, Settings as SettingsIcon, LogOut, ChevronRight, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
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
  const navigate = useNavigate();
  const { nomeLiga } = useLiga();
  const { user, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

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
        // ID segment — could be tournament result etc
        if (pathParts[i - 1] === 'history') {
          breadcrumbs.push({ label: 'Resultado', path: accumulated, active: isLast });
        }
      }
    });
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const userEmail = user?.email || '';
  const userLiga = nomeLiga || userEmail.split('@')[0];

  return (
    <header className="h-14 flex items-center gap-3 border-b border-[rgba(255,255,255,0.07)] bg-[hsl(var(--bg2))] px-4 sticky top-0 z-50">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0">
        {breadcrumbs.map((bc, i) => (
          <span key={bc.path} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
            {bc.active ? (
              <span className="font-heading text-sm font-bold text-foreground truncate">{bc.label}</span>
            ) : (
              <Link to={bc.path} className="font-heading text-sm text-muted-foreground hover:text-foreground transition-colors truncate">
                {bc.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Center: Liga info */}
      <div className="hidden md:flex items-center gap-2">
        <LigaLogo size={28} />
        <span className="font-heading text-sm font-semibold text-foreground truncate max-w-[160px]">{userLiga}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Search */}
        {searchOpen ? (
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar..."
            className="w-40 sm:w-56 px-3 py-1.5 rounded-lg text-sm font-body bg-[hsl(var(--surface))] border border-[rgba(255,255,255,0.12)] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all"
            onBlur={() => setSearchOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
          />
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.12)] text-sm text-muted-foreground hover:bg-[hsl(var(--surface))] hover:text-foreground transition-all font-body"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Buscar</span>
          </button>
        )}

        {/* User avatar dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
          >
            <User className="h-4 w-4" />
          </button>
          {dropdownOpen && (
            <div
              className="absolute right-0 top-10 w-56 rounded-xl p-2 z-50 shadow-xl"
              style={{ background: '#141928', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <div className="px-3 py-2">
                <p className="font-heading text-sm font-bold text-foreground truncate">{userLiga}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
              <div className="h-px bg-[rgba(255,255,255,0.07)] my-1" />
              <button
                onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface))] rounded-lg transition-colors font-body"
              >
                <SettingsIcon className="h-4 w-4" /> Configurações
              </button>
              <button
                onClick={() => { setDropdownOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors font-body"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>
          )}
        </div>
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
            <Route path="/signup/:tournamentId" element={<TournamentSignup />} />
            <Route path="*" element={<ProtectedLayout />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
