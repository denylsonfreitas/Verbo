import { api } from './api';

// Interfaces para tipos de dados
export interface User {
  _id: string;
  username: string;
  email?: string;
  role: 'player' | 'admin';
  stats: GameStats;
  gameHistory: WordHistoryEntry[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export interface WordHistoryEntry {
  word: string;
  verbId: string;
  date: string;
  won: boolean;
  attempts: number;
  guesses: Array<{
    letters: Array<{
      letter: string;
      status: 'correct' | 'wrong-position' | 'incorrect';
    }>;
  }>;
  hardMode: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export interface LoginData {
  login: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email?: string;
}

// Chaves para armazenamento local
const TOKEN_KEY = 'verbo_auth_token';
const USER_KEY = 'verbo_auth_user';

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Carregar dados do localStorage na inicialização
    this.loadFromStorage();
  }

  // Carregar token e usuário do localStorage
  private loadFromStorage(): void {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);

      if (token && userStr) {
        this.token = token;
        this.user = JSON.parse(userStr);
        this.setAuthHeader(token);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de autenticação:', error);
      this.clearStorage();
    }
  }

  // Salvar dados no localStorage
  private saveToStorage(token: string, user: User): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      this.token = token;
      this.user = user;
      this.setAuthHeader(token);
    } catch (error) {
      console.error('Erro ao salvar dados de autenticação:', error);
    }
  }

  // Limpar dados do localStorage
  private clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token = null;
    this.user = null;
    this.removeAuthHeader();
  }

  // Definir header de autorização
  private setAuthHeader(token: string): void {
    api.setHeaders({ Authorization: `Bearer ${token}` });
  }

  // Remover header de autorização
  private removeAuthHeader(): void {
    api.clearHeaders();
  }

  // Login do usuário
  async login(login: string, password: string): Promise<AuthResponse> {
    const loginData: LoginData = { login, password };
    
    const response = await api.post('/api/auth/login', loginData);
    const authResponse: AuthResponse = response;

    this.saveToStorage(authResponse.token, authResponse.user);
    
    return authResponse;
  }

  // Registro de novo usuário
  async register(username: string, password: string, email?: string): Promise<AuthResponse> {
    const registerData: RegisterData = { username, password };
    
    if (email && email.trim()) {
      registerData.email = email.trim();
    }

    const response = await api.post('/api/auth/register', registerData);
    const authResponse: AuthResponse = response;

    this.saveToStorage(authResponse.token, authResponse.user);
    
    return authResponse;
  }

  // Logout do usuário
  logout(): void {
    this.clearStorage();
  }

  // Verificar se o token é válido
  async verifyToken(): Promise<boolean> {
    try {
      if (!this.token) return false;

      await api.get('/api/auth/verify');
      return true;
    } catch (error) {
      console.error('Token inválido:', error);
      this.clearStorage();
      return false;
    }
  }

  // Obter perfil do usuário
  async getProfile(): Promise<User> {
    const response = await api.get('/api/auth/profile');
    const user: User = response.user;
    
    // Atualizar usuário local
    if (this.token) {
      this.saveToStorage(this.token, user);
    }
    
    return user;
  }

  // Atualizar perfil do usuário
  async updateProfile(data: { username?: string; email?: string }): Promise<User> {
    const response = await api.put('/api/auth/profile', data);
    const user: User = response.user;
    
    // Atualizar usuário local
    if (this.token) {
      this.saveToStorage(this.token, user);
    }
    
    return user;
  }

  // Alterar senha do usuário
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/api/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword: newPassword
    });
  }

  // Sincronizar dados locais com o servidor
  async syncData(stats: GameStats, gameHistory: WordHistoryEntry[]): Promise<User> {
    const response = await api.post('/api/auth/sync', { stats, gameHistory });
    const user: User = response.user;

    // Garante que todos os campos obrigatórios de stats estão presentes
    if (user && user.stats) {
      user.stats = {
        statId: stats?.statId || user.stats.statId || '',
        gamesPlayed: user.stats.gamesPlayed ?? stats?.gamesPlayed ?? 0,
        gamesWon: user.stats.gamesWon ?? stats?.gamesWon ?? 0,
        currentStreak: user.stats.currentStreak ?? stats?.currentStreak ?? 0,
        maxStreak: user.stats.maxStreak ?? stats?.maxStreak ?? 0,
        guessDistribution: user.stats.guessDistribution ?? stats?.guessDistribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
        lastPlayedDate: user.stats.lastPlayedDate ?? stats?.lastPlayedDate ?? null,
        lastWonDate: user.stats.lastWonDate ?? stats?.lastWonDate ?? null
      };
    }

    // Atualizar usuário local
    if (this.token) {
      this.saveToStorage(this.token, user);
    }

    return user;
  }

  // Atualizar estatísticas do usuário
  async updateStats(stats: GameStats): Promise<GameStats> {
    const response = await api.put('/api/auth/stats', { stats });
    
    // Atualizar estatísticas do usuário local
    if (this.user) {
      this.user.stats = response.stats;
      if (this.token) {
        this.saveToStorage(this.token, this.user);
      }
    }
    
    return response.stats;
  }

  // Adicionar entrada ao histórico
  async addHistoryEntry(entry: WordHistoryEntry): Promise<void> {
    await api.post('/api/auth/history', { entry });
    
    // Atualizar histórico local
    if (this.user) {
      this.user.gameHistory.push(entry);
      if (this.token) {
        this.saveToStorage(this.token, this.user);
      }
    }
  }

  // Solicitar reset de senha
  async requestPasswordReset(email: string): Promise<void> {
    await api.post('/api/auth/request-reset', { email });
  }

  // Solicitar reset de senha (método alternativo)
  async forgotPassword(email: string): Promise<{ message: string; devToken?: string; devLink?: string }> {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao solicitar reset de senha');
    }
  }

  // Resetar senha com token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/api/auth/reset-password', { token, newPassword });
  }

  // Verificar se token de reset é válido
  async verifyResetToken(token: string): Promise<boolean> {
    try {
      const response = await api.post('/api/auth/verify-reset-token', { token });
      return response.valid;
    } catch (error) {
      return false;
    }
  }

  // Desativar conta
  async deactivateAccount(password: string): Promise<void> {
    await api.post('/api/auth/deactivate', { password });
    this.clearStorage();
  }

  // Getters para acessar dados atuais
  getCurrentUser(): User | null {
    return this.user;
  }

  getStoredToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  isPlayer(): boolean {
    return this.user?.role === 'player';
  }

  // Remover token (para logout forçado)
  removeToken(): void {
    this.clearStorage();
  }

  // Verificar se precisa migrar dados locais
  shouldMigrateLocalData(): boolean {
    if (!this.isAuthenticated()) return false;
    
    // Verificar se há dados no localStorage que não estão no servidor
    const localStats = localStorage.getItem('verbo_stats');
    const localHistory = localStorage.getItem('verbo_history');
    
    return !!(localStats || localHistory);
  }

  // Migrar dados locais para o servidor
  async migrateLocalData(): Promise<boolean> {
    if (!this.isAuthenticated()) return false;

    try {
      const localStatsStr = localStorage.getItem('verbo_stats');
      const localHistoryStr = localStorage.getItem('verbo_history');

      if (!localStatsStr && !localHistoryStr) return true;

      const localStats = localStatsStr ? JSON.parse(localStatsStr) : null;
      const localHistory = localHistoryStr ? JSON.parse(localHistoryStr) : [];

      await this.syncData(localStats, localHistory);

      // Opcionalmente, limpar dados locais após migração
      // localStorage.removeItem('verbo_stats');
      // localStorage.removeItem('verbo_history');

      return true;
    } catch (error) {
      console.error('Erro ao migrar dados locais:', error);
      return false;
    }
  }

  // Excluir conta permanentemente
  async deleteAccount(password: string): Promise<void> {
    await api.post('/api/auth/delete-account', { password });
    
    // Limpar dados locais após exclusão
    this.clearStorage();
    localStorage.removeItem('verbo_stats');
    localStorage.removeItem('verbo_history');
  }

  async requestEmailChange(newEmail: string): Promise<{ message: string; verificationToken?: string }> {
    const response = await api.post('/api/auth/request-email-change', { newEmail });
    return response;
  }

  async confirmEmailChange(token: string): Promise<User> {
    const response = await api.post('/api/auth/confirm-email-change', { token });
    
    // Atualizar os dados locais do usuário
    if (response.user) {
      this.user = response.user;
      // Salvar no localStorage com os dados atualizados
      if (this.token && this.user) {
        this.saveToStorage(this.token, this.user);
      }
    }
    
    return response.user;
  }
}

// Instância singleton do serviço
export const authService = new AuthService();
