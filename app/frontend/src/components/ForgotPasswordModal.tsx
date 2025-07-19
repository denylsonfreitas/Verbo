import React, { useState } from 'react';
import { X, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onBackToLogin
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Digite seu email');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Digite um email válido');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authService.forgotPassword(email);
      setIsSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Erro ao enviar email de recuperação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setIsSuccess(false);
    onClose();
  };

  const handleBackToLogin = () => {
    handleClose();
    onBackToLogin();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in slide-in-from-bottom-4 duration-300 border border-gray-700">
        <div className="relative p-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center w-12 h-12 bg-blue-900/50 rounded-full mb-4">
              {isSuccess ? (
                <CheckCircle className="w-6 h-6 text-green-400" />
              ) : (
                <Mail className="w-6 h-6 text-blue-400" />
              )}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">
              {isSuccess ? 'Email Enviado!' : 'Recuperar Senha'}
            </h3>
            
            <p className="text-gray-300 text-sm">
              {isSuccess 
                ? 'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.'
                : 'Digite seu email para receber um link de recuperação de senha.'
              }
            </p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-900/50 border border-red-600 rounded-md text-red-300">
                  <AlertCircle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors border border-gray-600"
                  disabled={isLoading}
                >
                  <ArrowLeft size={16} />
                  <span>Voltar</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Enviando...' : 'Enviar Email'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex space-x-3">
                <button
                  onClick={handleBackToLogin}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
                >
                  Voltar ao Login
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors border border-gray-600"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
