import { Button } from '../ui/Button';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  details?: string[];
  footer?: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  details,
  footer
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-success-600 to-success-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-500 rounded-full">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-success-500 rounded-full p-1 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-800 text-lg mb-4">{message}</p>

            {details && details.length > 0 && (
              <ul className="space-y-2 mb-4">
                {details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <CheckCircleIcon className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            )}

            {footer && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-gray-600">{footer}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-end">
              <Button
                onClick={onClose}
                className="bg-success-600 hover:bg-success-700"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
