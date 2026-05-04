-- bey_combos: suporte a múltiplos decks
ALTER TABLE public.bey_combos ADD COLUMN IF NOT EXISTS nome TEXT NOT NULL DEFAULT 'Meu Deck';
ALTER TABLE public.bey_combos ADD COLUMN IF NOT EXISTS deck_uuid UUID;
-- updated_at já existe, mas garantimos default
ALTER TABLE public.bey_combos ALTER COLUMN updated_at SET DEFAULT now();

-- Backfill: agrupar combos existentes por user_id em um único deck
UPDATE public.bey_combos
SET deck_uuid = subq.new_uuid
FROM (
  SELECT user_id, gen_random_uuid() AS new_uuid
  FROM public.bey_combos
  WHERE deck_uuid IS NULL
  GROUP BY user_id
) subq
WHERE public.bey_combos.user_id = subq.user_id
  AND public.bey_combos.deck_uuid IS NULL;

ALTER TABLE public.bey_combos ALTER COLUMN deck_uuid SET NOT NULL;
ALTER TABLE public.bey_combos ALTER COLUMN deck_uuid SET DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_bey_combos_deck_uuid ON public.bey_combos(deck_uuid);
CREATE INDEX IF NOT EXISTS idx_bey_combos_user ON public.bey_combos(user_id);

-- Trigger updated_at em bey_combos
DROP TRIGGER IF EXISTS bey_combos_set_updated_at ON public.bey_combos;
CREATE TRIGGER bey_combos_set_updated_at
  BEFORE UPDATE ON public.bey_combos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- inscricoes: vincular deck e snapshot
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS deck_id UUID;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS deck_snapshot JSONB;

CREATE INDEX IF NOT EXISTS idx_inscricoes_deck_id ON public.inscricoes(deck_id);