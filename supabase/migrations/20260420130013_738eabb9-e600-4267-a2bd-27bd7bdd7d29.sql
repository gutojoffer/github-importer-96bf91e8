-- Adiciona cor personalizável do perfil (8 opções)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cor_perfil TEXT NOT NULL DEFAULT 'blue';

-- Validação dos valores permitidos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_cor_perfil_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_cor_perfil_check
      CHECK (cor_perfil IN ('blue','purple','pink','red','orange','green','teal','gold'));
  END IF;
END $$;

-- Estado (UF) para rankings regionais (entrega futura)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS estado TEXT;