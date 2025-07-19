import React, { useState, useEffect } from 'react';
import {
  historyService,
  WordHistoryEntry,
  getLocalDateString,
} from '../services/historyService';
import LetterTile from './LetterTile';

const WordHistory: React.FC = () => {
  const [history, setHistory] = useState<WordHistoryEntry[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(
    new Set()
  );
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadHistory = () => {
      const historyData = historyService.loadHistory();
      setHistory(historyData);
    };

    loadHistory();

    // Atualizar a cada 10 segundos para capturar mudanças
    const interval = setInterval(loadHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpanded = (date: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedEntries(newExpanded);
  };

  const formatDate = (dateStr: string) => {
    const todayStr = getLocalDateString();
    const yesterdayStr = getLocalDateString(new Date(Date.now() - 86400000));

    if (dateStr === todayStr) return 'Hoje';
    if (dateStr === yesterdayStr) return 'Ontem';

    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const getResultEmoji = (entry: WordHistoryEntry) => {
    if (!entry.completed) return '⏳';
    if (entry.won) {
      switch (entry.attempts) {
        case 1:
          return '🏆';
        case 2:
          return '🥇';
        case 3:
          return '🥈';
        case 4:
          return '🥉';
        case 5:
          return '🎯';
        case 6:
          return '✅';
        default:
          return '✅';
      }
    }
    return '❌';
  };

  const displayedHistory = showAll ? history : history.slice(0, 7);

  if (history.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
        <div className="text-4xl mb-4">📚</div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Nenhum histórico ainda
        </h3>
        <p className="text-gray-400 text-sm">
          Complete alguns jogos para ver seu histórico aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Histórico de Palavras</h2>
        {history.length > 7 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showAll ? 'Mostrar menos' : `Ver todos (${history.length})`}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayedHistory.map(entry => {
          const isExpanded = expandedEntries.has(entry.date);

          return (
            <div
              key={entry.date}
              className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() => toggleExpanded(entry.date)}
                className="w-full p-4 text-left hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getResultEmoji(entry)}</span>
                    <div>
                      <div className="text-white font-semibold">
                        {formatDate(entry.date)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {entry.completed
                          ? entry.won
                            ? `Resolvido em ${entry.attempts} tentativa${entry.attempts > 1 ? 's' : ''}`
                            : 'Não resolvido'
                          : 'Em progresso'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-verbo-green uppercase">
                        {entry.word}
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.guesses.length} tentativa
                        {entry.guesses.length > 1 ? 's' : ''}
                      </div>
                    </div>
                    <span
                      className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      ▼
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-700 p-4 bg-gray-900">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">
                    Tentativas:
                  </h4>

                  <div className="space-y-2">
                    {entry.guesses.map((guess, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 w-8">
                          {index + 1}.
                        </span>
                        <div className="flex gap-1">
                          {guess.letters.map((letter, letterIndex) => (
                            <LetterTile
                              key={letterIndex}
                              letter={letter.letter}
                              status={letter.status}
                              position={letterIndex}
                            />
                          ))}
                        </div>
                        {index === entry.guesses.length - 1 && entry.won && (
                          <span className="text-verbo-green text-sm ml-2">
                            🎉
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-400">
                    <span>Data: {formatDate(entry.date)}</span>
                    <span>
                      {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : 'Horário não disponível'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mt-6">
        <h3 className="text-blue-200 font-semibold mb-2">
          Resumo do Histórico
        </h3>
        <div className="text-sm text-blue-100 space-y-1">
          <p>• Total de jogos: {history.filter(h => h.completed).length}</p>
          <p>• Vitórias: {history.filter(h => h.won).length}</p>
          <p>
            • Taxa de acerto:{' '}
            {history.length > 0
              ? Math.round(
                  (history.filter(h => h.won).length /
                    history.filter(h => h.completed).length) *
                    100
                ) || 0
              : 0}
            %
          </p>
        </div>
      </div>
    </div>
  );
};

export default WordHistory;
