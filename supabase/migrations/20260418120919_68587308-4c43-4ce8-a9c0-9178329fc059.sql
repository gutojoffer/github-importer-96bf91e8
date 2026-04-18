ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS tem_perfil_blader BOOLEAN NOT NULL DEFAULT false;

-- Bladers existentes já têm o perfil ativo
UPDATE public.profiles SET tem_perfil_blader = true WHERE tipo_conta = 'blader';