import { create } from 'zustand';
import { Player } from '@/types/tournament';
import { getPlayers, addPlayer as apiAddPlayer, deletePlayer as apiDeletePlayer, savePlayers as apiSavePlayers, updatePlayer as apiUpdatePlayer } from '@/lib/storage';

interface PlayerStore {
  players: Player[];
  loaded: boolean;
  load: () => Promise<void>;
  reload: () => Promise<void>;
  add: (p: Player) => void;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Player>) => void;
  bulkSet: (players: Player[]) => void;
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

  update: (id: string, patch: Partial<Player>) => {
    set(s => ({
      players: s.players.map(p => p.id === id ? { ...p, ...patch } : p),
    }));
    const updated = get().players;
    apiSavePlayers(updated).catch(console.error);
  },

  bulkSet: (players: Player[]) => {
    set({ players });
    apiSavePlayers(players).catch(console.error);
  },
}));
