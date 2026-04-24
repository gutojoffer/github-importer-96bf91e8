DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inscricoes_torneio_id_fkey'
  ) THEN
    ALTER TABLE public.inscricoes
      ADD CONSTRAINT inscricoes_torneio_id_fkey
      FOREIGN KEY (torneio_id)
      REFERENCES public.tournaments(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'inscricoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inscricoes;
  END IF;
END $$;