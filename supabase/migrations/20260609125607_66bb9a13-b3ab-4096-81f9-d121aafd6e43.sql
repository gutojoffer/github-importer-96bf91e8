
-- =========================================================
-- 1) Drop INSERT/UPDATE/DELETE policies on game-state tables
-- =========================================================
DROP POLICY IF EXISTS "users_can_create_own_notifications" ON public.notificacoes;

DROP POLICY IF EXISTS "user_elo_insert"   ON public.elo_bladers;
DROP POLICY IF EXISTS "user_elo_update"   ON public.elo_bladers;
DROP POLICY IF EXISTS "user_elo_delete"   ON public.elo_bladers;

DROP POLICY IF EXISTS "user_historico_elo_insert" ON public.historico_elo;

DROP POLICY IF EXISTS "user_conquistas_insert" ON public.conquistas_bladers;
DROP POLICY IF EXISTS "user_conquistas_update" ON public.conquistas_bladers;
DROP POLICY IF EXISTS "user_conquistas_delete" ON public.conquistas_bladers;

DROP POLICY IF EXISTS "user_torre_pontos_insert" ON public.torre_x_pontos;
DROP POLICY IF EXISTS "user_torre_pontos_update" ON public.torre_x_pontos;
DROP POLICY IF EXISTS "user_torre_pontos_delete" ON public.torre_x_pontos;

DROP POLICY IF EXISTS "user_torre_historico_insert" ON public.torre_x_historico;

-- Make sure service_role can still do everything (used by SECURITY DEFINER functions
-- and edge functions). authenticated keeps the SELECT/UPDATE rights it already has
-- through the remaining policies.
GRANT ALL ON public.notificacoes        TO service_role;
GRANT ALL ON public.elo_bladers         TO service_role;
GRANT ALL ON public.historico_elo       TO service_role;
GRANT ALL ON public.conquistas_bladers  TO service_role;
GRANT ALL ON public.torre_x_pontos      TO service_role;
GRANT ALL ON public.torre_x_historico   TO service_role;

