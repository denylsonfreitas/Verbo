import React, { useEffect, useState } from 'react';

interface LetterTileProps {
  letter: string;
  status: 'empty' | 'submitted' | 'correct' | 'wrong-position' | 'incorrect';
  isActive?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  position: number;
  showError?: boolean;
  shouldFlip?: boolean;
  animationDelay?: number;
}

const LetterTile: React.FC<LetterTileProps> = ({
  letter,
  status,
  isActive = false,
  isSelected = false,
  onClick,
  position,
  showError = false,
  shouldFlip = false,
  animationDelay = 0,
}) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [showPop, setShowPop] = useState(false);
  const [prevLetter, setPrevLetter] = useState(letter);

  // Trigger flip animation when shouldFlip changes
  useEffect(() => {
    if (
      shouldFlip &&
      (status === 'correct' ||
        status === 'wrong-position' ||
        status === 'incorrect')
    ) {
      setTimeout(() => {
        setIsFlipping(true);
        setTimeout(() => setIsFlipping(false), 600);
      }, animationDelay);
    }
  }, [shouldFlip, status, animationDelay]);

  // Trigger pop animation when letter changes (letter added)
  useEffect(() => {
    if (letter !== prevLetter && letter !== '') {
      setShowPop(true);
      setTimeout(() => setShowPop(false), 150);
    }
    setPrevLetter(letter);
  }, [letter, prevLetter]);

  const getTileClasses = () => {
    const baseClasses =
      'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border-2 flex items-center justify-center text-base sm:text-xl md:text-2xl font-bold uppercase transition-colors duration-300 cursor-pointer rounded-sm';

    let animationClasses = '';

    // Adicionar classes de animação
    if (isFlipping) {
      animationClasses += ' tile-flip';
    }
    if (showPop) {
      animationClasses += ' tile-pop';
    }
    if (showError) {
      animationClasses += ' shake-animation';
    }

    // Se estiver mostrando erro, aplicar cores de erro
    if (showError) {
      return `${baseClasses}${animationClasses} bg-orange-500 border-orange-500 text-white`;
    }

    switch (status) {
      case 'correct':
        return `${baseClasses}${animationClasses} bg-verbo-green border-verbo-green text-white`;
      case 'wrong-position':
        return `${baseClasses}${animationClasses} bg-verbo-yellow border-verbo-yellow text-white`;
      case 'incorrect':
        return `${baseClasses}${animationClasses} bg-gray-600 border-gray-600 text-white`;
      case 'submitted':
        return `${baseClasses}${animationClasses} bg-gray-800 border-gray-700 text-white`;
      case 'empty':
      default:
        if (isSelected) {
          return `${baseClasses}${animationClasses} bg-gray-800 border-blue-400 text-white pulse`;
        }
        return `${baseClasses}${animationClasses} bg-gray-800 border-gray-700 text-white ${isActive ? 'border-blue-400' : ''}`;
    }
  };

  return (
    <div
      className={getTileClasses()}
      onClick={onClick}
      title={`Posição ${position + 1}`}
      style={{ animationDelay: shouldFlip ? `${animationDelay}ms` : undefined }}
    >
      {letter}
    </div>
  );
};

export default LetterTile;
