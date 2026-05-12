import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { href: '/ranking', label: 'Ranking' },
  { href: '/torneios-publicos', label: 'Torneios' },
  { href: '/beyblade-x', label: 'Beyblade X' },
  { href: '/sobre', label: 'Sobre' },
];

export default function NavbarPublica() {
  const { pathname } = useLocation();

  return (
    <nav
      style={{
        minHeight: 54,
        background: '#08091a',
        borderBottom: '1px solid rgba(255,255,255,.07)',
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        gap: 8,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexWrap: 'wrap',
      }}
    >
      <Link
        to="/"
        style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 900,
          fontSize: 18,
          letterSpacing: 3,
          color: '#fff',
          textDecoration: 'none',
          marginRight: 8,
        }}
      >
        BLADE<span style={{ color: '#00DCFF' }}>X</span>
      </Link>

      <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                color: active ? '#00DCFF' : 'rgba(255,255,255,.55)',
                background: active ? 'rgba(0,220,255,.08)' : 'transparent',
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                transition: 'all .15s',
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <Link
        to="/login"
        style={{
          padding: '7px 16px',
          borderRadius: 9,
          background: 'rgba(0,220,255,.1)',
          border: '1px solid rgba(0,220,255,.25)',
          color: '#00DCFF',
          textDecoration: 'none',
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 1,
          flexShrink: 0,
        }}
      >
        Entrar
      </Link>
    </nav>
  );
}
