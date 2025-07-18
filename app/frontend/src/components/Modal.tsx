import React from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  children?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  children,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-gray-900 rounded-lg shadow-lg p-8 max-w-md w-full text-center border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        {description && <p className="text-gray-300 mb-6">{description}</p>}
        {children && <div className="mb-6">{children}</div>}
        <div className="flex justify-center gap-4">
          <button
            className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 transition-colors font-semibold"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
