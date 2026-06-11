
ALTER TABLE public.torre_x_desafios
  ADD COLUMN IF NOT EXISTS resultado_relato_desafiante text,
  ADD COLUMN IF NOT EXISTS resultado_relato_desafiado text,
  ADD COLUMN IF NOT EXISTS finalizado_em timestamptz;

CREATE OR REPLACE FUNCTION public.resolver_desafio_torre_x(_desafio_id uuid, _eu_venci boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_d public.torre_x_desafios%ROWTYPE;
  v_sou_desafiante boolean;
  v_meu_relato text;
  v_outro_relato text;
  v_winner uuid;
  v_loser uuid;
  v_winner_pts int;
  v_loser_pts int;
  v_winner_new int;
  v_loser_new int;
  v_exp_w numeric;
  v_delta int;
  K constant int := 24;
  v_min_gain constant int := 5;
  v_max_gain constant int := 40;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Nao autorizado'; END IF;

  SELECT * INTO v_d FROM public.torre_x_desafios WHERE id = _desafio_id FOR UPDATE;
  IF v_d.id IS NULL THEN RAISE EXCEPTION 'Desafio nao encontrado'; END IF;
  IF v_d.desafiante_id <> v_user AND v_d.desafiado_id <> v_user THEN
    RAISE EXCEPTION 'Nao autorizado';
  END IF;
  IF v_d.status NOT IN ('aceito','em_andamento','em_disputa') THEN
    RAISE EXCEPTION 'Desafio nao esta em andamento';
  END IF;

  v_sou_desafiante := (v_d.desafiante_id = v_user);
  v_meu_relato := CASE WHEN _eu_venci THEN 'venci' ELSE 'perdi' END;

  IF v_sou_desafiante THEN
    v_outro_relato := v_d.resultado_relato_desafiado;
    UPDATE public.torre_x_desafios
       SET resultado_relato_desafiante = v_meu_relato,
           confirmado_desafiante = true,
           status = CASE WHEN status = 'aceito' THEN 'em_andamento' ELSE status END,
           updated_at = now()
     WHERE id = _desafio_id;
  ELSE
    v_outro_relato := v_d.resultado_relato_desafiante;
    UPDATE public.torre_x_desafios
       SET resultado_relato_desafiado = v_meu_relato,
           confirmado_desafiado = true,
           status = CASE WHEN status = 'aceito' THEN 'em_andamento' ELSE status END,
           updated_at = now()
     WHERE id = _desafio_id;
  END IF;

  IF v_outro_relato IS NULL THEN
    PERFORM public.send_notificacao(
      CASE WHEN v_sou_desafiante THEN v_d.desafiado_id ELSE v_d.desafiante_id END,
      'torre_x_resultado_pendente',
      'Seu oponente registrou o resultado da Torre X. Confirme voce tambem!',
      jsonb_build_object('desafio_id', _desafio_id)
    );
    RETURN jsonb_build_object('status', 'aguardando_oponente');
  END IF;

  IF v_meu_relato = v_outro_relato THEN
    UPDATE public.torre_x_desafios SET status='em_disputa', updated_at=now() WHERE id=_desafio_id;
    PERFORM public.send_notificacao(
      CASE WHEN v_sou_desafiante THEN v_d.desafiado_id ELSE v_d.desafiante_id END,
      'torre_x_disputa',
      'Resultados divergentes na Torre X. O desafio entrou em disputa.',
      jsonb_build_object('desafio_id', _desafio_id)
    );
    RETURN jsonb_build_object('status','em_disputa');
  END IF;

  IF (v_sou_desafiante AND _eu_venci) OR (NOT v_sou_desafiante AND NOT _eu_venci) THEN
    v_winner := v_d.desafiante_id; v_loser := v_d.desafiado_id;
  ELSE
    v_winner := v_d.desafiado_id; v_loser := v_d.desafiante_id;
  END IF;

  SELECT COALESCE(pontos,0) INTO v_winner_pts FROM public.torre_x_pontos WHERE user_id=v_winner;
  SELECT COALESCE(pontos,0) INTO v_loser_pts FROM public.torre_x_pontos WHERE user_id=v_loser;
  v_winner_pts := COALESCE(v_winner_pts,0);
  v_loser_pts := COALESCE(v_loser_pts,0);

  v_exp_w := 1.0 / (1.0 + power(10.0, (v_loser_pts - v_winner_pts) / 400.0));
  v_delta := GREATEST(v_min_gain, LEAST(v_max_gain, round(K * (1 - v_exp_w))::int));

  v_winner_new := v_winner_pts + v_delta;
  v_loser_new := GREATEST(0, v_loser_pts - v_delta);

  UPDATE public.torre_x_pontos
     SET pontos = v_winner_new,
         tier = public.calcular_tier_elo(v_winner_new),
         updated_at = now()
   WHERE user_id = v_winner;

  UPDATE public.torre_x_pontos
     SET pontos = v_loser_new,
         tier = public.calcular_tier_elo(v_loser_new),
         updated_at = now()
   WHERE user_id = v_loser;

  INSERT INTO public.torre_x_historico (user_id, desafio_id, pontos_antes, pontos_depois, variacao, resultado, oponente_id)
  VALUES
    (v_winner, _desafio_id, v_winner_pts, v_winner_new, v_delta, 'vitoria', v_loser),
    (v_loser, _desafio_id, v_loser_pts, v_loser_new, -v_delta, 'derrota', v_winner);

  UPDATE public.torre_x_desafios
     SET status = 'finalizado', vencedor_id = v_winner, finalizado_em = now(), updated_at = now()
   WHERE id = _desafio_id;

  PERFORM public.send_notificacao(v_winner, 'torre_x_vitoria',
    'Vitoria na Torre X! +' || v_delta || ' pts', jsonb_build_object('desafio_id', _desafio_id));
  PERFORM public.send_notificacao(v_loser, 'torre_x_derrota',
    'Derrota na Torre X. -' || v_delta || ' pts', jsonb_build_object('desafio_id', _desafio_id));

  INSERT INTO public.feed_atividades (user_id, tipo, dados)
  VALUES (v_winner, 'torre_x_vitoria',
    jsonb_build_object('desafio_id', _desafio_id, 'delta', v_delta, 'oponente_id', v_loser));

  RETURN jsonb_build_object('status','finalizado','vencedor', v_winner,'delta', v_delta);
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolver_desafio_torre_x(uuid, boolean) TO authenticated;
