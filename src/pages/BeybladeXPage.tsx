import { Link } from 'react-router-dom';
import NavbarPublica from '@/components/public/NavbarPublica';

const ELOS_INFO = 'Ferro (0-299pts), Bronze (300-699pts), Prata (700-1299pts), Ouro (1300-2199pts), Platina (2200-3499pts), Diamante (3500+pts)';

const secoes = [
  {
    titulo: 'Beyblade X — O novo sistema',
    conteudo: 'Beyblade X (BX) é a mais recente geração do brinquedo competitivo Beyblade, lançada pela Takara Tomy em 2023. O principal diferencial é o sistema X-Dash, onde os Bits (a ponta inferior da beyblade) podem entrar em modo de alta velocidade ao atingir a rampa da arena, criando batalhas mais intensas e imprevisíveis.',
  },
  {
    titulo: 'As 3 linhas de Beyblade X',
    lista: [
      { nome: 'BX — Basic Line', desc: 'A linha básica do Beyblade X. Beyblades com ganchos metálicos no Blade, proporcionando maior IWD (Distribuição de Peso Interna). São os mais acessíveis e indicados para iniciantes.' },
      { nome: 'UX — Unique Line', desc: 'A linha única, com características especiais. Beyblades UX possuem ganchos de resina (plástico) no Blade, proporcionando melhor OWD (Distribuição de Peso Externa). Cada UX tem um diferencial único: formatos especiais de blade, rolamentos, mudança de modo, etc.' },
      { nome: 'CX — Customization Line', desc: 'A linha de customização. O Blade é composto por 3 partes distintas: Lock Chip (estrutura base), Main Blade (ponto de contato principal em metal) e Assist Blade (componente auxiliar em plástico que afeta formato e distribuição de peso). Combinar diferentes peças CX cria possibilidades infinitas de customização.' },
    ],
  },
  {
    titulo: 'As peças de uma Beyblade X',
    lista: [
      { nome: 'Blade', desc: 'A peça principal, responsável pelo contato e combate. Define o estilo de batalha (Ataque, Defesa, Stamina ou Equilíbrio).' },
      { nome: 'Ratchet', desc: 'Peça intermediária com número de lados (1 a 9) e altura em mm. Ex: 3-60 = 3 lados, 6mm de altura. Influencia estabilidade e agressividade.' },
      { nome: 'Bit', desc: 'A ponta inferior. Define o movimento da beyblade na arena. Flat (F) = ataque, Needle (N) = stamina, Ball (B) = defesa. Bits com X-Dash entram em modo de alta velocidade.' },
    ],
  },
  {
    titulo: 'Formato de torneio Swiss MD4',
    conteudo: 'No BLADEX, os torneios utilizam o formato Swiss MD4 (Match to 4), onde cada batalha vai até um jogador acumular 4 pontos. O sistema suíço emparelha jogadores com desempenhos similares em cada rodada, garantindo partidas equilibradas. Os torneios têm entre 3 e 7 rodadas dependendo do número de participantes, com a classificação final determinada por vitórias, pontos e, em caso de empate, pelo desempenho geral.',
  },
  {
    titulo: 'Sistema ELO BLADEX',
    conteudo: `O BLADEX usa um sistema ELO com 6 divisões: ${ELOS_INFO}. As temporadas duram 6 meses e a promoção entre elos é decidida em partidas MD3 (Match to 3). Cada torneio disputado atualiza automaticamente o ELO do blader.`,
  },
];

export default function BeybladeXPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#070a14', color: '#e7ecf3', fontFamily: 'Montserrat, sans-serif' }}>
      <NavbarPublica />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 44, color: '#00DCFF', margin: 0 }}>O que é Beyblade X?</h1>
        <p style={{ color: '#cbd2dd', fontSize: 17, lineHeight: 1.6, marginBottom: 40 }}>
          Guia completo sobre o novo sistema de Beyblade lançado pela Takara Tomy em 2023.
        </p>

        {secoes.map((s, i) => (
          <section key={i} style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 28, color: '#fff', borderLeft: '3px solid #00DCFF', paddingLeft: 12, marginBottom: 16 }}>{s.titulo}</h2>
            {s.conteudo && <p style={{ color: '#cbd2dd', lineHeight: 1.7 }}>{s.conteudo}</p>}
            {s.lista && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {s.lista.map((it, j) => (
                  <article key={j} style={{ background: '#0d1120', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: 16 }}>
                    <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 18, color: '#00DCFF', margin: '0 0 6px' }}>{it.nome}</h3>
                    <p style={{ color: '#cbd2dd', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{it.desc}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}

        <section style={{ textAlign: 'center', padding: '40px 24px', background: 'linear-gradient(135deg, rgba(0,220,255,.08), rgba(167,139,250,.06))', borderRadius: 16, border: '1px solid rgba(0,220,255,.2)', marginTop: 32 }}>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 28, color: '#fff', margin: '0 0 12px' }}>Compete em Beyblade X?</h2>
          <p style={{ color: '#cbd2dd', marginBottom: 24 }}>Entre para o BLADEX e apareça nos rankings oficiais do Brasil.</p>
          <Link to="/login" style={{ background: '#00DCFF', color: '#070a14', padding: '14px 32px', borderRadius: 10, fontWeight: 800, textDecoration: 'none', fontFamily: 'Rajdhani, sans-serif', letterSpacing: 1 }}>Entrar / Criar conta</Link>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '24px', textAlign: 'center', color: '#7a8392', fontSize: 13 }}>
        © 2026 BLADEX · bladex.com.br
      </footer>
    </div>
  );
}
