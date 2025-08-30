export const config = {
  // API Configuration
  API_BASE_URL:
    (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000',

  // Game Configuration
  WORD_LENGTH: 5,
  MAX_ATTEMPTS: 6,

  // Storage Keys
  STORAGE_KEYS: {
    GAME_STATE: 'verbo-game',
    STATS: 'verbo_stats',
    HISTORY: 'verbo_history',
    TUTORIAL_COMPLETED: 'verbo_tutorial_completed',
    FIRST_VISIT: 'verbo_first_visit',
    HARD_MODE: 'verbo_hard_mode',
    PLAYER_ID: 'verbo_player_id',
  },

  // Game Constants
  LETTER_STATUS: {
    CORRECT: 'correct',
    WRONG_POSITION: 'wrong-position',
    INCORRECT: 'incorrect',
    ABSENT: 'absent',
  } as const,

  // Timing
  ANIMATION_DURATION: 300,
  CONFETTI_DURATION: 3000,

  // Validation
  PATTERNS: {
    LETTERS_ONLY: /^[a-zA-ZÀ-ÿ\u00C0-\u017F]+$/,
    VERB_SUFFIXES: ['ar', 'er', 'ir', 'or'],
  },

  // Error Messages
  ERRORS: {
    REQUIRED_WORD: 'A palavra é obrigatória',
    EMPTY_WORD: 'A palavra não pode estar vazia',
    INVALID_LENGTH: 'A palavra deve ter exatamente 5 letras',
    LETTERS_ONLY: 'A palavra deve conter apenas letras',
    NETWORK_ERROR: 'Erro de conexão. Tente novamente.',
    UNKNOWN_ERROR: 'Algo deu errado. Tente novamente.',
  },

  // Success Messages
  SUCCESS: {
    GAME_WON: 'Parabéns! Você acertou!',
    STATS_RESET: 'Estatísticas resetadas com sucesso!',
    VERB_CREATED: 'Verbo criado com sucesso!',
    VERB_UPDATED: 'Verbo atualizado com sucesso!',
  },
} as const;

export type LetterStatus =
  (typeof config.LETTER_STATUS)[keyof typeof config.LETTER_STATUS];
