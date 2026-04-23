import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Calendar, MapPin, Users, Trophy, ChevronDown, X } from 'lucide-react';

interface TournamentData {
  id: string;
  name: string;
  date: string;
  status: string;
  liga_id: string | null;
  player_ids: string[];
  max_players: number | null;
  local_nome: string | null;
  local_endereco: string | null;
  local_cidade: string | null;
  local_estado: string | null;
  horario_inicio: string | null;
  horario_fim: string | null;
  descricao: string | null;
  imagem_url: string | null;
  premio: string | null;
  regras: string | null;
}

interface LigaInfo {
  nome_liga: string | null;
  cidade: string | null;
  logo_url: string | null;
}

interface Props {
  tournament: TournamentData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInscrito?: () => void;
}

export default function BladerTournamentModal({ tournament, open, onOpenChange, onInscrito }: Props) {
  const { user } = useAuth();
  const [inscrito, setInscrito] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showClose, setShowClose] = useState(false);
  const [liga, setLiga] = useState<LigaInfo | null>(null);
  const [inscritosCount, setInscritosCount] = useState(0);

  useEffect(() => {
    if (!open || !tournament || !user) { setChecking(false); return; }
    setInscrito(false);
    setShowClose(false);
    setChecking(true);

    const checkInscricao = async () => {
      const { data } = await supabase
        .from('inscricoes')
        .select('id')
        .eq('torneio_id', tournament.id)
        .eq('blader_id', user.id)
        .maybeSingle();
      setInscrito(!!data);

      const { count } = await supabase
        .from('inscricoes')
        .select('*', { count: 'exact', head: true })
        .eq('torneio_id', tournament.id);
      setInscritosCount(count ?? tournament.player_ids.length);

      if (tournament.liga_id) {
        const { data: ligaData } = await supabase
          .from('profiles')
          .select('nome_liga, cidade, logo_url')
          .eq('id', tournament.liga_id)
          .maybeSingle();
        setLiga(ligaData as LigaInfo | null);
      }
      setChecking(false);
    };
    checkInscricao();
  }, [open, tournament?.id, user?.id]);

  const maxPlayers = tournament?.max_players ?? 32;
  const vagasEsgotadas = inscritosCount >= maxPlayers;

  const dataFormatada = tournament?.horario_inicio
    ? new Date(tournament.horario_inicio).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : tournament?.date
      ? new Date(tournament.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
      : '';

  async function handleInscrever() {
    if (!tournament || !user) return;
    setLoading(true);
    const { error } = await supabase
      .from('inscricoes')
      .insert({ torneio_id: tournament.id, blader_id: user.id, status: 'confirmado' });

    if (error) {
      toast.error('Erro ao realizar inscrição');
      setLoading(false);
      return;
    }

    setInscrito(true);
    setInscritosCount(c => c + 1);
    setLoading(false);
    onInscrito?.();

    // Show close button after 1.5s
    setTimeout(() => setShowClose(true), 1500);

    // Notify organizer
    if (tournament.liga_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome_blader')
        .eq('id', user.id)
        .maybeSingle();
      const bladerNome = (profile as any)?.nome_blader || 'Um blader';
      await supabase.from('notificacoes').insert({
        user_id: tournament.liga_id,
        tipo: 'nova_inscricao',
        mensagem: `${bladerNome} se inscreveu no torneio "${tournament.name}"`,
      });
    }
  }

  if (!tournament) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 overflow-hidden border-0 max-w-[480px] w-full [&>button:last-child]:hidden"
        style={{
          background: '#0d1120',
          border: '1px solid rgba(0,220,255,.15)',
          borderRadius: 20,
        }}
      >
        {/* Header image */}
        {tournament.imagem_url ? (
          <div className="relative" style={{ height: 160, overflow: 'hidden' }}>
            <img src={tournament.imagem_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0d1120, transparent 60%)' }} />
            <h2
              className="absolute bottom-4 left-5 right-5 font-heading font-bold text-foreground"
              style={{ fontSize: 24, lineHeight: 1.2 }}
            >
              {tournament.name}
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full"
              style={{ background: 'rgba(0,0,0,.5)' }}
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        ) : (
          <div className="relative" style={{ height: 80, overflow: 'hidden', background: 'linear-gradient(135deg, #0a1428, #0d1f3c)' }}>
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(37,99,235,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.04) 1px,transparent 1px)',
              backgroundSize: '24px 24px',
            }} />
            <h2
              className="absolute bottom-3 left-5 right-12 font-heading font-bold text-foreground"
              style={{ fontSize: 20, lineHeight: 1.2 }}
            >
              {tournament.name}
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full"
              style={{ background: 'rgba(0,0,0,.3)' }}
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-5 pb-5 space-y-4">
          {/* Liga info */}
          {liga && (
            <div className="flex items-center gap-3 py-2">
              {liga.logo_url ? (
                <img src={liga.logo_url} alt="" className="rounded-lg object-cover" style={{ width: 40, height: 40, border: '1px solid rgba(255,255,255,.08)' }} />
              ) : (
                <div className="rounded-lg flex items-center justify-center" style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #1e3a8a, #2563EB)' }}>
                  <Trophy size={18} className="text-white" />
                </div>
              )}
              <div>
                <p className="font-heading font-bold text-foreground" style={{ fontSize: 13 }}>{liga.nome_liga || 'Liga'}</p>
                {liga.cidade && <p className="text-xs text-muted-foreground font-body">{liga.cidade}</p>}
              </div>
            </div>
          )}

          <div style={{ height: 1, background: 'rgba(255,255,255,.06)' }} />

          {/* Info rows */}
          <div className="space-y-2.5 font-body text-sm">
            <div className="flex items-center gap-2.5">
              <Calendar size={14} style={{ color: '#60A5FA' }} />
              <span className="text-foreground">{dataFormatada}</span>
            </div>
            {(tournament.local_nome || tournament.local_cidade) && (
              <div className="flex items-start gap-2.5">
                <MapPin size={14} style={{ color: '#60A5FA', marginTop: 2 }} />
                <div>
                  <span className="text-foreground">
                    {tournament.local_nome}{tournament.local_cidade ? ` · ${tournament.local_cidade}` : ''}
                    {tournament.local_estado ? ` - ${tournament.local_estado}` : ''}
                  </span>
                  {tournament.local_endereco && (
                    <p className="text-xs text-muted-foreground mt-0.5">{tournament.local_endereco}</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <Users size={14} style={{ color: '#60A5FA' }} />
              <span className="text-foreground">{inscritosCount} inscritos / {maxPlayers} vagas</span>
            </div>
            {tournament.premio && (
              <div className="flex items-center gap-2.5">
                <Trophy size={14} style={{ color: '#FBBF24' }} />
                <span className="text-foreground">{tournament.premio}</span>
              </div>
            )}
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,.06)' }} />

          {/* Description */}
          {tournament.descricao && (
            <p className="text-sm text-muted-foreground font-body" style={{ fontSize: 13 }}>{tournament.descricao}</p>
          )}

          {/* Rules collapsible */}
          {tournament.regras && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-xs font-heading font-bold text-muted-foreground tracking-wider w-full">
                📋 REGRAS ESPECIAIS <ChevronDown size={12} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="text-xs text-muted-foreground font-body mt-2 whitespace-pre-wrap">{tournament.regras}</p>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Footer action */}
          {checking ? (
            <div className="h-12 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,.04)' }} />
          ) : inscrito ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: '#00DCFF', marginBottom: 4 }}>
                Inscrição confirmada!
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>
                Você está inscrito em {tournament.name}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginTop: 4 }}>
                📅 {dataFormatada}{tournament.local_nome ? ` · 📍 ${tournament.local_nome}` : ''}
              </div>
              {showClose && (
                <button
                  onClick={() => onOpenChange(false)}
                  className="mt-4 font-heading font-bold tracking-wider text-sm"
                  style={{ color: 'rgba(255,255,255,.4)' }}
                >
                  Fechar
                </button>
              )}
            </div>
          ) : vagasEsgotadas ? (
            <button
              disabled
              style={{
                width: '100%', padding: 13,
                background: 'rgba(239,68,68,.1)',
                border: '1px solid rgba(239,68,68,.2)',
                borderRadius: 12,
                color: '#F87171',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700, fontSize: 16,
                letterSpacing: 1, cursor: 'not-allowed', opacity: 0.6,
              }}
            >
              Vagas esgotadas
            </button>
          ) : (
            <button
              onClick={handleInscrever}
              disabled={loading}
              style={{
                width: '100%', padding: 13,
                background: 'linear-gradient(135deg, rgba(0,220,255,.2), rgba(0,220,255,.1))',
                border: '1px solid rgba(0,220,255,.3)',
                borderRadius: 12,
                color: '#00DCFF',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700, fontSize: 16,
                letterSpacing: 1,
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all .2s',
              }}
            >
              {loading ? 'Inscrevendo...' : '⚡ INSCREVER-SE'}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
