import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cacheMemory } from '@/lib/cache';
import { ELO_TIERS } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import BladerLink from '@/components/BladerLink';
import { Crown, Shield, Trophy, Medal } from 'lucide-react';

interface RankingEntry {
  playerId: string;
  userId: string | null;
  name: string;
  nickname: string;
  avatar: string;
  totalPoints: number;
  totalWins: number;
  totalLosses: number;
  tournamentsPlayed: number;
  elo: string;
}

const eloColors: Record<string, string> = {
  Ferro: '210 10% 70%',
  Bronze: '30 50% 45%',
  Prata: '210 10% 82%',
  Ouro: '45 95% 58%',
  Platina: '188 100% 50%',
  Diamante: '258 90% 75%',
};

function rankingPoints(posicao: number) {
  if (posicao === 1) return 100;
  if (posicao === 2) return 70;
  if (posicao === 3) return 50;
  if (posicao === 4) return 35;
  if (posicao <= 8) return 20;
  if (posicao <= 16) return 10;
  return 5;
}

function eloFromPoints(points: number) {
  if (points < 100) return 'Ferro';
  if (points < 300) return 'Bronze';
  if (points < 600) return 'Prata';
  if (points < 1000) return 'Ouro';
  if (points < 1500) return 'Platina';
  return 'Diamante';
}

