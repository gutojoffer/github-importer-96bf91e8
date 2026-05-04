
CREATE OR REPLACE FUNCTION public.apply_tournament_results(_torneio_id uuid, _standings jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  item jsonb;
  v_player_id uuid;
  v_real_blader_id uuid;
  v_posicao integer;
  v_vitorias integer;
  v_derrotas integer;
  v_xp integer;
  v_torneio_nome text;
  v_rows integer;
BEGIN
  SELECT name INTO v_torneio_nome
  FROM public.tournaments
  WHERE id = _torneio_id AND liga_id = auth.uid();

  IF v_torneio_nome IS NULL THEN
    RAISE EXCEPTION 'Torneio nao encontrado ou sem permissao';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(_standings)
  LOOP
    v_player_id := (item->>'playerId')::uuid;
    v_posicao := COALESCE((item->>'placement')::integer, 999);
    v_vitorias := COALESCE((item->>'wins')::integer, 0);
    v_derrotas := COALESCE((item->>'losses')::integer, 0);
    v_xp := CASE
      WHEN v_posicao = 1 THEN 100
      WHEN v_posicao = 2 THEN 60
      WHEN v_posicao = 3 THEN 30
      ELSE 10
    END + (v_vitorias * 15);

    v_real_blader_id := NULL;

    UPDATE public.inscricoes
    SET posicao_final = v_posicao,
        xp_ganho = v_xp,
        vitorias = v_vitorias,
        derrotas = v_derrotas
    WHERE torneio_id = _torneio_id AND blader_id = v_player_id;

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows > 0 THEN
      v_real_blader_id := v_player_id;
    ELSE
      UPDATE public.inscricoes
      SET posicao_final = v_posicao,
          xp_ganho = v_xp,
          vitorias = v_vitorias,
          derrotas = v_derrotas
      WHERE torneio_id = _torneio_id AND blader_temp_id = v_player_id;

      SELECT vinculado_a INTO v_real_blader_id
      FROM public.bladers_temp
      WHERE id = v_player_id;
    END IF;

    IF v_real_blader_id IS NOT NULL THEN
      UPDATE public.profiles
      SET xp_total = COALESCE(xp_total, 0) + v_xp,
          vitorias_total = COALESCE(vitorias_total, 0) + v_vitorias,
          torneios_total = COALESCE(torneios_total, 0) + 1,
          melhor_posicao = LEAST(COALESCE(melhor_posicao, 999), v_posicao),
          nivel = public.calcular_nivel_blader(COALESCE(xp_total, 0) + v_xp)
      WHERE id = v_real_blader_id;

      INSERT INTO public.notificacoes (user_id, tipo, mensagem)
      VALUES (
        v_real_blader_id,
        'resultado_torneio',
        'Torneio encerrado! Voce ficou em ' || v_posicao || 'o lugar e ganhou +' || v_xp || ' XP.'
      );
    END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.match_bladers_temp_by_email(_user_id uuid, _email text)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text := lower(trim(coalesce(_email, '')));
  v_matched_count integer := 0;
  v_torneios_total integer := 0;
  v_xp_total integer := 0;
  v_melhor_posicao integer;
  v_vitorias_partidas integer := 0;
BEGIN
  IF _user_id IS NULL OR _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Nao autorizado';
  END IF;

  IF v_email = '' THEN
    UPDATE public.profiles SET match_verificado = true WHERE id = _user_id;
    RETURN 0;
  END IF;

  UPDATE public.bladers_temp
  SET vinculado_a = _user_id, vinculado_em = now()
  WHERE lower(trim(email)) = v_email AND vinculado_a IS NULL;

  GET DIAGNOSTICS v_matched_count = ROW_COUNT;

  UPDATE public.inscricoes i
  SET blader_id = _user_id, blader_temp_id = NULL
  FROM public.bladers_temp bt
  WHERE i.blader_temp_id = bt.id
    AND bt.vinculado_a = _user_id
    AND lower(trim(bt.email)) = v_email;

  SELECT
    COUNT(*) FILTER (WHERE posicao_final IS NOT NULL),
    COALESCE(SUM(COALESCE(xp_ganho, 0)) FILTER (WHERE posicao_final IS NOT NULL), 0),
    MIN(posicao_final) FILTER (WHERE posicao_final IS NOT NULL),
    COALESCE(SUM(COALESCE(vitorias, 0)), 0)
  INTO v_torneios_total, v_xp_total, v_melhor_posicao, v_vitorias_partidas
  FROM public.inscricoes
  WHERE blader_id = _user_id;

  UPDATE public.profiles
  SET torneios_total = v_torneios_total,
      vitorias_total = v_vitorias_partidas,
      xp_total = v_xp_total,
      melhor_posicao = v_melhor_posicao,
      nivel = public.calcular_nivel_blader(v_xp_total),
      match_verificado = true
  WHERE id = _user_id;

  RETURN v_matched_count;
END;
$function$;
