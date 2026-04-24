DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inscricoes_blader_id_fkey'
  ) THEN
    ALTER TABLE public.inscricoes
      ADD CONSTRAINT inscricoes_blader_id_fkey
      FOREIGN KEY (blader_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;