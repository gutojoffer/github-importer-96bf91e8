CREATE OR REPLACE FUNCTION public.recompute_elo_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_temporada_id uuid;
BEGIN
  SELECT id INTO v_temporada_id
  FROM public.temporadas
  WHERE ativa = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_temporada_id IS NULL THEN
    INSERT INTO public.temporadas (nome, inicio, fim, ativa)
    VALUES ('Temporada 1 — 2026', '2026-01-01', '2026-06-30', true)
    RETURNING id INTO v_temporada_id;
  END IF;

  WITH ranking AS (
    SELECT
      COALESCE(i.blader_id, bt.vinculado_a) AS user_id,
      SUM(COALESCE((s.item->>'rankingPoints')::integer,
        CASE
          WHEN COALESCE(i.posicao_final, (s.item->>'placement')::integer) = 1 THEN 100
          WHEN COALESCE(i.posicao_final, (s.item->>'placement')::integer) = 2 THEN 70
          WHEN COALESCE(i.posicao_final, (s.item->>'placement')::integer) = 3 THEN 50
          WHEN COALESCE(i.posicao_final, (s.item->>'placement')::integer) = 4 THEN 35
          WHEN COALESCE(i.posicao_final, (s.item->>'placement')::integer) <= 8 THEN 20
          WHEN COALESCE(i.posicao_final, (s.item->>'placement')::integer) <= 16 THEN 10
          ELSE 5
        END
      ))::integer AS pontos
    FROM public.tournaments t
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(t.final_standings, '[]'::jsonb)) AS s(item)
    LEFT JOIN public.inscricoes i
      ON i.torneio_id = t.id
     AND (
       i.blader_id = NULLIF(s.item->>'playerId', '')::uuid
       OR i.blader_temp_id = NULLIF(s.item->>'playerId', '')::uuid
     )
    LEFT JOIN public.bladers_temp bt ON bt.id = i.blader_temp_id
    WHERE t.status = 'completed'
      AND COALESCE((s.item->>'dropped')::boolean, false) = false
      AND COALESCE(i.blader_id, bt.vinculado_a) IS NOT NULL
    GROUP BY COALESCE(i.blader_id, bt.vinculado_a)
  )
  INSERT INTO public.elo_bladers (user_id, temporada_id, pontos, elo, updated_at)
  SELECT user_id, v_temporada_id, pontos, public.calcular_tier_elo(pontos), now()
  FROM ranking
  ON CONFLICT (user_id, temporada_id)
  DO UPDATE SET
    pontos = EXCLUDED.pontos,
    elo = public.calcular_tier_elo(EXCLUDED.pontos),
    updated_at = now();

  UPDATE public.elo_bladers e
  SET pontos = 0,
      elo = public.calcular_tier_elo(0),
      updated_at = now()
  WHERE e.temporada_id = v_temporada_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.tournaments t
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(t.final_standings, '[]'::jsonb)) AS s(item)
      LEFT JOIN public.inscricoes i
        ON i.torneio_id = t.id
       AND (
         i.blader_id = NULLIF(s.item->>'playerId', '')::uuid
         OR i.blader_temp_id = NULLIF(s.item->>'playerId', '')::uuid
       )
      LEFT JOIN public.bladers_temp bt ON bt.id = i.blader_temp_id
      WHERE t.status = 'completed'
        AND COALESCE(i.blader_id, bt.vinculado_a) = e.user_id
        AND COALESCE((s.item->>'dropped')::boolean, false) = false
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_tournament_results(_torneio_id uuid, _standings jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
  v_player_id uuid;
  v_real_blader_id uuid;
  v_posicao integer;
  v_vitorias integer;
  v_derrotas integer;
  v_xp integer;
  v_ranking_pts integer;
  v_streak integer;
  v_torneio_nome text;
  v_liga_id uuid;
  v_rows integer;
  v_temporada_id uuid;
  v_touched_users uuid[] := '{}';
BEGIN
  SELECT name, liga_id INTO v_torneio_nome, v_liga_id
  FROM public.tournaments
  WHERE id = _torneio_id;

  IF v_torneio_nome IS NULL THEN
    RAISE EXCEPTION 'Torneio nao encontrado';
  END IF;

  IF auth.uid() IS NULL THEN
    IF session_user <> 'postgres' THEN
      RAISE EXCEPTION 'Nao autorizado';
    END IF;
  ELSIF v_liga_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Torneio nao encontrado ou sem permissao';
  END IF;

  SELECT id INTO v_temporada_id FROM public.temporadas WHERE ativa = true ORDER BY created_at DESC LIMIT 1;

  UPDATE public.tournaments
  SET status = 'completed',
      final_standings = _standings
  WHERE id = _torneio_id;

  FOR item IN SELECT * FROM jsonb_array_elements(COALESCE(_standings, '[]'::jsonb))
  LOOP
    v_player_id := (item->>'playerId')::uuid;
    v_posicao := COALESCE((item->>'placement')::integer, 999);
    v_vitorias := COALESCE((item->>'wins')::integer, 0);
    v_derrotas := COALESCE((item->>'losses')::integer, 0);
    v_streak := COALESCE((item->>'streakMax')::integer, v_vitorias);
    v_xp := COALESCE((item->>'xpAwarded')::integer,
      CASE WHEN v_posicao=1 THEN 100 WHEN v_posicao=2 THEN 60 WHEN v_posicao=3 THEN 30 ELSE 10 END + (v_vitorias * 15)
    );
    v_ranking_pts := COALESCE((item->>'rankingPoints')::integer,
      CASE WHEN v_posicao=1 THEN 100 WHEN v_posicao=2 THEN 70 WHEN v_posicao=3 THEN 50
           WHEN v_posicao=4 THEN 35 WHEN v_posicao<=8 THEN 20 WHEN v_posicao<=16 THEN 10 ELSE 5 END);

    v_real_blader_id := NULL;

    UPDATE public.inscricoes
    SET posicao_final=v_posicao, xp_ganho=v_xp, vitorias=v_vitorias, derrotas=v_derrotas,
        streak_max=GREATEST(COALESCE(streak_max,0), v_streak)
    WHERE torneio_id=_torneio_id AND blader_id=v_player_id;
    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows > 0 THEN
      v_real_blader_id := v_player_id;
    ELSE
      UPDATE public.inscricoes
      SET posicao_final=v_posicao, xp_ganho=v_xp, vitorias=v_vitorias, derrotas=v_derrotas,
          streak_max=GREATEST(COALESCE(streak_max,0), v_streak)
      WHERE torneio_id=_torneio_id AND blader_temp_id=v_player_id;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      IF v_rows > 0 THEN
        SELECT vinculado_a INTO v_real_blader_id FROM public.bladers_temp WHERE id = v_player_id;
      END IF;
    END IF;

    IF v_real_blader_id IS NOT NULL THEN
      v_touched_users := array_append(v_touched_users, v_real_blader_id);

      INSERT INTO public.historico_elo (user_id, temporada_id, pontos_antes, pontos_depois, variacao, motivo, torneio_id)
      SELECT v_real_blader_id, v_temporada_id, 0, v_ranking_pts, v_ranking_pts,
             'Torneio: ' || v_torneio_nome || ' (' || v_posicao || 'º)', _torneio_id
      WHERE v_temporada_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.historico_elo h
          WHERE h.user_id = v_real_blader_id
            AND h.torneio_id = _torneio_id
            AND h.motivo LIKE 'Torneio:%'
        );

      INSERT INTO public.notificacoes (user_id, tipo, mensagem)
      SELECT v_real_blader_id, 'resultado_torneio',
             'Torneio encerrado! Voce ficou em ' || v_posicao || 'o lugar e ganhou +' || v_xp || ' XP.'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.notificacoes n
        WHERE n.user_id = v_real_blader_id AND n.tipo='resultado_torneio'
          AND n.mensagem='Torneio encerrado! Voce ficou em ' || v_posicao || 'o lugar e ganhou +' || v_xp || ' XP.'
      );
    END IF;
  END LOOP;

  PERFORM public.recompute_elo_rankings();

  FOR v_real_blader_id IN SELECT DISTINCT unnest(v_touched_users)
  LOOP
    PERFORM public.recompute_blader_metrics(v_real_blader_id);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_bladers_temp(_user_id uuid, _temp_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _now timestamptz := now();
BEGIN
  IF _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  UPDATE public.bladers_temp
  SET vinculado_a = _user_id, vinculado_em = _now
  WHERE id = ANY(_temp_ids) AND vinculado_a IS NULL;

  UPDATE public.inscricoes
  SET blader_id = _user_id, blader_temp_id = NULL
  WHERE blader_temp_id = ANY(_temp_ids);

  PERFORM public.recompute_blader_metrics(_user_id);
  PERFORM public.recompute_elo_rankings();
END;
$$;

CREATE OR REPLACE FUNCTION public.match_bladers_temp_by_email(_user_id uuid, _email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text := lower(trim(coalesce(_email, '')));
  v_matched_count integer := 0;
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

  PERFORM public.recompute_blader_metrics(_user_id);
  PERFORM public.recompute_elo_rankings();

  UPDATE public.profiles
  SET match_verificado = true
  WHERE id = _user_id;

  RETURN v_matched_count;
END;
$$;

SELECT public.recompute_elo_rankings();