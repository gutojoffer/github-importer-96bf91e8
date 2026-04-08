
-- 1. Enum e tabela de roles (separada por segurança)
CREATE TYPE public.app_role AS ENUM ('admin', 'organizer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'organizer',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função segura para checar role (evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Policies para user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 2. Tabela profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome_liga TEXT,
  logo_url TEXT,
  cidade TEXT,
  endereco TEXT,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Trigger: criar profile + role ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'organizer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. Tabela beyblades_meta
CREATE TABLE public.beyblades_meta (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  ratchet TEXT NOT NULL,
  bit TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('S', 'A', 'B', 'C')),
  tipo TEXT NOT NULL CHECK (tipo IN ('Attack', 'Defense', 'Stamina', 'Balance')),
  descricao TEXT,
  imagem_url TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  destaque BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.beyblades_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active beyblades" ON public.beyblades_meta
  FOR SELECT USING (ativo = true);

CREATE POLICY "Admins manage beyblades" ON public.beyblades_meta
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_beyblades_meta_tier ON public.beyblades_meta(tier);
CREATE INDEX idx_beyblades_meta_destaque ON public.beyblades_meta(destaque);

CREATE TRIGGER update_beyblades_meta_updated_at
  BEFORE UPDATE ON public.beyblades_meta
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. Tabela release_notes
CREATE TABLE public.release_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  versao TEXT NOT NULL,
  tag TEXT NOT NULL CHECK (tag IN ('novo', 'melhoria', 'fix', 'destaque')),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  publicado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.release_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published notes" ON public.release_notes
  FOR SELECT USING (publicado = true);

CREATE POLICY "Admins manage release notes" ON public.release_notes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 5. Bucket para imagens de beyblades
INSERT INTO storage.buckets (id, name, public) VALUES ('beyblades-meta', 'beyblades-meta', true);

CREATE POLICY "Public read beyblades images" ON storage.objects
  FOR SELECT USING (bucket_id = 'beyblades-meta');

CREATE POLICY "Admins upload beyblades images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'beyblades-meta'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins update beyblades images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'beyblades-meta'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins delete beyblades images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'beyblades-meta'
    AND public.has_role(auth.uid(), 'admin')
  );
