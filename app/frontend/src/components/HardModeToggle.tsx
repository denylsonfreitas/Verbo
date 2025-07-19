import React from 'react';
import { useGame } from '../contexts/GameContext';

const HardModeToggle: React.FC = () => {
  const { gameState, toggleHardMode } = useGame();

  return (
    <div className="flex items-center space-x-3 bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4">
      <div className="flex-1">
        <h3 className="text-sm sm:text-base font-semibold text-white mb-1">
          Modo Difícil
        </h3>
        <p className="text-xs sm:text-sm text-gray-300">
          Letras corretas devem ser mantidas nas próximas tentativas
        </p>
      </div>

      <button
        onClick={toggleHardMode}
        disabled={gameState.guesses.length > 0}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
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
  );
};

export default HardModeToggle;
