
CREATE INDEX IF NOT EXISTS idx_players_liga_created ON public.players (liga_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bladers_temp_org_nome ON public.bladers_temp (organizador_id, nome);
CREATE INDEX IF NOT EXISTS idx_bladers_temp_org_created ON public.bladers_temp (organizador_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tournaments_liga_created ON public.tournaments (liga_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tournaments_liga_status_created ON public.tournaments (liga_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tournaments_date_desc ON public.tournaments (date DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_liga_week ON public.player_stats (liga_id, week_key);
CREATE INDEX IF NOT EXISTS idx_player_stats_liga_month ON public.player_stats (liga_id, month_key);
CREATE INDEX IF NOT EXISTS idx_notif_user_lida_tipo ON public.notificacoes (user_id, lida, tipo);
CREATE INDEX IF NOT EXISTS idx_feed_user_created ON public.feed_atividades (user_id, created_at DESC);
ANALYZE public.players;
ANALYZE public.bladers_temp;
ANALYZE public.tournaments;
ANALYZE public.player_stats;
ANALYZE public.notificacoes;
