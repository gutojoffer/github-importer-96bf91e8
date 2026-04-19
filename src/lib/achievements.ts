/**
 * Sistema de conquistas automáticas do Blader.
 * Todas as conquistas são derivadas dos dados de torneios — sem persistência extra.
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;          // emoji
  color: string;         // hex
  earned: boolean;
  hint?: string;         // dica de como desbloquear (quando não conquistada)
}

export interface BladerStatsForAchievements {
  tournamentsPlayed: number;
  totalWins: number;
  totalLosses: number;
  podiums: number;       // top 3
  championships: number; // 1º lugar
  bestPlacement: number; // menor número (1 = melhor)
  longestStreak: number; // maior sequência de vitórias num torneio
}

export function computeAchievements(s: BladerStatsForAchievements): Achievement[] {
  return [
    {
      id: 'first-tournament',
      title: 'Primeiro Torneio',
      description: 'Participou do seu primeiro torneio',
      icon: '🎯',
      color: '#60A5FA',
      earned: s.tournamentsPlayed >= 1,
      hint: 'Inscreva-se em um torneio aberto',
    },
    {
      id: 'podium',
      title: 'Subiu ao Pódio',
      description: 'Terminou um torneio entre os 3 melhores',
      icon: '🥉',
      color: '#B45309',
      earned: s.podiums >= 1,
      hint: 'Termine entre os 3 primeiros',
    },
    {
      id: 'champion',
      title: 'Campeão',
      description: 'Conquistou o 1º lugar de um torneio',
      icon: '🏆',
      color: '#FBBF24',
      earned: s.championships >= 1,
      hint: 'Vença um torneio',
    },
    {
      id: 'veteran',
      title: 'Veterano',
      description: 'Participou de 5 ou mais torneios',
      icon: '⚔️',
      color: '#A78BFA',
      earned: s.tournamentsPlayed >= 5,
      hint: `Faltam ${Math.max(0, 5 - s.tournamentsPlayed)} torneios`,
    },
    {
      id: 'unstoppable',
      title: 'Imparável',
      description: 'Sequência de 5 vitórias seguidas em um torneio',
      icon: '🔥',
      color: '#EF4444',
      earned: s.longestStreak >= 5,
      hint: 'Vença 5 batalhas seguidas',
    },
    {
      id: 'centurion',
      title: 'Centurião',
      description: '100 vitórias acumuladas',
      icon: '💯',
      color: '#10B981',
      earned: s.totalWins >= 100,
      hint: `${s.totalWins}/100 vitórias`,
    },
    {
      id: 'three-time-champ',
      title: 'Tricampeão',
      description: 'Conquistou 3 títulos',
      icon: '👑',
      color: '#F59E0B',
      earned: s.championships >= 3,
      hint: `${s.championships}/3 títulos`,
    },
  ];
}
