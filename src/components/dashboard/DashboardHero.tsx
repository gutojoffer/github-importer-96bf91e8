import { Trophy, Users, Swords } from 'lucide-react';
import React from 'react';
import LigaLogo from '@/components/LigaLogo';
import { useLiga } from '@/contexts/LigaContext';

interface Stats {
  totalTournaments: number;
  totalBladers: number;
  activeTournaments: number;
}

const StatCard = React.memo(({ value, label, color }: { value: number; label: string; color: 'blue' | 'white' | 'gold' }) => {
  const colorMap = {
    blue: 'text-primary',
    white: 'text-foreground',
    gold: 'text-gold',
  };
  return (
    <div className="flex flex-col items-center gap-1 min-w-[80px]">
      <span className={`font-heading text-3xl font-bold ${colorMap[color]}`}>{value}</span>
      <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-body font-medium">{label}</span>
    </div>
  );
});

const DashboardHero = React.memo(({ stats }: { stats: Stats }) => {
  const { nomeLiga } = useLiga();
  
  return (
    <div className="surface-panel p-8 relative overflow-hidden">
      {/* Subtle overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 80% 50%, rgba(79,142,247,0.08), transparent 70%)'
      }} />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <LigaLogo size={96} className="hidden sm:block" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-body font-semibold mb-1">
              {nomeLiga || 'Organizador de Torneios'}
            </p>
            <h1 className="font-heading text-4xl sm:text-[40px] font-bold tracking-wider text-foreground leading-tight">
              ARENA <span className="text-primary">X</span>
            </h1>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-body mt-1">
              BEYBLADE X · ORGANIZADOR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 sm:gap-10">
          <StatCard value={stats.totalTournaments} label="Torneios" color="blue" />
          <StatCard value={stats.totalBladers} label="Bladers" color="white" />
          <StatCard value={stats.activeTournaments} label="Ativos" color="gold" />
        </div>
      </div>
    </div>
  );
});

export default DashboardHero;
