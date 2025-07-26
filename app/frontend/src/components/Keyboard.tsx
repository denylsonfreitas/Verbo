import React, { useState, useEffect } from 'react';
import { Delete, Send } from 'lucide-react';

interface LetterFeedback {
  letter: string;
  status: 'correct' | 'wrong-position' | 'incorrect';
}

interface GuessFeedback {
  letters: LetterFeedback[];
}

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  guesses?: GuessFeedback[];
  disabled?: boolean;
}

const Keyboard: React.FC<KeyboardProps> = ({ onKeyPress, guesses = [], disabled = false }) => {
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [recentlyUpdatedKeys, setRecentlyUpdatedKeys] = useState<Set<string>>(new Set());

  const keys = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['Backspace', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Enter'],
  ];

  // Detectar quando uma nova tentativa é adicionada para animar as teclas afetadas
  useEffect(() => {
    if (guesses.length > 0) {
      const lastGuess = guesses[guesses.length - 1];
      const updatedKeys = new Set<string>();
      
      lastGuess.letters.forEach(letterFeedback => {
        updatedKeys.add(letterFeedback.letter.toLowerCase());
      });
      
      setRecentlyUpdatedKeys(updatedKeys);
      
      // Remove a animação após um tempo
      const timer = setTimeout(() => {
        setRecentlyUpdatedKeys(new Set());
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [guesses.length]);

  // Função para calcular o status de uma letra baseado em todas as tentativas
  const getLetterStatus = (letter: string): 'correct' | 'wrong-position' | 'incorrect' | 'unused' => {
    if (letter === 'Enter' || letter === 'Backspace') return 'unused';
    
    let hasCorrect = false;
    let hasWrongPosition = false;
    let hasIncorrect = false;

    guesses.forEach(guess => {
      guess.letters.forEach(item => {
        if (item.letter.toLowerCase() === letter.toLowerCase()) {
          if (item.status === 'correct') {
            hasCorrect = true;
          } else if (item.status === 'wrong-position') {
            hasWrongPosition = true;
          } else if (item.status === 'incorrect') {
            hasIncorrect = true;
          }
        }
      });
    });

    // Prioridade: correct > wrong-position > incorrect > unused
    if (hasCorrect) return 'correct';
    if (hasWrongPosition) return 'wrong-position';
    if (hasIncorrect) return 'incorrect';
    return 'unused';
  };

  const handleKeyClick = (key: string) => {
    if (disabled) return;
    
    setPressedKey(key);
    onKeyPress(key);
    
    // Remove a animação de pressionar após 150ms
    setTimeout(() => setPressedKey(null), 150);
  };

  const getKeyClass = (key: string) => {
    const baseTransition = 'transition-all duration-200 ease-in-out';
    const pressAnimation = pressedKey === key ? 'scale-95 bg-opacity-80' : '';
    const updateAnimation = recentlyUpdatedKeys.has(key) ? 'animate-pulse ring-2 ring-white ring-opacity-60' : '';
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

    // Botões especiais (Enter e Backspace)
    if (key === 'Enter' || key === 'Backspace') {
      const hoverClasses = disabled ? '' : 'hover:bg-blue-500 focus:bg-blue-700';
      return `px-4 sm:px-4 md:px-6 py-4 sm:py-4 md:py-5 bg-blue-600 text-white font-bold rounded-lg min-w-[64px] sm:min-w-[64px] md:min-w-[80px] text-lg sm:text-lg md:text-xl ${hoverClasses} focus:outline-none focus:ring-2 focus:ring-blue-300 ${baseTransition} ${pressAnimation} ${disabledClasses} transform select-none`;
    }

    // Obtém o status da letra para aplicar a cor correspondente
    const letterStatus = getLetterStatus(key);
    let statusClasses = '';
    let hoverClasses = '';

    switch (letterStatus) {
      case 'correct':
        statusClasses = 'bg-verbo-green text-white border-verbo-green shadow-lg shadow-green-500/20';
        hoverClasses = disabled ? '' : 'hover:bg-green-500 hover:shadow-green-500/30';
        break;
      case 'wrong-position':
        statusClasses = 'bg-verbo-yellow text-white border-verbo-yellow shadow-lg shadow-yellow-500/20';
        hoverClasses = disabled ? '' : 'hover:bg-yellow-500 hover:shadow-yellow-500/30';
        break;
      case 'incorrect':
        statusClasses = 'bg-verbo-gray text-white border-verbo-gray shadow-lg shadow-gray-500/20';
        hoverClasses = disabled ? '' : 'hover:bg-gray-500 hover:shadow-gray-500/30';
        break;
      default:
        statusClasses = 'bg-gray-700 text-white border-gray-700 shadow-lg shadow-gray-500/10';
        hoverClasses = disabled ? '' : 'hover:bg-gray-600 hover:shadow-gray-500/20';
        break;
    }

    return `px-2 py-3 sm:px-2 md:px-3 sm:py-2.5 md:py-4 ${statusClasses} ${hoverClasses} border-2 rounded-lg font-semibold text-base sm:text-sm uppercase min-w-0 flex-1 max-w-[48px] sm:max-w-[40px] md:max-w-[48px] focus:outline-none focus:ring-2 focus:ring-white/30 ${baseTransition} ${pressAnimation} ${updateAnimation} ${disabledClasses} transform select-none`;
  };

  const renderKeyContent = (key: string) => {
    if (key === 'Backspace') {
      return (
        <div className="flex flex-col items-center justify-center">
          <Delete size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
        </div>
      );
    }
    
    if (key === 'Enter') {
      return (
        <div className="flex flex-col items-center justify-center">
          <Send size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center">
        <span className={`leading-none ${getLetterStatus(key) !== 'unused' ? 'font-bold' : ''}`}>
          {key}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-0.5 sm:gap-1 md:gap-2 w-full max-w-full mx-auto px-1 sm:px-2">
      {keys.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-0.5 sm:gap-1 justify-center w-full">
          {row.map(key => {
            return (
              <button
                key={key}
                onClick={() => handleKeyClick(key)}
                disabled={disabled}
                className={getKeyClass(key)}
                aria-label={key === 'Backspace' ? 'Apagar' : key === 'Enter' ? 'Enviar tentativa' : `Letra ${key.toUpperCase()}`}
                aria-pressed={getLetterStatus(key) !== 'unused'}
              >
                {renderKeyContent(key)}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
