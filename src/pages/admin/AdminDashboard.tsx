import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Swords, Trophy, Disc3 } from 'lucide-react';
import SkeletonBox from '@/components/SkeletonBox';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const [ligas, players, tournaments, beyblades] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('players').select('id', { count: 'exact', head: true }),
        supabase.from('tournaments').select('id, created_at', { count: 'exact' }).gte('created_at', monthStart),
        supabase.from('beyblades_meta').select('id', { count: 'exact', head: true }),
      ]);

      return {
        ligas: ligas.count ?? 0,
        players: players.count ?? 0,
        tournamentsMonth: tournaments.count ?? 0,
        beyblades: beyblades.count ?? 0,
      };
    },
  });

  const { data: recentLigas, isLoading: ligasLoading } = useQuery({
    queryKey: ['admin-recent-ligas'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, nome_liga, cidade, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const statCards = [
    { label: 'Total de Ligas', value: stats?.ligas ?? 0, icon: Users, color: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-400' },
    { label: 'Total de Bladers', value: stats?.players ?? 0, icon: Swords, color: 'from-green-500/20 to-green-500/5', iconColor: 'text-green-400' },
    { label: 'Torneios este mês', value: stats?.tournamentsMonth ?? 0, icon: Trophy, color: 'from-amber-500/20 to-amber-500/5', iconColor: 'text-amber-400' },
    { label: 'Beyblades no Meta', value: stats?.beyblades ?? 0, icon: Disc3, color: 'from-purple-500/20 to-purple-500/5', iconColor: 'text-purple-400' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Visão geral da plataforma Arena X</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={`rounded-xl border border-[rgba(255,255,255,0.07)] bg-gradient-to-br ${s.color} p-5`}>
            {isLoading ? (
              <SkeletonBox className="h-14 w-full" />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wide">{s.label}</p>
                  <p className="font-heading text-3xl font-bold text-foreground mt-1">{s.value}</p>
                </div>
                <s.icon className={`h-5 w-5 ${s.iconColor}`} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Ligas */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[hsl(var(--bg2))]">
        <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="font-heading text-base font-bold text-foreground">Ligas recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-body uppercase tracking-wide">Nome</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-body uppercase tracking-wide">Cidade</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-body uppercase tracking-wide">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {ligasLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[rgba(255,255,255,0.04)]">
                    <td className="px-5 py-3"><SkeletonBox className="h-4 w-32" /></td>
                    <td className="px-5 py-3"><SkeletonBox className="h-4 w-24" /></td>
                    <td className="px-5 py-3"><SkeletonBox className="h-4 w-20" /></td>
                  </tr>
                ))
              ) : recentLigas?.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground font-body">Nenhuma liga cadastrada</td>
                </tr>
              ) : (
                recentLigas?.map((liga) => (
                  <tr key={liga.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-5 py-3 font-body font-medium text-foreground">{liga.nome_liga || '—'}</td>
                    <td className="px-5 py-3 font-body text-muted-foreground">{liga.cidade || '—'}</td>
                    <td className="px-5 py-3 font-body text-muted-foreground">
                      {liga.created_at ? new Date(liga.created_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
