-- 1. Novas colunas em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tipo_conta TEXT NOT NULL DEFAULT 'organizador'
    CHECK (tipo_conta IN ('organizador', 'blader')),
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS beyblade_favorita TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Atualizar handle_new_user para considerar tipo_conta vindo do signUp metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tipo TEXT;
  v_nome_liga TEXT;
  v_descricao TEXT;
  v_cidade TEXT;
  v_endereco TEXT;
BEGIN
  v_tipo := COALESCE(NEW.raw_user_meta_data->>'tipo_conta', 'organizador');
  v_nome_liga := NEW.raw_user_meta_data->>'nome_liga';
  v_descricao := NEW.raw_user_meta_data->>'descricao';
  v_cidade := NEW.raw_user_meta_data->>'cidade';
  v_endereco := NEW.raw_user_meta_data->>'endereco';

  INSERT INTO public.profiles (id, tipo_conta, nome_liga, descricao, cidade, endereco)
  VALUES (NEW.id, v_tipo, v_nome_liga, v_descricao, v_cidade, v_endereco);

  -- Apenas organizadores recebem o role automaticamente
  IF v_tipo = 'organizador' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'organizer');
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Permitir que qualquer usuário autenticado veja qualquer perfil
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
CREATE POLICY "Authenticated can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
