import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTutorial } from '../contexts/TutorialContext';
import { useAuth } from '../contexts/AuthContext';
import { Play, BarChart3, Shield, HelpCircle, Settings, LogIn, UserPlus } from 'lucide-react';
import OptionsModal from './OptionsModal';
import UserMenu from './UserMenu';
import LoginModal from './LoginModal';

const Header: React.FC = () => {
  const location = useLocation();
  const { showTutorialManually } = useTutorial();
  const { state, showLoginModal, showRegisterModal, hideLoginModal, hideRegisterModal } = useAuth();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-verbo-primary text-white shadow-lg">
      <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4">
        <nav className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 gap-y-2">
          {/* Lado Esquerdo - Navegação */}
          <div className="flex items-center space-x-1 justify-start">
            <Link
              to="/"
              className={`px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1 ${
                isActive('/')
                  ? 'bg-verbo-accent text-white'
                  : 'text-white hover:bg-verbo-accent/80'
              }`}
            >
              <Play size={16} className="sm:w-4 sm:h-4" />
            </Link>

            <Link
              to="/stats"
              className={`px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1 ${
                state.isAuthenticated ? 'hidden' : ''
              } ${
                isActive('/stats')
                  ? 'bg-verbo-accent text-white'
                  : 'text-white hover:bg-verbo-accent/80'
              }`}
            >
              <BarChart3 size={16} className="sm:w-4 sm:h-4" />
            </Link>

            <Link
              to="/admin"
              className={`px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1 ${
                !state.isAuthenticated || state.user?.role !== 'admin' 
                  ? 'hidden' 
                  : 'hidden'
              } ${
                isActive('/admin')
                  ? 'bg-verbo-accent text-white'
                  : 'text-white hover:bg-verbo-accent/80'
              }`}
            >
              <Shield size={16} className="sm:w-4 sm:h-4" />
            </Link>

            <button
              onClick={showTutorialManually}
              className="px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors text-white hover:bg-verbo-accent/80 flex items-center space-x-1"
              title="Como jogar"
            >
              <HelpCircle size={16} className="sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => setIsOptionsOpen(true)}
              className="px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors text-white hover:bg-verbo-accent/80 flex items-center space-x-1"
              title="Opções do jogo"
            >
              <Settings size={16} className="sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Centro - Logo */}
          <Link
            to="/"
            className="text-xl sm:text-2xl font-major-mono font-bold hover:text-verbo-accent transition-colors text-center"
          >
            Verbo
          </Link>

          {/* Lado Direito - Apenas Autenticação */}
          <div className="flex items-center space-x-1 justify-end">
            {/* Authentication Section */}
            {state.isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={showLoginModal}
                  className="px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors text-white hover:bg-verbo-accent/80 flex items-center space-x-1"
                >
                  <LogIn size={16} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </button>
                <button
                  onClick={showRegisterModal}
                  className="px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors bg-verbo-accent text-white hover:bg-verbo-accent/90 flex items-center space-x-1"
                >
                  <UserPlus size={16} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Criar Conta</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Modal de Opções */}
      <OptionsModal 
        isOpen={isOptionsOpen} 
        onClose={() => setIsOptionsOpen(false)} 
      />

      {/* Modal de Login */}
      <LoginModal
        isOpen={state.showLoginModal}
        onClose={hideLoginModal}
        initialMode="login"
      />

      {/* Modal de Registro */}
      <LoginModal
        isOpen={state.showRegisterModal}
        onClose={hideRegisterModal}
        initialMode="register"
      />
    </header>
  );
};

export default Header;
