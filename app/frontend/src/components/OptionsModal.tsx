import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useGame } from '../contexts/GameContext';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OptionsModal: React.FC<OptionsModalProps> = ({ isOpen, onClose }) => {
  const { gameState, toggleHardMode } = useGame();

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll do body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-auto border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Opções</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Fechar opções"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo das opções */}
        <div className="space-y-4">
          
          {/* Modo Difícil */}
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white mb-1">
                  Modo Difícil
                </h3>
                <p className="text-sm text-gray-300">
                  Letras corretas devem ser mantidas nas próximas tentativas
                </p>
                {gameState.guesses.length > 0 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Não pode ser alterado durante uma partida
                  </p>
                )}
              </div>

              <button
                onClick={toggleHardMode}
                disabled={gameState.guesses.length > 0}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ml-4
                  ${gameState.hardMode ? 'bg-verbo-green' : 'bg-gray-600'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out
                    ${gameState.hardMode ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
            <h3 className="text-base font-semibold text-white mb-2">
              Sobre o Jogo
            </h3>
            <div className="text-sm text-gray-300 space-y-1">
              <p>• Adivinhe a palavra de 5 letras em até 6 tentativas</p>
              <p>• As cores das letras indicam sua posição:</p>
              <div className="ml-4 space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-verbo-green rounded"></div>
                  <span>Verde: posição correta</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-verbo-yellow rounded"></div>
                  <span>Amarelo: letra existe, posição errada</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-verbo-gray rounded"></div>
                  <span>Cinza: letra não existe</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="bg-verbo-primary hover:bg-verbo-primary/80 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OptionsModal;
