import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useTournamentStore } from '@/stores/useTournamentStore';
import { Player } from '@/types/tournament';
import { Trophy, Calendar, Users, Swords, ChevronRight, Plus, Clock } from 'lucide-react';
import DashboardHero from '@/components/dashboard/DashboardHero';
import TournamentCard from '@/components/dashboard/TournamentCard';
import TopBladers from '@/components/dashboard/TopBladers';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import BatchEnrollModal from '@/components/BatchEnrollModal';

const Index = () => {
  const players = usePlayerStore(s => s.players);
  const loadPlayers = usePlayerStore(s => s.load);
  const { tournaments, load: loadTournaments } = useTournamentStore();
  const [batchEnrollTournamentId, setBatchEnrollTournamentId] = useState<string | null>(null);

  useEffect(() => {
    loadPlayers();
    loadTournaments();
  }, []);

  const upcoming = useMemo(() => tournaments.filter(t => t.status === 'upcoming'), [tournaments]);
  const active = useMemo(() => tournaments.filter(t => t.status === 'active'), [tournaments]);
  const completed = useMemo(() => tournaments.filter(t => t.status === 'completed'), [tournaments]);

  const stats = useMemo(() => ({
    totalTournaments: tournaments.length,
    totalBladers: players.length,
    activeTournaments: active.length,
  }), [tournaments.length, players.length, active.length]);

  const batchEnrollTournament = useMemo(() =>
    batchEnrollTournamentId ? tournaments.find(t => t.id === batchEnrollTournamentId) : null
  , [batchEnrollTournamentId, tournaments]);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Batch Enrollment Modal */}
      {batchEnrollTournament && (
        <BatchEnrollModal
          tournamentId={batchEnrollTournament.id}
          tournamentName={batchEnrollTournament.name}
          enrolledPlayerIds={batchEnrollTournament.playerIds}
          allPlayers={players}
          onClose={() => setBatchEnrollTournamentId(null)}
        />
      )}

      {/* Hero Section */}
      <DashboardHero stats={stats} />

      {/* Upcoming Tournaments */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[3px] h-5 rounded-full bg-primary" />
          <h2 className="font-heading text-xl font-bold tracking-wider text-foreground">PRÓXIMOS TORNEIOS</h2>
          <div className="flex-1" />
          <Link to="/tournament" className="text-xs text-primary hover:text-primary/80 font-body font-medium transition-colors flex items-center gap-1">
            Ver todos <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {upcoming.length === 0 && active.length === 0 ? (
          <div className="surface-panel p-10 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-[rgba(79,142,247,0.08)] border border-[rgba(79,142,247,0.2)] mb-4">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <p className="font-heading text-lg text-foreground font-bold mb-1">Nenhum torneio agendado</p>
            <p className="text-sm text-muted-foreground font-body mb-4">Crie seu primeiro torneio e comece a competição!</p>
            <Link
              to="/tournament"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-body font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Criar Torneio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[...active, ...upcoming].map((t, i) => (
              <TournamentCard key={t.id} tournament={t} players={players} index={i} onBatchEnroll={(id) => setBatchEnrollTournamentId(id)} />
            ))}
          </div>
        )}
      </section>

      {/* Bottom Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopBladers players={players} />
        <ActivityFeed tournaments={tournaments} players={players} />
      </div>
    </div>
  );
};

export default Index;
