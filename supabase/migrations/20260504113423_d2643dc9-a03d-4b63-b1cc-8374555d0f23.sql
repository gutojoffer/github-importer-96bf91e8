CREATE INDEX IF NOT EXISTS idx_inscricoes_blader_id_inscrito_em
ON public.inscricoes (blader_id, inscrito_em DESC);

CREATE INDEX IF NOT EXISTS idx_inscricoes_torneio_id
ON public.inscricoes (torneio_id);

CREATE INDEX IF NOT EXISTS idx_inscricoes_blader_temp_id
ON public.inscricoes (blader_temp_id)
WHERE blader_temp_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inscricoes_resultados_blader
ON public.inscricoes (blader_id, posicao_final)
WHERE posicao_final IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tournaments_liga_status_date
ON public.tournaments (liga_id, status, date DESC);

CREATE INDEX IF NOT EXISTS idx_tournaments_status_date
ON public.tournaments (status, date DESC);

CREATE INDEX IF NOT EXISTS idx_bladers_temp_email_normalized
ON public.bladers_temp (lower(trim(email)))
WHERE email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.recompute_blader_metrics(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_torneios_total integer := 0;
  v_xp_total integer := 0;
  v_melhor_posicao integer;
  v_vitorias_partidas integer := 0;
  v_streak_max integer := 0;
BEGIN
  IF _user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE posicao_final IS NOT NULL),
    COALESCE(SUM(COALESCE(xp_ganho, 0)) FILTER (WHERE posicao_final IS NOT NULL), 0),
    MIN(posicao_final) FILTER (WHERE posicao_final IS NOT NULL),
    COALESCE(SUM(COALESCE(vitorias, 0)) FILTER (WHERE posicao_final IS NOT NULL), 0),
    COALESCE(MAX(COALESCE(streak_max, 0)) FILTER (WHERE posicao_final IS NOT NULL), 0)
  INTO v_torneios_total, v_xp_total, v_melhor_posicao, v_vitorias_partidas, v_streak_max
  FROM public.inscricoes
  WHERE blader_id = _user_id;

  UPDATE public.profiles
  SET torneios_total = v_torneios_total,
      vitorias_total = v_vitorias_partidas,
      xp_total = v_xp_total,
      melhor_posicao = v_melhor_posicao,
      streak_max = v_streak_max,
      nivel = public.calcular_nivel_blader(v_xp_total)
  WHERE id = _user_id;
