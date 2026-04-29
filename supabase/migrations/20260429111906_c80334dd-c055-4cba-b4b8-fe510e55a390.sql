ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS match_verificado boolean NOT NULL DEFAULT false;

UPDATE public.bladers_temp
SET email = lower(trim(email))
WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bladers_temp_email
ON public.bladers_temp(email)
WHERE email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.match_bladers_temp_by_email(_user_id uuid, _email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text := lower(trim(coalesce(_email, '')));
  v_matched_count integer := 0;
  v_torneios_total integer := 0;
  v_xp_total integer := 0;
  v_melhor_posicao integer;
  v_torneios_vencidos integer := 0;
BEGIN
  IF _user_id IS NULL OR _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  IF v_email = '' THEN
    UPDATE public.profiles
    SET match_verificado = true
    WHERE id = _user_id;
    RETURN 0;
  END IF;

  UPDATE public.bladers_temp
  SET
    vinculado_a = _user_id,
    vinculado_em = now()
  WHERE lower(trim(email)) = v_email
    AND vinculado_a IS NULL;

  GET DIAGNOSTICS v_matched_count = ROW_COUNT;

  UPDATE public.inscricoes i
  SET
    blader_id = _user_id,
    blader_temp_id = NULL
  FROM public.bladers_temp bt
  WHERE i.blader_temp_id = bt.id
    AND bt.vinculado_a = _user_id
    AND lower(trim(bt.email)) = v_email;

  SELECT
    COUNT(*) FILTER (WHERE posicao_final IS NOT NULL),
    COALESCE(SUM(COALESCE(xp_ganho, 0)) FILTER (WHERE posicao_final IS NOT NULL), 0),
    MIN(posicao_final) FILTER (WHERE posicao_final IS NOT NULL),
    COUNT(*) FILTER (WHERE posicao_final = 1)
  INTO v_torneios_total, v_xp_total, v_melhor_posicao, v_torneios_vencidos
  FROM public.inscricoes
  WHERE blader_id = _user_id;

  UPDATE public.profiles
  SET
    torneios_total = v_torneios_total,
    vitorias_total = v_torneios_vencidos,
    xp_total = v_xp_total,
    melhor_posicao = v_melhor_posicao,
    nivel = public.calcular_nivel_blader(v_xp_total),
    match_verificado = true
  WHERE id = _user_id;

  RETURN v_matched_count;
END;
$$;

REVOKE ALL ON FUNCTION public.match_bladers_temp_by_email(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_bladers_temp_by_email(uuid, text) TO authenticated;