-- =========================================================
-- 2) RPC: send_notificacao
--    Authenticated users can send notifications to OTHERS only.
--    Self-notifications are forbidden (prevents fake achievement spam).
-- =========================================================
CREATE OR REPLACE FUNCTION public.send_notificacao(
  _target_user_id uuid,
  _tipo text,
  _mensagem text,
  _dados jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Nao autorizado';
  END IF;
  IF _target_user_id IS NULL THEN
    RAISE EXCEPTION 'Destinatario invalido';
  END IF;
  IF _target_user_id = v_caller THEN
    RAISE EXCEPTION 'Voce nao pode enviar notificacoes para si mesmo';
  END IF;
  IF _tipo IS NULL OR length(trim(_tipo)) = 0 THEN
    RAISE EXCEPTION 'Tipo obrigatorio';
  END IF;
  IF _mensagem IS NULL OR length(trim(_mensagem)) = 0 THEN
    RAISE EXCEPTION 'Mensagem obrigatoria';
  END IF;
  IF length(_mensagem) > 1000 THEN
    RAISE EXCEPTION 'Mensagem muito longa';
  END IF;

  INSERT INTO public.notificacoes (user_id, tipo, mensagem, lida, dados)
  VALUES (_target_user_id, _tipo, _mensagem, false, _dados)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.send_notificacao(uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_notificacao(uuid, text, text, jsonb) TO authenticated;

-- =========================================================
-- 3) RPC: ensure_torre_x_row
--    Lazily creates the caller's own torre_x_pontos row.
-- =========================================================
CREATE OR REPLACE FUNCTION public.ensure_torre_x_row()
RETURNS public.torre_x_pontos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.torre_x_pontos;
  v_cidade text;
  v_estado text;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Nao autorizado';
  END IF;

  SELECT * INTO v_row FROM public.torre_x_pontos WHERE user_id = v_user;
  IF FOUND THEN
    RETURN v_row;
  END IF;

  SELECT cidade_blader, estado_blader INTO v_cidade, v_estado
  FROM public.profiles WHERE id = v_user;

  INSERT INTO public.torre_x_pontos (user_id, pontos, andar, tier, cidade, estado)
  VALUES (v_user, 0, 1, 'Iniciante', v_cidade, v_estado)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_torre_x_row() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_torre_x_row() TO authenticated;

-- =========================================================
-- 4) RPC: recompute_blader_conquistas
--    Server-side achievement recompute. Callable by the user
--    for their own id, or by service_role for anyone.
-- =========================================================
CREATE OR REPLACE FUNCTION public.recompute_blader_conquistas(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_perfil record;
  v_def record;
  v_decks_unicos integer;
  v_andar_torre integer;
  v_progresso integer;
  v_concluida boolean;
  v_anterior record;
BEGIN
  IF _user_id IS NULL THEN
    RETURN;
  END IF;
  IF v_caller IS NOT NULL AND v_caller <> _user_id THEN
    RAISE EXCEPTION 'Nao autorizado';
  END IF;

  SELECT * INTO v_perfil FROM public.profiles WHERE id = _user_id;
  IF v_perfil IS NULL THEN RETURN; END IF;

  SELECT COUNT(DISTINCT nome) INTO v_decks_unicos
  FROM public.bey_combos WHERE user_id = _user_id;

  SELECT COALESCE(andar, 1) INTO v_andar_torre
  FROM public.torre_x_pontos WHERE user_id = _user_id;
  IF v_andar_torre IS NULL THEN v_andar_torre := 1; END IF;

  FOR v_def IN SELECT * FROM public.conquistas_definicoes
  LOOP
    v_progresso := CASE v_def.slug
      WHEN 'primeiro_passo'    THEN LEAST(1, COALESCE(v_perfil.torneios_total,0))
      WHEN 'veterano'          THEN COALESCE(v_perfil.torneios_total,0)
      WHEN 'campeao'           THEN CASE WHEN v_perfil.melhor_posicao = 1 THEN 1 ELSE 0 END
      WHEN 'primeira_vitoria'  THEN LEAST(1, COALESCE(v_perfil.vitorias_total,0))
      WHEN 'em_chamas'         THEN LEAST(3, COALESCE(v_perfil.streak_max,0))
      WHEN 'imparavel'         THEN LEAST(5, COALESCE(v_perfil.streak_max,0))
      WHEN 'forjador'          THEN LEAST(1, v_decks_unicos)
      WHEN 'mestre_forjador'   THEN v_decks_unicos
      WHEN 'escalador'         THEN v_andar_torre
      WHEN 'conquistador_x'    THEN v_andar_torre
      WHEN 'elite_x'           THEN v_andar_torre
      WHEN 'topo_x'            THEN v_andar_torre
      ELSE NULL
    END;
    IF v_progresso IS NULL THEN CONTINUE; END IF;

    v_concluida := v_progresso >= COALESCE(v_def.meta, 1);

    SELECT concluida, notificado INTO v_anterior
    FROM public.conquistas_bladers
    WHERE user_id = _user_id AND conquista_id = v_def.id;

    INSERT INTO public.conquistas_bladers (user_id, conquista_id, progresso, concluida, concluida_em, notificado)
    VALUES (_user_id, v_def.id, v_progresso, v_concluida,
            CASE WHEN v_concluida THEN now() ELSE NULL END,
            COALESCE(v_anterior.notificado, false))
    ON CONFLICT (user_id, conquista_id) DO UPDATE
    SET progresso = EXCLUDED.progresso,
        concluida = EXCLUDED.concluida,
        concluida_em = CASE WHEN EXCLUDED.concluida AND public.conquistas_bladers.concluida_em IS NULL
                            THEN now() ELSE public.conquistas_bladers.concluida_em END;

    IF v_concluida AND NOT COALESCE(v_anterior.notificado, false) THEN
      INSERT INTO public.notificacoes (user_id, tipo, mensagem, lida, dados)
      VALUES (_user_id, 'conquista',
              COALESCE(v_def.icone, '🏅') || ' Conquista desbloqueada: "' || v_def.nome || '" — ' || COALESCE(v_def.descricao, ''),
              false,
              jsonb_build_object('conquista_slug', v_def.slug, 'conquista_nome', v_def.nome));
      UPDATE public.conquistas_bladers
      SET notificado = true
      WHERE user_id = _user_id AND conquista_id = v_def.id;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.recompute_blader_conquistas(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recompute_blader_conquistas(uuid) TO authenticated;
