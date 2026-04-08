import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useRef, useState } from 'react';
import { Trophy, ChevronLeft, ChevronRight, Disc3, Calendar, Users, MapPin } from 'lucide-react';
import promoImage from '@/assets/beyblade-heroes.png';

// ─── Particle Canvas ───
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; r: number; speed: number; color: string; opacity: number }[] = [];

    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.5 ? '#3B82F6' : '#EF4444',
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const p of particles) {
        p.y -= p.speed;
        if (p.y < -10) { p.y = canvas!.height + 10; p.x = Math.random() * canvas!.width; }
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = p.opacity;
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ─── Infinite Scroll Strip ───
function InfiniteScroll({ children, reverse = false, duration = 30 }: { children: React.ReactNode; reverse?: boolean; duration?: number }) {
  return (
    <div className="overflow-hidden relative">
      <div
        className="flex gap-6 w-max"
        style={{
          animation: `${reverse ? 'scrollReverse' : 'scrollForward'} ${duration}s linear infinite`,
        }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

// ─── Tier colors ───
const TIER_COLORS: Record<string, string> = {
  S: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  A: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  B: 'bg-green-500/20 text-green-400 border-green-500/30',
  C: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const TAG_COLORS: Record<string, string> = {
  novo: 'bg-green-500/20 text-green-400 border-green-500/30',
  melhoria: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  fix: 'bg-red-500/20 text-red-400 border-red-500/30',
  destaque: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // ─── Data queries ───
  const { data: ligas } = useQuery({
    queryKey: ['landing-ligas'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, nome_liga, logo_url, cidade')
        .not('logo_url', 'is', null)
        .order('created_at');
      return data ?? [];
    },
  });

  const { data: beyblades } = useQuery({
    queryKey: ['landing-beyblades'],
    queryFn: async () => {
      const { data } = await supabase
        .from('beyblades_meta')
        .select('*')
        .eq('ativo', true)
        .eq('destaque', true)
        .order('ordem');
      return data ?? [];
    },
  });

  const { data: tournaments } = useQuery({
    queryKey: ['landing-tournaments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'upcoming')
        .order('date', { ascending: true })
        .limit(6);
      return data ?? [];
    },
  });

  const { data: releaseNotes } = useQuery({
    queryKey: ['landing-release-notes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('release_notes')
        .select('*')
        .eq('publicado', true)
        .order('data', { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const [tournamentIdx, setTournamentIdx] = useState(0);

  if (loading) return null;
  if (user) return <Navigate to="/home" replace />;

  return (
    <div className="min-h-screen bg-[#060912] text-white overflow-hidden">
      <style>{`
        @keyframes scrollForward { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes scrollReverse { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        @keyframes heroSlideLeft { 0% { transform: translateX(-50px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes heroSlideRight { 0% { transform: translateX(60px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes pulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>

      {/* ════════ NAVBAR ════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(6,9,18,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #1e3a8a, #2563EB)',
            border: '1px solid rgba(37,99,235,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 12, color: '#fff',
          }}>BX</div>
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: 0.5 }}>
            BLADE<span style={{ color: '#60A5FA' }}>X</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'transparent', border: '1.5px solid rgba(255,255,255,.2)',
              color: '#E2E8F0', borderRadius: 8, padding: '8px 18px',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', transition: 'all 0.15s', letterSpacing: 0.5,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.2)'; }}
          >Entrar</button>
          <button
            onClick={() => navigate('/cadastro')}
            className="hidden sm:block"
            style={{
              background: '#2563EB', border: 'none', color: '#fff',
              borderRadius: 8, padding: '8px 18px',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', transition: 'background 0.15s', letterSpacing: 0.5,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
          >Criar liga</button>
        </div>
      </nav>

      {/* ════════ HERO ════════ */}
      <section className="relative min-h-[90vh] flex items-center" style={{ overflow: 'hidden', position: 'relative' }}>
        {/* Bg gradient + grid */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 70% 60% at 55% 40%, rgba(37,99,235,0.1), transparent)',
        }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black, transparent)',
        }} />

        <ParticleCanvas />

        {/* Promo image — desktop */}
        <img
          src={promoImage}
          alt="Beyblade X"
          className="absolute pointer-events-none hidden md:block"
          style={{
            right: 0,
            bottom: 0,
            height: '95%',
            width: 'auto',
            maxWidth: '58%',
            objectFit: 'contain',
            objectPosition: 'bottom right',
            maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 92%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 92%)',
          }}
        />
        {/* Promo image — mobile bg */}
        <img
          src={promoImage}
          alt=""
          className="absolute inset-0 pointer-events-none md:hidden"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            opacity: 0.12,
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-[600px] px-6 sm:px-12 lg:px-20 py-20" style={{ animation: 'heroSlideLeft 0.8s ease-out both' }}>
          {/* Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500" style={{ animation: 'pulseDot 2s ease-in-out infinite' }} />
            <span className="text-[11px] font-heading font-bold tracking-[2px] uppercase text-blue-400">SISTEMA OFICIAL DE TORNEIOS</span>
          </div>

          <h1 className="font-heading font-bold leading-[1.05] mb-6" style={{ fontSize: 'clamp(52px, 8vw, 92px)' }}>
            <span className="text-white">O SISTEMA</span><br />
            <span className="text-[#60A5FA]">BLADEX</span>
          </h1>

          <p className="text-[15px] text-muted-foreground font-body leading-relaxed mb-8 max-w-md">
            Organize torneios, gerencie ligas e acompanhe rankings em tempo real. A plataforma definitiva para a comunidade Beyblade X.
          </p>

          <div className="flex items-center gap-3 mb-8">
            <Link to="/cadastro" className="px-7 py-3.5 rounded-xl font-body font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              Criar minha liga
            </Link>
            <Link to="/login" className="px-7 py-3.5 rounded-xl font-body font-semibold text-sm text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 transition-colors">
              Ver torneios
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            {[
              { n: '200+', l: 'Bladers' },
              { n: '48', l: 'Torneios' },
              { n: '12', l: 'Ligas' },
            ].map((s) => (
              <div key={s.l} className="flex flex-col">
                <span className="font-heading text-xl font-bold text-white">{s.n}</span>
                <span className="text-xs text-muted-foreground font-body">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ LIGAS PARCEIRAS ════════ */}
      {ligas && ligas.length > 0 && (
        <section className="py-16 border-t border-[rgba(255,255,255,0.05)]">
          <div className="text-center mb-8 px-6">
            <h2 className="font-heading text-2xl font-bold text-white">Ligas parceiras</h2>
            <p className="text-sm text-muted-foreground font-body mt-2">Ligas que confiam no BLADEX para seus torneios</p>
          </div>
          <InfiniteScroll duration={30}>
            {ligas.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] shrink-0">
                <img src={l.logo_url!} alt={l.nome_liga || ''} className="w-12 h-12 rounded-full object-cover border border-[rgba(255,255,255,0.1)]" />
                <div>
                  <p className="font-heading text-sm font-bold text-white">{l.nome_liga || 'Liga'}</p>
                  {l.cidade && <p className="text-xs text-muted-foreground font-body">{l.cidade}</p>}
                </div>
              </div>
            ))}
          </InfiniteScroll>
        </section>
      )}

      {/* ════════ BEYBLADES DO META ════════ */}
      {beyblades && beyblades.length > 0 && (
        <section className="py-16 border-t border-[rgba(255,255,255,0.05)]">
          <div className="text-center mb-8 px-6">
            <h2 className="font-heading text-2xl font-bold text-white">Beyblades em destaque</h2>
            <p className="text-sm text-muted-foreground font-body mt-2">As melhores combinações do meta atual, curadas pelo time BLADEX</p>
          </div>
          <InfiniteScroll reverse duration={35}>
            {beyblades.map((b) => (
              <div key={b.id} className="shrink-0 w-[180px] h-[240px] rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#111827] overflow-hidden flex flex-col items-center p-4 relative">
                <span className={`absolute top-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded border ${TIER_COLORS[b.tier]}`}>{b.tier}</span>
                <div className="w-[140px] h-[140px] flex items-center justify-center mb-3">
                  {b.imagem_url ? (
                    <img src={b.imagem_url} alt={b.nome} className="w-full h-full object-contain" />
                  ) : (
                    <Disc3 className="w-16 h-16 text-muted-foreground/30" />
                  )}
                </div>
                <p className="font-heading text-sm font-bold text-white text-center leading-tight">{b.nome}</p>
                <p className="text-[11px] text-muted-foreground font-body">{b.ratchet} · {b.bit}</p>
                <span className="mt-1 text-[10px] font-body px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] text-muted-foreground">{b.tipo}</span>
              </div>
            ))}
          </InfiniteScroll>
        </section>
      )}

      {/* ════════ PRÓXIMOS TORNEIOS ════════ */}
      {tournaments && tournaments.length > 0 && (
        <section className="py-16 border-t border-[rgba(255,255,255,0.05)] px-6 sm:px-12 lg:px-20 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-2xl font-bold text-white">Próximos torneios</h2>
              <p className="text-sm text-muted-foreground font-body mt-1">Campeonatos abertos para inscrição</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setTournamentIdx(Math.max(0, tournamentIdx - 1))} className="p-2 rounded-lg border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-30" disabled={tournamentIdx === 0}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setTournamentIdx(Math.min(tournaments.length - 1, tournamentIdx + 1))} className="p-2 rounded-lg border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-30" disabled={tournamentIdx >= tournaments.length - 1}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.slice(tournamentIdx, tournamentIdx + 3).map((t) => (
              <div key={t.id} className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111827] p-5 hover:border-blue-500/20 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 text-blue-400" />
                  <h3 className="font-heading text-base font-bold text-white truncate">{t.name}</h3>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground font-body">
                  <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {t.date}</div>
                  <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> {t.player_ids?.length || 0} inscritos{t.max_players ? ` / ${t.max_players}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ════════ RELEASE NOTES ════════ */}
      {releaseNotes && releaseNotes.length > 0 && (
        <section className="py-16 border-t border-[rgba(255,255,255,0.05)] px-6 sm:px-12 lg:px-20 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl font-bold text-white">Novidades</h2>
            <p className="text-sm text-muted-foreground font-body mt-2">Últimas atualizações da plataforma</p>
          </div>

          <div className="relative">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[rgba(255,255,255,0.08)] hidden md:block" />

            <div className="space-y-8">
              {releaseNotes.map((note, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <div key={note.id} className={`relative flex ${isLeft ? 'md:justify-start' : 'md:justify-end'} justify-end`}>
                    {/* Dot on timeline */}
                    <div className="absolute left-1/2 top-4 w-3 h-3 rounded-full bg-blue-500 border-2 border-[#060912] -translate-x-1/2 hidden md:block z-10" />
                    <div className={`w-full md:w-[45%] rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111827] p-5`}>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs text-muted-foreground font-body">{new Date(note.data).toLocaleDateString('pt-BR')}</span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${TAG_COLORS[note.tag] || TAG_COLORS.novo}`}>{note.tag}</span>
                        <span className="font-heading text-xs font-bold text-blue-400">v{note.versao}</span>
                      </div>
                      <h3 className="font-heading text-base font-bold text-white mb-1">{note.titulo}</h3>
                      <p className="text-sm text-muted-foreground font-body whitespace-pre-line leading-relaxed">{note.descricao}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ════════ CTA ════════ */}
      <section className="py-20 border-t border-[rgba(255,255,255,0.05)]" style={{ background: 'linear-gradient(180deg, rgba(37,99,235,0.06) 0%, transparent 100%)' }}>
        <div className="text-center px-6 max-w-xl mx-auto">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">Crie sua liga hoje.<br />É gratuito.</h2>
          <p className="text-base text-muted-foreground font-body mb-8 leading-relaxed">
            Monte sua liga, cadastre seus bladers e comece a organizar torneios profissionais em minutos.
          </p>
          <Link to="/cadastro" className="inline-block px-8 py-4 rounded-xl font-body font-semibold text-base text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            Criar liga grátis
          </Link>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="py-8 px-6 border-t border-[rgba(255,255,255,0.05)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <span className="font-heading text-sm font-bold tracking-[0.15em]">
            BLADE<span className="text-[#60A5FA]">X</span>
          </span>
          <p className="text-xs text-muted-foreground font-body">Feito para a comunidade Beyblade X do Brasil</p>
          <p className="text-xs text-muted-foreground font-body">© 2025</p>
        </div>
      </footer>
    </div>
  );
}
