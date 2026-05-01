import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { erro: string | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null };

  static getDerivedStateFromError(error: Error): State {
    return { erro: error.message || 'Erro desconhecido' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.erro) {
      return (
        <div style={{
          background: '#060912', minHeight: '100dvh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center',
        }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff' }}>
            Algo deu errado
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', maxWidth: 280, wordBreak: 'break-word' }}>
            {this.state.erro}
          </div>
          <button
            onClick={() => {
              document.body.style.overflow = '';
              document.body.style.height = '';
              window.location.href = '/';
            }}
            style={{
              padding: '10px 24px', background: 'rgba(0,220,255,.1)',
              border: '1px solid rgba(0,220,255,.25)', borderRadius: 10,
              color: '#00DCFF', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
