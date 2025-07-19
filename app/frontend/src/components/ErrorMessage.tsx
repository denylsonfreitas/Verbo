import React from 'react';

interface ErrorMessageProps {
  message: string;
  show: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, show }) => {
  return (
    <div 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        show 
          ? 'opacity-100 translate-y-0 pointer-events-auto' 
          : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
    >
      <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg border border-red-500">
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

export default ErrorMessage;