async function fetchRanking(): Promise<RankingEntry[]> {
  const { data: torneios } = await supabase
    .from('tournaments')
    .select('id')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(100);

  const torneioIds = (torneios ?? []).map((t) => t.id);
  if (!torneioIds.length) return [];

  const { data: inscricoes, error } = await supabase
    .from('inscricoes')
    .select('blader_id, blader_temp_id, posicao_final, vitorias, derrotas')
    .in('torneio_id', torneioIds)
    .not('posicao_final', 'is', null);

  if (error || !inscricoes?.length) return [];

  const userIds = Array.from(new Set(inscricoes.map((i) => i.blader_id).filter(Boolean))) as string[];
  const tempIds = Array.from(new Set(inscricoes.map((i) => i.blader_temp_id).filter(Boolean))) as string[];
  const [profilesRes, tempRes] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('id, nome_blader, avatar_blader_url').in('id', userIds)
      : Promise.resolve({ data: [] as any[] }),
    tempIds.length
      ? supabase.from('bladers_temp').select('id, nome, apelido, avatar_url').in('id', tempIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const tempMap = new Map((tempRes.data ?? []).map((p) => [p.id, p]));
  const rows = new Map<string, RankingEntry>();

  for (const inscricao of inscricoes) {
    const id = inscricao.blader_id || inscricao.blader_temp_id;
    const posicao = inscricao.posicao_final ?? 999;
    if (!id || posicao === 999) continue;

    const key = inscricao.blader_id ? `user:${id}` : `temp:${id}`;
    const profile = inscricao.blader_id ? profileMap.get(inscricao.blader_id) : null;
    const temp = inscricao.blader_temp_id ? tempMap.get(inscricao.blader_temp_id) : null;
    const current = rows.get(key) ?? {
      playerId: id,
      userId: inscricao.blader_id ?? null,
      name: profile?.nome_blader || temp?.nome || temp?.apelido || 'Blader',
      nickname: temp?.apelido || '',
      avatar: profile?.avatar_blader_url || temp?.avatar_url || '🔵',
      totalPoints: 0,
      totalWins: 0,
      totalLosses: 0,
      tournamentsPlayed: 0,
      elo: 'Ferro',
    };

    current.totalPoints += rankingPoints(posicao);
    current.totalWins += inscricao.vitorias ?? 0;
    current.totalLosses += inscricao.derrotas ?? 0;
    current.tournamentsPlayed += 1;
    current.elo = eloFromPoints(current.totalPoints);
    rows.set(key, current);
  }

  return Array.from(rows.values())
    .sort((a, b) => b.totalPoints - a.totalPoints || b.totalWins - a.totalWins)
    .slice(0, 50);
}

export default function Rankings() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cacheMemory('leaderboard:elo:top50', 15_000, fetchRanking)
      .then(setRankings)
      .finally(() => setLoading(false));
  }, []);

  const positionColors = ['text-gold', 'text-muted-foreground', 'text-secondary'];

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6 relative">
      <h1 className="font-heading text-3xl font-bold tracking-wider text-foreground italic neon-line-cyan pl-3 flex items-center gap-2">
        <Crown className="h-7 w-7 text-primary" /> RANKINGS
      </h1>

      {/* Elo tiers */}
      <div className="glass-panel p-4">
        <p className="font-heading text-xs text-muted-foreground tracking-[0.2em] mb-3 uppercase">Hierarquia de Elos</p>
        <div className="flex flex-wrap gap-3">
          {ELO_TIERS.map(tier => (
            <div key={tier.name} className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm" style={{ background: `hsl(${tier.color})` }} />
              <span className="text-[10px] font-heading" style={{ color: `hsl(${tier.color})` }}>{tier.name}</span>
              {tier.divisions > 0 && <span className="text-[8px] text-muted-foreground">(3-1)</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Points table */}
      <div className="glass-panel p-4">
        <p className="font-heading text-xs text-muted-foreground tracking-[0.2em] mb-3 uppercase">Pontuação por Colocação</p>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center">
          {[
            { label: '1º', pts: 100 },
            { label: '2º', pts: 70 },
            { label: '3º', pts: 50 },
            { label: '4º', pts: 35 },
            { label: '5º-8º', pts: 20 },
            { label: '9º-16º', pts: 10 },
            { label: 'Participação', pts: 5 },
          ].map(item => (
            <div key={item.label} className="dark-panel p-2 rounded-lg">
              <p className="text-[10px] font-heading text-muted-foreground">{item.label}</p>
              <p className="font-heading font-bold text-primary text-sm">{item.pts}</p>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-12 text-center">
          <div className="h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-muted-foreground font-body text-sm">Carregando ranking...</p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-body text-sm">Nenhum blader ranqueado ainda. Encerre torneios para gerar pontos!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[40px_1fr_80px_80px_80px_80px] gap-3 px-4 py-2 text-[10px] font-heading text-muted-foreground tracking-[0.15em] uppercase">
            <span>#</span>
            <span>Blader</span>
            <span className="text-right">Pontos</span>
            <span className="text-right">Vitórias</span>
            <span className="text-right">Torneios</span>
            <span className="text-right">Elo</span>
          </div>

          {rankings.map((entry, i) => {
            const eloColor = eloColors[entry.elo] || eloColors.Ferro;
            return (
              <div key={entry.playerId}
                className={`glass-panel flex items-center gap-3 p-4 anim-fade-up ${i < 3 ? 'neon-line-cyan' : ''}`}
                style={{ animationDelay: `${i * 50}ms` }}>
                
                {/* Desktop grid */}
                <div className="hidden sm:grid grid-cols-[40px_1fr_80px_80px_80px_80px] gap-3 items-center w-full">
                  <span className={`font-heading text-xl font-bold text-center italic ${i < 3 ? positionColors[i] : 'text-muted-foreground/50'}`}>
                    {i === 0 ? <Crown className="h-5 w-5 inline text-gold" /> : `#${i + 1}`}
                  </span>
                  <BladerLink name={entry.name} className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
                    <Avatar className="h-10 w-10 border-2 shrink-0" style={{ borderColor: `hsl(${eloColor} / 0.5)` }}>
                      {entry.avatar.startsWith('http') || entry.avatar.startsWith('data:') ? <AvatarImage src={entry.avatar} alt={entry.name} /> : <AvatarFallback className="bg-muted text-lg">{entry.avatar}</AvatarFallback>}
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-heading font-bold truncate text-foreground">{entry.name}</p>
                      {entry.nickname && <p className="text-[10px] text-muted-foreground">@{entry.nickname.replace(/^@/,'')}</p>}
                    </div>
                  </BladerLink>
                  <span className="font-heading text-lg font-bold text-primary text-right">{entry.totalPoints}</span>
                  <span className="font-heading text-sm text-foreground text-right">{entry.totalWins}</span>
                  <span className="font-heading text-sm text-muted-foreground text-right">{entry.tournamentsPlayed}</span>
                  <div className="flex justify-end">
                    <span className="font-heading text-xs font-bold" style={{ color: `hsl(${eloColor})` }}>{entry.elo}</span>
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="sm:hidden flex items-center gap-3 w-full">
                  <span className={`font-heading text-xl font-bold w-8 text-center italic ${i < 3 ? positionColors[i] : 'text-muted-foreground/50'}`}>
                    {i === 0 ? <Crown className="h-5 w-5 inline text-gold" /> : `#${i + 1}`}
                  </span>
                  <BladerLink name={entry.name} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                    <Avatar className="h-10 w-10 border-2 shrink-0" style={{ borderColor: `hsl(${eloColor} / 0.5)` }}>
                      {entry.avatar.startsWith('http') || entry.avatar.startsWith('data:') ? <AvatarImage src={entry.avatar} alt={entry.name} /> : <AvatarFallback className="bg-muted text-lg">{entry.avatar}</AvatarFallback>}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold truncate text-foreground">{entry.name}</p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-0.5"><Trophy className="h-3 w-3" />{entry.totalWins}W</span>
                        <span className="flex items-center gap-0.5"><Medal className="h-3 w-3" />{entry.tournamentsPlayed}T</span>
                      </div>
                    </div>
                  </BladerLink>
                  <div className="text-right shrink-0">
                    <span className="font-heading text-lg font-bold text-primary">{entry.totalPoints}</span>
                    <div className="mt-0.5 font-heading text-[10px] font-bold" style={{ color: `hsl(${eloColor})` }}>{entry.elo}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
