import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

function ModeCard({
  src,
  alt,
  glowColor,
  animationDelay,
  onClick,
}: {
  src: string;
  alt: string;
  glowColor: 'cyan' | 'pink';
  animationDelay: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const glowIdle =
    glowColor === 'cyan'
      ? 'card-float 4s ease-in-out infinite, glow-c 3s ease-in-out infinite'
      : `card-float 4s ease-in-out infinite ${animationDelay}, glow-p 3s ease-in-out infinite`;

  const glowHover =
    glowColor === 'cyan'
      ? 'drop-shadow(0 0 16px rgba(0,220,255,.7))'
      : 'drop-shadow(0 0 16px rgba(255,0,180,.7))';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        transition: 'transform .35s cubic-bezier(.34,1.56,.64,1)',
        transform: hovered ? 'translateY(-12px) scale(1.05)' : 'translateY(0) scale(1)',
        animation: hovered ? 'none' : glowIdle,
        filter: hovered ? glowHover : undefined,
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="w-[240px] sm:w-[280px] select-none"
      />
    </div>
  );
}

export default function SelectMode() {
  const navigate = useNavigate();
  const { setMode, perfis } = useActiveMode();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  function handleBlader() {
    if (perfis.temBlader) {
      setMode('blader');
      navigate('/blader/home', { replace: true });
    } else {
      navigate('/criar-perfil-blader', { replace: true });
    }
  }

  function handleOrganizador() {
    if (perfis.temOrganizador) {
      setMode('organizador');
      navigate('/home', { replace: true });
    } else {
      navigate('/criar-perfil-organizador', { replace: true });
    }
  }

  if (authLoading || perfis.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060912' }}>
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#060912' }}
    >
      <h1
        className="font-heading text-4xl sm:text-5xl font-bold tracking-[0.18em] mb-2"
        style={{ color: '#fff' }}
      >
        BLADE<span style={{ color: '#00D4FF' }}>X</span>
      </h1>

      <p
        className="font-heading text-sm sm:text-base tracking-[0.25em] uppercase mb-10"
        style={{ color: 'rgba(255,255,255,.35)' }}
      >
        Como deseja entrar?
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-10">
        <ModeCard
          src="/card-blader.png"
          alt="Área do Blader"
          glowColor="cyan"
          animationDelay="0s"
          onClick={handleBlader}
        />
        <ModeCard
          src="/card-organizador.png"
          alt="Área do Organizador"
          glowColor="pink"
          animationDelay="2s"
          onClick={handleOrganizador}
        />
      </div>

      <p
        className="font-body text-xs mt-10"
        style={{ color: 'rgba(255,255,255,.25)' }}
      >
        Você pode trocar de modo a qualquer momento pelo menu do topo
      </p>
    </div>
  );
}
