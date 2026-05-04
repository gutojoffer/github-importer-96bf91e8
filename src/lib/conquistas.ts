import { supabase } from '@/integrations/supabase/client';

/**
 * Recalcula o progresso das conquistas do blader e dispara notificações
 * para as recém-concluídas. Pensado para ser chamado após eventos como:
 * encerrar torneio, registrar partida da Torre X, salvar deck etc.
 */
export async function atualizarConquistas(userId: string) {
  if (!userId) return;

  const [{ data: perfil }, { data: defs }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('conquistas_definicoes').select('*'),
  ]);

  if (!perfil || !defs?.length) return;

  // Pré-busca contagens auxiliares (decks únicos, andar Torre X)
  const [{ data: decksRows }, { data: torre }] = await Promise.all([
    supabase.from('bey_combos').select('nome').eq('user_id', userId),
    supabase.from('torre_x_pontos').select('andar').eq('user_id', userId).maybeSingle(),
  ]);
  const decksUnicos = new Set((decksRows ?? []).map((d: any) => d.nome)).size;
  const andarTorre = (torre as any)?.andar ?? 1;

  for (const def of defs as any[]) {
    let progresso = 0;

    switch (def.slug) {
      case 'primeiro_passo':   progresso = Math.min(1, perfil.torneios_total || 0); break;
      case 'veterano':         progresso = perfil.torneios_total || 0; break;
      case 'campeao':          progresso = (perfil.melhor_posicao === 1) ? 1 : 0; break;
      case 'primeira_vitoria': progresso = Math.min(1, perfil.vitorias_total || 0); break;
      case 'em_chamas':        progresso = Math.min(3, perfil.streak_max || 0); break;
      case 'imparavel':        progresso = Math.min(5, perfil.streak_max || 0); break;
      case 'forjador':         progresso = Math.min(1, decksUnicos); break;
      case 'mestre_forjador':  progresso = decksUnicos; break;
      case 'escalador':
      case 'conquistador_x':
      case 'elite_x':
      case 'topo_x':           progresso = andarTorre; break;
      default:                 continue; // sem regra mapeada
    }

    const concluida = progresso >= (def.meta || 1);

    // Lê estado atual antes do upsert para detectar transição
    const { data: anterior } = await supabase
      .from('conquistas_bladers')
      .select('concluida, notificado')
      .eq('user_id', userId)
      .eq('conquista_id', def.id)
      .maybeSingle();

    await supabase.from('conquistas_bladers').upsert({
      user_id: userId,
      conquista_id: def.id,
      progresso,
      concluida,
      concluida_em: concluida ? new Date().toISOString() : null,
      notificado: anterior?.notificado ?? false,
    }, { onConflict: 'user_id,conquista_id' });

    if (concluida && !anterior?.notificado) {
      await supabase.from('notificacoes').insert({
        user_id: userId,
        tipo: 'conquista',
        mensagem: `${def.icone || '🏅'} Conquista desbloqueada: "${def.nome}" — ${def.descricao || ''}`,
        lida: false,
        dados: { conquista_slug: def.slug, conquista_nome: def.nome },
      });
      await supabase.from('conquistas_bladers')
        .update({ notificado: true })
        .eq('user_id', userId)
        .eq('conquista_id', def.id);
    }
  }
}
