import React from 'react';

interface KeyboardLegendProps {
  className?: string;
  guesses?: Array<{
    letters: Array<{
      letter: string;
      status: 'correct' | 'wrong-position' | 'incorrect';
    }>;
  }>;
}

const KeyboardLegend: React.FC<KeyboardLegendProps> = ({ className = '', guesses = [] }) => {
  // Função para contar letras por status
  const getLetterCounts = () => {
    const counts = {
      correct: new Set<string>(),
      'wrong-position': new Set<string>(),
      incorrect: new Set<string>(),
    };

    guesses.forEach(guess => {
      guess.letters.forEach(letterFeedback => {
        const letter = letterFeedback.letter.toLowerCase();
        
        // Prioridade: correct > wrong-position > incorrect
        if (letterFeedback.status === 'correct') {
          counts.correct.add(letter);
          counts['wrong-position'].delete(letter);
          counts.incorrect.delete(letter);
        } else if (letterFeedback.status === 'wrong-position' && !counts.correct.has(letter)) {
          counts['wrong-position'].add(letter);
          counts.incorrect.delete(letter);
        } else if (letterFeedback.status === 'incorrect' && 
                   !counts.correct.has(letter) && 
                   !counts['wrong-position'].has(letter)) {
          counts.incorrect.add(letter);
        }
      });
    });

    return {
      correct: counts.correct.size,
      wrongPosition: counts['wrong-position'].size,
      incorrect: counts.incorrect.size,
    };
  };

  const counts = getLetterCounts();

  return (
    <div className={`flex flex-wrap gap-3 justify-center text-xs sm:text-sm text-gray-300 ${className}`}>
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-verbo-green rounded border border-verbo-green"></div>
        <span>Posição correta</span>
        {counts.correct > 0 && (
          <span className="bg-verbo-green text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
            {counts.correct}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-verbo-yellow rounded border border-verbo-yellow"></div>
        <span>Posição errada</span>
        {counts.wrongPosition > 0 && (
          <span className="bg-verbo-yellow text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
            {counts.wrongPosition}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-verbo-gray rounded border border-verbo-gray"></div>
        <span>Não está na palavra</span>
        {counts.incorrect > 0 && (
          <span className="bg-verbo-gray text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
            {counts.incorrect}
          </span>
        )}
      </div>
    </div>
  );
};

export default KeyboardLegend;
