import React, { useState, useEffect } from 'react';
import LetterTile from './LetterTile';
import { useGame } from '../contexts/GameContext';

const GameBoard: React.FC = () => {
  const { gameState, setSelectedPosition, insertLetterAtPosition } = useGame();
  const {
    guesses,
    currentGuess,
    maxGuesses,
    wordLength,
    gameOver,
    selectedPosition,
    showError,
    loading,
  } = gameState;

  const [shouldAnimateRow, setShouldAnimateRow] = useState<number | null>(null);
  const [prevGuessesLength, setPrevGuessesLength] = useState(guesses.length);

  // Detectar quando uma nova linha é submetida para triggerar animação
  useEffect(() => {
    if (guesses.length > prevGuessesLength) {
      setShouldAnimateRow(guesses.length - 1);
      // Reset animation trigger após um tempo
      setTimeout(() => setShouldAnimateRow(null), 3000);
    }
    setPrevGuessesLength(guesses.length);
  }, [guesses.length, prevGuessesLength]);

  return (
    <div className="grid gap-1 sm:gap-2 p-2 sm:p-4">
      {Array.from({ length: maxGuesses }, (_, rowIndex) => {
        // Linha já submetida: mostrar feedback de cada letra
        if (guesses[rowIndex]) {
          const isAnimatingRow = shouldAnimateRow === rowIndex;
          return (
            <div key={rowIndex} className="flex gap-1 sm:gap-2 justify-center">
              {guesses[rowIndex].letters.map((item, colIndex) => (
                <LetterTile
                  key={colIndex}
                  letter={item.letter}
                  status={item.status}
                  position={colIndex}
                  shouldFlip={isAnimatingRow}
                  animationDelay={colIndex * 100} // 100ms delay entre cada tile
                />
              ))}
            </div>
          );
        }
        // Linha ativa: mostrar o que está sendo digitado
        if (rowIndex === guesses.length && !gameOver) {
          const handleTileClick = (position: number) => {
            if (!gameOver && rowIndex === guesses.length) {
              setSelectedPosition(position);
            }
          };

          return (
            <div
              key={rowIndex}
              className={`flex gap-1 sm:gap-2 justify-center relative ${showError ? 'shake-animation' : ''}`}
            >
              {/* Indicador de validação removido */}
              {Array.from({ length: wordLength }, (_, colIndex) => (
                <LetterTile
                  key={colIndex}
                  letter={
                    currentGuess[colIndex] && currentGuess[colIndex] !== ' '
                      ? currentGuess[colIndex]
                      : ''
                  }
                  status="empty"
                  isActive={colIndex === selectedPosition}
                  isSelected={colIndex === selectedPosition}
                  onClick={() => handleTileClick(colIndex)}
                  position={colIndex}
                  showError={showError}
                />
              ))}
            </div>
          );
        }
        // Linhas vazias
        return (
          <div key={rowIndex} className="flex gap-1 sm:gap-2 justify-center">
            {Array.from({ length: wordLength }, (_, colIndex) => (
              <LetterTile
                key={colIndex}
                letter=""
                status="empty"
                position={colIndex}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default GameBoard;
