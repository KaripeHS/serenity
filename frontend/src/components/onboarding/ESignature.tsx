import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';
import {
  PencilIcon,
  ArrowPathIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ESignatureProps {
  /** Callback when signature is completed */
  onSign: (signatureData: SignatureData) => void;
  /** Whether the signature is required */
  required?: boolean;
  /** Legal attestation text to display above signature */
  attestationText?: string;
  /** Width of the signature canvas */
  width?: number;
  /** Height of the signature canvas */
  height?: number;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Initial signature data if already signed */
  initialSignature?: string;
  /** Signer's name to display */
  signerName?: string;
  /** Additional className */
  className?: string;
}

export interface SignatureData {
  /** Base64 encoded PNG signature image */
  signature: string;
  /** Timestamp when signed */
  signedAt: string;
  /** Legal attestation text that was displayed */
  attestationText: string;
  /** SHA-256 hash of the document being signed (if provided) */
  documentHash?: string;
}

/**
 * E-Signature Component
 *
 * A canvas-based signature capture component with:
 * - Touch and mouse support
 * - Clear and undo functionality
 * - Legal attestation display
 * - E-SIGN Act compliant data capture
 */
export function ESignature({
  onSign,
  required = false,
  attestationText = 'By signing below, I certify that the information provided is true and accurate to the best of my knowledge.',
  width = 500,
  height = 150,
  disabled = false,
  initialSignature,
  signerName,
  className,
}: ESignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialSignature);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const [agreed, setAgreed] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Set drawing styles
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Load initial signature if provided
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        setHasSignature(true);
      };
      img.src = initialSignature;
    }
  }, [width, height, initialSignature]);

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Save state before starting new stroke (for undo)
    const dpr = window.devicePixelRatio || 1;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory(prev => [...prev.slice(-10), imageData]); // Keep last 10 states

    e.preventDefault();
    setIsDrawing(true);
    const point = getCanvasPoint(e);
    setLastPoint(point);

    // Start a new path
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }, [disabled, getCanvasPoint]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPoint) return;

    e.preventDefault();
    const point = getCanvasPoint(e);

    // Draw smooth line
    ctx.quadraticCurveTo(
      lastPoint.x,
      lastPoint.y,
      (lastPoint.x + point.x) / 2,
      (lastPoint.y + point.y) / 2
    );
    ctx.stroke();

    setLastPoint(point);
    setHasSignature(true);
  }, [isDrawing, disabled, lastPoint, getCanvasPoint]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setLastPoint(null);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    setHasSignature(false);
    setStrokeHistory([]);
  }, [width, height]);

  const undoLast = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || strokeHistory.length === 0) return;

    const lastState = strokeHistory[strokeHistory.length - 1];
    ctx.putImageData(lastState, 0, 0);
    setStrokeHistory(prev => prev.slice(0, -1));

    // Check if canvas is empty after undo
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const isEmpty = imageData.data.every((val, idx) =>
      idx % 4 === 3 ? val === 255 : val === 255
    );
    setHasSignature(!isEmpty);
  }, [strokeHistory]);

  const handleSign = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature || !agreed) return;

    // Get signature as base64 PNG
    const signature = canvas.toDataURL('image/png');

    const signatureData: SignatureData = {
      signature,
      signedAt: new Date().toISOString(),
      attestationText,
    };

    onSign(signatureData);
  }, [hasSignature, agreed, attestationText, onSign]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Attestation Text */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">{attestationText}</p>
            {signerName && (
              <p className="text-sm font-medium text-gray-900 mt-2">
                Signing as: {signerName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Agreement Checkbox */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="signature-agreement"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          disabled={disabled}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="signature-agreement" className="text-sm text-gray-700">
          I have read and agree to the above statement {required && <span className="text-danger-500">*</span>}
        </label>
      </div>

      {/* Signature Canvas */}
      <div className="relative">
        <div className={cn(
          'border-2 rounded-lg overflow-hidden',
          disabled ? 'border-gray-200 bg-gray-100' : 'border-gray-300 bg-white',
          !agreed && 'opacity-50 pointer-events-none'
        )}>
          <canvas
            ref={canvasRef}
            style={{ width, height, touchAction: 'none' }}
            className="cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {/* Signature Line */}
          <div className="absolute bottom-8 left-4 right-4 border-b border-gray-400" />
          <div className="absolute bottom-2 left-4 text-xs text-gray-400 flex items-center gap-1">
            <PencilIcon className="h-3 w-3" />
            Sign above this line
          </div>
        </div>

        {/* Canvas Controls */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              disabled={disabled || !hasSignature}
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={undoLast}
              disabled={disabled || strokeHistory.length === 0}
            >
              Undo
            </Button>
          </div>

          <Button
            type="button"
            onClick={handleSign}
            disabled={disabled || !hasSignature || !agreed}
            className="min-w-[120px]"
          >
            <CheckIcon className="h-4 w-4 mr-1" />
            Apply Signature
          </Button>
        </div>
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Use your mouse, finger, or stylus to sign above. Your signature will be legally binding.
      </p>
    </div>
  );
}

/**
 * Signature Display Component
 * Shows a completed signature with timestamp
 */
interface SignatureDisplayProps {
  signatureData: SignatureData;
  signerName?: string;
  className?: string;
  onClear?: () => void;
}

export function SignatureDisplay({
  signatureData,
  signerName,
  className,
  onClear
}: SignatureDisplayProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Signature</span>
        {onClear && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear & Re-sign
          </Button>
        )}
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <img
          src={signatureData.signature}
          alt="Signature"
          className="max-h-24 mx-auto"
        />
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        {signerName && (
          <p>Signed by: <span className="font-medium text-gray-700">{signerName}</span></p>
        )}
        <p>
          Signed on: {new Date(signatureData.signedAt).toLocaleString()}
        </p>
        <p className="text-gray-400 italic">
          "{signatureData.attestationText}"
        </p>
      </div>
    </div>
  );
}

export default ESignature;
