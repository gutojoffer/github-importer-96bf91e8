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

      INSERT INTO public.feed_atividades (user_id, tipo, dados)
      SELECT v_real_blader_id, 'torneio_resultado',
             jsonb_build_object(
               'torneio_id', _torneio_id,
               'torneio_nome', v_torneio_nome,
               'posicao', v_posicao,
               'vitorias', v_vitorias,
               'derrotas', v_derrotas,
               'xp', v_xp
             )
      WHERE NOT EXISTS (
        SELECT 1 FROM public.feed_atividades f
        WHERE f.user_id = v_real_blader_id
          AND f.tipo = 'torneio_resultado'
          AND f.dados->>'torneio_id' = _torneio_id::text
      );
    END IF;
  END LOOP;

  PERFORM public.recompute_elo_rankings();

  FOR v_real_blader_id IN SELECT DISTINCT unnest(v_touched_users)
  LOOP
    PERFORM public.recompute_blader_metrics(v_real_blader_id);
  END LOOP;
END;
$function$;

-- Backfill: feed para torneios já encerrados
INSERT INTO public.feed_atividades (user_id, tipo, dados)
SELECT
  COALESCE(i.blader_id, bt.vinculado_a) AS user_id,
  'torneio_resultado',
  jsonb_build_object(
    'torneio_id', t.id,
    'torneio_nome', t.name,
    'posicao', i.posicao_final,
    'vitorias', COALESCE(i.vitorias, 0),
    'derrotas', COALESCE(i.derrotas, 0),
    'xp', COALESCE(i.xp_ganho, 0)
  )
FROM public.tournaments t
JOIN public.inscricoes i ON i.torneio_id = t.id
LEFT JOIN public.bladers_temp bt ON bt.id = i.blader_temp_id
WHERE t.status = 'completed'
  AND i.posicao_final IS NOT NULL
  AND COALESCE(i.blader_id, bt.vinculado_a) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.feed_atividades f
    WHERE f.user_id = COALESCE(i.blader_id, bt.vinculado_a)
      AND f.tipo = 'torneio_resultado'
      AND f.dados->>'torneio_id' = t.id::text
  );