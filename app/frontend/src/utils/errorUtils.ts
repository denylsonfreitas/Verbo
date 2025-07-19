// Tipos de erro específicos
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  GAME_ERROR = 'GAME_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  code?: string;
}

// Mensagens de erro padronizadas
export const ERROR_MESSAGES = {
  // Validação
  WORD_TOO_SHORT: 'A palavra deve ter exatamente 5 letras',
  WORD_TOO_LONG: 'A palavra deve ter exatamente 5 letras',
  WORD_EMPTY: 'Digite uma palavra para continuar',
  INVALID_CHARACTERS: 'Use apenas letras sem números ou símbolos',
  WORD_NOT_FOUND: 'Esta palavra não está no nosso dicionário',
  
  // Jogo
  GAME_ALREADY_FINISHED: 'Você já jogou hoje! Volte amanhã para uma nova palavra',
  MAX_ATTEMPTS_REACHED: 'Você esgotou suas 6 tentativas',
  HARD_MODE_VIOLATION: 'No modo difícil, use as dicas das tentativas anteriores',
  
  // Rede
  CONNECTION_ERROR: 'Verifique sua conexão e tente novamente',
  SERVER_BUSY: 'Servidor ocupado. Tente novamente em alguns segundos',
  TIMEOUT_ERROR: 'A operação demorou muito. Tente novamente',
  
  // Servidor
  VERB_NOT_FOUND: 'Palavra do dia não encontrada',
  DATABASE_ERROR: 'Erro interno. Nossa equipe foi notificada',
  RATE_LIMIT: 'Muitas tentativas. Aguarde um momento e tente novamente',
} as const;

// Função para criar erros específicos
export function createAppError(
  type: ErrorType,
  message: string,
  details?: string,
  code?: string
): AppError {
  return {
    type,
    message,
    details,
    code,
  };
}

// Função para detectar tipo de erro baseado no status HTTP
export function getErrorFromStatus(status: number, defaultMessage: string = ''): AppError {
  switch (status) {
    case 400:
      return createAppError(ErrorType.VALIDATION_ERROR, defaultMessage || ERROR_MESSAGES.INVALID_CHARACTERS);
    case 401:
      return createAppError(ErrorType.VALIDATION_ERROR, defaultMessage || 'Credenciais inválidas');
    case 404:
      return createAppError(ErrorType.GAME_ERROR, defaultMessage || ERROR_MESSAGES.VERB_NOT_FOUND);
    case 409:
      // Para conflitos, sempre usar a mensagem do servidor se disponível
      return createAppError(ErrorType.VALIDATION_ERROR, defaultMessage || ERROR_MESSAGES.GAME_ALREADY_FINISHED);
    case 429:
      return createAppError(ErrorType.GAME_ERROR, ERROR_MESSAGES.RATE_LIMIT);
    case 500:
      return createAppError(ErrorType.SERVER_ERROR, ERROR_MESSAGES.DATABASE_ERROR);
    case 503:
      return createAppError(ErrorType.SERVER_ERROR, ERROR_MESSAGES.SERVER_BUSY);
    default:
      return createAppError(ErrorType.NETWORK_ERROR, defaultMessage || ERROR_MESSAGES.CONNECTION_ERROR);
  }
}

// Função para validar entrada do usuário
export function validateWordInput(word: string): AppError | null {
  if (!word || word.trim().length === 0) {
    return createAppError(ErrorType.VALIDATION_ERROR, ERROR_MESSAGES.WORD_EMPTY);
  }

  const cleanWord = word.trim();
  
  if (cleanWord.length < 5) {
    return createAppError(ErrorType.VALIDATION_ERROR, ERROR_MESSAGES.WORD_TOO_SHORT);
  }
  
  if (cleanWord.length > 5) {
    return createAppError(ErrorType.VALIDATION_ERROR, ERROR_MESSAGES.WORD_TOO_LONG);
  }

  // Verificar apenas letras (incluindo acentos)
  const lettersRegex = /^[a-zA-ZÀ-ÿ\u00C0-\u017F]+$/;
  if (!lettersRegex.test(cleanWord)) {
    return createAppError(ErrorType.VALIDATION_ERROR, ERROR_MESSAGES.INVALID_CHARACTERS);
  }

  return null; // Sem erro
}
