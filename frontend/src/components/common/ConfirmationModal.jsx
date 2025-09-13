import React from 'react';
import Modal from '../ui/Modal';
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonColor = "bg-red-500 hover:bg-red-600",
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center p-4">
        <div className="flex justify-center items-center mb-4">
          <svg className="h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.5-1.688 1.7-3.153l-6.928-13.9c-.8-1.603-2.735-1.603-3.535 0l-6.928 13.9c-.8 1.465.15 3.153 1.7 3.153z" />
          </svg>
        </div>
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-6">
          {message}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            {cancelButtonText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 rounded-lg text-white font-semibold ${confirmButtonColor} transition-colors duration-200`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;