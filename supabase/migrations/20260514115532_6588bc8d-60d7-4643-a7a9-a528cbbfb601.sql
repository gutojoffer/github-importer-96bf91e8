-- Times
CREATE TABLE IF NOT EXISTS public.times (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  emoji TEXT DEFAULT '⚡',
  cor TEXT DEFAULT '#00DCFF',
  descricao TEXT,
  cidade TEXT,
  estado TEXT,
  liga_id UUID,
  capitao_id UUID NOT NULL,
  max_membros INTEGER DEFAULT 6,
  vitorias_total INTEGER DEFAULT 0,
  derrotas_total INTEGER DEFAULT 0,
  torneios_total INTEGER DEFAULT 0,
  trofeus INTEGER DEFAULT 0,
  xp_total INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.time_membros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  time_id UUID NOT NULL REFERENCES public.times(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'membro' CHECK (role IN ('capitao','vice','membro')),
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo','inativo','expulso','saiu')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  vitorias_pelo_time INTEGER DEFAULT 0,
  derrotas_pelo_time INTEGER DEFAULT 0,
  UNIQUE(time_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.time_convites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  time_id UUID NOT NULL REFERENCES public.times(id) ON DELETE CASCADE,
  convidado_id UUID NOT NULL,
  convidado_por UUID,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','aceito','recusado','expirado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  UNIQUE(time_id, convidado_id)
);

CREATE TABLE IF NOT EXISTS public.torneio_times (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  torneio_id UUID NOT NULL,
  time_id UUID NOT NULL REFERENCES public.times(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmado',
  posicao_final INTEGER,
  pontos_totais INTEGER DEFAULT 0,
  vitorias INTEGER DEFAULT 0,
  derrotas INTEGER DEFAULT 0,
  xp_ganho INTEGER DEFAULT 0,
  inscrito_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(torneio_id, time_id)
);

CREATE TABLE IF NOT EXISTS public.torneio_time_bladers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  torneio_id UUID NOT NULL,
  time_id UUID NOT NULL REFERENCES public.times(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  confirmado BOOLEAN DEFAULT false,
  posicao_na_ordem INTEGER,
  vitorias INTEGER DEFAULT 0,
  derrotas INTEGER DEFAULT 0,
  UNIQUE(torneio_id, time_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.confrontos_times (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  torneio_id UUID NOT NULL,
  rodada INTEGER NOT NULL,
  time_a_id UUID REFERENCES public.times(id),
  time_b_id UUID REFERENCES public.times(id),
  pontos_time_a INTEGER DEFAULT 0,
  pontos_time_b INTEGER DEFAULT 0,
  vencedor_id UUID REFERENCES public.times(id),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','finalizado')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.time_historico_elo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  time_id UUID NOT NULL REFERENCES public.times(id) ON DELETE CASCADE,
  torneio_id UUID,
  pontos_antes INTEGER,
  pontos_depois INTEGER,
  variacao INTEGER,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torneio_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torneio_time_bladers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confrontos_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_historico_elo ENABLE ROW LEVEL SECURITY;

-- times
CREATE POLICY "leitura_publica_times" ON public.times FOR SELECT USING (true);
CREATE POLICY "capitao_cria_time" ON public.times FOR INSERT WITH CHECK (auth.uid() = capitao_id);
CREATE POLICY "capitao_atualiza_time" ON public.times FOR UPDATE USING (auth.uid() = capitao_id);
CREATE POLICY "capitao_deleta_time" ON public.times FOR DELETE USING (auth.uid() = capitao_id);

-- time_membros
CREATE POLICY "leitura_publica_membros" ON public.time_membros FOR SELECT USING (true);
CREATE POLICY "capitao_gerencia_membros" ON public.time_membros FOR ALL
  USING (EXISTS (SELECT 1 FROM public.times t WHERE t.id = time_membros.time_id AND t.capitao_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.times t WHERE t.id = time_membros.time_id AND t.capitao_id = auth.uid()));
CREATE POLICY "membro_sai_do_time" ON public.time_membros FOR DELETE USING (auth.uid() = user_id);

-- time_convites
CREATE POLICY "ver_convites" ON public.time_convites FOR SELECT USING (
  auth.uid() = convidado_id OR
  EXISTS (SELECT 1 FROM public.times t WHERE t.id = time_convites.time_id AND t.capitao_id = auth.uid())
);
CREATE POLICY "capitao_cria_convite" ON public.time_convites FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.times t WHERE t.id = time_convites.time_id AND t.capitao_id = auth.uid())
);
CREATE POLICY "convidado_responde" ON public.time_convites FOR UPDATE USING (auth.uid() = convidado_id);
CREATE POLICY "capitao_deleta_convite" ON public.time_convites FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.times t WHERE t.id = time_convites.time_id AND t.capitao_id = auth.uid())
);

-- torneio_times
CREATE POLICY "leitura_publica_torneio_times" ON public.torneio_times FOR SELECT USING (true);
CREATE POLICY "capitao_inscreve_time" ON public.torneio_times FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.times t WHERE t.id = torneio_times.time_id AND t.capitao_id = auth.uid())
);
CREATE POLICY "capitao_atualiza_inscricao" ON public.torneio_times FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.times t WHERE t.id = torneio_times.time_id AND t.capitao_id = auth.uid())
);
CREATE POLICY "capitao_remove_inscricao" ON public.torneio_times FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.times t WHERE t.id = torneio_times.time_id AND t.capitao_id = auth.uid())
);

