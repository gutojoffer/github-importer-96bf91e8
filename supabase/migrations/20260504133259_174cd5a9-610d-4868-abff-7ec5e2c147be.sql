-- =====================================================
-- ELO + TEMPORADAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.temporadas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  inicio TIMESTAMPTZ NOT NULL,
  fim TIMESTAMPTZ NOT NULL,
  ativa BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.elo_bladers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  temporada_id UUID REFERENCES public.temporadas(id) ON DELETE CASCADE,
  pontos INTEGER DEFAULT 0,
  elo TEXT DEFAULT 'Ferro',
  em_promocao BOOLEAN DEFAULT false,
  promocao_vitorias INTEGER DEFAULT 0,
  promocao_derrotas INTEGER DEFAULT 0,
  titulo_final TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, temporada_id)
);

CREATE TABLE IF NOT EXISTS public.historico_elo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  temporada_id UUID REFERENCES public.temporadas(id) ON DELETE CASCADE,
  pontos_antes INTEGER,
  pontos_depois INTEGER,
  variacao INTEGER,
  motivo TEXT,
  torneio_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TORRE X
-- =====================================================

CREATE TABLE IF NOT EXISTS public.torre_x_pontos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  pontos INTEGER DEFAULT 0,
  andar INTEGER DEFAULT 1,
  tier TEXT DEFAULT 'Iniciante',
  cidade TEXT,
  estado TEXT,
  rejeicoes_seguidas INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.torre_x_desafios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  desafiante_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  desafiado_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pendente',
  score_desafiante INTEGER DEFAULT 0,
  score_desafiado INTEGER DEFAULT 0,
  vencedor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmado_desafiante BOOLEAN DEFAULT false,
  confirmado_desafiado BOOLEAN DEFAULT false,
  cidade TEXT,
  pontos_em_jogo INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.torre_x_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  desafio_id UUID REFERENCES public.torre_x_desafios(id) ON DELETE CASCADE,
  pontos_antes INTEGER,
  pontos_depois INTEGER,
  andar_antes INTEGER,
  andar_depois INTEGER,
  variacao INTEGER,
  resultado TEXT,
  oponente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- CONQUISTAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.conquistas_definicoes (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  icone TEXT,
  meta INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conquistas_bladers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conquista_id INTEGER REFERENCES public.conquistas_definicoes(id) ON DELETE CASCADE,
  progresso INTEGER DEFAULT 0,
  concluida BOOLEAN DEFAULT false,
  concluida_em TIMESTAMPTZ,
  notificado BOOLEAN DEFAULT false,
  UNIQUE(user_id, conquista_id)
);

-- RLS
ALTER TABLE public.temporadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elo_bladers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_elo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torre_x_pontos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torre_x_desafios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torre_x_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conquistas_definicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conquistas_bladers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura_publica_temporadas" ON public.temporadas FOR SELECT USING (true);
CREATE POLICY "admin_manage_temporadas" ON public.temporadas FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "leitura_publica_elo" ON public.elo_bladers FOR SELECT USING (true);
CREATE POLICY "user_elo_insert" ON public.elo_bladers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_elo_update" ON public.elo_bladers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_elo_delete" ON public.elo_bladers FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_historico_elo_select" ON public.historico_elo FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_historico_elo_insert" ON public.historico_elo FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "leitura_publica_torre" ON public.torre_x_pontos FOR SELECT USING (true);
CREATE POLICY "user_torre_pontos_insert" ON public.torre_x_pontos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_torre_pontos_update" ON public.torre_x_pontos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_torre_pontos_delete" ON public.torre_x_pontos FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_desafios_select" ON public.torre_x_desafios FOR SELECT USING (auth.uid() = desafiante_id OR auth.uid() = desafiado_id);
CREATE POLICY "user_desafios_insert" ON public.torre_x_desafios FOR INSERT WITH CHECK (auth.uid() = desafiante_id);
CREATE POLICY "user_desafios_update" ON public.torre_x_desafios FOR UPDATE USING (auth.uid() = desafiante_id OR auth.uid() = desafiado_id);
CREATE POLICY "user_desafios_delete" ON public.torre_x_desafios FOR DELETE USING (auth.uid() = desafiante_id OR auth.uid() = desafiado_id);

