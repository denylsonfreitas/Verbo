import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { authService, User, AuthResponse } from '../services/authService';
import { statsService } from '../services/statsService';
import { historyService } from '../services/historyService';

// Interface para o estado de autenticação
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  showLoginModal: boolean;
  showRegisterModal: boolean;
}

// Tipos de ações para o reducer
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthResponse }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: AuthResponse }
  | { type: 'REGISTER_FAILURE'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SHOW_LOGIN_MODAL' }
  | { type: 'HIDE_LOGIN_MODAL' }
  | { type: 'SHOW_REGISTER_MODAL' }
  | { type: 'HIDE_REGISTER_MODAL' }
  | { type: 'SYNC_START' }
  | { type: 'SYNC_SUCCESS' }
  | { type: 'SYNC_FAILURE'; payload: string }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

// Interface para o contexto
interface AuthContextType {
  state: AuthState;
  login: (login: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, email?: string) => Promise<boolean>;
  logout: () => void;
  syncData: (stats: any, gameHistory: any[]) => Promise<boolean>;
  showLoginModal: () => void;
  hideLoginModal: () => void;
  showRegisterModal: () => void;
  hideRegisterModal: () => void;
  clearError: () => void;
  updateProfile: (data: { username?: string; email?: string }) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateUser: (user: User) => void;
  resetUserStats: () => void;
}

// Estado inicial
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  showLoginModal: false,
  showRegisterModal: false,
};

