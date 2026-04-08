import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Star, Clock } from 'lucide-react';
import React from 'react';

const actions = [
  { title: 'Novo Torneio', route: '/tournament', color: '#2563EB', icon: Trophy },
  { title: 'Ver Bladers', route: '/players', color: '#7C3AED', icon: Users },
  { title: 'Rankings', route: '/rankings', color: '#D97706', icon: Star },
  { title: 'Histórico', route: '/history', color: '#059669', icon: Clock },
];

const QuickActions = React.memo(() => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((a) => (
        <button
          key={a.route}
          onClick={() => navigate(a.route)}
          className="quick-action-card group relative h-[120px] rounded-[14px] overflow-hidden cursor-pointer text-left transition-all duration-200 hover:-translate-y-[3px]"
          style={{
            '--action-color': a.color,
            boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${a.color}40`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px rgba(0,0,0,0.3)`;
          }}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{
            background: `linear-gradient(135deg, ${a.color}D9 0%, ${a.color}66 100%)`,
          }} />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-end p-5">
            <h3 className="font-heading text-xl font-bold text-white" style={{
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              {a.title}
            </h3>
          </div>

          {/* Decorative icon */}
          <div className="absolute bottom-3 right-4 z-10 opacity-30">
            <a.icon style={{ width: 32, height: 32 }} className="text-white" />
          </div>
        </button>
      ))}
    </div>
  );
});

export default QuickActions;
