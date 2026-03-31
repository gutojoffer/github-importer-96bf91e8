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
import NotFound from "./pages/NotFound";
import { Trophy } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public signup route — standalone, no sidebar */}
          <Route path="/signup/:tournamentId" element={<TournamentSignup />} />

          {/* Main app shell */}
          <Route path="*" element={
            <SidebarProvider>
              <div className="min-h-screen flex w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col min-w-0">
                  <header className="h-12 flex items-center border-b border-border/30 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
                    <SidebarTrigger className="ml-3 text-muted-foreground hover:text-foreground transition-colors" />
                    <div className="flex-1 flex justify-center items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="font-heading text-xs font-bold tracking-[0.2em] uppercase text-foreground italic">
                        Blader Hub X
                      </span>
                    </div>
                  </header>
                  <main className="flex-1 overflow-auto">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/tournament" element={<TournamentHub />} />
                      <Route path="/players" element={<PlayerManager />} />
                      <Route path="/history" element={<TournamentHistory />} />
                      <Route path="/history/:id" element={<TournamentPodium />} />
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
