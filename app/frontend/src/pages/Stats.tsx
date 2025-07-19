import React, { useState, useEffect } from 'react';
import { statsService, GameStats } from '../services/statsService';
import WordHistory from '../components/WordHistory';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { RotateCcw, Trophy, Target, TrendingUp, Calendar, Award } from 'lucide-react';

const Stats: React.FC = () => {
  const { resetUserStats } = useAuth();
  const [stats, setStats] = useState<
    (GameStats & { winRate: number; averageAttempts: number }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadStats = () => {
      const formattedStats = statsService.getFormattedStats();
      setStats(formattedStats);
      setLoading(false);
    };

    loadStats();
  }, []);

  const handleResetStats = () => {
    setShowModal(true);
  };

  const confirmResetStats = () => {
    statsService.resetStats();
    resetUserStats(); // Atualiza o contexto de autenticação
    const formattedStats = statsService.getFormattedStats();
    setStats(formattedStats);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Estatísticas</h1>
        <div className="text-white text-center">Carregando...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Estatísticas</h1>
        <div className="text-white text-center">
          Erro ao carregar estatísticas
        </div>
      </div>
    );
  }

  const maxDistribution = Math.max(...Object.values(stats.guessDistribution));

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <Modal
        open={showModal}
        title="Resetar Estatísticas"
        description="Tem certeza que deseja resetar todas as estatísticas e o histórico de palavras? Esta ação não pode ser desfeita."
        onConfirm={confirmResetStats}
        onCancel={() => setShowModal(false)}
        confirmText="Resetar"
        cancelText="Cancelar"
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Estatísticas</h1>
        <button
          onClick={handleResetStats}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
        >
          <RotateCcw size={16} className="sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Resetar Estatísticas</span>
          <span className="sm:hidden">Reset</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-primary-400 sm:w-5 sm:h-5" />
            <h3 className="text-sm sm:text-lg font-semibold text-gray-300">
              Total
            </h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-primary-400">
            {stats.gamesPlayed}
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={16} className="text-verbo-green sm:w-5 sm:h-5" />
            <h3 className="text-sm sm:text-lg font-semibold text-gray-300">
              Vitórias
            </h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-verbo-green">
            {stats.gamesWon}
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-primary-400 sm:w-5 sm:h-5" />
            <h3 className="text-sm sm:text-lg font-semibold text-gray-300">
              Taxa
            </h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-primary-400">
            {stats.winRate}%
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-verbo-yellow sm:w-5 sm:h-5" />
            <h3 className="text-sm sm:text-lg font-semibold text-gray-300">
              Sequência
            </h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-verbo-yellow">
            {stats.currentStreak}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 mt-4 sm:mt-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-verbo-yellow sm:w-5 sm:h-5" />
            <h3 className="text-sm sm:text-lg font-semibold text-gray-300">
              Melhor Sequência
            </h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-verbo-yellow">
            {stats.maxStreak}
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-primary-400 sm:w-5 sm:h-5" />
            <h3 className="text-sm sm:text-lg font-semibold text-gray-300">
              Média de Tentativas
            </h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-primary-400">
            {stats.averageAttempts}
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 shadow-lg">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
          Distribuição de Tentativas
        </h2>
        <div className="space-y-2 sm:space-y-3">
          {[1, 2, 3, 4, 5, 6].map(tentativas => {
            const count =
              stats.guessDistribution[
                tentativas as keyof typeof stats.guessDistribution
              ];
            const percentage =
              maxDistribution > 0 ? (count / maxDistribution) * 100 : 0;

            return (
              <div key={tentativas} className="flex items-center">
                <span className="w-6 sm:w-8 text-xs sm:text-sm font-medium text-gray-300">
                  {tentativas}
                </span>
                <div className="flex-1 mx-2 sm:mx-4 bg-gray-700 rounded-full h-3 sm:h-4">
                  <div
                    className="bg-verbo-green h-3 sm:h-4 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="w-8 sm:w-12 text-xs sm:text-sm text-gray-300">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {stats.lastPlayedDate && (
        <div className="mt-4 sm:mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-white sm:w-5 sm:h-5" />
            <h3 className="text-lg font-semibold text-white">
              Informações Adicionais
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-300">
            <div>
              <strong className="text-white">Último jogo:</strong>{' '}
              {new Date(stats.lastPlayedDate).toLocaleDateString('pt-BR')}
            </div>
            {stats.lastWonDate && (
              <div>
                <strong className="text-white">Última vitória:</strong>{' '}
                {new Date(stats.lastWonDate).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Histórico de Palavras */}
      <div className="mt-6 sm:mt-8">
        <WordHistory />
      </div>
    </div>
  );
};

export default Stats;
