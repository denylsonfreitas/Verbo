interface ValidationResult {
  valid: boolean;
  message: string;
  code?: string;
}

// Regex padronizada para aceitar letras portuguesas e acentos
const LETTERS_REGEX = /^[a-zA-ZÀ-ÿ\u00C0-\u017F]+$/;
const WORD_LENGTH = 5;

export function validateAttempt(word: string): ValidationResult {
  if (!word || typeof word !== 'string') {
    return {
      valid: false,
      message: 'A palavra é obrigatória',
      code: 'WORD_REQUIRED',
    };
  }

  const cleanWord = word.trim();

  if (cleanWord.length === 0) {
    return {
      valid: false,
      message: 'A palavra não pode estar vazia',
      code: 'WORD_EMPTY',
    };
  }

  // O jogo só aceita palavras de exatamente 5 letras
  if (cleanWord.length !== WORD_LENGTH) {
    return {
      valid: false,
      message: `A palavra deve ter exatamente ${WORD_LENGTH} letras`,
      code: 'WORD_INVALID_LENGTH',
    };
  }

  // Somente letras são permitidas (incluindo acentos e caracteres especiais portugueses)
  if (!LETTERS_REGEX.test(cleanWord)) {
    return {
      valid: false,
      message: 'A palavra deve conter apenas letras',
      code: 'WORD_INVALID_CHARACTERS',
    };
  }

  return {
    valid: true,
    message: 'Tentativa válida',
    code: 'VALID',
  };
}

// Validação específica para palavras do dicionário (mais flexível)
export function validateDictionaryWord(word: string): ValidationResult {
  if (!word || typeof word !== 'string') {
    return {
      valid: false,
      message: 'A palavra é obrigatória',
      code: 'WORD_REQUIRED',
    };
  }

  const cleanWord = word.trim();

  if (cleanWord.length === 0) {
    return {
      valid: false,
      message: 'A palavra não pode estar vazia',
      code: 'WORD_EMPTY',
    };
  }

  // Palavras do dicionário podem ter tamanhos diferentes
  if (cleanWord.length < 3 || cleanWord.length > 15) {
    return {
      valid: false,
      message: 'A palavra deve ter entre 3 e 15 letras',
      code: 'WORD_INVALID_LENGTH',
    };
  }

  if (!LETTERS_REGEX.test(cleanWord)) {
    return {
      valid: false,
      message: 'A palavra deve conter apenas letras',
      code: 'WORD_INVALID_CHARACTERS',
    };
  }

  return {
    valid: true,
    message: 'Palavra válida',
    code: 'VALID',
  };
}

export function normalizeWord(word: string): string {
  if (!word || typeof word !== 'string') {
    return '';
  }
  
  return word
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
}

// Comparar palavras ignorando acentos e case
export function compareWords(word1: string, word2: string): boolean {
  return normalizeWord(word1) === normalizeWord(word2);
}

// Gerar um ID único para o jogador
export function generatePlayerId(): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substr(2, 9);
  return `player_${timestamp}_${randomPart}`;
}

// Validar uma data
export function validateDate(date: string | Date): boolean {
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime()) && dateObj.getTime() > 0;
}

// Formato de data para exibição
export function formatDate(date: string | Date): string {
  try {
    const dateObj = new Date(date);
    if (!validateDate(dateObj)) {
      return 'Data inválida';
    }
    
    return dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Data inválida';
  }
}

// Validar email (para futuras funcionalidades)
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitizar string para prevenir XSS
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>\"'&]/g, (match) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return escapeMap[match];
    });
}

// Constantes exportadas
export const VALIDATION_CONSTANTS = {
  WORD_LENGTH: WORD_LENGTH,
  MIN_DICTIONARY_WORD_LENGTH: 3,
  MAX_DICTIONARY_WORD_LENGTH: 15,
  LETTERS_REGEX: LETTERS_REGEX,
} as const;
