-- Tabela de bladers temporários criados pelo organizador
CREATE TABLE IF NOT EXISTS public.bladers_temp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  apelido TEXT,
  email TEXT,
  telefone TEXT,
  cidade TEXT,
  beyblade_favorita TEXT,
  avatar_url TEXT,
  vinculado_a UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vinculado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bladers_temp_organizador ON public.bladers_temp(organizador_id);
CREATE INDEX IF NOT EXISTS idx_bladers_temp_email ON public.bladers_temp(LOWER(email)) WHERE email IS NOT NULL AND vinculado_a IS NULL;
CREATE INDEX IF NOT EXISTS idx_bladers_temp_vinculado ON public.bladers_temp(vinculado_a);

ALTER TABLE public.bladers_temp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizador_gerenciar_bladers_temp" ON public.bladers_temp
  FOR ALL
  TO authenticated
  USING (auth.uid() = organizador_id)
  WITH CHECK (auth.uid() = organizador_id);

CREATE POLICY "blader_ver_proprio_temp" ON public.bladers_temp
  FOR SELECT
  TO authenticated
  USING (auth.uid() = vinculado_a);

CREATE POLICY "autenticado_ver_temp_em_torneios"
  ON public.bladers_temp
  FOR SELECT
  TO authenticated
  USING (true);

-- Adicionar coluna blader_temp_id em inscricoes
ALTER TABLE public.inscricoes
  ADD COLUMN IF NOT EXISTS blader_temp_id UUID REFERENCES public.bladers_temp(id) ON DELETE CASCADE;

-- Tornar blader_id nullable (uma inscrição tem blader_id OU blader_temp_id)
ALTER TABLE public.inscricoes ALTER COLUMN blader_id DROP NOT NULL;

-- Garantir que pelo menos um dos dois esteja preenchido
ALTER TABLE public.inscricoes
  DROP CONSTRAINT IF EXISTS inscricoes_blader_xor;
ALTER TABLE public.inscricoes
  ADD CONSTRAINT inscricoes_blader_xor
  CHECK (
    (blader_id IS NOT NULL AND blader_temp_id IS NULL)
    OR (blader_id IS NULL AND blader_temp_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_inscricoes_blader_temp ON public.inscricoes(blader_temp_id);

-- Atualizar policies de INSERT em inscricoes para permitir organizador inserir blader_temp
DROP POLICY IF EXISTS "organizador_inserir_inscricao" ON public.inscricoes;
CREATE POLICY "organizador_inserir_inscricao" ON public.inscricoes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = inscricoes.torneio_id
        AND t.liga_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "deletar_inscricao" ON public.inscricoes;
CREATE POLICY "deletar_inscricao" ON public.inscricoes
  FOR DELETE
  TO authenticated
  USING (
    (blader_id IS NOT NULL AND auth.uid() = blader_id)
    OR EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = inscricoes.torneio_id
        AND t.liga_id = auth.uid()
    )
  );

-- Função para vincular blader_temp ao usuário recém-cadastrado
CREATE OR REPLACE FUNCTION public.link_bladers_temp(_user_id UUID, _temp_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _now TIMESTAMPTZ := now();
BEGIN
  IF _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  UPDATE public.bladers_temp
  SET vinculado_a = _user_id, vinculado_em = _now
  WHERE id = ANY(_temp_ids) AND vinculado_a IS NULL;

  -- Transferir inscrições: blader_temp_id -> blader_id
  -- Cuidado com a constraint XOR: precisamos zerar temp e setar blader_id atomicamente
  UPDATE public.inscricoes
  SET blader_id = _user_id, blader_temp_id = NULL
  WHERE blader_temp_id = ANY(_temp_ids);

  -- Recalcular stats do blader
  UPDATE public.profiles p
  SET
    torneios_total = COALESCE(stats.total, 0),
    vitorias_total = COALESCE(stats.vitorias, 0),
    xp_total = COALESCE(stats.xp, 0),
    melhor_posicao = stats.melhor,
    nivel = public.calcular_nivel_blader(COALESCE(stats.xp, 0))
  FROM (
    SELECT
      COUNT(*) FILTER (WHERE posicao_final IS NOT NULL) AS total,
      SUM(COALESCE(xp_ganho, 0)) AS xp,
      MIN(posicao_final) AS melhor,
      0 AS vitorias
    FROM public.inscricoes
    WHERE blader_id = _user_id
  ) stats
  WHERE p.id = _user_id;
END;
$$;