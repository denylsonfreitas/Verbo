import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTutorial } from '../contexts/TutorialContext';
import { Play, BarChart3, Shield, HelpCircle, Settings } from 'lucide-react';
import OptionsModal from './OptionsModal';

const Header: React.FC = () => {
  const location = useLocation();
  const { showTutorialManually } = useTutorial();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-verbo-primary text-white shadow-lg">
      <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4">
        <nav className="flex flex-wrap items-center justify-between gap-y-2">
          <Link
            to="/"
            className="text-xl sm:text-2xl font-bold hover:text-verbo-accent transition-colors"
          >
            Verbo
          </Link>

          <div className="flex items-center space-x-1 sm:space-x-4">
            <Link
              to="/"
              className={`px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1 ${
                isActive('/')
                  ? 'bg-verbo-accent text-white'
                  : 'text-white hover:bg-verbo-accent/80'
              }`}
            >
              <Play size={16} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Jogar</span>
            </Link>

            <Link
              to="/stats"
              className={`px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1 ${
                isActive('/stats')
                  ? 'bg-verbo-accent text-white'
                  : 'text-white hover:bg-verbo-accent/80'
              }`}
            >
              <BarChart3 size={16} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Estatistícas</span>
            </Link>

            <Link
              to="/admin"
              className="px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors text-white hover:bg-verbo-accent/80 flex items-center space-x-1"
            >
              <Shield size={16} className="sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Admin</span>
            </Link>

            <button
              onClick={showTutorialManually}
              className="px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors text-white hover:bg-verbo-accent/80 flex items-center space-x-1"
              title="Como jogar"
            >
              <HelpCircle size={16} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Ajuda</span>
            </button>

            <button
              onClick={() => setIsOptionsOpen(true)}
              className="px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors text-white hover:bg-verbo-accent/80 flex items-center space-x-1"
              title="Opções do jogo"
            >
              <Settings size={16} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Opções</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Modal de Opções */}
      <OptionsModal 
        isOpen={isOptionsOpen} 
        onClose={() => setIsOptionsOpen(false)} 
      />
    </header>
  );
};

export default Header;
