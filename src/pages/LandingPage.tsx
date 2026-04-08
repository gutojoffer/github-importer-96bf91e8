import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Zap, Star } from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/home" replace />;

  return (
    <div className="min-h-screen" style={{ background: '#090b12' }}>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        {/* Decorative spinning beyblade SVG */}
        <div className="absolute right-[5%] top-1/2 -translate-y-1/2 opacity-[0.12] pointer-events-none">
          <svg className="landing-beyblade" width="500" height="500" viewBox="0 0 500 500" fill="none">
            <circle cx="250" cy="250" r="240" stroke="#4F8EF7" strokeWidth="2" />
            <circle cx="250" cy="250" r="190" stroke="#4F8EF7" strokeWidth="1.5" />
            <circle cx="250" cy="250" r="140" stroke="#4F8EF7" strokeWidth="1" />
            <circle cx="250" cy="250" r="80" stroke="#4F8EF7" strokeWidth="2" />
            <circle cx="250" cy="250" r="30" fill="#4F8EF7" fillOpacity="0.3" />
            {/* Radial lines */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const x1 = 250 + 80 * Math.cos(angle);
              const y1 = 250 + 80 * Math.sin(angle);
              const x2 = 250 + 240 * Math.cos(angle);
              const y2 = 250 + 240 * Math.sin(angle);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4F8EF7" strokeWidth="1" />;
            })}
            {/* Curved blades */}
            <path d="M250 10 Q350 100 290 250" stroke="#4F8EF7" strokeWidth="2" fill="none" />
            <path d="M490 250 Q400 350 250 290" stroke="#4F8EF7" strokeWidth="2" fill="none" />
            <path d="M250 490 Q150 400 210 250" stroke="#4F8EF7" strokeWidth="2" fill="none" />
            <path d="M10 250 Q100 150 250 210" stroke="#4F8EF7" strokeWidth="2" fill="none" />
          </svg>
        </div>

        <div className="relative z-10 max-w-[560px] px-6 sm:px-12 lg:px-20 py-16">
          <p className="text-[11px] font-heading font-bold tracking-[2px] uppercase mb-6" style={{ color: '#4F8EF7' }}>
            SISTEMA OFICIAL DE TORNEIOS
          </p>

          <h1 className="font-heading text-5xl sm:text-[64px] font-bold leading-[1.05] mb-6">
            <span className="text-white">ARENA</span>
            <span style={{ color: '#4F8EF7' }}> X</span>
            <br />
            <span style={{ color: '#4F8EF7' }}>BEYBLADE X</span>
          </h1>

          <p className="text-base text-muted-foreground font-body leading-relaxed mb-8 max-w-md">
            Organize suas ligas, gerencie torneios e acompanhe rankings em tempo real.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <Link
              to="/cadastro"
              className="px-6 py-3 rounded-xl font-body font-semibold text-sm text-white transition-all hover:opacity-90"
              style={{ background: '#4F8EF7' }}
            >
              Criar minha liga
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl font-body font-semibold text-sm transition-all hover:bg-[rgba(79,142,247,0.1)]"
              style={{ color: '#4F8EF7', border: '1px solid #4F8EF7' }}
            >
              Já tenho conta
            </Link>
          </div>

          <p className="text-xs text-muted-foreground font-body">
            Gratuito para ligas locais de Beyblade X
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 sm:px-12 lg:px-20 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: <Trophy className="h-8 w-8" style={{ color: '#4F8EF7' }} />,
              title: 'Gerencie torneios',
              text: 'Crie chaveamentos, registre partidas ao vivo e encerre torneios com um clique.',
            },
            {
              icon: <Zap className="h-8 w-8" style={{ color: '#4F8EF7' }} />,
              title: 'Arena ao vivo',
              text: 'Registre SPIN, OVER, BURST e XTREME em tempo real durante as batalhas.',
            },
            {
              icon: <Star className="h-8 w-8" style={{ color: '#4F8EF7' }} />,
              title: 'Ranking automático',
              text: 'Pontuação calculada automaticamente ao final de cada torneio.',
            },
          ].map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-xl"
              style={{ background: '#141928', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div
                className="h-12 w-12 rounded-lg flex items-center justify-center mb-4"
                style={{ background: 'rgba(79,142,247,0.1)' }}
              >
                {f.icon}
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="py-8" style={{ background: '#0d1120' }}>
        <p className="text-center text-sm text-muted-foreground font-body">
          Usado por ligas em todo o Brasil
        </p>
      </section>

      {/* Footer */}
      <footer className="px-6 sm:px-12 py-8" style={{ background: '#090b12', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <span className="font-heading text-sm font-bold tracking-[0.12em]">
            ARENA <span style={{ color: '#4F8EF7' }}>X</span>
          </span>
          <p className="text-xs text-muted-foreground font-body">
            Desenvolvido para comunidades de Beyblade X
          </p>
          <p className="text-xs text-muted-foreground font-body">© 2025</p>
        </div>
      </footer>
    </div>
  );
}
