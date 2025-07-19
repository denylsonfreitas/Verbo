import React, { useState, useEffect } from 'react';
import { adminService, Verb, NewVerb } from '../services/adminService';
import { wordService, CommonWord, WordFilters } from '../services/wordService';
import { historyService } from '../services/historyService';
import { useAuth } from '../contexts/AuthContext';
import { 
  Target, 
  FileText, 
  Plus, 
  RefreshCw, 
  BarChart3, 
  Edit, 
  X, 
  Check, 
  Search, 
  RotateCcw,
  Upload,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  LucideIcon,
  LogIn
} from 'lucide-react';

// Modal simples personalizado
interface SimpleModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

const SimpleModal: React.FC<SimpleModalProps> = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl font-bold transition-colors"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

interface TabType {
  id: 'verbs' | 'words';
  label: string;
  icon: LucideIcon;
}

const AdminNew: React.FC = () => {
  // Estado de autenticação usando AuthContext
  const { state: authState, showLoginModal } = useAuth();
  
  // Estado de navegação
  const [activeTab, setActiveTab] = useState<'verbs' | 'words'>('verbs');
  
  // Estados de verbos
  const [verbs, setVerbs] = useState<Verb[]>([]);
  const [verbPage, setVerbPage] = useState(1);
  const [verbTotalPages, setVerbTotalPages] = useState(1);
  const [verbSearch, setVerbSearch] = useState('');
  const [currentDayVerb, setCurrentDayVerb] = useState<string>('');
  const [showVerbModal, setShowVerbModal] = useState(false);
  const [verbModalType, setVerbModalType] = useState<'add' | 'edit'>('add');
  const [editingVerb, setEditingVerb] = useState<Verb | null>(null);
  const [verbForm, setVerbForm] = useState<Partial<NewVerb>>({
    word: '',
    active: true,
    used: false,
  });

  // Estados de palavras comuns
  const [words, setWords] = useState<CommonWord[]>([]);
  const [wordPage, setWordPage] = useState(1);
  const [wordTotalPages, setWordTotalPages] = useState(1);
  const [wordFilters, setWordFilters] = useState<WordFilters>({});
  const [showWordModal, setShowWordModal] = useState(false);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [batchType, setBatchType] = useState<string>('other');
  const [newWordsText, setNewWordsText] = useState('');
  
  // Estados gerais
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [stats, setStats] = useState<{total: number, used: number, available: number} | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Estados de erro locais para modais
  const [verbModalError, setVerbModalError] = useState('');
  const [wordModalError, setWordModalError] = useState('');
  const [batchModalError, setBatchModalError] = useState('');

  const tabs: TabType[] = [
    { id: 'verbs', label: 'Verbos do Jogo', icon: Target },
    { id: 'words', label: 'Palavras para Validação', icon: FileText },
  ];

  // Carregamento de dados
  const loadVerbs = async () => {
    setLoading(true);
    try {
      const response = await adminService.listarVerbs(verbPage, 20, undefined, verbSearch);
      setVerbs(response.verbs);
      setVerbTotalPages(response.pagination.pages);
    } catch (err: any) {
      setError('Erro ao carregar verbos');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentDayVerb = async () => {
    try {
      const response = await fetch('/api/verb/day');
      if (response.ok) {
        const data = await response.json();
        setCurrentDayVerb(data.word);
      }
    } catch (err: any) {
      console.log('Não foi possível carregar o verbo do dia');
    }
  };

  const loadWords = async () => {
    setLoading(true);
    try {
      const response = await wordService.listWords({ ...wordFilters, page: wordPage, limit: 20 });
      setWords(response.words);
      setWordTotalPages(response.pagination.pages);
    } catch (err: any) {
      setError('Erro ao carregar palavras');
    } finally {
      setLoading(false);
    }
  };

  // Efeitos
  useEffect(() => {
    if (authState.isAuthenticated && authState.user?.role === 'admin' && activeTab === 'verbs') {
      loadVerbs();
    }
  }, [verbPage, verbSearch, authState.isAuthenticated, authState.user?.role, activeTab]);

  useEffect(() => {
    if (authState.isAuthenticated && authState.user?.role === 'admin' && activeTab === 'words') {
      loadWords();
    }
  }, [wordPage, wordFilters, authState.isAuthenticated, authState.user?.role, activeTab]);

  // Carregar verbo atual do dia quando autenticado
  useEffect(() => {
    if (authState.isAuthenticated && authState.user?.role === 'admin') {
      loadCurrentDayVerb();
    }
  }, [authState.isAuthenticated, authState.user?.role]);

  // Handlers de verbos
  const handleAddVerb = () => {
    setVerbForm({
      word: '',
      active: true,
      used: false,
    });
    setVerbModalType('add');
    setEditingVerb(null);
    setVerbModalError('');
    setShowVerbModal(true);
  };

  const handleEditVerb = (verb: Verb) => {
    setVerbForm({
      word: verb.word,
      active: verb.active,
      used: verb.used,
    });
    setVerbModalType('edit');
    setEditingVerb(verb);
    setVerbModalError('');
    setShowVerbModal(true);
  };

  const handleSaveVerb = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setVerbModalError('');

    try {
      if (verbModalType === 'add') {
        await adminService.createVerb(verbForm as NewVerb);
        setSuccess('Verbo adicionado com sucesso!');
      } else if (editingVerb) {
        await adminService.updateVerb(editingVerb.id, verbForm);
        setSuccess('Verbo atualizado com sucesso!');
      }
      
      setShowVerbModal(false);
      loadVerbs();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Erro ao salvar verbo:', err);
      
      // Mostrar erro específico no modal
      if (err.message && err.message.includes('já existe')) {
        setVerbModalError('Já existe um verbo com esta palavra no sistema.');
      } else if (err.message && err.message.includes('duplicate')) {
        setVerbModalError('Esta palavra já está cadastrada como verbo.');
      } else {
        setVerbModalError(err.message || 'Erro ao salvar verbo');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetVerbs = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/verbs/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('verbo_auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao resetar verbos');
      }

      const data = await response.json();
      
      // Limpar histórico se indicado pelo backend
      if (data.clearHistory) {
        historyService.clearHistory();
        setSuccess('Todos os verbos foram resetados e o histórico foi limpo com sucesso!');
      } else {
        setSuccess('Todos os verbos foram resetados com sucesso!');
      }
      
      setStats(data.stats);
      loadVerbs();
      setShowResetConfirm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao resetar verbos');
    } finally {
      setLoading(false);
    }
  };

  const handleShowStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/verbs/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('verbo_auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas');
      }

      const data = await response.json();
      setStats(data);
      setShowStatsModal(true);
    } catch (err: any) {
      setError('Erro ao buscar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerbStatus = async (verb: Verb) => {
    try {
      await adminService.updateVerb(verb.id, { active: !verb.active });
      setSuccess(`Verbo ${!verb.active ? 'ativado' : 'desativado'} com sucesso!`);
      loadVerbs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao alterar status do verbo');
    }
  };

  // Handlers de palavras
  const handleAddWords = async () => {
    if (!newWordsText.trim()) {
      setWordModalError('Por favor, digite pelo menos uma palavra.');
      return;
    }

    setLoading(true);
    setWordModalError('');
    
    try {
      const words = newWordsText
        .split('\n')
        .map(w => w.trim())
        .filter(w => w.length > 0);

      if (words.length === 0) {
        setWordModalError('Nenhuma palavra válida encontrada.');
        return;
      }

      // Validar palavras (exatamente 5 letras, apenas letras)
      const invalidWords = words.filter(word => 
        word.length !== 5 || !/^[a-záàâãéêíóôõúç]+$/i.test(word)
      );

      if (invalidWords.length > 0) {
        setWordModalError(`Palavras inválidas encontradas: ${invalidWords.join(', ')}. Use exatamente 5 letras, apenas letras.`);
        return;
      }

      const response = await wordService.addWords(words, 'other');
      setSuccess(`${response.addedWords.length} palavras adicionadas!`);
      setNewWordsText('');
      setShowWordModal(false);
      loadWords();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Erro ao adicionar palavras:', err);
      
      // Tratar diferentes tipos de erro no modal
      if (err.message && err.message.includes('verbo do jogo')) {
        setWordModalError('Algumas palavras não foram adicionadas pois já existem como verbos do jogo.');
      } else if (err.message && err.message.includes('Palavras duplicadas')) {
        setWordModalError('Algumas palavras já existem no banco de dados e não foram adicionadas.');
      } else if (err.message && err.message.includes('já existe')) {
        setWordModalError(err.message);
      } else {
        setWordModalError(err.message || 'Erro ao adicionar palavras');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBatchImport = async () => {
    if (!batchText.trim()) {
      setBatchModalError('Por favor, cole o texto com as palavras.');
      return;
    }

    setLoading(true);
    setBatchModalError('');
    
    try {
      const response = await wordService.batchImport(batchText, batchType);
      setSuccess(`${response.addedWords.length} de ${response.total} palavras importadas!`);
      setBatchText('');
      setShowBatchImport(false);
      loadWords();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Erro ao importar palavras:', err);
      
      // Tratar diferentes tipos de erro no modal
      if (err.message && err.message.includes('verbo do jogo')) {
        setBatchModalError('Algumas palavras não foram importadas pois já existem como verbos do jogo.');
      } else if (err.message && err.message.includes('Palavras duplicadas')) {
        setBatchModalError('Algumas palavras já existem no banco de dados e não foram importadas.');
      } else if (err.message && err.message.includes('já existe')) {
        setBatchModalError(err.message);
      } else {
        setBatchModalError(err.message || 'Erro ao importar palavras');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWordStatus = async (word: CommonWord) => {
    try {
      await wordService.toggleWordStatus(word.id, !word.active);
      setSuccess(`Palavra ${!word.active ? 'ativada' : 'desativada'}!`);
      loadWords();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao alterar status da palavra');
    }
  };

  const handleDeleteWord = async (word: CommonWord) => {
    if (!confirm(`Remover palavra "${word.word}"?`)) return;

    try {
      await wordService.deleteWord(word.id);
      setSuccess('Palavra removida com sucesso!');
      loadWords();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao remover palavra');
    }
  };

  // Renderização
  if (!authState.isAuthenticated || authState.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-verbo-dark flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
            <div className="text-center mb-8">
              <Shield size={48} className="mx-auto text-verbo-primary mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Painel Administrativo</h2>
              <p className="text-gray-400">
                {!authState.isAuthenticated 
                  ? "Acesso restrito - Faça login como administrador"
                  : "Acesso negado - Você não tem permissões de administrador"
                }
              </p>
            </div>
            
            {!authState.isAuthenticated ? (
              <button
                onClick={showLoginModal}
                className="w-full bg-verbo-primary hover:bg-verbo-accent text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
              >
                <LogIn size={20} />
                <span>Fazer Login</span>
              </button>
            ) : (
              <div className="text-center">
                <p className="text-gray-400 mb-4">
                  Sua conta não possui privilégios administrativos.
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Voltar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-verbo-dark">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={32} className="text-verbo-primary" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Painel Administrativo</h1>
              <p className="text-gray-400">Gerencie verbos do jogo e palavras para validação</p>
            </div>
          </div>
        </div>

        {/* Notificações */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
            <div className="flex items-center gap-2">
              <X size={16} />
              {error}
            </div>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-700 text-green-300 rounded-lg">
            <div className="flex items-center gap-2">
              <Check size={16} />
              {success}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="flex space-x-1 sm:space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-2 sm:px-4 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-verbo-primary text-verbo-primary'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                <tab.icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'verbs' && (
        <div>
          {/* Header da seção */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Verbos do Jogo</h2>
              {currentDayVerb && (
                <div className="flex items-center gap-2 text-sm">
                  <Target size={14} className="text-verbo-accent" />
                  <span className="text-gray-400">Verbo de hoje:</span>
                  <span className="text-verbo-accent font-bold">{currentDayVerb.toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleResetVerbs}
                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 text-sm transition-colors"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Resetar Verbos</span>
                <span className="sm:hidden">Reset</span>
              </button>
              <button
                onClick={handleShowStats}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 text-sm transition-colors"
              >
                <BarChart3 size={16} />
                <span className="hidden sm:inline">Estatísticas</span>
                <span className="sm:hidden">Stats</span>
              </button>
              <button
                onClick={handleAddVerb}
                className="bg-verbo-primary hover:bg-verbo-primary/80 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 text-sm transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Novo Verbo</span>
                <span className="sm:hidden">Novo</span>
              </button>
            </div>
          </div>

          {/* Barra de busca para verbos */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar verbo..."
                  value={verbSearch}
                  onChange={(e) => {
                    setVerbSearch(e.target.value);
                    setVerbPage(1);
                  }}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-verbo-primary focus:border-transparent transition-colors"
                />
              </div>
              <button
                onClick={() => {
                  setVerbSearch('');
                  setVerbPage(1);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            </div>
          </div>

          {/* Tabela de verbos */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            {/* View desktop */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Verbo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Histórico
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {verbs.map((verb) => {
                    const isCurrentDayVerb = verb.word === currentDayVerb;
                    return (
                      <tr 
                        key={verb.id}
                        className={isCurrentDayVerb ? 'bg-verbo-primary/10 border-l-4 border-verbo-primary' : ''}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          <div className="flex items-center gap-2">
                            {verb.word}
                            {isCurrentDayVerb && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-verbo-primary/20 text-verbo-accent">
                                <Target size={12} className="mr-1" />
                                Hoje
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              verb.used
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-verbo-primary/20 text-verbo-accent'
                            }`}
                          >
                            {verb.used ? 'Já utilizado' : 'Disponível'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              verb.active
                                ? 'bg-green-900/50 text-green-300'
                                : 'bg-red-900/50 text-red-300'
                            }`}
                          >
                            {verb.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleEditVerb(verb)}
                              className="text-verbo-accent hover:text-verbo-accent/80 flex items-center gap-1 transition-colors"
                            >
                              <Edit size={14} />
                              Editar
                            </button>
                            <button
                              onClick={() => handleToggleVerbStatus(verb)}
                              className={`flex items-center gap-1 transition-colors ${
                                verb.active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                              }`}
                            >
                              {verb.active ? <EyeOff size={14} /> : <Eye size={14} />}
                              {verb.active ? 'Desativar' : 'Ativar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* View mobile */}
            <div className="md:hidden">
              <div className="divide-y divide-gray-700">
                {verbs.map((verb) => {
                  const isCurrentDayVerb = verb.word === currentDayVerb;
                  return (
                    <div 
                      key={verb.id}
                      className={`p-4 ${isCurrentDayVerb ? 'bg-verbo-primary/10 border-l-4 border-verbo-primary' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{verb.word}</span>
                          {isCurrentDayVerb && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-verbo-primary/20 text-verbo-accent">
                              <Target size={10} className="mr-1" />
                              Hoje
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              verb.active
                                ? 'bg-green-900/50 text-green-300'
                                : 'bg-red-900/50 text-red-300'
                            }`}
                          >
                            {verb.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            verb.used
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-verbo-primary/20 text-verbo-accent'
                          }`}
                        >
                          {verb.used ? 'Já utilizado' : 'Disponível'}
                        </span>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEditVerb(verb)}
                            className="text-verbo-accent hover:text-verbo-accent/80 flex items-center gap-1 text-sm transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleVerbStatus(verb)}
                            className={`flex items-center gap-1 text-sm transition-colors ${
                              verb.active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                            }`}
                          >
                            {verb.active ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Paginação de verbos */}
          {verbTotalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              <div className="text-sm text-gray-400">
                Página {verbPage} de {verbTotalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setVerbPage(Math.max(1, verbPage - 1))}
                  disabled={verbPage === 1}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setVerbPage(Math.min(verbTotalPages, verbPage + 1))}
                  disabled={verbPage === verbTotalPages}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'words' && (
        <div>
          {/* Header da seção */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-xl font-semibold text-white">Palavras para Validação</h2>
              <p className="text-gray-400 text-sm mt-1">Gerencie palavras aceitas para validação de tentativas</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setWordModalError('');
                  setNewWordsText('');
                  setShowWordModal(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 text-sm transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Adicionar Palavras</span>
                <span className="sm:hidden">Adicionar</span>
              </button>
              <button
                onClick={() => {
                  setBatchModalError('');
                  setBatchText('');
                  setBatchType('other');
                  setShowBatchImport(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 text-sm transition-colors"
              >
                <Upload size={16} />
                <span className="hidden sm:inline">Importar em Lote</span>
                <span className="sm:hidden">Importar</span>
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar palavra..."
                  value={wordFilters.search || ''}
                  onChange={(e) => setWordFilters({ ...wordFilters, search: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-verbo-primary focus:border-transparent transition-colors"
                />
              </div>
              <select
                value={wordFilters.type || ''}
                onChange={(e) => setWordFilters({ ...wordFilters, type: e.target.value || undefined })}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-verbo-primary focus:border-transparent transition-colors"
              >
                <option value="">Todos os tipos</option>
                <option value="noun">Substantivos</option>
                <option value="adjective">Adjetivos</option>
                <option value="verb">Verbos</option>
                <option value="other">Outros</option>
              </select>
              <select
                value={wordFilters.active?.toString() || ''}
                onChange={(e) => setWordFilters({ 
                  ...wordFilters, 
                  active: e.target.value ? e.target.value === 'true' : undefined 
                })}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-verbo-primary focus:border-transparent transition-colors"
              >
                <option value="">Todos os status</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
              <button
                onClick={() => {
                  setWordFilters({});
                  setWordPage(1);
                }}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">Limpar Filtros</span>
                <span className="sm:hidden">Limpar</span>
              </button>
            </div>
          </div>

          {/* Tabela de palavras */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            {/* View desktop */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Palavra
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {words.map((word) => (
                    <tr key={word.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {word.word}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
                          {word.type === 'noun' ? 'Substantivo' : 
                           word.type === 'adjective' ? 'Adjetivo' :
                           word.type === 'verb' ? 'Verbo' : 'Outro'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            word.active
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-red-900/50 text-red-300'
                          }`}
                        >
                          {word.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleWordStatus(word)}
                            className={`flex items-center gap-1 transition-colors ${
                              word.active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                            }`}
                          >
                            {word.active ? <EyeOff size={14} /> : <Eye size={14} />}
                            {word.active ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleDeleteWord(word)}
                            className="text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                          >
                            <Trash2 size={14} />
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* View mobile */}
            <div className="md:hidden">
              <div className="divide-y divide-gray-700">
                {words.map((word) => (
                  <div key={word.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{word.word}</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
                          {word.type === 'noun' ? 'Substantivo' : 
                           word.type === 'adjective' ? 'Adjetivo' :
                           word.type === 'verb' ? 'Verbo' : 'Outro'}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          word.active
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-red-900/50 text-red-300'
                        }`}
                      >
                        {word.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleToggleWordStatus(word)}
                        className={`flex items-center gap-1 text-sm transition-colors ${
                          word.active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                        }`}
                      >
                        {word.active ? <EyeOff size={14} /> : <Eye size={14} />}
                        {word.active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleDeleteWord(word)}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm transition-colors"
                      >
                        <Trash2 size={14} />
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Paginação de palavras */}
          {wordTotalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              <div className="text-sm text-gray-400">
                Página {wordPage} de {wordTotalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setWordPage(Math.max(1, wordPage - 1))}
                  disabled={wordPage === 1}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setWordPage(Math.min(wordTotalPages, wordPage + 1))}
                  disabled={wordPage === wordTotalPages}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Verbo */}
      {showVerbModal && (
        <SimpleModal onClose={() => {
          setShowVerbModal(false);
          setVerbModalError('');
        }}>
          <h3 className="text-lg font-bold mb-4 text-white">
            {verbModalType === 'add' ? 'Novo Verbo' : 'Editar Verbo'}
          </h3>
          
          {/* Erro do modal de verbo */}
          {verbModalError && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{verbModalError}</p>
            </div>
          )}
          
          <form onSubmit={handleSaveVerb}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Verbo (5 letras) *</label>
                <input
                  type="text"
                  value={verbForm.word || ''}
                  onChange={(e) => setVerbForm({ ...verbForm, word: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-verbo-primary focus:border-transparent"
                  placeholder="Ex: jogar (5 letras)"
                  maxLength={5}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Status de Uso</label>
                <select
                  value={verbForm.used ? 'true' : 'false'}
                  onChange={(e) => setVerbForm({ 
                    ...verbForm, 
                    used: e.target.value === 'true'
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-verbo-primary focus:border-transparent"
                >
                  <option value="false">Disponível</option>
                  <option value="true">Usado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Status</label>
                <select
                  value={verbForm.active ? 'true' : 'false'}
                  onChange={(e) => setVerbForm({ 
                    ...verbForm, 
                    active: e.target.value === 'true'
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-verbo-primary focus:border-transparent"
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowVerbModal(false);
                  setVerbModalError('');
                }}
                className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-verbo-primary hover:bg-verbo-primary/80 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </SimpleModal>
      )}

      {/* Modal de Adicionar Palavras */}
      {showWordModal && (
        <SimpleModal onClose={() => {
          setShowWordModal(false);
          setWordModalError('');
        }}>
          <h3 className="text-lg font-bold mb-4 text-white">Adicionar Palavras</h3>
          
          {/* Erro do modal de palavras */}
          {wordModalError && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{wordModalError}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Palavras (uma por linha)
            </label>
            <div className="mb-2 text-xs text-gray-400">
              • Use apenas letras (sem números ou símbolos)
              • Exatamente 5 letras
              • Uma palavra por linha
              • ⚠️ Não adicione verbos que já estão no jogo
            </div>
            <textarea
              value={newWordsText}
              onChange={(e) => setNewWordsText(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-verbo-primary focus:border-transparent resize-none"
              rows={10}
              placeholder="piano&#10;zebra&#10;livro&#10;..."
            />
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={() => {
                setShowWordModal(false);
                setWordModalError('');
              }}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddWords}
              disabled={loading || !newWordsText.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </SimpleModal>
      )}

      {/* Modal de Importação em Lote */}
      {showBatchImport && (
        <SimpleModal onClose={() => {
          setShowBatchImport(false);
          setBatchModalError('');
        }}>
          <h3 className="text-lg font-bold mb-4 text-white">Importar Palavras em Lote</h3>
          
          {/* Erro do modal de importação */}
          {batchModalError && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{batchModalError}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Tipo das palavras</label>
              <select
                value={batchType}
                onChange={(e) => setBatchType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-verbo-primary focus:border-transparent"
              >
                <option value="other">Outros</option>
                <option value="noun">Substantivos</option>
                <option value="adjective">Adjetivos</option>
                <option value="verb">Verbos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Texto (palavras separadas por linha)
              </label>
              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-verbo-primary focus:border-transparent resize-none"
                rows={15}
                placeholder="Cole aqui o texto com as palavras..."
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={() => {
                setShowBatchImport(false);
                setBatchModalError('');
              }}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleBatchImport}
              disabled={loading || !batchText.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </SimpleModal>
      )}

      {/* Modal de Estatísticas */}
      {showStatsModal && stats && (
        <SimpleModal onClose={() => setShowStatsModal(false)}>
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={20} className="text-verbo-primary" />
            <h3 className="text-lg font-bold text-white">Estatísticas dos Verbos</h3>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-700 border border-gray-600 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-verbo-primary">{stats.total}</div>
                <div className="text-sm text-gray-400">Total</div>
              </div>
              <div className="bg-gray-700 border border-gray-600 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-400">{stats.used}</div>
                <div className="text-sm text-gray-400">Usados</div>
              </div>
              <div className="bg-gray-700 border border-gray-600 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-400">{stats.available}</div>
                <div className="text-sm text-gray-400">Disponíveis</div>
              </div>
            </div>
            <div className="bg-gray-700 border border-gray-600 p-4 rounded-lg">
              <div className="w-full bg-gray-600 rounded-full h-3">
                <div 
                  className="bg-orange-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${(stats.used / stats.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-3 text-center">
                {((stats.used / stats.total) * 100).toFixed(1)}% dos verbos já foram usados
              </p>
            </div>
          </div>
        </SimpleModal>
      )}

      {/* Modal de Confirmação de Reset */}
      {showResetConfirm && (
        <SimpleModal onClose={() => setShowResetConfirm(false)}>
          <div className="flex items-center gap-2 mb-6">
            <RefreshCw size={20} className="text-orange-400" />
            <h3 className="text-lg font-bold text-white">Confirmar Reset</h3>
          </div>
          <div className="text-gray-300 mb-6 space-y-2">
            <p>Tem certeza que deseja resetar todos os verbos? Isso irá:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Marcar todos os verbos como "não usados"</li>
              <li>Limpar todo o histórico de palavras dos jogadores</li>
              <li>Permitir que todos os verbos sejam sorteados novamente no jogo</li>
            </ul>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmReset}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? 'Resetando...' : 'Confirmar Reset'}
            </button>
          </div>
        </SimpleModal>
      )}
      </div>
    </div>
  );
};

export default AdminNew;
