import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import PlayerManager from "@/pages/PlayerManager";
import PlayerRegister from "@/pages/PlayerRegister";
import TournamentSetup from "@/pages/TournamentSetup";
import TournamentHistory from "@/pages/TournamentHistory";
import TournamentPodium from "@/pages/TournamentPodium";
import MatchArena from "@/pages/MatchArena";
import Leaderboard from "@/pages/Leaderboard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/invite/:code" element={<PlayerRegister />} />
          <Route path="*" element={
            <SidebarProvider>
              <div className="min-h-screen flex w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col min-w-0">
                  <header className="h-12 flex items-center border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
                    <SidebarTrigger className="ml-3 text-muted-foreground hover:text-foreground transition-colors" />
                    <div className="flex-1 flex justify-center">
                      <span className="font-heading text-sm font-bold tracking-[0.2em] uppercase text-foreground">
                        Blader Hub X
                      </span>
                      <span className="ml-2 font-heading text-xs text-muted-foreground tracking-wider hidden sm:inline">
                        — Tournament Management
                      </span>
                    </div>
                  </header>
                  <main className="flex-1 overflow-auto">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/players" element={<PlayerManager />} />
                      <Route path="/tournament" element={<TournamentSetup />} />
                      <Route path="/history" element={<TournamentHistory />} />
                      <Route path="/history/:id" element={<TournamentPodium />} />
                      <Route path="/arena" element={<MatchArena />} />
                      <Route path="/rankings" element={<Leaderboard />} />
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
