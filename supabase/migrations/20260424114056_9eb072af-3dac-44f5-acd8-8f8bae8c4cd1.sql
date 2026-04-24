DROP POLICY IF EXISTS "Authenticated can insert notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "autenticados_podem_criar_notificacoes" ON public.notificacoes;

CREATE POLICY "autenticados_podem_criar_notificacoes" ON public.notificacoes
  FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'authenticated' AND user_id IS NOT NULL);