import { create } from 'zustand';
import { Tournament, TournamentStanding } from '@/types/tournament';
import {
  getTournaments, createUpcomingTournament, saveActiveTournament,
  saveCompletedTournament, deleteTournament as apiDeleteTournament,
  calculateStandings, awardXP, saveTournaments,
} from '@/lib/storage';

interface TournamentStore {
  tournaments: Tournament[];
  activeTournament: Tournament | null;
  loaded: boolean;
  load: () => Promise<void>;
  createTournament: (t: Tournament) => void;
  deleteTournament: (id: string) => void;
  setActiveTournament: (t: Tournament | null) => void;
  updateActive: (t: Tournament) => void;
  endTournament: () => Promise<TournamentStanding[] | null>;
  cancelTournament: () => void;
  enrollPlayer: (tournamentId: string, playerId: string) => void;
  unenrollPlayer: (tournamentId: string, playerId: string) => void;
  refreshList: () => Promise<void>;
}

export const useTournamentStore = create<TournamentStore>((set, get) => ({
  tournaments: [],
  activeTournament: null,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const all = await getTournaments();
    const active = all.find(t => t.status === 'active') || null;
    set({ tournaments: all, activeTournament: active, loaded: true });
  },

  createTournament: (t: Tournament) => {
    set(s => ({ tournaments: [t, ...s.tournaments] }));
    createUpcomingTournament(t).catch(console.error);
  },

  deleteTournament: (id: string) => {
    set(s => ({ tournaments: s.tournaments.filter(t => t.id !== id) }));
    apiDeleteTournament(id).catch(console.error);
  },

  setActiveTournament: (t: Tournament | null) => {
    set({ activeTournament: t });
    if (t) {
      saveActiveTournament(t).catch(console.error);
    }
  },

  updateActive: (t: Tournament) => {
    set({ activeTournament: t });
    saveActiveTournament(t).catch(console.error);
  },

  endTournament: async () => {
    const { activeTournament } = get();
    if (!activeTournament) return null;
    const standings = calculateStandings(activeTournament);
    const completed: Tournament = { ...activeTournament, status: 'completed', finalStandings: standings };
    set(s => ({
      activeTournament: null,
      tournaments: [completed, ...s.tournaments.filter(t => t.id !== completed.id)],
    }));
    await saveCompletedTournament(completed);
    await awardXP(standings);
    return standings;
  },

  cancelTournament: () => {
    const { activeTournament } = get();
    if (!activeTournament) return;
    set(s => ({
      activeTournament: null,
      tournaments: s.tournaments.filter(t => t.id !== activeTournament.id),
    }));
    apiDeleteTournament(activeTournament.id).catch(console.error);
  },

  enrollPlayer: (tournamentId: string, playerId: string) => {
    set(s => ({
      tournaments: s.tournaments.map(t =>
        t.id === tournamentId && !t.playerIds.includes(playerId)
          ? { ...t, playerIds: [...t.playerIds, playerId] }
          : t
      ),
    }));
    // Persist
    const t = get().tournaments.find(t => t.id === tournamentId);
    if (t) saveTournaments([t]).catch(console.error);
  },

  unenrollPlayer: (tournamentId: string, playerId: string) => {
    set(s => ({
      tournaments: s.tournaments.map(t =>
        t.id === tournamentId
          ? { ...t, playerIds: t.playerIds.filter(id => id !== playerId) }
          : t
      ),
    }));
    const t = get().tournaments.find(t => t.id === tournamentId);
    if (t) saveTournaments([t]).catch(console.error);
  },

  refreshList: async () => {
    const all = await getTournaments();
    set({ tournaments: all });
  },
}));