// Reducer para gerenciar o estado de autenticação
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
    case 'SYNC_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        showLoginModal: false,
        showRegisterModal: false,
      };

    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
    case 'SYNC_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      };

    case 'SYNC_SUCCESS':
      return {
        ...state,
        isLoading: false,
        error: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'SHOW_LOGIN_MODAL':
      return {
        ...state,
        showLoginModal: true,
        showRegisterModal: false,
        error: null,
      };

    case 'HIDE_LOGIN_MODAL':
      return {
        ...state,
        showLoginModal: false,
        error: null,
      };

    case 'SHOW_REGISTER_MODAL':
      return {
        ...state,
        showRegisterModal: true,
        showLoginModal: false,
        error: null,
      };

    case 'HIDE_REGISTER_MODAL':
      return {
        ...state,
        showRegisterModal: false,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
}

// Criação do contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider do contexto de autenticação
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar se há token salvo ao carregar a aplicação
  useEffect(() => {
    const checkAuthStatus = async () => {
      const savedToken = authService.getStoredToken();
      
      if (savedToken) {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        try {
          const isValid = await authService.verifyToken();
          if (isValid) {
            const user = authService.getCurrentUser();
            if (user) {
              dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { user, token: savedToken, message: 'Login restaurado com sucesso' }
              });
            }
          } else {
            // Token inválido, remove do storage
            authService.removeToken();
          }
        } catch (error) {
          console.error('Erro ao verificar token:', error);
          authService.removeToken();
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };

    checkAuthStatus();
  }, []);

  // Função de login
  const login = useCallback(async (loginValue: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await authService.login(loginValue, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
      
      // Sincronizar dados locais após login bem-sucedido
      try {
        const localStats = statsService.loadStats();
        const localHistory = historyService.loadHistory();
        
        // Só sincronizar se houver dados locais
        if (localStats.gamesPlayed > 0 || localHistory.length > 0) {
          console.log('Dados locais encontrados para sincronização após login:', {
            stats: localStats,
            historyEntries: localHistory.length
          });
          await authService.syncData(localStats, localHistory);
          console.log('Dados locais sincronizados após login');
        } else {
          console.log('Nenhum dado local encontrado para sincronizar após login');
        }
      } catch (syncError) {
        console.error('Erro ao sincronizar dados após login:', syncError);
        // Não falhar o login por causa da sincronização
      }
      
      return true;
    } catch (error: any) {
      // Com o novo sistema de erros, a mensagem está diretamente em error.message
      const errorMessage = error.message || error.response?.data?.message || 'Erro ao fazer login';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return false;
    }
  }, []);

  // Função de registro
  const register = useCallback(async (username: string, password: string, email?: string): Promise<boolean> => {
    dispatch({ type: 'REGISTER_START' });

    try {
      const response = await authService.register(username, password, email);
      dispatch({ type: 'REGISTER_SUCCESS', payload: response });
      
      // Sincronizar dados locais após registro bem-sucedido
      try {
        const localStats = statsService.loadStats();
        const localHistory = historyService.loadHistory();
        
        // Só sincronizar se houver dados locais
        if (localStats.gamesPlayed > 0 || localHistory.length > 0) {
          console.log('Dados locais encontrados para sincronização após registro:', {
            stats: localStats,
            historyEntries: localHistory.length
          });
          await authService.syncData(localStats, localHistory);
          console.log('Dados locais sincronizados após registro');
        } else {
          console.log('Nenhum dado local encontrado para sincronizar após registro');
        }
      } catch (syncError) {
        console.error('Erro ao sincronizar dados após registro:', syncError);
        // Não falhar o registro por causa da sincronização
      }
      
      return true;
    } catch (error: any) {
      // Com o novo sistema de erros, a mensagem está diretamente em error.message
      const errorMessage = error.message || error.response?.data?.message || 'Erro ao criar conta';
      dispatch({ type: 'REGISTER_FAILURE', payload: errorMessage });
      return false;
    }
  }, []);

  // Função de logout
  const logout = useCallback(() => {
    authService.logout();
    // Limpa histórico local ao sair da conta
    import('../services/historyService').then(m => m.historyService.clearHistory());
    dispatch({ type: 'LOGOUT' });
  }, []);

  // Função de sincronização de dados
  const syncData = useCallback(async (stats: any, gameHistory: any[]): Promise<boolean> => {
    if (!state.isAuthenticated) return false;

    dispatch({ type: 'SYNC_START' });

    try {
      const updatedUser = await authService.syncData(stats, gameHistory);
      // Garante que todos os campos obrigatórios de GameStats estão presentes
      if (updatedUser && updatedUser.stats) {
        updatedUser.stats = {
          statId: updatedUser.stats.statId ?? stats?.statId ?? '',
          gamesPlayed: updatedUser.stats.gamesPlayed ?? stats?.gamesPlayed ?? 0,
          gamesWon: updatedUser.stats.gamesWon ?? stats?.gamesWon ?? 0,
          currentStreak: updatedUser.stats.currentStreak ?? stats?.currentStreak ?? 0,
          maxStreak: updatedUser.stats.maxStreak ?? stats?.maxStreak ?? 0,
          guessDistribution: updatedUser.stats.guessDistribution ?? stats?.guessDistribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
          lastPlayedDate: updatedUser.stats.lastPlayedDate ?? stats?.lastPlayedDate ?? null,
          lastWonDate: updatedUser.stats.lastWonDate ?? stats?.lastWonDate ?? null
        };
      }
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      dispatch({ type: 'SYNC_SUCCESS' });
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao sincronizar dados';
      dispatch({ type: 'SYNC_FAILURE', payload: errorMessage });
      return false;
    }
  }, [state.isAuthenticated]);

  // Atualizar perfil
  const updateProfile = useCallback(async (data: { username?: string; email?: string }): Promise<boolean> => {
    if (!state.isAuthenticated) return false;

    try {
      const updatedUser = await authService.updateProfile(data);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar perfil';
      dispatch({ type: 'SYNC_FAILURE', payload: errorMessage });
      return false;
    }
  }, [state.isAuthenticated]);

  // Alterar senha
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!state.isAuthenticated) return false;

    try {
      await authService.changePassword(currentPassword, newPassword);
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao alterar senha';
      dispatch({ type: 'SYNC_FAILURE', payload: errorMessage });
      return false;
    }
  }, [state.isAuthenticated]);

  // Atualizar usuário diretamente no contexto
  const updateUser = useCallback((user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  // Resetar estatísticas do usuário (apenas local, para sync com localStorage)
  const resetUserStats = useCallback(() => {
    if (!state.user) return;

    const updatedUser = {
      ...state.user,
      stats: {
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
          6: 0
        },
        lastPlayedDate: null,
        lastWonDate: null,
        statId: ''
      },
      gameHistory: []
    };

    dispatch({ type: 'UPDATE_USER', payload: updatedUser });
  }, [state.user]);

  // Funções para controlar modais
  const showLoginModal = useCallback(() => dispatch({ type: 'SHOW_LOGIN_MODAL' }), []);
  const hideLoginModal = useCallback(() => dispatch({ type: 'HIDE_LOGIN_MODAL' }), []);
  const showRegisterModal = useCallback(() => dispatch({ type: 'SHOW_REGISTER_MODAL' }), []);
  const hideRegisterModal = useCallback(() => dispatch({ type: 'HIDE_REGISTER_MODAL' }), []);
  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  const contextValue: AuthContextType = useMemo(() => ({
    state,
    login,
    register,
    logout,
    syncData,
    showLoginModal,
    hideLoginModal,
    showRegisterModal,
    hideRegisterModal,
    clearError,
    updateProfile,
    changePassword,
    updateUser,
    resetUserStats,
  }), [
    state,
    login,
    register,
    logout,
    syncData,
    showLoginModal,
    hideLoginModal,
    showRegisterModal,
    hideRegisterModal,
    clearError,
    updateProfile,
    changePassword,
    updateUser,
    resetUserStats,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto de autenticação
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
