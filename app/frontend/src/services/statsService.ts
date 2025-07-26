import { historyService } from './historyService';
import { v4 as uuidv4 } from 'uuid';

export interface GameStats {
  statId: string; // Identificador único da estatística
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    6: number;
  };
  lastPlayedDate: string | null;
  lastWonDate: string | null;
}

const STORAGE_KEY = 'verbo_stats';

// Função utilitária para obter a data de ontem no formato YYYY-MM-DD
function getYesterday(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

export const statsService = {
  // Carregar estatísticas do localStorage
  loadStats(): GameStats {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }

    // Retornar estatísticas padrão se não existirem
    return {
      statId: '', // Inicializa vazio, será gerado ao registrar vitória
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
      },
      lastPlayedDate: null,
      lastWonDate: null,
    };
  },

  // Salvar estatísticas no localStorage
  saveStats(stats: GameStats): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Erro ao salvar estatísticas:', error);
    }
  },

  // Registrar uma vitória
  recordWin(attempts: number): void {
    const stats = this.loadStats();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Só registra se ainda não foi registrado hoje
    if (stats.lastPlayedDate === today) {
      return;
    }

    // Gera um novo statId único para cada vitória do dia
    stats.statId = uuidv4();

    stats.gamesPlayed += 1;
    stats.gamesWon += 1;
    stats.lastPlayedDate = today;
    stats.lastWonDate = today;

    // Atualizar distribuição de tentativas
    if (attempts >= 1 && attempts <= 6) {
      stats.guessDistribution[
        attempts as keyof typeof stats.guessDistribution
      ] += 1;
    }

    // Atualizar sequência de vitórias considerando dias consecutivos
    const yesterday = getYesterday(today);
    if (stats.lastWonDate && stats.lastWonDate === yesterday) {
      stats.currentStreak += 1;
    } else {
      stats.currentStreak = 1;
    }
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);

    this.saveStats(stats);
  },

  // Registrar uma derrota
  recordLoss(): void {
    const stats = this.loadStats();
    const today = new Date().toISOString().split('T')[0];

    // Só registra se ainda não foi registrado hoje
    if (stats.lastPlayedDate === today) {
      return;
    }

    stats.gamesPlayed += 1;
    stats.lastPlayedDate = today;
    stats.currentStreak = 0; // Reset da sequência

    this.saveStats(stats);
  },

  // Verificar se já jogou hoje
  hasPlayedToday(): boolean {
    const stats = this.loadStats();
    const today = new Date().toISOString().split('T')[0];
    return stats.lastPlayedDate === today;
  },

  // Obter estatísticas formatadas
  getFormattedStats(): GameStats & {
    winRate: number;
    averageAttempts: number;
  } {
    const stats = this.loadStats();

    const winRate =
      stats.gamesPlayed > 0
        ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
        : 0;

    // Calcular média de tentativas (apenas para jogos vencidos)
    let totalAttempts = 0;
    let totalWonGames = 0;

    Object.entries(stats.guessDistribution).forEach(([attempts, count]) => {
      totalAttempts += parseInt(attempts) * count;
      totalWonGames += count;
    });

    const averageAttempts =
      totalWonGames > 0
        ? Math.round((totalAttempts / totalWonGames) * 10) / 10
        : 0;

    return {
      ...stats,
      winRate,
      averageAttempts,
    };
  },

  // Resetar todas as estatísticas
  resetStats(): void {
    const emptyStats: GameStats = {
      statId: '', // Inicializa vazio, será gerado ao registrar vitória
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
      },
      lastPlayedDate: null,
      lastWonDate: null,
    };
    this.saveStats(emptyStats);
    
    // Também limpar o histórico de palavras
    historyService.clearHistory();
  },
};
