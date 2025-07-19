import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { User, Lock, Save, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';

const Account: React.FC = () => {
  const { state, updateProfile, changePassword, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    username: state.user?.username || '',
    email: state.user?.email || ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Atualizar formulário quando o usuário mudar
  useEffect(() => {
    if (state.user) {
      setProfileForm({
        username: state.user.username || '',
        email: state.user.email || ''
      });
    }
  }, [state.user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Verificar se o email foi alterado
      const emailChanged = profileForm.email !== state.user?.email;
      
      if (emailChanged) {
        // Se o email foi alterado, solicitar verificação
        const response = await authService.requestEmailChange(profileForm.email);
        setPendingEmail(profileForm.email);
        setShowEmailVerificationModal(true);
        setMessage({ 
          type: 'info', 
          text: 'Link de verificação enviado. Verifique seu novo email para confirmar a alteração.' 
        });
      } else {
        // Se apenas o username foi alterado, atualizar normalmente
        const success = await updateProfile({
          username: profileForm.username,
          email: profileForm.email
        });

        if (success) {
          setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        } else {
          setMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao atualizar perfil' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async (token: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const updatedUser = await authService.confirmEmailChange(token);
      
      // Atualizar o contexto com os novos dados do usuário
      updateUser(updatedUser);
      
      // Atualizar o formulário local também
      setProfileForm({
        username: updatedUser.username,
        email: updatedUser.email || ''
      });
      
      setShowEmailVerificationModal(false);
      setPendingEmail('');
      setMessage({ type: 'success', text: 'Email alterado com sucesso!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao verificar email' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres' });
      setLoading(false);
      return;
    }

    try {
      const success = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);

      if (success) {
        setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage({ type: 'error', text: 'Erro ao alterar senha' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao alterar senha' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setMessage({ type: 'error', text: 'Digite sua senha para confirmar' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await authService.deleteAccount(deletePassword);
      
      setMessage({ type: 'success', text: 'Conta excluída com sucesso. Redirecionando...' });
      setTimeout(() => {
        logout();
        window.location.href = '/';
      }, 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao excluir conta' });
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeletePassword('');
    }
  };

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-verbo-dark text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Você precisa estar logado para acessar esta página</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-verbo-accent text-white px-6 py-2 rounded-lg hover:bg-verbo-accent/90 transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-verbo-dark text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-verbo-accent">
          Minha Conta
        </h1>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-900/50 border border-green-500 text-green-300' 
              : message.type === 'info'
              ? 'bg-blue-900/50 border border-blue-500 text-blue-300'
              : 'bg-red-900/50 border border-red-500 text-red-300'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-8">
          {/* Profile Information */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User size={20} />
              Informações do Perfil
            </h2>

            {/* Current Information Display */}
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Informações Atuais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-400">Nome de Usuário:</span>
                  <p className="text-white font-medium">{state.user?.username || 'Não definido'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">E-mail:</span>
                  <p className="text-white font-medium">{state.user?.email || 'Não definido'}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Nome de Usuário
                </label>
                <div className="space-y-1">
                  <input
                    type="text"
                    id="username"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-verbo-accent focus:border-transparent"
                    placeholder={state.user?.username || 'Digite seu nome de usuário'}
                    required
                  />
                  {state.user?.username && (
                    <p className="text-xs text-gray-400">
                      Atual: <span className="text-gray-300">{state.user.username}</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  E-mail
                </label>
                <div className="space-y-1">
                  <input
                    type="email"
                    id="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-verbo-accent focus:border-transparent"
                    placeholder={state.user?.email || 'Digite seu e-mail'}
                    required
                  />
                  {state.user?.email && (
                    <p className="text-xs text-gray-400">
                      Atual: <span className="text-gray-300">{state.user.email}</span>
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-verbo-accent text-white py-2 px-4 rounded-md hover:bg-verbo-accent/90 focus:outline-none focus:ring-2 focus:ring-verbo-accent focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>

          {/* Password Change */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lock size={20} />
              Alterar Senha
            </h2>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Senha Atual
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-verbo-accent focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Nova Senha
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-verbo-accent focus:border-transparent"
                  minLength={6}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Mínimo de 6 caracteres</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-verbo-accent focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lock size={16} />
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </form>
          </div>

          {/* Delete Account Section - Only for regular players */}
          {state.user?.role !== 'admin' && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-400">
                <Trash2 size={20} />
                Excluir Conta
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-md">
                  <p className="text-red-300 text-sm mb-3">
                    ⚠️ <strong>Atenção:</strong> Esta ação é irreversível. Ao excluir sua conta:
                  </p>
                  <ul className="text-red-300 text-sm space-y-1 ml-4">
                    <li>• Todos os seus dados serão permanentemente removidos</li>
                    <li>• Suas estatísticas e histórico de jogos serão perdidos</li>
                    <li>• Você não poderá recuperar sua conta</li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Excluir Minha Conta
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                <Trash2 size={20} />
                Confirmar Exclusão de Conta
              </h3>

              <div className="space-y-4">
                <p className="text-gray-300">
                  Esta ação é <strong className="text-red-400">irreversível</strong>. 
                  Todos os seus dados serão permanentemente excluídos.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Para confirmar, digite sua senha:
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Sua senha"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletePassword('');
                    }}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading || !deletePassword.trim()}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    {loading ? 'Excluindo...' : 'Excluir Conta'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Verification Modal */}
        {showEmailVerificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw]">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Verificação de Email
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Um código de verificação foi enviado para <strong>{pendingEmail}</strong>.
                    Clique no link recebido ou digite o código de 6 caracteres aqui:
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
                    Código de Verificação (6 caracteres):
                  </label>
                  <input
                    type="text"
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white text-center text-xl font-mono font-bold letter-spacing-wide placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    style={{ letterSpacing: '0.2em' }}
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const token = (e.target as HTMLInputElement).value;
                        if (token.trim() && token.length === 6) {
                          handleEmailVerification(token.trim());
                        }
                      }
                    }}
                  />
                  <p className="text-xs text-gray-400 text-center mt-1">
                    Digite exatamente como recebido no email
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowEmailVerificationModal(false);
                      setPendingEmail('');
                    }}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Account;
