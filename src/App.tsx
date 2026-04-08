import { lazy, Suspense, useEffect } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppTopbar } from "@/components/AppTopbar";
import { AuthProvider } from "@/contexts/AuthContext";
import { LigaProvider } from "@/contexts/LigaContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import SkeletonBox from "@/components/SkeletonBox";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useTournamentStore } from "@/stores/useTournamentStore";
import Index from "./pages/Index";
import PlayerManager from "@/pages/PlayerManager";
import TournamentHub from "@/pages/TournamentHub";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import LandingPage from "@/pages/LandingPage";
import SetupAdmin from "@/pages/SetupAdmin";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes
const TournamentHistory = lazy(() => import("@/pages/TournamentHistory"));
const TournamentPodium = lazy(() => import("@/pages/TournamentPodium"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const TournamentSignup = lazy(() => import("@/pages/TournamentSignup"));
const Settings = lazy(() => import("@/pages/Settings"));

// Admin lazy-loaded
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminBeyblades = lazy(() => import("@/pages/admin/AdminBeyblades"));
const AdminReleaseNotes = lazy(() => import("@/pages/admin/AdminReleaseNotes"));
const AdminLigas = lazy(() => import("@/pages/admin/AdminLigas"));
const AdminConfig = lazy(() => import("@/pages/admin/AdminConfig"));

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

const ProtectedLayout = () => {
  useEffect(() => {
    const unsubPlayers = usePlayerStore.getState().subscribeRealtime();
    const unsubTournaments = useTournamentStore.getState().subscribeRealtime();
    return () => { unsubPlayers(); unsubTournaments(); };
  }, []);

  return (
    <ProtectedRoute>
      <LigaProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <AppTopbar />
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
      </LigaProvider>
    </ProtectedRoute>
  );
};

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
            <Route path="/setup-admin" element={<SetupAdmin />} />
            <Route path="/recuperar-senha" element={<ForgotPassword />} />
            <Route path="/nova-senha" element={<ResetPassword />} />
            <Route path="/signup/:tournamentId" element={<Suspense fallback={<LazyFallback />}><TournamentSignup /></Suspense>} />
            <Route path="/admin/*" element={
              <AdminRoute>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AdminSidebar />
                    <div className="flex-1 flex flex-col min-w-0">
                      <header className="h-14 flex items-center sticky top-0 z-50" style={{ background: '#0a0d18', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '0 24px' }}>
                        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
                        <div className="h-5 w-px mx-3" style={{ background: 'rgba(255,255,255,.08)' }} />
                        <span className="font-heading text-sm font-bold text-foreground">Admin Panel</span>
                      </header>
                      <main className="flex-1 overflow-auto">
                        <Suspense fallback={<LazyFallback />}>
                          <Routes>
                            <Route path="/" element={<AdminDashboard />} />
                            <Route path="/beyblades" element={<AdminBeyblades />} />
                            <Route path="/release-notes" element={<AdminReleaseNotes />} />
                            <Route path="/ligas" element={<AdminLigas />} />
                            <Route path="/config" element={<AdminConfig />} />
                          </Routes>
                        </Suspense>
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              </AdminRoute>
            } />
            <Route path="*" element={<ProtectedLayout />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
