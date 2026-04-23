
-- 1. New columns on tournaments
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS local_nome TEXT,
  ADD COLUMN IF NOT EXISTS local_endereco TEXT,
  ADD COLUMN IF NOT EXISTS local_cidade TEXT,
  ADD COLUMN IF NOT EXISTS local_estado TEXT,
  ADD COLUMN IF NOT EXISTS horario_inicio TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS horario_fim TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS imagem_url TEXT,
  ADD COLUMN IF NOT EXISTS premio TEXT,
  ADD COLUMN IF NOT EXISTS regras TEXT;

-- 2. New columns on profiles for blader stats
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vitorias_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS torneios_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS melhor_posicao INTEGER,
  ADD COLUMN IF NOT EXISTS xp_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nivel TEXT NOT NULL DEFAULT 'Rookie';

-- 3. Inscricoes table
CREATE TABLE IF NOT EXISTS public.inscricoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  torneio_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  blader_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmado',
  posicao_final INTEGER,
  xp_ganho INTEGER NOT NULL DEFAULT 0,
  inscrito_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_inscricoes_torneio_blader ON public.inscricoes(torneio_id, blader_id);

-- Bladers can view their own enrollments
CREATE POLICY "Bladers can view own inscricoes"
  ON public.inscricoes FOR SELECT
  TO authenticated
  USING (auth.uid() = blader_id);

-- Bladers can insert their own enrollment
CREATE POLICY "Bladers can insert own inscricoes"
  ON public.inscricoes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blader_id);

-- Organizer of the tournament can view all enrollments
CREATE POLICY "Liga can view inscricoes of own tournaments"
  ON public.inscricoes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = torneio_id AND t.liga_id = auth.uid()
    )
  );

-- Organizer can manage enrollments (update/delete)
CREATE POLICY "Liga can update inscricoes of own tournaments"
  ON public.inscricoes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = torneio_id AND t.liga_id = auth.uid()
    )
  );

CREATE POLICY "Liga can delete inscricoes of own tournaments"
  ON public.inscricoes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = torneio_id AND t.liga_id = auth.uid()
    )
  );

-- Organizer can insert enrollments on behalf of bladers
CREATE POLICY "Liga can insert inscricoes for own tournaments"
  ON public.inscricoes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = torneio_id AND t.liga_id = auth.uid()
    )
  );

-- 4. Notificacoes table
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notificacoes_user ON public.notificacoes(user_id, created_at DESC);

-- Users can view own notifications
CREATE POLICY "Users can view own notificacoes"
  ON public.notificacoes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notificacoes"
  ON public.notificacoes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert notifications
CREATE POLICY "Authenticated can insert notificacoes"
  ON public.notificacoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Storage bucket for tournament images
INSERT INTO storage.buckets (id, name, public)
VALUES ('torneios', 'torneios', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read torneios images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'torneios');

CREATE POLICY "Authenticated upload torneios images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'torneios');

CREATE POLICY "Owner update torneios images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'torneios' AND auth.uid()::text = (storage.foldername(name))[1]);
