-- Performance indexes for Arena X tables
-- Run these in the Supabase SQL Editor after deployment

CREATE INDEX IF NOT EXISTS idx_players_liga_id ON public.players(liga_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_liga_id ON public.tournaments(liga_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_player_stats_liga_id ON public.player_stats(liga_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON public.player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_week_key ON public.player_stats(week_key);
