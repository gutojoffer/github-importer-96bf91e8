import { create } from 'zustand';
import { Player } from '@/types/tournament';
import { getPlayers, addPlayer as apiAddPlayer, deletePlayer as apiDeletePlayer, savePlayers as apiSavePlayers, updatePlayer as apiUpdatePlayer } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';

interface PlayerStore {
  players: Player[];
  loaded: boolean;
  load: () => Promise<void>;
  reload: () => Promise<void>;
  add: (p: Player) => void;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Player>) => Promise<void>;
  bulkSet: (players: Player[]) => void;
  subscribeRealtime: () => () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  players: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const players = await getPlayers();
    set({ players, loaded: true });
  },

  reload: async () => {
    const players = await getPlayers();
    set({ players, loaded: true });
  },

  add: (p: Player) => {
    set(s => ({ players: [...s.players, p] }));
    apiAddPlayer(p).catch(console.error);
  },

  remove: (id: string) => {
    set(s => ({ players: s.players.filter(p => p.id !== id) }));
    apiDeletePlayer(id).catch(console.error);
  },

  update: async (id: string, patch: Partial<Player>) => {
    set(s => ({
      players: s.players.map(p => p.id === id ? { ...p, ...patch } : p),
    }));
    await apiUpdatePlayer(id, patch);
  },

  bulkSet: (players: Player[]) => {
    set({ players });
    apiSavePlayers(players).catch(console.error);
  },

  subscribeRealtime: () => {
    const channel = supabase
      .channel('players-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
      }, (payload) => {
        const { eventType } = payload;
        if (eventType === 'UPDATE' || eventType === 'INSERT') {
          const row = payload.new as any;
          const updated: Player = {
            id: row.id,
            name: row.name,
            nickname: row.nickname || '',
            avatar: row.avatar || '🔵',
            xp: row.xp ?? 0,
            createdAt: row.created_at,
          };
          set(s => {
            const exists = s.players.some(p => p.id === updated.id);
            if (exists) {
              return { players: s.players.map(p => p.id === updated.id ? updated : p) };
            }
            return { players: [...s.players, updated] };
          });
        } else if (eventType === 'DELETE') {
          const oldRow = payload.old as any;
          set(s => ({ players: s.players.filter(p => p.id !== oldRow.id) }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },
}));
