import React, { useEffect, useState } from 'react';
import GameBoard from '../components/GameBoard';
import Keyboard from '../components/Keyboard';
import KeyboardLegend from '../components/KeyboardLegend';
import GameResult from '../components/GameResult';
import Tutorial from '../components/Tutorial';
import Toast from '../components/Toast';
import SaveStatsBanner from '../components/SaveStatsBanner';
import { useGame } from '../contexts/GameContext';
import { useTutorial } from '../contexts/TutorialContext';
import { useAuth } from '../contexts/AuthContext';
import { statsService } from '../services/statsService';

const Game: React.FC = () => {
  const {
    gameState,
    submitGuess,
    addLetter,
    removeLetter,
    resetGame,
    insertLetterAtPosition,
    setSelectedPosition,
    hideError,
  } = useGame();
  const { showError, errorMessage } = gameState;
  const { state: authState } = useAuth();
  const [showSaveStatsBanner, setShowSaveStatsBanner] = useState(false);

  const { showTutorial, completeTutorial, hideTutorial } = useTutorial();

  // Mostrar banner de salvar estatísticas para usuários não autenticados após vitória
  useEffect(() => {
    if (
      gameState.gameOver &&
      gameState.win &&
      !authState.isAuthenticated &&
      gameState.statsRecorded
    ) {
      // Delay para mostrar após o resultado
      const timer = setTimeout(() => {
        setShowSaveStatsBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState.gameOver, gameState.win, authState.isAuthenticated, gameState.statsRecorded]);

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
      // Não processar eventos se estiver em game over
      if (gameState.gameOver) return;

      // Não processar eventos se há modais de autenticação abertos
      if (authState.showLoginModal || authState.showRegisterModal) {
        return;
      }

      // Não processar eventos se o usuário estiver digitando em um input/textarea/modal
      const target = event.target as HTMLElement;
      const inputElement = target as HTMLInputElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.closest('[role="dialog"]') ||
        target.closest('.modal') ||
        // Verifica se há modais abertos (classe comum em modais)
        document.querySelector('.fixed.inset-0') ||
        // Verifica se há focus em elementos de formulário
        (inputElement.type && ['text', 'email', 'password', 'search'].includes(inputElement.type))
      ) {
        return;
      }

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
    authState.showLoginModal,
    authState.showRegisterModal,
    submitGuess,
    removeLetter,
    insertLetterAtPosition,
    setSelectedPosition,
  ]);

  return (
    <div className="h-full flex flex-col">
      <Tutorial isOpen={showTutorial} onClose={handleCloseTutorial} />

      {/* Container principal centralizado com padding responsivo */}
      <div className="flex-1 flex flex-col items-center justify-center px-2 py-2 sm:px-4 sm:py-4 min-h-0">
        
        {/* Container do jogo com largura controlada e centralizado */}
        <div className="w-full max-w-md sm:max-w-lg flex flex-col items-center space-y-2 sm:space-y-3 overflow-hidden">
          
          {/* GameBoard */}
          <div className="flex-shrink-0">
            <GameBoard />
          </div>

          {/* Conteúdo central - GameResult quando jogo termina */}
          {gameState.gameOver && (
            <div className="flex-shrink-0">
              <GameResult
                wordOfDay={gameState.wordOfDay}
                win={gameState.win}
                guesses={gameState.guesses}
                maxGuesses={gameState.maxGuesses}
              />
            </div>
          )}

          {/* Teclado e legenda - sempre centralizados */}
          {!gameState.gameOver && (
            <div className="flex-shrink-0 w-full flex flex-col items-center space-y-3 sm:space-y-4">
              <Keyboard 
                onKeyPress={handleKeyPress} 
                guesses={gameState.guesses} 
                disabled={gameState.loading.submit || gameState.loading.validate}
              />
              <KeyboardLegend className="text-xs sm:text-sm" guesses={gameState.guesses} />
            </div>
          )}
        </div>
      </div>
      
      {/* Toast para feedback visual melhorado - substitui o ErrorMessage */}
      <Toast 
        show={showError}
        message={errorMessage}
        type="error"
        onClose={hideError}
      />

      {/* Banner para promover criação de conta após vitórias */}
      <SaveStatsBanner
        show={showSaveStatsBanner}
        onClose={() => setShowSaveStatsBanner(false)}
        gamesWon={statsService.loadStats().gamesWon}
        totalGames={statsService.loadStats().gamesPlayed}
      />
    </div>
  );
};

export default Game;
