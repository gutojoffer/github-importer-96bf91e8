CREATE OR REPLACE FUNCTION public.calcular_nivel_blader(_xp integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF COALESCE(_xp, 0) < 100 THEN RETURN 'Rookie'; END IF;
  IF _xp < 300 THEN RETURN 'Challenger'; END IF;
  IF _xp < 700 THEN RETURN 'Fighter'; END IF;
  IF _xp < 1500 THEN RETURN 'Warrior'; END IF;
  IF _xp < 3000 THEN RETURN 'Champion'; END IF;
  IF _xp < 10000 THEN RETURN 'Legend'; END IF;
  RETURN 'Mythic';
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_tournament_results(_torneio_id uuid, _standings jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  v_blader_id uuid;
  v_posicao integer;
  v_vitorias integer;
  v_xp integer;
  v_novo_xp integer;
  v_torneio_nome text;
BEGIN
  SELECT name INTO v_torneio_nome
  FROM public.tournaments
  WHERE id = _torneio_id AND liga_id = auth.uid();

  IF v_torneio_nome IS NULL THEN
    RAISE EXCEPTION 'Torneio não encontrado ou sem permissão';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(_standings)
  LOOP
    v_blader_id := (item->>'playerId')::uuid;
    v_posicao := COALESCE((item->>'placement')::integer, 999);
    v_vitorias := COALESCE((item->>'wins')::integer, 0);
    v_xp := CASE
      WHEN v_posicao = 1 THEN 100
      WHEN v_posicao = 2 THEN 60
      WHEN v_posicao = 3 THEN 30
      ELSE 10
    END + (v_vitorias * 15);

    UPDATE public.inscricoes
    SET posicao_final = v_posicao,
        xp_ganho = v_xp
    WHERE torneio_id = _torneio_id
      AND blader_id = v_blader_id;

    UPDATE public.profiles
    SET xp_total = COALESCE(xp_total, 0) + v_xp,
        vitorias_total = COALESCE(vitorias_total, 0) + v_vitorias,
        torneios_total = COALESCE(torneios_total, 0) + 1,
        melhor_posicao = LEAST(COALESCE(melhor_posicao, 999), v_posicao),
        nivel = public.calcular_nivel_blader(COALESCE(xp_total, 0) + v_xp)
    WHERE id = v_blader_id
    RETURNING xp_total INTO v_novo_xp;

    IF v_novo_xp IS NOT NULL THEN
      INSERT INTO public.notificacoes (user_id, tipo, mensagem)
      VALUES (
        v_blader_id,
        'resultado_torneio',
        'Torneio encerrado! Você ficou em ' || v_posicao || 'º lugar e ganhou +' || v_xp || ' XP.'
      );
    END IF;
  END LOOP;
END;
$$;