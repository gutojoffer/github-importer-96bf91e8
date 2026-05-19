
CREATE OR REPLACE FUNCTION public.calcular_tier_elo(_pontos integer)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN COALESCE(_pontos,0) < 100 THEN 'Ferro'
    WHEN _pontos < 300 THEN 'Bronze'
    WHEN _pontos < 600 THEN 'Prata'
    WHEN _pontos < 1000 THEN 'Ouro'
    WHEN _pontos < 1500 THEN 'Platina'
    ELSE 'Diamante'
  END
$$;

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
  v_pontos_antes integer;
  v_pontos_depois integer;
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

      -- ELO: somar pontos do ranking na temporada ativa
      IF v_temporada_id IS NOT NULL AND v_ranking_pts > 0 THEN
        SELECT pontos INTO v_pontos_antes FROM public.elo_bladers
          WHERE user_id = v_real_blader_id AND temporada_id = v_temporada_id;

        IF v_pontos_antes IS NULL THEN
          INSERT INTO public.elo_bladers (user_id, temporada_id, pontos, elo)
          VALUES (v_real_blader_id, v_temporada_id, v_ranking_pts, public.calcular_tier_elo(v_ranking_pts));
          v_pontos_antes := 0;
          v_pontos_depois := v_ranking_pts;
        ELSE
          v_pontos_depois := v_pontos_antes + v_ranking_pts;
          UPDATE public.elo_bladers
          SET pontos = v_pontos_depois,
              elo = public.calcular_tier_elo(v_pontos_depois),
              updated_at = now()
          WHERE user_id = v_real_blader_id AND temporada_id = v_temporada_id;
        END IF;

        INSERT INTO public.historico_elo (user_id, temporada_id, pontos_antes, pontos_depois, variacao, motivo, torneio_id)
        VALUES (v_real_blader_id, v_temporada_id, v_pontos_antes, v_pontos_depois, v_ranking_pts,
                'Torneio: ' || v_torneio_nome || ' (' || v_posicao || 'º)', _torneio_id);
      END IF;

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

  FOR v_real_blader_id IN SELECT DISTINCT unnest(v_touched_users)
  LOOP
    PERFORM public.recompute_blader_metrics(v_real_blader_id);
  END LOOP;
END;
$function$;
