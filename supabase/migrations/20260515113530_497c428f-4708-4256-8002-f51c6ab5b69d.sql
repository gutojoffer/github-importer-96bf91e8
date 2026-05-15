ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS modalidade TEXT NOT NULL DEFAULT 'individual';

ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_modalidade_check;
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_modalidade_check CHECK (modalidade IN ('individual','times'));