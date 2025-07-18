import { api } from './api';

export interface Verb {
  id: string;
  word: string;
  active: boolean;
  used: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NewVerb {
  word: string;
  active?: boolean;
  used?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface VerbList {
  verbs: Verb[];
  pagination: Pagination;
}

// ------------------ helpers ------------------
const toApi = (verb: Partial<NewVerb>): any => {
  const map: any = {};
  if (verb.word !== undefined) map.word = verb.word;
  if (verb.active !== undefined) map.active = verb.active;
  if (verb.used !== undefined) map.used = verb.used;
  return map;
};

const fromApi = (v: any): Verb => ({
  id: v.id ?? v._id,
  word: v.word,
  active: v.active,
  used: v.used || false,
  createdAt: v.createdAt,
  updatedAt: v.updatedAt,
});

export const adminService = {
  // Configurar headers com senha
  setAuthHeaders(password: string) {
    api.setHeaders({ senha: password });
  },

  // Limpar headers de autenticação
  clearAuthHeaders() {
    api.clearHeaders();
  },

  // Listar verbos
  async listarVerbs(page = 1, limit = 20, active?: boolean, search?: string): Promise<VerbList> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (active !== undefined) {
      params.append('active', active.toString());
    }

    if (search && search.trim()) {
      params.append('search', search.trim());
    }

    const response = await api.get(`/api/admin/verbs?${params}`);
    return {
      verbs: response.verbs.map(fromApi),
      pagination: {
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        pages: response.pagination.pages,
      },
    };
  },

  // Cadastrar novo verbo
  async createVerb(verb: NewVerb): Promise<{ message: string; verb: Verb }> {
    const response = await api.post('/api/admin/verbs', toApi(verb));
    return { message: response.message, verb: fromApi(response.verb) };
  },

  // Atualizar verbo
  async updateVerb(
    id: string,
    verb: Partial<NewVerb>
  ): Promise<{ message: string; verb: Verb }> {
    const response = await api.put(`/api/admin/verbs/${id}`, toApi(verb));
    return { message: response.message, verb: fromApi(response.verb) };
  },

  // Desativar verbo
  async deactivateVerb(id: string): Promise<{ message: string }> {
    return api.delete(`/api/admin/verbs/${id}`);
  },

  // Ativar verbo
  async activateVerb(id: string): Promise<{ message: string; verb: Verb }> {
    const response = await api.put(`/api/admin/verbs/${id}`, { active: true });
    return { message: response.message, verb: fromApi(response.verb) };
  },
};

export type {
  Verb as Verbo,
  NewVerb as NovoVerbo,
  Pagination as Paginacao,
  VerbList as ListaVerbos,
};
