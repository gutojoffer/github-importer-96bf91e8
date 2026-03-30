CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  nickname text NOT NULL DEFAULT '',
  avatar text NOT NULL DEFAULT '🔵',
  xp integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to players" ON public.players
  FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date text NOT NULL,
  signup_deadline text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  arena_count integer NOT NULL DEFAULT 1,
  points_to_win integer NOT NULL DEFAULT 4,
  total_rounds integer NOT NULL DEFAULT 3,
  current_round integer NOT NULL DEFAULT 0,
  max_players integer,
  player_ids uuid[] NOT NULL DEFAULT '{}',
  rounds jsonb NOT NULL DEFAULT '[]',
  final_standings jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to tournaments" ON public.tournaments
  FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  finish_wins integer NOT NULL DEFAULT 0,
  extreme_finish_wins integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  week_key text NOT NULL,
  month_key text NOT NULL
);

ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to player_stats" ON public.player_stats
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_player_stats_week ON public.player_stats(week_key);
CREATE INDEX idx_player_stats_month ON public.player_stats(month_key);
CREATE INDEX idx_player_stats_player ON public.player_stats(player_id);