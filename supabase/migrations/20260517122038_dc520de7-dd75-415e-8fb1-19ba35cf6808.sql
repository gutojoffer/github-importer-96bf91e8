
-- inscricoes
CREATE INDEX IF NOT EXISTS idx_inscricoes_torneio ON public.inscricoes(torneio_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_blader ON public.inscricoes(blader_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_blader_temp ON public.inscricoes(blader_temp_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_torneio_status ON public.inscricoes(torneio_id, status);
CREATE INDEX IF NOT EXISTS idx_inscricoes_blader_status ON public.inscricoes(blader_id, status);

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_cidade_blader ON public.profiles(cidade_blader);
CREATE INDEX IF NOT EXISTS idx_profiles_estado_blader ON public.profiles(estado_blader);
CREATE INDEX IF NOT EXISTS idx_profiles_tem_perfil_blader ON public.profiles(tem_perfil_blader) WHERE tem_perfil_blader = true;
CREATE INDEX IF NOT EXISTS idx_profiles_xp_total ON public.profiles(xp_total DESC) WHERE tem_perfil_blader = true;

-- tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_horario_inicio ON public.tournaments(horario_inicio);
CREATE INDEX IF NOT EXISTS idx_tournaments_liga_status ON public.tournaments(liga_id, status);

-- elo_bladers
CREATE INDEX IF NOT EXISTS idx_elo_temporada_pontos ON public.elo_bladers(temporada_id, pontos DESC);
CREATE INDEX IF NOT EXISTS idx_elo_user_temporada ON public.elo_bladers(user_id, temporada_id);

-- torre_x_pontos
CREATE INDEX IF NOT EXISTS idx_torre_cidade_pontos ON public.torre_x_pontos(cidade, pontos DESC);
CREATE INDEX IF NOT EXISTS idx_torre_estado_pontos ON public.torre_x_pontos(estado, pontos DESC);
CREATE INDEX IF NOT EXISTS idx_torre_user ON public.torre_x_pontos(user_id);

-- torre_x_desafios
CREATE INDEX IF NOT EXISTS idx_desafios_desafiante ON public.torre_x_desafios(desafiante_id, status);
CREATE INDEX IF NOT EXISTS idx_desafios_desafiado ON public.torre_x_desafios(desafiado_id, status);

-- notificacoes
CREATE INDEX IF NOT EXISTS idx_notif_user_lida ON public.notificacoes(user_id, lida);
CREATE INDEX IF NOT EXISTS idx_notif_user_created ON public.notificacoes(user_id, created_at DESC);

-- feed_atividades
CREATE INDEX IF NOT EXISTS idx_feed_user_created ON public.feed_atividades(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_created ON public.feed_atividades(created_at DESC);

-- amizades
CREATE INDEX IF NOT EXISTS idx_amizades_solicitante_status ON public.amizades(solicitante_id, status);
CREATE INDEX IF NOT EXISTS idx_amizades_destinatario_status ON public.amizades(destinatario_id, status);

-- bladers_temp
CREATE INDEX IF NOT EXISTS idx_bladers_temp_vinculado ON public.bladers_temp(vinculado_a);
CREATE INDEX IF NOT EXISTS idx_bladers_temp_organizador ON public.bladers_temp(organizador_id);
CREATE INDEX IF NOT EXISTS idx_bladers_temp_email ON public.bladers_temp(lower(trim(email))) WHERE email IS NOT NULL;

-- times / time_membros / time_convites
CREATE INDEX IF NOT EXISTS idx_time_membros_time ON public.time_membros(time_id);
CREATE INDEX IF NOT EXISTS idx_time_membros_user ON public.time_membros(user_id);
CREATE INDEX IF NOT EXISTS idx_time_convites_convidado ON public.time_convites(convidado_id, status);
CREATE INDEX IF NOT EXISTS idx_time_convites_time ON public.time_convites(time_id);
CREATE INDEX IF NOT EXISTS idx_times_capitao ON public.times(capitao_id);

-- confrontos_times / torneio_times
CREATE INDEX IF NOT EXISTS idx_confrontos_torneio ON public.confrontos_times(torneio_id);
CREATE INDEX IF NOT EXISTS idx_torneio_times_torneio ON public.torneio_times(torneio_id);
CREATE INDEX IF NOT EXISTS idx_torneio_times_time ON public.torneio_times(time_id);

-- conquistas / presenca
CREATE INDEX IF NOT EXISTS idx_conquistas_user ON public.conquistas_bladers(user_id);
CREATE INDEX IF NOT EXISTS idx_presenca_online ON public.presenca_online(online) WHERE online = true;
