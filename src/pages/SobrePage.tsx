import { Link } from 'react-router-dom';
import NavbarPublica from '@/components/public/NavbarPublica';

const features = [
  { icone: '🏆', titulo: 'Gestão de torneios', desc: 'Sistema Swiss MD4 com arena ao vivo, marcação de pontos e geração automática de chaves' },
  { icone: '🏅', titulo: 'Sistema ELO', desc: '6 elos (Ferro ao Diamante) com temporadas de 6 meses e partidas de promoção MD3' },
  { icone: '🗼', titulo: 'Torre X', desc: '100 andares de ranking por cidade, estado e nacional. Desafie bladers da sua cidade' },
  { icone: '⚙️', titulo: 'ForjaBey', desc: 'Deck builder completo com todas as peças BX, UX e CX lançadas até 2026' },
  { icone: '👥', titulo: 'Rede social', desc: 'Adicione amigos, veja o feed de atividades e acompanhe a evolução dos seus companheiros' },
  { icone: '📊', titulo: 'Estatísticas', desc: 'Winrate por deck, rivalidades, comparativo com a média do estado, conquistas e muito mais' },
];

export default function SobrePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#070a14', color: '#e7ecf3', fontFamily: 'Montserrat, sans-serif' }}>
      <NavbarPublica />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
        <section style={{ textAlign: 'center', marginBottom: 64 }}>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 56, fontWeight: 800, letterSpacing: 4, color: '#00DCFF', margin: 0 }}>BLADEX</h1>
          <p style={{ fontSize: 18, color: '#cbd2dd', maxWidth: 680, margin: '16px auto 32px' }}>
            O sistema oficial de ligas e torneios de Beyblade X no Brasil.
            Gerencie campeonatos, acompanhe rankings e conecte bladers de todo o país.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/cadastro" style={{ background: '#00DCFF', color: '#070a14', padding: '12px 26px', borderRadius: 10, fontWeight: 800, textDecoration: 'none', fontFamily: 'Rajdhani, sans-serif', letterSpacing: 1 }}>Criar conta grátis</Link>
            <Link to="/ranking" style={{ border: '1px solid rgba(0,220,255,.4)', color: '#00DCFF', padding: '12px 26px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontFamily: 'Rajdhani, sans-serif', letterSpacing: 1 }}>Ver ranking</Link>
          </div>
        </section>

        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 32, color: '#fff', marginBottom: 16 }}>O que é o BLADEX?</h2>
          <p style={{ color: '#cbd2dd', lineHeight: 1.7, marginBottom: 12 }}>
            O BLADEX é uma plataforma completa para a comunidade brasileira de Beyblade X — o mais novo sistema de Beyblade lançado pela Takara Tomy. A plataforma permite que organizadores criem e gerenciem torneios profissionais no formato Swiss MD4, enquanto bladers acompanham sua evolução com rankings detalhados e estatísticas completas.
          </p>
          <p style={{ color: '#cbd2dd', lineHeight: 1.7 }}>
            Com o BLADEX, cada torneio realizado alimenta um sistema de pontuação ELO, ranking da Torre X por cidade e estado, conquistas desbloqueáveis e um perfil público que cada blader pode compartilhar com a comunidade.
          </p>
        </section>

        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 32, color: '#fff', marginBottom: 24 }}>Funcionalidades</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {features.map((f, i) => (
              <article key={i} style={{ background: '#0d1120', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{f.icone}</div>
                <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 20, color: '#fff', margin: '0 0 6px' }}>{f.titulo}</h3>
                <p style={{ color: '#9ba3af', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 32, color: '#fff', marginBottom: 24 }}>Para quem é o BLADEX?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <article style={{ background: '#0d1120', border: '1px solid rgba(0,220,255,.2)', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 22, color: '#00DCFF', marginTop: 0 }}>⚡ Bladers</h3>
              <ul style={{ color: '#cbd2dd', lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
                <li>Inscreva-se em torneios da sua cidade</li>
                <li>Acompanhe seu ELO e rankings</li>
                <li>Monte decks na ForjaBey</li>
                <li>Desafie outros bladers na Torre X</li>
                <li>Compartilhe seu perfil público</li>
              </ul>
            </article>
            <article style={{ background: '#0d1120', border: '1px solid rgba(255,200,0,.2)', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 22, color: '#FFD23F', marginTop: 0 }}>🏆 Organizadores</h3>
              <ul style={{ color: '#cbd2dd', lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
                <li>Crie e gerencie torneios</li>
                <li>Controle inscrições online</li>
                <li>Gerencie arenas ao vivo</li>
                <li>Publique resultados automaticamente</li>
                <li>Gerencie sua liga regional</li>
              </ul>
            </article>
          </div>
        </section>

        <section style={{ textAlign: 'center', padding: '48px 24px', background: 'linear-gradient(135deg, rgba(0,220,255,.08), rgba(167,139,250,.06))', borderRadius: 16, border: '1px solid rgba(0,220,255,.2)' }}>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 32, color: '#fff', margin: '0 0 12px' }}>Pronto para competir?</h2>
          <p style={{ color: '#cbd2dd', marginBottom: 24 }}>Crie sua conta grátis e entre para a comunidade BLADEX</p>
          <Link to="/cadastro" style={{ background: '#00DCFF', color: '#070a14', padding: '14px 32px', borderRadius: 10, fontWeight: 800, textDecoration: 'none', fontFamily: 'Rajdhani, sans-serif', letterSpacing: 1 }}>Let it Rip! 🚀</Link>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '24px', textAlign: 'center', color: '#7a8392', fontSize: 13 }}>
        <p style={{ margin: '0 0 8px', color: '#cbd2dd' }}>BLADEX — Sistema de Torneios Beyblade X no Brasil</p>
        <nav style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
          <Link to="/sobre" style={{ color: '#7a8392', textDecoration: 'none' }}>Sobre</Link>
          <Link to="/ranking" style={{ color: '#7a8392', textDecoration: 'none' }}>Ranking</Link>
          <Link to="/beyblade-x" style={{ color: '#7a8392', textDecoration: 'none' }}>Beyblade X</Link>
          <Link to="/login" style={{ color: '#7a8392', textDecoration: 'none' }}>Entrar</Link>
        </nav>
        <p style={{ margin: 0 }}>© 2026 BLADEX · Todos os direitos reservados · bladex.com.br</p>
      </footer>
    </div>
  );
}
