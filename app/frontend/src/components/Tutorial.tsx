import React, { useState } from 'react';
import LetterTile from './LetterTile';

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: 'Bem-vindo ao Verbo!',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Descubra o verbo secreto em até 6 tentativas! Cada tentativa deve
            ser um verbo válido em português.
          </p>
          <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4">
            <p className="text-blue-200 text-sm">
              💡 <strong>Dica:</strong> O verbo muda todo dia às 00:00!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Como jogar',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Digite um verbo e pressione ENTER. As cores das entradas te darão
            dicas:
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <LetterTile letter="V" status="correct" position={0} />
              <span className="text-sm text-gray-300">
                <strong className="text-verbo-green">Verde:</strong> Letra
                correta na posição certa
              </span>
            </div>

            <div className="flex items-center gap-3">
              <LetterTile letter="A" status="wrong-position" position={1} />
              <span className="text-sm text-gray-300">
                <strong className="text-verbo-yellow">Amarelo:</strong> Letra
                existe, mas na posição errada
              </span>
            </div>

            <div className="flex items-center gap-3">
              <LetterTile letter="C" status="incorrect" position={2} />
              <span className="text-sm text-gray-300">
                <strong className="text-gray-400">Cinza:</strong> Letra não
                existe no verbo
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Exemplo Prático',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Vamos ver um exemplo! Se o verbo secreto for <strong>FERIR</strong>{' '}
            e você chutou <strong>FICAR</strong>:
          </p>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex gap-1 justify-center mb-3">
              <LetterTile letter="F" status="correct" position={0} />
              <LetterTile letter="I" status="wrong-position" position={1} />
              <LetterTile letter="C" status="incorrect" position={2} />
              <LetterTile letter="A" status="incorrect" position={3} />
              <LetterTile letter="R" status="correct" position={4} />
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p>
                • <strong>F</strong> e <strong>R</strong> estão na posição correta
              </p>
              <p>
                • <strong>I</strong> existe no verbo, mas em outras posições
              </p>
              <p>
                • <strong>C</strong> e <strong>A</strong> não existem no verbo
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Recursos Extras',
      content: (
        <div className="space-y-4">
          <div className="grid gap-3">
            <div className="bg-purple-900/30 border border-purple-600 rounded-lg p-3">
              <h4 className="text-purple-200 font-semibold mb-2">
                🔥 Modo Difícil
              </h4>
              <p className="text-purple-100 text-sm">
                Letras reveladas devem ser usadas nas próximas tentativas
              </p>
            </div>

            <div className="bg-green-900/30 border border-green-600 rounded-lg p-3">
              <h4 className="text-green-200 font-semibold mb-2">
                📊 Estatísticas
              </h4>
              <p className="text-green-100 text-sm">
                Acompanhe seu progresso e sequência de vitórias
              </p>
            </div>

            <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-3">
              <h4 className="text-orange-200 font-semibold mb-2">
                📱 Compartilhar
              </h4>
              <p className="text-orange-100 text-sm">
                Compartilhe seus resultados sem spoilers
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Pronto para começar!',
      content: (
        <div className="space-y-4 text-center">
          <div className="text-6xl">🎯</div>
          <p className="text-gray-300">
            Agora você está pronto para descobrir o verbo do dia!
          </p>
          <div className="bg-verbo-green/20 border border-verbo-green rounded-lg p-4">
            <p className="text-verbo-green text-sm">
              <strong>Dica especial:</strong> Comece com verbos comuns como
              "FAZER" ou "ESTAR"
            </p>
          </div>
        </div>
      ),
    },
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden modal-enter">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {tutorialSteps[currentStep].title}
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">
              {currentStep + 1} de {tutorialSteps.length}
            </span>
            <button
              onClick={skipTutorial}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-gray-800 px-4 py-2">
          <div className="bg-gray-700 rounded-full h-2">
            <div
              className="bg-verbo-green h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / tutorialSteps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div
          className="p-6 overflow-y-auto"
          style={{ maxHeight: 'calc(90vh - 160px)' }}
        >
          {tutorialSteps[currentStep].content}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 border-t border-gray-700 p-4 flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          <div className="flex space-x-2">
            <button
              onClick={skipTutorial}
              className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              Pular
            </button>
            <button
              onClick={nextStep}
              className="px-4 py-2 text-sm rounded-lg bg-verbo-green hover:bg-green-600 text-white transition-colors"
            >
              {currentStep === tutorialSteps.length - 1
                ? 'Começar!'
                : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
