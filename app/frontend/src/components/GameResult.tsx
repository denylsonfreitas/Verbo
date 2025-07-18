import React, { useState } from 'react';
import {
  generateShareText,
  copyToClipboard,
  shareNative,
} from '../utils/shareUtils';
import { GuessFeedback } from '../contexts/GameContext';
import Confetti from './Confetti';

interface GameResultProps {
  wordOfDay: string;
  win: boolean;
  guesses: GuessFeedback[];
  maxGuesses: number;
}

const GameResult: React.FC<GameResultProps> = ({
  wordOfDay,
  win,
  guesses,
  maxGuesses,
}) => {
  const [shareMessage, setShareMessage] = useState<string>('');

  const handleShare = async () => {
    const shareData = {
      guesses,
      win,
      maxGuesses,
      gameNumber:
        new Date().getFullYear() * 1000 +
        Math.floor(
          (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
    };

    // Tentar compartilhamento nativo primeiro (mobile)
    const nativeShareSuccess = await shareNative(shareData);

    if (!nativeShareSuccess) {
      // Fallback para copiar para clipboard
      const shareText = generateShareText(shareData);
      const copySuccess = await copyToClipboard(shareText);

      if (copySuccess) {
        setShareMessage('✅ Resultado copiado! Cole onde quiser compartilhar.');
      } else {
        setShareMessage('❌ Erro ao copiar. Tente novamente.');
      }

      // Limpar mensagem após 3 segundos
      setTimeout(() => setShareMessage(''), 3000);
    }
  };

  return (
    <div className="text-center space-y-3 sm:space-y-4 px-2 sm:px-0">
      <Confetti show={win} duration={4000} />

      {win ? (
        <>
          <h2 className="text-xl sm:text-2xl font-bold text-verbo-green glow-green">
            Parabéns!
          </h2>
          <p className="text-sm sm:text-base text-white">
            Você acertou o verbo do dia!
          </p>
        </>
      ) : (
        <>
          <h2 className="text-xl sm:text-2xl font-bold text-red-400">
            Que pena!
          </h2>
          <p className="text-sm sm:text-base text-white">
            Você não conseguiu acertar o verbo do dia.
          </p>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4 mt-3 sm:mt-4">
            <p className="text-gray-300 text-xs sm:text-sm mb-2">
              O verbo do dia era:
            </p>
            <p className="text-xl sm:text-2xl font-bold text-verbo-green uppercase">
              {wordOfDay}
            </p>
          </div>
        </>
      )}

      {/* Botão de Compartilhar */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4 mt-3 sm:mt-4">
        <button
          onClick={handleShare}
          className="w-full bg-verbo-green hover:bg-green-600 text-white font-bold py-3 px-4 sm:px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
        >
          <span>📱</span>
          <span>Compartilhar Resultado</span>
        </button>

        {shareMessage && (
          <p className="text-xs sm:text-sm mt-2 text-blue-300">
            {shareMessage}
          </p>
        )}
      </div>

      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 sm:p-4 mt-3 sm:mt-4">
        <p className="text-blue-200 text-xs sm:text-sm">
          💾 Seu progresso foi salvo automaticamente.
        </p>
        <p className="text-gray-300 text-xs sm:text-sm mt-1">
          Volte amanhã para um novo verbo!
        </p>
      </div>
    </div>
  );
};

export default GameResult;
