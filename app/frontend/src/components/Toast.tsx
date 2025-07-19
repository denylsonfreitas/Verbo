// Sistema de notificação Toast melhorado

import React, { useState, useEffect, useCallback } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  show, 
  onClose, 
  duration = 3000 
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setIsExiting(false);
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  useEffect(() => {
    if (!show && !isExiting) {
      handleClose();
    }
  }, [show]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  if (!show && !isExiting) return null;

  const bgColor = {
    success: 'bg-verbo-green border-green-600',
    error: 'bg-red-500 border-red-600',
    info: 'bg-blue-500 border-blue-600'
  }[type];

  const icon = {
    success: '✓',
    error: '✗',
    info: 'ℹ'
  }[type];

  return (
    <div 
      className={`fixed top-4 right-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-xl border-l-4 z-50 max-w-sm transform transition-all duration-300 ease-in-out ${
        show && !isExiting
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">{icon}</span>
          <span className="text-sm font-medium">{message}</span>
        </div>
        {/* Botão para fechar manualmente */}
        <button
          onClick={handleClose}
          className="ml-2 text-white hover:text-gray-200 transition-colors duration-200 focus:outline-none"
          aria-label="Fechar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;
