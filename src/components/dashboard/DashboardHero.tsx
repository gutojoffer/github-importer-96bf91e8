import { Trophy, Users, Swords, Zap } from 'lucide-react';
import React from 'react';
import { useLiga } from '@/contexts/LigaContext';

interface Stats {
  totalTournaments: number;
  totalBladers: number;
  activeTournaments: number;
}

const DashboardHero = React.memo(({ stats }: { stats: Stats }) => {
  const { nomeLiga } = useLiga();

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{
      background: 'linear-gradient(135deg, #0B1020 0%, #111B33 50%, #0B1020 100%)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 30% 50%, rgba(37,99,235,0.12) 0%, transparent 60%)',
      }} />

      <div className="relative z-10 flex items-end justify-between p-8 md:p-10 min-h-[220px]">
        {/* Left content - slides in */}
        <div className="hero-slide-in-left flex-1 min-w-0">
          <p className="font-heading text-[11px] font-bold tracking-[4px] uppercase text-[#2563EB] mb-2">
            SISTEMA DE TORNEIOS
          </p>
          <h1 className="font-heading text-[48px] sm:text-[56px] font-bold tracking-wider text-white leading-none mb-2">
            BLADE<span className="text-[#2563EB]">X</span>
          </h1>
          <p className="text-sm text-muted-foreground font-body mb-6">
            {nomeLiga ? `Liga ${nomeLiga}` : 'Organizador de Torneios'}
          </p>

          <div className="flex items-center gap-6 sm:gap-10">
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-heading text-2xl font-bold text-[#2563EB]">{stats.totalTournaments}</span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-body">Torneios</span>
            </div>
            <div className="w-px h-8 bg-[rgba(255,255,255,0.08)]" />
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-heading text-2xl font-bold text-foreground">{stats.totalBladers}</span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-body">Bladers</span>
            </div>
            <div className="w-px h-8 bg-[rgba(255,255,255,0.08)]" />
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-heading text-2xl font-bold text-[#F59E0B]">{stats.activeTournaments}</span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-body">Ativos</span>
            </div>
          </div>
        </div>

        {/* Right decorative element - slides in */}
        <div className="hero-slide-in-right hidden md:flex items-end justify-end" style={{
          maskImage: 'linear-gradient(to left, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, black 50%, transparent 100%)',
        }}>
          <div className="relative w-[200px] h-[180px] flex items-center justify-center opacity-20">
            <Swords className="w-32 h-32 text-[#2563EB]" />
          </div>
        </div>
      </div>
    </div>
  );
});

export default DashboardHero;
