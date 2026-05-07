-- Amizades
CREATE TABLE IF NOT EXISTS public.amizades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitante_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  destinatario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','aceita','recusada','bloqueada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(solicitante_id, destinatario_id)
);

-- Feed de atividades
CREATE TABLE IF NOT EXISTS public.feed_atividades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  dados JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Presença online
CREATE TABLE IF NOT EXISTS public.presenca_online (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  ultimo_visto TIMESTAMPTZ DEFAULT now(),
  online BOOLEAN DEFAULT false
);

ALTER TABLE public.amizades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presenca_online ENABLE ROW LEVEL SECURITY;

-- Amizades policies
CREATE POLICY "ver_proprias_amizades" ON public.amizades
  FOR SELECT USING (auth.uid() = solicitante_id OR auth.uid() = destinatario_id);

CREATE POLICY "criar_amizade" ON public.amizades
  FOR INSERT WITH CHECK (auth.uid() = solicitante_id);

CREATE POLICY "atualizar_amizade" ON public.amizades
  FOR UPDATE USING (auth.uid() = solicitante_id OR auth.uid() = destinatario_id);

CREATE POLICY "deletar_amizade" ON public.amizades
  FOR DELETE USING (auth.uid() = solicitante_id OR auth.uid() = destinatario_id);

-- Feed policies
CREATE POLICY "ver_feed_amigos" ON public.feed_atividades
  FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.amizades
      WHERE status = 'aceita'
      AND (
        (solicitante_id = auth.uid() AND destinatario_id = feed_atividades.user_id) OR
        (destinatario_id = auth.uid() AND solicitante_id = feed_atividades.user_id)
      )
    )
  );

CREATE POLICY "criar_feed" ON public.feed_atividades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Presença policies
CREATE POLICY "ver_presenca" ON public.presenca_online FOR SELECT USING (true);
CREATE POLICY "atualizar_presenca" ON public.presenca_online
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at em amizades
CREATE TRIGGER amizades_updated_at
  BEFORE UPDATE ON public.amizades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_amizades_solicitante ON public.amizades(solicitante_id, status);
CREATE INDEX IF NOT EXISTS idx_amizades_destinatario ON public.amizades(destinatario_id, status);
CREATE INDEX IF NOT EXISTS idx_feed_user ON public.feed_atividades(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presenca_online ON public.presenca_online(online, ultimo_visto);