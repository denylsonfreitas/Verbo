import React, { useEffect } from 'react';
import GameBoard from '../components/GameBoard';
import Keyboard from '../components/Keyboard';
import KeyboardLegend from '../components/KeyboardLegend';
import GameResult from '../components/GameResult';
import Tutorial from '../components/Tutorial';
import Toast from '../components/Toast';
import { useGame } from '../contexts/GameContext';
import { useTutorial } from '../contexts/TutorialContext';

const Game: React.FC = () => {
  const {
    gameState,
    submitGuess,
    addLetter,
    removeLetter,
    resetGame,
    insertLetterAtPosition,
    setSelectedPosition,
  } = useGame();
  const { showError, errorMessage } = gameState;

  const { showTutorial, completeTutorial, hideTutorial } = useTutorial();

  const handleCloseTutorial = () => {
    completeTutorial();
    hideTutorial();
  };

  const handleKeyPress = (key: string) => {
    if (gameState.gameOver) return;

    if (key === 'Enter') {
      submitGuess();
    } else if (key === 'Backspace') {
      removeLetter();
    } else if (/^[a-zA-Z]$/.test(key)) {
      // Inserir letra na posição selecionada
      insertLetterAtPosition(key, gameState.selectedPosition);
    }
  };

  // Adicionar listener para teclado físico
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState.gameOver) return;

      const key = event.key;

      if (key === 'Enter') {
        event.preventDefault();
        submitGuess();
      } else if (key === 'Backspace') {
        event.preventDefault();
        removeLetter();
      } else if (/^[a-zA-Z]$/.test(key)) {
        event.preventDefault();
        insertLetterAtPosition(key, gameState.selectedPosition);
      } else if (key === 'ArrowLeft') {
        event.preventDefault();
        setSelectedPosition(Math.max(0, gameState.selectedPosition - 1));
      } else if (key === 'ArrowRight') {
        event.preventDefault();
        setSelectedPosition(
          Math.min(gameState.wordLength - 1, gameState.selectedPosition + 1)
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    gameState.gameOver,
    gameState.selectedPosition,
    gameState.wordLength,
    submitGuess,
    removeLetter,
    insertLetterAtPosition,
    setSelectedPosition,
  ]);

  return (
    <div className="h-full flex flex-col items-center">
      <Tutorial isOpen={showTutorial} onClose={handleCloseTutorial} />

      {/* Container principal com altura controlada */}
      <div className="flex flex-col items-center w-full max-w-lg px-2 py-2 sm:max-w-2xl sm:px-4 container mx-auto">
        
        {/* GameBoard */}
        <div className="flex-shrink-0 mb-2 sm:mb-3">
          <GameBoard />
        </div>

        {/* Conteúdo central - GameResult quando jogo termina */}
        {gameState.gameOver && (
          <div className="flex-shrink-0 mb-2 sm:mb-3">
            <GameResult
              wordOfDay={gameState.wordOfDay}
              win={gameState.win}
              guesses={gameState.guesses}
              maxGuesses={gameState.maxGuesses}
            />
          </div>
        )}

        {/* Teclado sempre logo após o GameBoard */}
        {!gameState.gameOver && (
          <div className="flex-shrink-0 w-full space-y-0.5 sm:space-y-1">
            <Keyboard 
              onKeyPress={handleKeyPress} 
              guesses={gameState.guesses} 
              disabled={gameState.loading.submit || gameState.loading.validate}
            />
            <KeyboardLegend className="text-xs sm:text-sm" guesses={gameState.guesses} />
          </div>
        )}
      </div>
      
      {/* Toast para feedback visual melhorado - substitui o ErrorMessage */}
      <Toast 
        show={showError}
        message={errorMessage}
        type="error"
        onClose={() => {}} // Auto-close no GameContext
      />
    </div>
  );
};

export default Game;
