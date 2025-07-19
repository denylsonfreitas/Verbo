import { AppError, ErrorType, getErrorFromStatus } from '../utils/errorUtils';

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

// Headers customizados
let customHeaders: Record<string, string> = {};

// Função para obter o token JWT do localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('verbo_auth_token');
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    
    // Priorizar a mensagem específica do servidor
    const errorMessage = errorData.message || errorData.error || response.statusText;
    const appError = getErrorFromStatus(response.status, errorMessage);
    throw appError;
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

export const api = {
  // Configurar headers customizados
  setHeaders(headers: Record<string, string>) {
    customHeaders = { ...customHeaders, ...headers };
  },

  // Limpar headers customizados
  clearHeaders() {
    customHeaders = {};
  },

  // Função para obter headers com token JWT automático
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  },

  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: this.getHeaders(),
    });
    return handleResponse(response);
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async put(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return handleResponse(response);
  },
};
