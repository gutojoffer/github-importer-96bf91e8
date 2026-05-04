import { supabase } from '@/integrations/supabase/client';

export const ELO_CONFIG = {
  VITORIA_TORNEIO: 15,
  DERROTA_TORNEIO: -5,
  VITORIA_UNDERDOG: 25,
  VITORIA_FAVORITO: 10,
  BONUS_PRIMEIRO: 50,
  BONUS_SEGUNDO: 25,
  BONUS_TERCEIRO: 10,
  INATIVIDADE_SEMANAL: -3,
};

export interface EloDef {
  nome: string;
  min: number;
  max: number;
  cor: string;
  bg: string;
  border: string;
}

export const ELOS: EloDef[] = [
  { nome: 'Ferro',    min: 0,    max: 299,   cor: '#9CA3AF', bg: 'rgba(156,163,175,.1)', border: 'rgba(156,163,175,.2)' },
  { nome: 'Bronze',   min: 300,  max: 699,   cor: '#CD7F32', bg: 'rgba(205,127,50,.1)',  border: 'rgba(205,127,50,.2)'  },
  { nome: 'Prata',    min: 700,  max: 1299,  cor: '#C0C0C0', bg: 'rgba(192,192,192,.1)', border: 'rgba(192,192,192,.2)' },
  { nome: 'Ouro',     min: 1300, max: 2199,  cor: '#F59E0B', bg: 'rgba(245,158,11,.1)',  border: 'rgba(245,158,11,.2)'  },
  { nome: 'Platina',  min: 2200, max: 3499,  cor: '#00DCFF', bg: 'rgba(0,220,255,.1)',   border: 'rgba(0,220,255,.2)'   },
  { nome: 'Diamante', min: 3500, max: 99999, cor: '#A78BFA', bg: 'rgba(167,139,250,.1)', border: 'rgba(167,139,250,.2)' },
];

export function getElo(pontos: number): EloDef {
  return ELOS.find(e => pontos >= e.min && pontos <= e.max) || ELOS[0];
}

export function getProximoElo(pontos: number): EloDef | null {
  const idx = ELOS.findIndex(e => pontos >= e.min && pontos <= e.max);
  return idx >= 0 && idx < ELOS.length - 1 ? ELOS[idx + 1] : null;
}

export function calcularVariacao(
  resultado: 'vitoria' | 'derrota',
  rankingJogador: number,
  rankingOponente: number,
  posicaoFinal?: number
): number {
  let variacao = resultado === 'derrota' ? ELO_CONFIG.DERROTA_TORNEIO : 0;
  if (resultado === 'vitoria') {
    variacao = rankingJogador > rankingOponente ? ELO_CONFIG.VITORIA_UNDERDOG : ELO_CONFIG.VITORIA_FAVORITO;
    variacao += ELO_CONFIG.VITORIA_TORNEIO;
  }
  if (posicaoFinal === 1) variacao += ELO_CONFIG.BONUS_PRIMEIRO;
  if (posicaoFinal === 2) variacao += ELO_CONFIG.BONUS_SEGUNDO;
  if (posicaoFinal === 3) variacao += ELO_CONFIG.BONUS_TERCEIRO;
  return variacao;
}

export async function atualizarEloAposTorneio(torneioId: string) {
  const { data: temporada } = await supabase
    .from('temporadas')
    .select('id')
    .eq('ativa', true)
    .maybeSingle();
  if (!temporada) return;

  const { data: inscricoes } = await supabase
    .from('inscricoes')
    .select('blader_id, posicao_final, vitorias, derrotas')
    .eq('torneio_id', torneioId)
    .not('blader_id', 'is', null)
    .not('posicao_final', 'is', null);
  if (!inscricoes?.length) return;

  const ids = inscricoes.map(i => i.blader_id).filter(Boolean) as string[];
  const { data: elosAtuais } = await supabase
    .from('elo_bladers')
    .select('user_id, pontos, elo')
    .eq('temporada_id', temporada.id)
    .in('user_id', ids);

  for (const insc of inscricoes) {
    if (!insc.blader_id) continue;
    const eloAtual = elosAtuais?.find(e => e.user_id === insc.blader_id);
    const pontosAtuais = eloAtual?.pontos || 0;

    let variacao = 0;
    variacao += (insc.vitorias || 0) * ELO_CONFIG.VITORIA_TORNEIO;
    variacao += (insc.derrotas || 0) * ELO_CONFIG.DERROTA_TORNEIO;
    if (insc.posicao_final === 1) variacao += ELO_CONFIG.BONUS_PRIMEIRO;
    if (insc.posicao_final === 2) variacao += ELO_CONFIG.BONUS_SEGUNDO;
    if (insc.posicao_final === 3) variacao += ELO_CONFIG.BONUS_TERCEIRO;

    const novosPontos = Math.max(0, pontosAtuais + variacao);
    const novoElo = getElo(novosPontos).nome;

    await supabase.from('elo_bladers').upsert({
      user_id: insc.blader_id,
      temporada_id: temporada.id,
      pontos: novosPontos,
      elo: novoElo,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,temporada_id' });

    await supabase.from('historico_elo').insert({
      user_id: insc.blader_id,
      temporada_id: temporada.id,
      pontos_antes: pontosAtuais,
      pontos_depois: novosPontos,
      variacao,
      motivo: `Torneio — ${insc.posicao_final}º lugar`,
      torneio_id: torneioId,
    });

    if (eloAtual && novoElo !== eloAtual.elo) {
      await supabase.from('notificacoes').insert({
        user_id: insc.blader_id,
        tipo: 'subiu_elo',
        mensagem: `🎉 Você subiu para o elo ${novoElo}!`,
        lida: false,
        dados: { elo_anterior: eloAtual.elo, elo_novo: novoElo, pontos: novosPontos },
      });
    }
  }
}

export async function encerrarTemporada(temporadaId: string) {
  const { data: elos } = await supabase
    .from('elo_bladers')
    .select('user_id, elo, pontos')
    .eq('temporada_id', temporadaId);

  for (const elo of elos || []) {
    if (!elo.user_id) continue;
    await supabase.from('elo_bladers')
      .update({ titulo_final: elo.elo })
      .eq('user_id', elo.user_id)
      .eq('temporada_id', temporadaId);

    await supabase.from('notificacoes').insert({
      user_id: elo.user_id,
      tipo: 'temporada_encerrada',
      mensagem: `🏅 Temporada encerrada! Seu título: ${elo.elo} (${elo.pontos} pts)`,
      lida: false,
      dados: { titulo: elo.elo, pontos: elo.pontos, temporada_id: temporadaId },
    });
  }

  await supabase.from('temporadas').update({ ativa: false }).eq('id', temporadaId);

  const agora = new Date();
  const inicio = new Date(agora);
  inicio.setMonth(inicio.getMonth() + 1);
  const fim = new Date(inicio);
  fim.setMonth(fim.getMonth() + 6);

  await supabase.from('temporadas').insert({
    nome: `Temporada ${inicio.getFullYear()} — ${inicio.toLocaleDateString('pt-BR', { month: 'long' })}`,
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    ativa: true,
  });
}
