import { api } from './api';

export interface CommonWord {
  id: string;
  word: string;
  type: 'noun' | 'adjective' | 'verb' | 'other';
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NewCommonWord {
  word: string;
  type: 'noun' | 'adjective' | 'verb' | 'other';
  active?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface WordList {
  words: CommonWord[];
  pagination: Pagination;
}

export interface WordFilters {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  active?: boolean;
}

// Helper para converter dados da API
const fromApi = (w: any): CommonWord => ({
  id: w.id ?? w._id,
  word: w.word,
  type: w.type,
  active: w.active,
  createdAt: w.createdAt,
  updatedAt: w.updatedAt,
});

const toApi = (word: Partial<NewCommonWord>): any => {
  const map: any = {};
  if (word.word !== undefined) map.word = word.word;
  if (word.type !== undefined) map.type = word.type;
  if (word.active !== undefined) map.active = word.active;
  return map;
};

export const wordService = {
  // Listar palavras com filtros e paginação
  async listWords(filters: WordFilters = {}): Promise<WordList> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    if (filters.active !== undefined) params.append('active', filters.active.toString());

    const response = await api.get(`/api/words?${params.toString()}`);
    
    return {
      words: response.words.map(fromApi),
      pagination: response.pagination,
    };
  },

  // Adicionar múltiplas palavras
  async addWords(words: string[], type: string = 'other'): Promise<{
    message: string;
    addedWords: CommonWord[];
    invalidWords?: Array<{ word: string; error: string }>;
  }> {
    const response = await api.post('/api/words', {
      words,
      type,
    });

    return {
      message: response.message,
      addedWords: response.addedWords.map(fromApi),
      invalidWords: response.invalidWords,
    };
  },

  // Atualizar uma palavra
  async updateWord(id: string, updates: Partial<NewCommonWord>): Promise<{
    message: string;
    word: CommonWord;
  }> {
    const response = await api.put(`/api/words/${id}`, toApi(updates));
    
    return {
      message: response.message,
      word: fromApi(response.word),
    };
  },

  // Remover uma palavra
  async deleteWord(id: string): Promise<{
    message: string;
    word: CommonWord;
  }> {
    const response = await api.delete(`/api/words/${id}`);
    
    return {
      message: response.message,
      word: fromApi(response.word),
    };
  },

  // Importar palavras de texto
  async batchImport(text: string, type: string = 'other', separator: string = '\n'): Promise<{
    message: string;
    total: number;
    valid: number;
    invalid: number;
    addedWords: CommonWord[];
    invalidWords?: Array<{ word: string; error: string }>;
  }> {
    const response = await api.post('/api/words/batch-import', {
      text,
      type,
      separator,
    });

    return {
      message: response.message,
      total: response.total,
      valid: response.valid,
      invalid: response.invalid,
      addedWords: response.addedWords.map(fromApi),
      invalidWords: response.invalidWords,
    };
  },

  // Ativar/desativar palavra
  async toggleWordStatus(id: string, active: boolean): Promise<{
    message: string;
    word: CommonWord;
  }> {
    return this.updateWord(id, { active });
  },

  // Buscar palavras por tipo
  async getWordsByType(type: string, page: number = 1, limit: number = 20): Promise<WordList> {
    return this.listWords({ type, page, limit });
  },

  // Buscar palavras ativas
  async getActiveWords(page: number = 1, limit: number = 20): Promise<WordList> {
    return this.listWords({ active: true, page, limit });
  },

  // Contar palavras por tipo
  async getWordStats(): Promise<{
    total: number;
    active: number;
    byType: Record<string, number>;
  }> {
    // Como não temos endpoint específico, fazemos múltiplas chamadas
    const [all, active, nouns, adjectives, verbs, others] = await Promise.all([
      this.listWords({ limit: 1 }),
      this.listWords({ active: true, limit: 1 }),
      this.listWords({ type: 'noun', limit: 1 }),
      this.listWords({ type: 'adjective', limit: 1 }),
      this.listWords({ type: 'verb', limit: 1 }),
      this.listWords({ type: 'other', limit: 1 }),
    ]);

    return {
      total: all.pagination.total,
      active: active.pagination.total,
      byType: {
        noun: nouns.pagination.total,
        adjective: adjectives.pagination.total,
        verb: verbs.pagination.total,
        other: others.pagination.total,
      },
    };
  },
};
