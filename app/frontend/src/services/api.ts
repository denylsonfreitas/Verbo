import { AppError, ErrorType, getErrorFromStatus } from '../utils/errorUtils';

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

// Headers customizados
let customHeaders: Record<string, string> = {};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    
    // Usar o sistema de erros melhorado
    const appError = getErrorFromStatus(response.status, errorData.message || errorData.error);
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

  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
    });
    return handleResponse(response);
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async put(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
    });
    return handleResponse(response);
  },
};
