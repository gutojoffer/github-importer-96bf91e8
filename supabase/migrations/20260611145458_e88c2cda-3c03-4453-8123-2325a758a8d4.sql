GRANT DELETE ON public.notificacoes TO authenticated;

DROP POLICY IF EXISTS "Users can delete own read notificacoes" ON public.notificacoes;

CREATE POLICY "Users can delete own read notificacoes"
  ON public.notificacoes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND lida = true);