CREATE POLICY "user_torre_historico_select" ON public.torre_x_historico FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_torre_historico_insert" ON public.torre_x_historico FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "leitura_publica_conquistas_def" ON public.conquistas_definicoes FOR SELECT USING (true);
CREATE POLICY "admin_manage_conquistas_def" ON public.conquistas_definicoes FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_conquistas_select" ON public.conquistas_bladers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_conquistas_insert" ON public.conquistas_bladers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_conquistas_update" ON public.conquistas_bladers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_conquistas_delete" ON public.conquistas_bladers FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER trg_elo_bladers_updated_at BEFORE UPDATE ON public.elo_bladers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_torre_x_pontos_updated_at BEFORE UPDATE ON public.torre_x_pontos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_torre_x_desafios_updated_at BEFORE UPDATE ON public.torre_x_desafios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_elo_bladers_temporada ON public.elo_bladers(temporada_id);
CREATE INDEX IF NOT EXISTS idx_elo_bladers_pontos ON public.elo_bladers(temporada_id, pontos DESC);
CREATE INDEX IF NOT EXISTS idx_historico_elo_user ON public.historico_elo(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_torre_x_pontos_andar ON public.torre_x_pontos(andar DESC, pontos DESC);
CREATE INDEX IF NOT EXISTS idx_torre_x_pontos_estado ON public.torre_x_pontos(estado, pontos DESC);
CREATE INDEX IF NOT EXISTS idx_torre_x_desafios_desafiante ON public.torre_x_desafios(desafiante_id, status);
CREATE INDEX IF NOT EXISTS idx_torre_x_desafios_desafiado ON public.torre_x_desafios(desafiado_id, status);
CREATE INDEX IF NOT EXISTS idx_torre_x_historico_user ON public.torre_x_historico(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conquistas_bladers_user ON public.conquistas_bladers(user_id);

-- =====================================================
-- SEED — Temporada inicial
-- =====================================================

INSERT INTO public.temporadas (nome, inicio, fim, ativa)
SELECT 'Temporada 1 — 2026', '2026-01-01'::timestamptz, '2026-06-30'::timestamptz, true
WHERE NOT EXISTS (SELECT 1 FROM public.temporadas);

-- =====================================================
-- SEED — Conquistas
-- =====================================================

INSERT INTO public.conquistas_definicoes (slug, nome, descricao, categoria, icone, meta) VALUES
('primeiro_passo',    'Primeiro Passo',    'Participar do 1º torneio',           'torneios',  '🎮', 1),
('veterano',          'Veterano',          'Participar de 10 torneios',          'torneios',  '⚔️', 10),
('campeao',           'Campeão',           'Vencer 1 torneio',                   'torneios',  '🏆', 1),
('tri_campeao',       'Tri Campeão',       'Vencer 3 torneios',                  'torneios',  '👑', 3),
('primeira_vitoria',  'Primeira Vitória',  'Vencer 1 batalha',                   'batalhas',  '⚡', 1),
('sniper',            'Sniper',            'Atingir 70% de winrate',             'batalhas',  '🎯', 70),
('burst_master',      'Burst Master',      'Causar 10 bursts',                   'batalhas',  '💥', 10),
('algoz',             'Algoz',             'Derrotar alguém do Top 3',           'batalhas',  '🗡️', 1),
('em_chamas',         'Em Chamas',         'Streak de 3 vitórias seguidas',      'streaks',   '🔥', 3),
('imparavel',         'Imparável',         'Streak de 5 vitórias seguidas',      'streaks',   '💢', 5),
('lendario_streak',   'Lendário',          'Streak de 10 vitórias seguidas',     'streaks',   '🌟', 10),
('rivalidade',        'Rivalidade',        'Enfrentar o mesmo blader 5x',        'sociais',   '🤝', 5),
('viajante',          'Viajante',          'Participar de torneios em 2 estados','sociais',   '🗺️', 2),
('local_legend',      'Local Legend',      'Chegar ao Top 3 do estado',          'sociais',   '📍', 1),
('nacional',          'Nacional',          'Chegar ao Top 10 do Brasil',         'sociais',   '🌍', 1),
('forjador',          'Forjador',          'Criar 1 deck na ForjaBey',           'decks',     '⚙️', 1),
('mestre_forjador',   'Mestre Forjador',   'Criar 3 decks diferentes',           'decks',     '🔩', 3),
('escalador',         'Escalador',         'Chegar ao andar 20 da Torre X',      'especiais', '🏗️', 20),
('conquistador_x',    'Conquistador X',    'Chegar ao andar 50 da Torre X',      'especiais', '🗼', 50),
('elite_x',           'Elite X',           'Chegar ao andar 80 da Torre X',      'especiais', '⚜️', 80),
('topo_x',            'Topo da Torre',     'Chegar ao andar 100 da Torre X',     'especiais', '🔱', 100)
ON CONFLICT (slug) DO NOTHING;

-- Inicializar Torre X para todos os bladers existentes
INSERT INTO public.torre_x_pontos (user_id, pontos, andar, tier, cidade, estado)
SELECT p.id, 0, 1, 'Iniciante', p.cidade_blader, p.estado_blader
FROM public.profiles p
WHERE p.tem_perfil_blader = true
ON CONFLICT (user_id) DO NOTHING;

-- Inicializar ELO para todos os bladers na temporada ativa
INSERT INTO public.elo_bladers (user_id, temporada_id, pontos, elo)
SELECT p.id, t.id, 0, 'Ferro'
FROM public.profiles p
CROSS JOIN public.temporadas t
WHERE p.tem_perfil_blader = true AND t.ativa = true
ON CONFLICT (user_id, temporada_id) DO NOTHING;