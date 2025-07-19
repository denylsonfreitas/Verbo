import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, AlertCircle, Key } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showLoginModal } = useAuth();
  
  const [token, setToken] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      verifyToken(tokenParam);
    }
    // Removido o else que definia erro - permitir entrada manual
  }, [searchParams]);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const isValid = await authService.verifyResetToken(tokenToVerify);
      setTokenValid(isValid);
      if (!isValid) {
        setError('Token inválido ou expirado');
      }
    } catch (error) {
      setTokenValid(false);
      setError('Erro ao verificar token');
    }
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('Senha deve ter pelo menos 6 caracteres');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword.trim()) {
      setError('Digite uma nova senha');
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    // Use token da URL ou token manual
    const tokenToUse = token || manualToken;
    if (!tokenToUse) {
      setError('Token de verificação é obrigatório');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authService.resetPassword(tokenToUse, newPassword);
      setIsSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Erro ao redefinir senha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleGoToLogin = () => {
    navigate('/');
    setTimeout(() => {
      showLoginModal();
    }, 100);
  };

  if (token && tokenValid === null) {
    return (
      <div className="min-h-screen bg-verbo-dark flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-300">Verificando token...</p>
          </div>
        </div>
      </div>
    );
  }

  if (token && tokenValid === false) {
    return (
      <div className="min-h-screen bg-verbo-dark flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-12 h-12 bg-red-900 rounded-full mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Token Inválido</h3>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={handleBackToHome}
              className="w-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-verbo-dark flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center w-12 h-12 bg-blue-900 rounded-full mb-4">
            {isSuccess ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <Key className="w-6 h-6 text-blue-400" />
            )}
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">
            {isSuccess ? 'Senha Redefinida!' : 'Nova Senha'}
          </h3>
          
          <p className="text-gray-300 text-sm">
            {isSuccess 
              ? 'Sua senha foi redefinida com sucesso. Agora você pode fazer login com a nova senha.'
              : token 
                ? 'Digite sua nova senha para completar a redefinição.'
                : 'Digite o código de verificação que você recebeu por email e sua nova senha.'
            }
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Digite sua nova senha"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirmar Nova Senha
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                placeholder="Confirme sua nova senha"
                disabled={isLoading}
              />
            </div>

            {!token && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Código de Verificação
                </label>
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono text-lg tracking-widest text-white placeholder-gray-400"
                  placeholder="CÓDIGO"
                  maxLength={6}
                  disabled={isLoading}
                  style={{ letterSpacing: '0.3em' }}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Digite o código de 6 caracteres que você recebeu por email
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-300">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-300 mb-2">Sua senha deve conter:</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li className={`flex items-center ${newPassword.length >= 6 ? 'text-green-400' : ''}`}>
                  <span className="mr-2">{newPassword.length >= 6 ? '✓' : '○'}</span>
                  Pelo menos 6 caracteres
                </li>
                <li className={`flex items-center ${/(?=.*[a-z])/.test(newPassword) ? 'text-green-400' : ''}`}>
                  <span className="mr-2">{/(?=.*[a-z])/.test(newPassword) ? '✓' : '○'}</span>
                  Uma letra minúscula
                </li>
                <li className={`flex items-center ${/(?=.*[A-Z])/.test(newPassword) ? 'text-green-400' : ''}`}>
                  <span className="mr-2">{/(?=.*[A-Z])/.test(newPassword) ? '✓' : '○'}</span>
                  Uma letra maiúscula
                </li>
                <li className={`flex items-center ${/(?=.*\d)/.test(newPassword) ? 'text-green-400' : ''}`}>
                  <span className="mr-2">{/(?=.*\d)/.test(newPassword) ? '✓' : '○'}</span>
                  Um número
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={
                isLoading || 
                !newPassword.trim() || 
                !confirmPassword.trim() || 
                (!token && !manualToken.trim())
              }
              className="w-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleGoToLogin}
              className="w-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
            >
              Fazer Login
            </button>
            <button
              onClick={handleBackToHome}
              className="w-full px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