-- torneio_time_bladers
CREATE POLICY "leitura_publica_time_bladers" ON public.torneio_time_bladers FOR SELECT USING (true);
CREATE POLICY "capitao_gerencia_convocacao" ON public.torneio_time_bladers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.times t WHERE t.id = torneio_time_bladers.time_id AND t.capitao_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.times t WHERE t.id = torneio_time_bladers.time_id AND t.capitao_id = auth.uid()));
CREATE POLICY "blader_confirma_propria" ON public.torneio_time_bladers FOR UPDATE USING (auth.uid() = user_id);

-- confrontos_times
CREATE POLICY "leitura_publica_confrontos" ON public.confrontos_times FOR SELECT USING (true);

-- time_historico_elo
CREATE POLICY "leitura_publica_historico_elo_time" ON public.time_historico_elo FOR SELECT USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_time_membros_time ON public.time_membros(time_id);
CREATE INDEX IF NOT EXISTS idx_time_membros_user ON public.time_membros(user_id);
CREATE INDEX IF NOT EXISTS idx_time_convites_convidado ON public.time_convites(convidado_id, status);
CREATE INDEX IF NOT EXISTS idx_torneio_times_torneio ON public.torneio_times(torneio_id);
CREATE INDEX IF NOT EXISTS idx_confrontos_torneio ON public.confrontos_times(torneio_id, rodada);
CREATE INDEX IF NOT EXISTS idx_times_capitao ON public.times(capitao_id);

-- Trigger updated_at em times
CREATE TRIGGER trg_times_updated_at
  BEFORE UPDATE ON public.times
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Função de stats
CREATE OR REPLACE FUNCTION public.calcular_stats_time(p_time_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vitorias INTEGER;
  v_derrotas INTEGER;
  v_torneios INTEGER;
  v_trofeus INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE vencedor_id = p_time_id),
    COUNT(*) FILTER (WHERE vencedor_id IS NOT NULL AND vencedor_id <> p_time_id)
  INTO v_vitorias, v_derrotas
  FROM public.confrontos_times
  WHERE (time_a_id = p_time_id OR time_b_id = p_time_id)
    AND status = 'finalizado';

  SELECT COUNT(*) INTO v_torneios FROM public.torneio_times WHERE time_id = p_time_id;
  SELECT COUNT(*) INTO v_trofeus FROM public.torneio_times WHERE time_id = p_time_id AND posicao_final = 1;

  UPDATE public.times SET
    vitorias_total = v_vitorias,
    derrotas_total = v_derrotas,
    torneios_total = v_torneios,
    trofeus = v_trofeus,
    updated_at = now()
  WHERE id = p_time_id;
END;
$$;