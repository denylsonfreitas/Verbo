import React, { useState } from 'react';
import { Cloud, X, UserPlus, LogIn, Trophy, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SaveStatsBannerProps {
  show: boolean;
  onClose: () => void;
  gamesWon: number;
  totalGames: number;
}

const SaveStatsBanner: React.FC<SaveStatsBannerProps> = ({
  show,
  onClose,
  gamesWon,
  totalGames
}) => {
  const { state, showLoginModal, showRegisterModal } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!show || isDismissed || state.isAuthenticated) {
    return null;
  }

  const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;

  const handleDismiss = () => {
    setIsDismissed(true);
    onClose();
  };

  const handleLogin = () => {
    showLoginModal();
    handleDismiss();
  };

  const handleRegister = () => {
    showRegisterModal();
    handleDismiss();
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md mx-4">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg border border-blue-500/30 p-4">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="pr-6">
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full mb-3">
            <Trophy className="text-white" size={20} />
          </div>

          {/* Title */}
          <h3 className="text-white font-bold text-lg mb-2">
            Salve suas estatísticas!
          </h3>

          {/* Stats */}
          <div className="text-white/90 text-sm mb-3">
            <p>Você já ganhou <strong>{gamesWon}</strong> jogos!</p>
            <p>Taxa de vitória: <strong>{winRate}%</strong></p>
          </div>

          {/* Description */}
          <p className="text-white/80 text-sm mb-4">
            Crie uma conta para salvar suas estatísticas na nuvem e nunca perdê-las!
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleRegister}
              className="flex-1 bg-white text-blue-600 font-medium py-2 px-3 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <UserPlus size={14} />
              Criar Conta
            </button>
            <button
              onClick={handleLogin}
              className="flex-1 bg-white/20 text-white font-medium py-2 px-3 rounded-md hover:bg-white/30 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <LogIn size={14} />
              Entrar
            </button>
          </div>

          {/* Disclaimer */}
          <p className="text-white/60 text-xs mt-2 text-center">
            Criar conta é opcional. Você pode continuar jogando sem login.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SaveStatsBanner;
