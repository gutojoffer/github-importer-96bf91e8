import React from 'react';
import { Link } from 'react-router-dom';
import { Player, Tournament } from '@/types/tournament';
import { Calendar, Users } from 'lucide-react';

interface Props {
  tournament: Tournament;
  players: Player[];
  index: number;
}

const TournamentCard = React.memo(({ tournament: t, players, index }: Props) => {
  const spotsLeft = (t.maxPlayers || 32) - t.playerIds.length;
  const fillPercent = Math.min(100, (t.playerIds.length / (t.maxPlayers || 32)) * 100);

  const statusConfig = {
    active: { label: 'Em andamento', color: 'bg-success text-white' },
    upcoming: spotsLeft <= 0
      ? { label: 'Lotado', color: 'bg-destructive text-white' }
      : spotsLeft <= 5
        ? { label: 'Quase lotado', color: 'bg-gold text-black' }
        : { label: 'Aberto', color: 'bg-success text-white' },
    completed: { label: 'Finalizado', color: 'bg-muted text-muted-foreground' },
  };

  const status = statusConfig[t.status] || statusConfig.upcoming;
  const accentColor = t.status === 'active' ? 'from-success' : 'from-primary';

  return (
    <Link
      to={t.status === 'active' ? '/tournament' : `/signup/${t.id}`}
      className="surface-panel group hover:bg-[hsl(var(--surface2))] hover:border-[rgba(79,142,247,0.25)] hover:-translate-y-[1px] transition-all duration-200 block overflow-hidden anim-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Top accent line */}
      <div className={`h-[2px] w-full bg-gradient-to-r ${accentColor} to-transparent`} />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-base font-bold text-foreground tracking-wide truncate">{t.name}</h3>
          <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full shrink-0 ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            {t.playerIds.length} / {t.maxPlayers || 32}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full bg-[rgba(255,255,255,0.05)]">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>
    </Link>
  );
});

export default TournamentCard;
