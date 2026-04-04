import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import PlayerManager from "@/pages/PlayerManager";
import TournamentHub from "@/pages/TournamentHub";
import TournamentHistory from "@/pages/TournamentHistory";
import TournamentPodium from "@/pages/TournamentPodium";
import Leaderboard from "@/pages/Leaderboard";
import TournamentSignup from "@/pages/TournamentSignup";
import Settings from "@/pages/Settings";
import NotFound from "./pages/NotFound";
import { Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { getCustomLogo } from "@/pages/Settings";

const queryClient = new QueryClient();

const AppHeader = () => {
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => { setLogo(getCustomLogo()); const h = () => setLogo(getCustomLogo()); window.addEventListener('storage', h); return () => window.removeEventListener('storage', h); }, []);

  return (
    <header className="h-12 flex items-center border-b border-border/30 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
      <SidebarTrigger className="ml-3 text-muted-foreground hover:text-foreground transition-colors" />
      <div className="flex-1 flex justify-center items-center gap-2">
        {logo ? (
          <img src={logo} alt="Logo" className="h-7 object-contain" />
        ) : (
          <img src={logoArenaX} alt="Arena X" className="h-7 object-contain" />
        )}
        <span className="font-heading text-xs font-bold tracking-[0.2em] uppercase text-foreground italic">
          Arena X
        </span>
      </div>
    </header>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/signup/:tournamentId" element={<TournamentSignup />} />
          <Route path="*" element={
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
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
