import { GuessFeedback } from '../contexts/GameContext';

export interface WordHistoryEntry {
  word: string;
  verbId: string;
  date: string; // YYYY-MM-DD
  won: boolean;
  attempts: number;
  guesses: Array<{
    letters: Array<{
      letter: string;
      status: 'correct' | 'wrong-position' | 'incorrect';
    }>;
  }>;
  hardMode: boolean;
  completed?: boolean; // Campo adicional para compatibilidade local
  timestamp?: string; // Campo adicional para compatibilidade local
}

const HISTORY_KEY = 'verbo_word_history';

export const historyService = {
  // Carregar histórico do localStorage
  loadHistory(): WordHistoryEntry[] {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const history = JSON.parse(stored);
        // Ordenar por data (mais recente primeiro)
        return history.sort(
          (a: WordHistoryEntry, b: WordHistoryEntry) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
    return [];
  },

  // Salvar histórico no localStorage
  saveHistory(history: WordHistoryEntry[]): void {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  },

  // Adicionar entrada ao histórico
  addEntry(entry: WordHistoryEntry): void {
    const history = this.loadHistory();

    // Verificar se já existe entrada para esta data
    const existingIndex = history.findIndex(h => h.date === entry.date);

    if (existingIndex !== -1) {
      // Atualizar entrada existente
      history[existingIndex] = entry;
    } else {
      // Adicionar nova entrada
      history.push(entry);
    }

    // Manter apenas os últimos 30 dias
    const sortedHistory = history
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30);

    this.saveHistory(sortedHistory);
  },

  // Buscar entrada por data
  getEntryByDate(date: string): WordHistoryEntry | null {
    const history = this.loadHistory();
    return history.find(h => h.date === date) || null;
  },

  // Obter estatísticas do histórico
  getHistoryStats(): {
    totalGames: number;
    totalWins: number;
    currentStreak: number;
    longestStreak: number;
    winRate: number;
    averageAttempts: number;
  } {
    const history = this.loadHistory().filter(h => h.completed);

    if (history.length === 0) {
      return {
        totalGames: 0,
        totalWins: 0,
        currentStreak: 0,
        longestStreak: 0,
        winRate: 0,
        averageAttempts: 0,
      };
    }

    const totalGames = history.length;
    const totalWins = history.filter(h => h.won).length;
    const winRate = Math.round((totalWins / totalGames) * 100);

    // Calcular média de tentativas (apenas para jogos vencidos)
    const wonGames = history.filter(h => h.won);
    const averageAttempts =
      wonGames.length > 0
        ? Math.round(
            (wonGames.reduce((sum, h) => sum + h.attempts, 0) /
              wonGames.length) *
              10
          ) / 10
        : 0;

    // Calcular sequências
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Ordenar por data (mais recente primeiro) para calcular streak atual
    const sortedHistory = [...history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Streak atual (a partir do jogo mais recente)
    for (const entry of sortedHistory) {
      if (entry.won) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Streak mais longa (toda a história)
    for (const entry of history) {
      if (entry.won) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return {
      totalGames,
      totalWins,
      currentStreak,
      longestStreak,
      winRate,
      averageAttempts,
    };
  },

  // Limpar histórico
  clearHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
  },

  // Obter histórico dos últimos N dias
  getRecentHistory(days: number = 7): WordHistoryEntry[] {
    const history = this.loadHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return history.filter(h => new Date(h.date) >= cutoffDate);
  },

  // Verificar se jogou em uma data específica
  hasPlayedOnDate(date: string): boolean {
    const entry = this.getEntryByDate(date);
    return entry !== null && (entry.completed === true || entry.won !== undefined);
  },
};

export const getLocalDateString = (date: Date = new Date()): string => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};
