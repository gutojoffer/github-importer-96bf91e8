
-- Add liga_id column to all tables
ALTER TABLE public.players ADD COLUMN liga_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.tournaments ADD COLUMN liga_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.player_stats ADD COLUMN liga_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all access to players" ON public.players;
DROP POLICY IF EXISTS "Allow all access to tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Allow all access to player_stats" ON public.player_stats;

-- Players RLS
CREATE POLICY "Liga can view own players" ON public.players FOR SELECT USING (liga_id = auth.uid());
CREATE POLICY "Liga can insert own players" ON public.players FOR INSERT WITH CHECK (liga_id = auth.uid());
CREATE POLICY "Liga can update own players" ON public.players FOR UPDATE USING (liga_id = auth.uid());
CREATE POLICY "Liga can delete own players" ON public.players FOR DELETE USING (liga_id = auth.uid());

-- Tournaments RLS
CREATE POLICY "Liga can view own tournaments" ON public.tournaments FOR SELECT USING (liga_id = auth.uid());
CREATE POLICY "Liga can insert own tournaments" ON public.tournaments FOR INSERT WITH CHECK (liga_id = auth.uid());
CREATE POLICY "Liga can update own tournaments" ON public.tournaments FOR UPDATE USING (liga_id = auth.uid());
CREATE POLICY "Liga can delete own tournaments" ON public.tournaments FOR DELETE USING (liga_id = auth.uid());

-- Player Stats RLS
CREATE POLICY "Liga can view own stats" ON public.player_stats FOR SELECT USING (liga_id = auth.uid());
CREATE POLICY "Liga can insert own stats" ON public.player_stats FOR INSERT WITH CHECK (liga_id = auth.uid());
CREATE POLICY "Liga can update own stats" ON public.player_stats FOR UPDATE USING (liga_id = auth.uid());
CREATE POLICY "Liga can delete own stats" ON public.player_stats FOR DELETE USING (liga_id = auth.uid());
