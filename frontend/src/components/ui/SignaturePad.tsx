import { useRef, useState, useEffect } from 'react';
import { TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface SignaturePadProps {
  value?: string; // Base64 image data
  onChange: (signatureData: string | null) => void;
  disabled?: boolean;
  width?: number;
  height?: number;
}

export function SignaturePad({
  value,
  onChange,
  disabled = false,
  width = 500,
  height = 200,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Initialize canvas and load existing signature
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set drawing styles
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load existing signature if provided
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [width, height]);

  // Load value when it changes externally
  useEffect(() => {
    if (value) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [value]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);

    // Save signature data
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const signatureData = canvas.toDataURL('image/png');
      onChange(signatureData);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative border-2 rounded-lg overflow-hidden ${
          disabled ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300 hover:border-primary-400'
        }`}
      >
        <canvas
          ref={canvasRef}
          className={`w-full touch-none ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
          style={{ height: `${height}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Signature line */}
        <div className="absolute bottom-8 left-8 right-8 border-b border-gray-300" />
        <div className="absolute bottom-2 left-8 text-xs text-gray-400">Sign above the line</div>

        {/* Clear button */}
        {hasSignature && !disabled && (
          <button
            type="button"
            onClick={clearSignature}
            className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-lg shadow-sm border border-gray-200 transition-colors"
            title="Clear signature"
          >
            <TrashIcon className="h-4 w-4 text-gray-600" />
          </button>
        )}
      </div>

      {!disabled && (
        <p className="text-xs text-gray-500 text-center">
          Use your mouse, finger, or stylus to sign above
        </p>
      )}
    </div>
  );
}

// Component for displaying a saved signature
export function SignatureDisplay({ signatureData, label }: { signatureData: string; label?: string }) {
  return (
    <div className="space-y-1">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
      <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
        <img
          src={signatureData}
          alt="Signature"
          className="max-h-24 mx-auto"
        />
      </div>
    </div>
  );
}