END;
$function$;

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
  v_streak integer;
  v_torneio_nome text;
  v_liga_id uuid;
  v_rows integer;
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
      CASE
        WHEN v_posicao = 1 THEN 100
        WHEN v_posicao = 2 THEN 60
        WHEN v_posicao = 3 THEN 30
        ELSE 10
      END + (v_vitorias * 15)
    );

    v_real_blader_id := NULL;

    UPDATE public.inscricoes
    SET posicao_final = v_posicao,
        xp_ganho = v_xp,
        vitorias = v_vitorias,
        derrotas = v_derrotas,
        streak_max = GREATEST(COALESCE(streak_max, 0), v_streak)
    WHERE torneio_id = _torneio_id AND blader_id = v_player_id;

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows > 0 THEN
      v_real_blader_id := v_player_id;
    ELSE
      UPDATE public.inscricoes
      SET posicao_final = v_posicao,
          xp_ganho = v_xp,
          vitorias = v_vitorias,
          derrotas = v_derrotas,
          streak_max = GREATEST(COALESCE(streak_max, 0), v_streak)
      WHERE torneio_id = _torneio_id AND blader_temp_id = v_player_id;

      GET DIAGNOSTICS v_rows = ROW_COUNT;

      IF v_rows > 0 THEN
        SELECT vinculado_a INTO v_real_blader_id
        FROM public.bladers_temp
        WHERE id = v_player_id;
      END IF;
    END IF;

    IF v_real_blader_id IS NOT NULL THEN
      v_touched_users := array_append(v_touched_users, v_real_blader_id);

      INSERT INTO public.notificacoes (user_id, tipo, mensagem)
      SELECT
        v_real_blader_id,
        'resultado_torneio',
        'Torneio encerrado! Voce ficou em ' || v_posicao || 'o lugar e ganhou +' || v_xp || ' XP.'
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.notificacoes n
        WHERE n.user_id = v_real_blader_id
          AND n.tipo = 'resultado_torneio'
          AND n.mensagem = 'Torneio encerrado! Voce ficou em ' || v_posicao || 'o lugar e ganhou +' || v_xp || ' XP.'
      );
    END IF;
  END LOOP;

  FOR v_real_blader_id IN SELECT DISTINCT unnest(v_touched_users)
  LOOP
    PERFORM public.recompute_blader_metrics(v_real_blader_id);
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.match_bladers_temp_by_email(_user_id uuid, _email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  UPDATE public.profiles
  SET match_verificado = true
  WHERE id = _user_id;

  RETURN v_matched_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.link_bladers_temp(_user_id uuid, _temp_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _now TIMESTAMPTZ := now();
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
END;
$function$;

CREATE OR REPLACE FUNCTION public.rebuild_tournament_results_from_rounds(_torneio_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_liga_id uuid;
  v_standings jsonb;
BEGIN
  SELECT liga_id INTO v_liga_id
  FROM public.tournaments
  WHERE id = _torneio_id;

  IF v_liga_id IS NULL THEN
    RAISE EXCEPTION 'Torneio nao encontrado';
  END IF;

  IF auth.uid() IS NULL THEN
    IF session_user <> 'postgres' THEN
      RAISE EXCEPTION 'Nao autorizado';
    END IF;
  ELSIF v_liga_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Torneio nao encontrado ou sem permissao';
  END IF;

  WITH tournament AS (
    SELECT id, player_ids, rounds
    FROM public.tournaments
    WHERE id = _torneio_id
  ), raw_matches AS (
    SELECT
      r.ord AS round_ord,
      m.ord AS match_ord,
      NULLIF(m.match->>'player1Id', '')::uuid AS player1_id,
      NULLIF(m.match->>'player2Id', '')::uuid AS player2_id,
      NULLIF(m.match->'result'->>'winnerId', '')::uuid AS winner_id,
      COALESCE((m.match->>'player1Points')::integer, 0) AS player1_points,
      COALESCE((m.match->>'player2Points')::integer, 0) AS player2_points,
      COALESCE((m.match->>'isBye')::boolean, false) AS is_bye
    FROM tournament t
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(t.rounds, '[]'::jsonb)) WITH ORDINALITY AS r(round, ord)
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(r.round->'matches', '[]'::jsonb)) WITH ORDINALITY AS m(match, ord)
    WHERE m.match ? 'result'
  ), participants AS (
    SELECT DISTINCT player_id
    FROM (
      SELECT unnest(player_ids) AS player_id FROM tournament
      UNION ALL SELECT blader_id FROM public.inscricoes WHERE torneio_id = _torneio_id AND blader_id IS NOT NULL
      UNION ALL SELECT blader_temp_id FROM public.inscricoes WHERE torneio_id = _torneio_id AND blader_temp_id IS NOT NULL
      UNION ALL SELECT player1_id FROM raw_matches WHERE player1_id IS NOT NULL
      UNION ALL SELECT player2_id FROM raw_matches WHERE player2_id IS NOT NULL
    ) p
    WHERE player_id IS NOT NULL
  ), per_player_match AS (
    SELECT
      player1_id AS player_id,
      round_ord,
      match_ord,
      CASE WHEN winner_id = player1_id THEN 1 ELSE 0 END AS win_flag,
      CASE WHEN NOT is_bye AND player2_id IS NOT NULL AND winner_id IS NOT NULL AND winner_id <> player1_id THEN 1 ELSE 0 END AS loss_flag,
      player1_points AS points
    FROM raw_matches
    WHERE player1_id IS NOT NULL
    UNION ALL
    SELECT
      player2_id AS player_id,
      round_ord,
      match_ord,
      CASE WHEN winner_id = player2_id THEN 1 ELSE 0 END AS win_flag,
      CASE WHEN winner_id IS NOT NULL AND winner_id <> player2_id THEN 1 ELSE 0 END AS loss_flag,
      player2_points AS points
    FROM raw_matches
    WHERE player2_id IS NOT NULL AND NOT is_bye
  ), streak_scan AS (
    SELECT
      player_id,
      round_ord,
      match_ord,
      win_flag,
      SUM(CASE WHEN win_flag = 0 THEN 1 ELSE 0 END) OVER (PARTITION BY player_id ORDER BY round_ord, match_ord) AS loss_group
    FROM per_player_match
  ), streaks AS (
    SELECT player_id, COALESCE(MAX(streak_len), 0) AS streak_max
    FROM (
      SELECT player_id, loss_group, COUNT(*) FILTER (WHERE win_flag = 1) AS streak_len
      FROM streak_scan
      GROUP BY player_id, loss_group
    ) s
    GROUP BY player_id
  ), aggregates AS (
    SELECT
      p.player_id,
      COALESCE(SUM(pm.win_flag), 0)::integer AS wins,
      COALESCE(SUM(pm.loss_flag), 0)::integer AS losses,
      COALESCE(SUM(pm.points), 0)::integer AS total_points,
      COALESCE(st.streak_max, 0)::integer AS streak_max
    FROM participants p
    LEFT JOIN per_player_match pm ON pm.player_id = p.player_id
    LEFT JOIN streaks st ON st.player_id = p.player_id
    GROUP BY p.player_id, st.streak_max
  ), ranked AS (
    SELECT
      player_id,
      wins,
      losses,
      total_points,
      streak_max,
      ROW_NUMBER() OVER (ORDER BY wins DESC, total_points DESC, losses ASC, player_id) AS placement
    FROM aggregates
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'playerId', player_id::text,
    'placement', placement,
    'wins', wins,
    'losses', losses,
    'streakMax', streak_max,
    'xpAwarded', CASE
      WHEN placement = 1 THEN 100
      WHEN placement = 2 THEN 60
      WHEN placement = 3 THEN 30
      ELSE 10
    END + (wins * 15),
    'rankingPoints', CASE
      WHEN placement = 1 THEN 100
      WHEN placement = 2 THEN 70
      WHEN placement = 3 THEN 50
      WHEN placement = 4 THEN 35
      WHEN placement <= 8 THEN 20
      WHEN placement <= 16 THEN 10
      ELSE 5
    END,
    'dropped', false
  ) ORDER BY placement), '[]'::jsonb)
  INTO v_standings
  FROM ranked;

  PERFORM public.apply_tournament_results(_torneio_id, v_standings);
  RETURN v_standings;
END;
$function$;

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT t.id
    FROM public.tournaments t
    WHERE jsonb_array_length(COALESCE(t.rounds, '[]'::jsonb)) > 0
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(t.rounds, '[]'::jsonb)) r
        WHERE COALESCE((r->>'completed')::boolean, false) = false
      )
      AND EXISTS (
        SELECT 1
        FROM public.inscricoes i
        WHERE i.torneio_id = t.id
      )
      AND (
        t.status <> 'completed'
        OR t.final_standings IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.inscricoes i
          WHERE i.torneio_id = t.id
            AND i.posicao_final IS NULL
        )
      )
  LOOP
    PERFORM public.rebuild_tournament_results_from_rounds(rec.id);
  END LOOP;

  FOR rec IN SELECT id FROM public.profiles
  LOOP
    PERFORM public.recompute_blader_metrics(rec.id);
  END LOOP;
END $$;