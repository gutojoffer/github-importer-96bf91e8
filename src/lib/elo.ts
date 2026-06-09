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

/**
 * Recalcula o ranking ELO no servidor.
 *
 * Toda a lógica de pontuação por torneio agora vive em `apply_tournament_results`
 * (SECURITY DEFINER) e em `recompute_elo_rankings`. O cliente não pode mais
 * escrever direto em `elo_bladers` / `historico_elo` por motivos de segurança
 * (impedir auto-inflar pontuação). Essa função apenas dispara o recálculo.
 */
export async function atualizarEloAposTorneio(_torneioId: string) {
  try {
    await (supabase as any).rpc('recompute_elo_rankings');
  } catch (err: any) {
    console.warn('[elo] recompute_elo_rankings falhou:', err?.message);
  }
}

/**
 * Encerramento de temporada agora deve ser feito por uma RPC dedicada no banco
 * (não implementada — feature admin). Mantida como stub para compatibilidade.
 */
export async function encerrarTemporada(_temporadaId: string) {
  console.warn('[elo] encerrarTemporada precisa de uma RPC admin no servidor.');
}

