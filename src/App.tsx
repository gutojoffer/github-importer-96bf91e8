import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import PlayerManager from "@/pages/PlayerManager";
import TournamentSetup from "@/pages/TournamentSetup";
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
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <header className="h-12 flex items-center border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <SidebarTrigger className="ml-3 text-muted-foreground hover:text-foreground" />
                <span className="ml-3 font-heading text-sm text-muted-foreground tracking-widest uppercase">
                  Blader Hub X
                </span>
              </header>
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/players" element={<PlayerManager />} />
                  <Route path="/tournament" element={<TournamentSetup />} />
                  <Route path="/arena" element={<MatchArena />} />
                  <Route path="/rankings" element={<Leaderboard />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
