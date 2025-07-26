import React, { useState, useRef, useEffect } from 'react';
import Toast from './Toast';
import { 
  User, 
  LogOut, 
  BarChart3, 
  Cloud, 
  ChevronDown,
  Shield,
  UserCog
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserMenu: React.FC = () => {
  const { state, logout, syncData } = useAuth();
  const [showError, setShowError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Obter dados locais para sincronizar
      const localStatsStr = localStorage.getItem('verbo_stats');
      const localHistoryStr = localStorage.getItem('verbo_history');
      const localStats = localStatsStr ? JSON.parse(localStatsStr) : null;
      const localHistory = localHistoryStr ? JSON.parse(localHistoryStr) : [];
      const result = await syncData(localStats, localHistory);
      if (!result) {
        setShowError(true);
      }
    } catch (error) {
      setShowError(true);
      console.error('Erro ao sincronizar:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!state.isAuthenticated || !state.user) {
    return null;
  }

  const user = state.user;

  // Se não há usuário, não renderizar o menu
  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Toast de erro de sincronização */}
      <Toast
        message={state.error || 'Erro ao sincronizar dados'}
        type="error"
        show={showError && !!state.error}
        onClose={() => setShowError(false)}
        duration={4000}
      />
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-white"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <User size={16} />
        </div>
        <span className="hidden sm:block font-medium">{user.username}</span>
        {user.role === 'admin' && (
          <Shield size={14} className="text-yellow-400" />
        )}
        <ChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <User size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{user.username}</p>
                {user.email && (
                  <p className="text-sm text-gray-400 truncate">{user.email}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-yellow-900 text-yellow-200' 
                      : 'bg-blue-900 text-blue-200'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : 'Jogador'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center">
                <p className="text-white font-medium">{user?.stats?.gamesPlayed || 0}</p>
                <p className="text-gray-400">Jogos</p>
              </div>
              <div className="text-center">
                <p className="text-white font-medium">{user?.stats?.currentStreak || 0}</p>
                <p className="text-gray-400">Sequência</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Sync Data */}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Cloud size={16} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Dados'}</span>
            </button>

            {/* Stats */}
            <button
              onClick={() => {
                setIsOpen(false);
                // Navegar para página de estatísticas se necessário
                window.location.href = '/stats';
              }}
              className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3"
            >
              <BarChart3 size={16} />
              <span>Estatísticas</span>
            </button>

            {/* My Account */}

            {/* Admin Panel (se for admin) */}
            {user.role === 'admin' && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/admin';
                }}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3"
              >
                <Shield size={16} />
                <span>Painel Admin</span>
              </button>
            )}

            {/* Divider */}
            <div className="h-px bg-gray-700 my-2"></div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors flex items-center gap-3"
            >
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
