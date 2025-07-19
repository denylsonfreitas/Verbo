import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ForgotPasswordModal from './ForgotPasswordModal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}) => {
  const { state, login, register, clearError } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    login: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        login: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setFormErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
      // Limpar erro apenas quando o modal abre pela primeira vez
      clearError();
      
      // Focar no primeiro campo após um pequeno delay para garantir que o modal esteja renderizado
      setTimeout(() => {
        const firstInput = document.querySelector('[role="dialog"] input');
        if (firstInput instanceof HTMLInputElement) {
          firstInput.focus();
        }
      }, 100);
    }
  }, [isOpen, mode, clearError]); // Removido state.error das dependências

  // Update mode when initialMode changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear context error when user starts typing
    if (state.error) {
      clearError();
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (mode === 'login') {
      if (!formData.login.trim()) {
        errors.login = 'Username ou email é obrigatório';
      }
      if (!formData.password) {
        errors.password = 'Senha é obrigatória';
      }
    } else {
      if (!formData.username.trim()) {
        errors.username = 'Username é obrigatório';
      } else if (formData.username.length < 3) {
        errors.username = 'Username deve ter pelo menos 3 caracteres';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        errors.username = 'Username deve conter apenas letras, números e underscore';
      }

      if (!formData.email.trim()) {
        errors.email = 'Email é obrigatório';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Email deve ter um formato válido';
      }

      if (!formData.password) {
        errors.password = 'Senha é obrigatória';
      } else if (formData.password.length < 6) {
        errors.password = 'Senha deve ter pelo menos 6 caracteres';
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Confirmação de senha é obrigatória';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Senhas não conferem';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    let success = false;

    if (mode === 'login') {
      success = await login(formData.login, formData.password);
    } else {
      success = await register(
        formData.username, 
        formData.password, 
        formData.email || undefined
      );
    }

    if (success) {
      onClose();
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    clearError();
    setFormErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {mode === 'login' ? (
              <>
                <LogIn size={20} />
                Fazer Login
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Criar Conta
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={state.isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {mode === 'login' ? (
            <div className="space-y-4">
              {/* Login Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username ou Email
                </label>
                <input
                  type="text"
                  name="login"
                  value={formData.login}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.login ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Digite seu username ou email"
                  disabled={state.isLoading}
                />
                {formErrors.login && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.login}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 pr-10 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.password ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Digite sua senha"
                    disabled={state.isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    disabled={state.isLoading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.password}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.username ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Escolha um username"
                  disabled={state.isLoading}
                />
                {formErrors.username && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.username}</p>
                )}
                <p className="text-gray-400 text-xs mt-1">
                  3-20 caracteres, apenas letras, números e underscore
                </p>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.email ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="seu@email.com"
                  disabled={state.isLoading}
                  required
                />
                {formErrors.email && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Senha <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 pr-10 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.password ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Crie uma senha"
                    disabled={state.isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    disabled={state.isLoading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar Senha <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 pr-10 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Confirme sua senha"
                    disabled={state.isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    disabled={state.isLoading}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {state.error && (
            <div className="mt-4 p-4 bg-red-100 border-2 border-red-400 rounded-md animate-pulse">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-800 text-sm font-medium">{state.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Forgot Password Link - Only show in login mode */}
          {mode === 'login' && (
            <div className="mt-4 text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                disabled={state.isLoading}
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={state.isLoading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {state.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {mode === 'login' ? 'Entrando...' : 'Criando conta...'}
              </>
            ) : (
              <>
                {mode === 'login' ? (
                  <>
                    <LogIn size={16} />
                    Entrar
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Criar Conta
                  </>
                )}
              </>
            )}
          </button>

          {/* Switch Mode */}
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">
              {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button
                type="button"
                onClick={switchMode}
                className="ml-1 text-blue-400 hover:text-blue-300 font-medium"
                disabled={state.isLoading}
              >
                {mode === 'login' ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onBackToLogin={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default LoginModal;
