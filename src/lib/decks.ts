import { supabase } from '@/integrations/supabase/client';

export interface DeckBeySnapshot {
  slot: number;
  linha: string;
  blade: any | null;
  ratchet: any | null;
  bit: any | null;
  lock_chip: any | null;
  main_blade: any | null;
  assist_blade: any | null;
}

export interface DeckResumo {
  deck_uuid: string;
  nome: string;
  updated_at: string;
  beys: DeckBeySnapshot[];
}

/**
 * Carrega todos os decks de um usuário, agrupados por deck_uuid.
 * Retorna lista de decks (com 1-3 beys cada).
 */
export async function fetchUserDecks(userId: string): Promise<DeckResumo[]> {
  const { data, error } = await (supabase as any)
    .from('bey_combos')
    .select(`
      id, deck_uuid, nome, slot, linha, updated_at,
      bey_blades(id, nome, tipo_ataque, imagem_url),
      bey_ratchets(id, nome, imagem_url),
      bey_bits(id, nome, abreviacao, tipo, imagem_url),
      bey_lock_chips(id, nome, imagem_url),
      bey_main_blades(id, nome, tipo_ataque, imagem_url),
      bey_assist_blades(id, nome, imagem_url)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .order('slot');

  if (error) {
    console.error('fetchUserDecks error:', error);
    return [];
  }

  const grupos = new Map<string, DeckResumo>();
  for (const row of data || []) {
    const uuid = row.deck_uuid as string;
    if (!grupos.has(uuid)) {
      grupos.set(uuid, {
        deck_uuid: uuid,
        nome: row.nome || 'Meu Deck',
        updated_at: row.updated_at,
        beys: [],
      });
    }
    const deck = grupos.get(uuid)!;
    deck.beys.push({
      slot: row.slot,
      linha: row.linha,
      blade: row.bey_blades,
      ratchet: row.bey_ratchets,
      bit: row.bey_bits,
      lock_chip: row.bey_lock_chips,
      main_blade: row.bey_main_blades,
      assist_blade: row.bey_assist_blades,
    });
    // updated_at do deck = mais recente entre os slots
    if (row.updated_at > deck.updated_at) deck.updated_at = row.updated_at;
  }

  return Array.from(grupos.values()).sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export async function deleteDeck(deckUuid: string): Promise<void> {
  const { error } = await supabase.from('bey_combos').delete().eq('deck_uuid', deckUuid);
  if (error) throw error;
}

export async function renameDeck(deckUuid: string, novoNome: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('bey_combos')
    .update({ nome: novoNome })
    .eq('deck_uuid', deckUuid);
  if (error) throw error;
}

export function formatarDataRelativa(iso: string): string {
  const data = new Date(iso);
  const agora = new Date();
  const diffMs = agora.getTime() - data.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffDia = Math.floor(diffH / 24);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin} min atrás`;
  if (diffH < 24) return `${diffH}h atrás`;
  if (diffDia < 7) return `${diffDia}d atrás`;
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function nomeBeyResumo(bey: DeckBeySnapshot): string {
  return bey.blade?.nome || bey.main_blade?.nome || '—';
}
