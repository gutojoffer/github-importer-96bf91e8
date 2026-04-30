-- Catálogo de peças
CREATE TABLE IF NOT EXISTS public.bey_blades (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  linha TEXT NOT NULL CHECK (linha IN ('BX','UX','CX')),
  tipo_ataque TEXT CHECK (tipo_ataque IN ('Attack','Defense','Stamina','Balance')),
  spin TEXT DEFAULT 'Right',
  peso_g DECIMAL(4,1),
  imagem_url TEXT,
  atk INTEGER DEFAULT 0,
  def INTEGER DEFAULT 0,
  endr INTEGER DEFAULT 0,
  xdash INTEGER DEFAULT 0,
  br INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bey_ratchets (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  lados INTEGER,
  altura INTEGER,
  linha TEXT DEFAULT 'BX',
  imagem_url TEXT,
  atk INTEGER DEFAULT 0,
  def INTEGER DEFAULT 0,
  endr INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bey_bits (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  abreviacao TEXT,
  tipo TEXT CHECK (tipo IN ('Attack','Defense','Stamina','Balance')),
  dash_performance TEXT,
  burst_resist TEXT CHECK (burst_resist IN ('Low','Medium','High')),
  linha TEXT DEFAULT 'BX',
  imagem_url TEXT,
  atk INTEGER DEFAULT 0,
  def INTEGER DEFAULT 0,
  endr INTEGER DEFAULT 0,
  xdash INTEGER DEFAULT 0,
  br INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bey_lock_chips (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  imagem_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bey_main_blades (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo_ataque TEXT,
  imagem_url TEXT,
  atk INTEGER DEFAULT 0,
  def INTEGER DEFAULT 0,
  endr INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bey_assist_blades (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  imagem_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Combos salvos
CREATE TABLE IF NOT EXISTS public.bey_combos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL CHECK (slot IN (1,2,3)),
  linha TEXT NOT NULL,
  blade_id INTEGER REFERENCES public.bey_blades(id),
  ratchet_id INTEGER REFERENCES public.bey_ratchets(id),
  bit_id INTEGER REFERENCES public.bey_bits(id),
  lock_chip_id INTEGER REFERENCES public.bey_lock_chips(id),
  main_blade_id INTEGER REFERENCES public.bey_main_blades(id),
  assist_blade_id INTEGER REFERENCES public.bey_assist_blades(id),
  atk_total INTEGER DEFAULT 0,
  def_total INTEGER DEFAULT 0,
  endr_total INTEGER DEFAULT 0,
  xdash_total INTEGER DEFAULT 0,
  br_total INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, slot)
);

-- RLS
ALTER TABLE public.bey_blades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bey_ratchets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bey_bits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bey_lock_chips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bey_main_blades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bey_assist_blades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bey_combos ENABLE ROW LEVEL SECURITY;

-- Leitura pública dos catálogos
CREATE POLICY "leitura_publica_blades" ON public.bey_blades FOR SELECT USING (true);
CREATE POLICY "leitura_publica_ratchets" ON public.bey_ratchets FOR SELECT USING (true);
CREATE POLICY "leitura_publica_bits" ON public.bey_bits FOR SELECT USING (true);
CREATE POLICY "leitura_publica_lock_chips" ON public.bey_lock_chips FOR SELECT USING (true);
CREATE POLICY "leitura_publica_main_blades" ON public.bey_main_blades FOR SELECT USING (true);
CREATE POLICY "leitura_publica_assist_blades" ON public.bey_assist_blades FOR SELECT USING (true);

-- Admins gerenciam catálogos (usa user_roles via has_role)
CREATE POLICY "admin_manage_blades" ON public.bey_blades FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_manage_ratchets" ON public.bey_ratchets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_manage_bits" ON public.bey_bits FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_manage_lock_chips" ON public.bey_lock_chips FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_manage_main_blades" ON public.bey_main_blades FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_manage_assist_blades" ON public.bey_assist_blades FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Combos do próprio usuário
CREATE POLICY "user_select_combos" ON public.bey_combos FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "user_insert_combos" ON public.bey_combos FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_combos" ON public.bey_combos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_delete_combos" ON public.bey_combos FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_bey_combos_updated_at
BEFORE UPDATE ON public.bey_combos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();