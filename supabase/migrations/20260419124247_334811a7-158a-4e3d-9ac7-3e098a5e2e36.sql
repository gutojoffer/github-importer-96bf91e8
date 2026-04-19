ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tem_perfil_organizador BOOLEAN NOT NULL DEFAULT false;

-- Marcar usuários existentes que já são organizadores
UPDATE public.profiles 
SET tem_perfil_organizador = true 
WHERE tipo_conta = 'organizador' OR nome_liga IS NOT NULL;