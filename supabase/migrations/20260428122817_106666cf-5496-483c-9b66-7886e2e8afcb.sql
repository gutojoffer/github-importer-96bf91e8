INSERT INTO public.bladers_temp (organizador_id, nome, apelido, avatar_url, created_at)
SELECT
  p.liga_id,
  p.name,
  NULLIF(p.nickname, ''),
  CASE
    WHEN p.avatar LIKE 'data:%' OR p.avatar LIKE 'http%' THEN p.avatar
    ELSE NULL
  END,
  p.created_at
FROM public.players p
WHERE p.liga_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.bladers_temp bt
    WHERE bt.organizador_id = p.liga_id
      AND lower(trim(bt.nome)) = lower(trim(p.name))
      AND COALESCE(lower(trim(bt.apelido)), '') = COALESCE(lower(trim(NULLIF(p.nickname, ''))), '')
  );

CREATE OR REPLACE FUNCTION public.sync_player_to_blader_temp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.liga_id IS NOT NULL THEN
      INSERT INTO public.bladers_temp (organizador_id, nome, apelido, avatar_url, created_at)
      VALUES (
        NEW.liga_id,
        NEW.name,
        NULLIF(NEW.nickname, ''),
        CASE
          WHEN NEW.avatar LIKE 'data:%' OR NEW.avatar LIKE 'http%' THEN NEW.avatar
          ELSE NULL
        END,
        NEW.created_at
      )
      ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    UPDATE public.bladers_temp bt
    SET
      nome = NEW.name,
      apelido = NULLIF(NEW.nickname, ''),
      avatar_url = CASE
        WHEN NEW.avatar LIKE 'data:%' OR NEW.avatar LIKE 'http%' THEN NEW.avatar
        ELSE bt.avatar_url
      END
    WHERE bt.organizador_id = OLD.liga_id
      AND lower(trim(bt.nome)) = lower(trim(OLD.name))
      AND COALESCE(lower(trim(bt.apelido)), '') = COALESCE(lower(trim(NULLIF(OLD.nickname, ''))), '')
      AND bt.vinculado_a IS NULL;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.bladers_temp bt
    WHERE bt.organizador_id = OLD.liga_id
      AND lower(trim(bt.nome)) = lower(trim(OLD.name))
      AND COALESCE(lower(trim(bt.apelido)), '') = COALESCE(lower(trim(NULLIF(OLD.nickname, ''))), '')
      AND bt.vinculado_a IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.inscricoes i WHERE i.blader_temp_id = bt.id
      );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_players_to_bladers_temp ON public.players;
CREATE TRIGGER sync_players_to_bladers_temp
AFTER INSERT OR UPDATE OR DELETE ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.sync_player_to_blader_temp();