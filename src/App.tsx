import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppHeader from "@/components/AppHeader";
import PlayerManager from "@/pages/PlayerManager";
import TournamentSetup from "@/pages/TournamentSetup";
import MatchArena from "@/pages/MatchArena";
import Leaderboard from "@/pages/Leaderboard";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <AppHeader />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/players" element={<PlayerManager />} />
            <Route path="/tournament" element={<TournamentSetup />} />
            <Route path="/arena" element={<MatchArena />} />
            <Route path="/rankings" element={<Leaderboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
