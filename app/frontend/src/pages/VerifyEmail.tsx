import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useAuth();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setMessage({ type: 'error', text: 'Token de verificação não encontrado' });
        setLoading(false);
        return;
      }

      try {
        const updatedUser = await authService.confirmEmailChange(token);
        setMessage({ 
          type: 'success', 
          text: `Email alterado com sucesso para ${updatedUser.email}! Redirecionando...` 
        });
        
        setTimeout(() => {
          if (state.isAuthenticated) {
            navigate('/account');
          } else {
            navigate('/login');
          }
        }, 3000);
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message || 'Erro ao verificar email' });
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate, state.isAuthenticated]);

  return (
    <div className="min-h-screen bg-verbo-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-verbo-accent rounded-full flex items-center justify-center mb-4">
            {loading ? (
              <Loader size={32} className="text-white animate-spin" />
            ) : message?.type === 'success' ? (
              <CheckCircle size={32} className="text-white" />
            ) : (
              <Mail size={32} className="text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Verificação de Email</h1>
          <p className="text-gray-400">
            {loading ? 'Verificando seu email...' : 'Resultado da verificação'}
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-900/50 border border-green-500 text-green-300' 
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

        {loading && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-gray-400">
              <Loader size={20} className="animate-spin" />
              <span>Processando verificação...</span>
            </div>
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {message?.type === 'success' ? (
              <div className="text-center">
                <p className="text-gray-300 mb-4">
                  Seu email foi verificado com sucesso! Você será redirecionado automaticamente.
                </p>
                <button
                  onClick={() => state.isAuthenticated ? navigate('/account') : navigate('/login')}
                  className="bg-verbo-accent text-white py-2 px-4 rounded-md hover:bg-verbo-accent/90 focus:outline-none focus:ring-2 focus:ring-verbo-accent"
                >
                  {state.isAuthenticated ? 'Ir para Minha Conta' : 'Ir para Login'}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-gray-300">
                  Não foi possível verificar seu email. O token pode estar expirado ou inválido.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/account')}
                    className="flex-1 bg-verbo-accent text-white py-2 px-4 rounded-md hover:bg-verbo-accent/90 focus:outline-none focus:ring-2 focus:ring-verbo-accent"
                  >
                    Tentar Novamente
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Voltar ao Início
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
