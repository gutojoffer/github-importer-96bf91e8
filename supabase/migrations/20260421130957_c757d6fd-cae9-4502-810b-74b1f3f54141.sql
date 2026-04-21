ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nome_blader TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_blader_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cidade_blader TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS estado_blader TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio_blader TEXT;