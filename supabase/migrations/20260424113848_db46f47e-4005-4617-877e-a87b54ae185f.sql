ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp_total INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vitorias_total INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS torneios_total INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS melhor_posicao INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nivel TEXT DEFAULT 'Rookie';

ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS posicao_final INTEGER;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS xp_ganho INTEGER DEFAULT 0;

DROP POLICY IF EXISTS "organizador_ver_inscricoes" ON public.inscricoes;
DROP POLICY IF EXISTS "blader_ver_proprias_inscricoes" ON public.inscricoes;
DROP POLICY IF EXISTS "blader_pode_se_inscrever" ON public.inscricoes;
DROP POLICY IF EXISTS "Users can view inscricoes" ON public.inscricoes;
DROP POLICY IF EXISTS "Bladers can view own inscricoes" ON public.inscricoes;
DROP POLICY IF EXISTS "Liga can view inscricoes of own tournaments" ON public.inscricoes;
DROP POLICY IF EXISTS "Bladers can insert own inscricoes" ON public.inscricoes;
DROP POLICY IF EXISTS "Liga can insert inscricoes for own tournaments" ON public.inscricoes;
DROP POLICY IF EXISTS "Liga can delete inscricoes of own tournaments" ON public.inscricoes;

CREATE POLICY "autenticado_ver_inscricoes" ON public.inscricoes
  FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "blader_inserir_inscricao" ON public.inscricoes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blader_id);

CREATE POLICY "organizador_inserir_inscricao" ON public.inscricoes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = inscricoes.torneio_id
      AND t.liga_id = auth.uid()
    )
  );

CREATE POLICY "deletar_inscricao" ON public.inscricoes
  FOR DELETE TO authenticated
  USING (
    auth.uid() = blader_id
    OR EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = inscricoes.torneio_id
      AND t.liga_id = auth.uid()
    )
  );