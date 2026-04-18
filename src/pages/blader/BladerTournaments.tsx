import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Trophy, Calendar, MapPin, Users, Filter } from 'lucide-react';

interface TournamentRow {
  id: string;
  name: string;
  date: string;
  status: string;
  liga_id: string | null;
  player_ids: string[];
  max_players: number | null;
}

interface LigaRow {
  id: string;
  nome_liga: string | null;
  cidade: string | null;
  logo_url: string | null;
}

type FilterMode = 'todos' | 'inscritos' | 'disponiveis';

export default function BladerTournaments() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterMode>('todos');

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['blader-tournaments-open'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('id, name, date, status, liga_id, player_ids, max_players')
        .eq('status', 'upcoming')
        .order('date', { ascending: true });
      return (data ?? []) as TournamentRow[];
    },
  });

  const ligaIds = Array.from(new Set(tournaments.map(t => t.liga_id).filter(Boolean) as string[]));
  const { data: ligas = [] } = useQuery({
    queryKey: ['blader-ligas', ligaIds],
    queryFn: async () => {
      if (ligaIds.length === 0) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, nome_liga, cidade, logo_url')
        .in('id', ligaIds);
      return (data ?? []) as LigaRow[];
    },
    enabled: ligaIds.length > 0,
  });

  const ligaById = new Map(ligas.map(l => [l.id, l]));

  const { data: myPlayerIds = [] } = useQuery({
    queryKey: ['blader-player-ids', user?.id, profile?.nome],
    queryFn: async () => {
      if (!profile?.nome) return [];
      const { data } = await supabase.from('players').select('id').eq('name', profile.nome);
      return (data ?? []).map(p => p.id);
    },
    enabled: !!profile?.nome,
  });

  const enriched = tournaments.map(t => ({
    ...t,
    inscrito: t.player_ids.some(pid => myPlayerIds.includes(pid)),
    cheio: t.max_players != null && t.player_ids.length >= t.max_players,
    liga: t.liga_id ? ligaById.get(t.liga_id) : undefined,
  }));

  const filtered = enriched.filter(t => {
    if (filter === 'inscritos') return t.inscrito;
    if (filter === 'disponiveis') return !t.inscrito && !t.cheio;
    return true;
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="font-heading font-bold text-foreground flex items-center gap-2" style={{ fontSize: 22 }}>
          <Trophy size={22} style={{ color: '#FBBF24' }} /> Torneios
        </h1>
        <p className="text-sm text-muted-foreground font-body mt-1">
          Inscreva-se nos torneios abertos das ligas.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter size={14} className="shrink-0" style={{ color: '#64748B' }} />
        {(['todos', 'disponiveis', 'inscritos'] as FilterMode[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="shrink-0 rounded-full font-body font-medium text-xs transition-all"
            style={{
              padding: '6px 14px',
              background: filter === f ? '#F59E0B' : 'rgba(255,255,255,.04)',
              color: filter === f ? '#0a0d18' : '#9CA3AF',
              border: filter === f ? 'none' : '1px solid rgba(255,255,255,.08)',
            }}
          >
            {f === 'todos' ? 'Todos' : f === 'disponiveis' ? 'Disponíveis' : 'Meus'}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,.04)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.08)' }}>
          <Trophy size={32} className="mx-auto mb-2" style={{ color: '#374151' }} />
          <p className="text-sm text-muted-foreground font-body">
            {filter === 'inscritos' ? 'Você ainda não está inscrito em nenhum torneio.' : 'Nenhum torneio disponível.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <div
              key={t.id}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,.07)' }}
            >
              {/* Logo da liga */}
              <div className="shrink-0">
                {t.liga?.logo_url ? (
                  <img src={t.liga.logo_url} alt="" className="rounded-lg object-cover" style={{ width: 44, height: 44, border: '1px solid rgba(255,255,255,.08)' }} />
                ) : (
                  <div className="rounded-lg flex items-center justify-center" style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #1e3a8a, #2563EB)' }}>
                    <Trophy size={20} className="text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-foreground truncate" style={{ fontSize: 14 }}>
                  {t.name}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-muted-foreground font-body">
                  {t.liga?.nome_liga && <span className="truncate">{t.liga.nome_liga}</span>}
                  {t.liga?.cidade && <><span>•</span><span className="flex items-center gap-1"><MapPin size={10} />{t.liga.cidade}</span></>}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs font-body" style={{ color: '#64748B' }}>
                  <span className="flex items-center gap-1"><Calendar size={10} />{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Users size={10} />{t.player_ids.length}{t.max_players ? `/${t.max_players}` : ''}</span>
                </div>
              </div>

              {/* CTA */}
              <div className="shrink-0">
                {t.inscrito ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-body font-medium text-xs"
                    style={{ background: 'rgba(16,185,129,.15)', color: '#10B981', border: '1px solid rgba(16,185,129,.3)' }}
                  >
                    ✓ Inscrito
                  </span>
                ) : t.cheio ? (
                  <span className="text-xs font-body" style={{ color: '#EF4444' }}>Esgotado</span>
                ) : (
                  <button
                    onClick={() => navigate(`/signup/${t.id}`)}
                    className="rounded-lg px-3 py-1.5 font-body font-medium text-xs transition-all"
                    style={{ background: '#F59E0B', color: '#0a0d18' }}
                  >
                    Inscrever-se
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
