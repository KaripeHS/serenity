import { useState, useCallback, useRef } from 'react';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';
import {
  DocumentArrowUpIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

interface UploadedDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  category: string;
  uploadedAt: string;
  verified?: boolean;
  rejected?: boolean;
  rejectionReason?: string;
}

interface DocumentUploadProps {
  /** Onboarding item ID to upload documents for */
  itemId: string;
  /** Category of documents being uploaded */
  category?: string;
  /** Accepted file types (default: images and PDFs) */
  accept?: string;
  /** Max file size in MB (default: 10) */
  maxSizeMB?: number;
  /** Whether multiple files can be uploaded */
  multiple?: boolean;
  /** Callback when upload completes */
  onUploadComplete?: (document: UploadedDocument) => void;
  /** Callback when document is deleted */
  onDelete?: (documentId: string) => void;
  /** Existing documents */
  existingDocuments?: UploadedDocument[];
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Custom upload instruction text */
  instructions?: string;
  /** Additional className */
  className?: string;
}

interface UploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  document?: UploadedDocument;
}

/**
 * Document Upload Component for Onboarding
 *
 * Features:
 * - Drag and drop support
 * - File type validation
 * - Size limit enforcement
 * - Upload progress tracking
 * - Document preview
 * - Verification status display
 */
export function DocumentUpload({
  itemId,
  category = 'document',
  accept = 'image/*,.pdf,.doc,.docx',
  maxSizeMB = 10,
  multiple = true,
  onUploadComplete,
  onDelete,
  existingDocuments = [],
  disabled = false,
  instructions,
  className,
}: DocumentUploadProps) {
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.some(type => file.type.startsWith(type.split('/')[0]) || file.type === type)) {
      return 'Invalid file type. Allowed: JPG, PNG, GIF, PDF, DOC, DOCX';
    }

    return null;
  }, [maxSizeBytes, maxSizeMB]);

  const uploadFile = useCallback(async (file: File, index: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    try {
      // Update status to uploading
      setUploads(prev => prev.map((u, i) =>
        i === index ? { ...u, status: 'uploading', progress: 0 } : u
      ));

      // Note: We're using fetch directly because api.post doesn't support FormData well
      const token = localStorage.getItem('serenity_access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/console/hr/onboarding/items/${itemId}/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();

      // Update status to complete
      setUploads(prev => prev.map((u, i) =>
        i === index ? { ...u, status: 'complete', progress: 100, document: result.document } : u
      ));

      if (onUploadComplete && result.document) {
        onUploadComplete(result.document);
      }
    } catch (error: any) {
      setUploads(prev => prev.map((u, i) =>
        i === index ? { ...u, status: 'error', error: error.message } : u
      ));
    }
  }, [itemId, category, onUploadComplete]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        // Add to uploads with error state
        setUploads(prev => [...prev, { file, progress: 0, status: 'error', error }]);
      } else {
        validFiles.push(file);
      }
    });

    // Add valid files and start uploads
    const startIndex = uploads.length;
    const newUploads = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Start uploading each file
    validFiles.forEach((file, i) => {
      uploadFile(file, startIndex + i);
    });
  }, [validateFile, uploads.length, uploadFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = multiple ? e.dataTransfer.files : [e.dataTransfer.files[0]];
      handleFiles(files);
    }
  }, [disabled, multiple, handleFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const removeUpload = useCallback((index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  }, []);

  const retryUpload = useCallback((index: number) => {
    const upload = uploads[index];
    if (upload) {
      setUploads(prev => prev.map((u, i) =>
        i === index ? { ...u, status: 'pending', error: undefined } : u
      ));
      uploadFile(upload.file, index);
    }
  }, [uploads, uploadFile]);

  const handleDeleteExisting = useCallback(async (documentId: string) => {
    try {
      await api.delete(`/console/hr/onboarding/documents/${documentId}`);
      if (onDelete) {
        onDelete(documentId);
      }
    } catch (error: any) {
      alert('Failed to delete document: ' + error.message);
    }
  }, [onDelete]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    }
    if (mimeType === 'application/pdf') {
      return '📄';
    }
    return '📎';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-gray-50',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />

        <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">
          {instructions || 'Drag and drop files here, or click to browse'}
        </p>
        <p className="text-xs text-gray-500">
          Max size: {maxSizeMB}MB per file • Allowed: JPG, PNG, PDF, DOC
        </p>
      </div>

      {/* Upload Queue */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploading</h4>
          {uploads.map((upload, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                upload.status === 'error' ? 'bg-red-50 border-red-200' :
                upload.status === 'complete' ? 'bg-green-50 border-green-200' :
                'bg-gray-50 border-gray-200'
              )}
            >
              <span className="text-xl">{getFileIcon(upload.file.type)}</span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {upload.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(upload.file.size)}
                </p>

                {upload.status === 'uploading' && (
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-primary-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}

                {upload.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {upload.status === 'uploading' && (
                  <ArrowPathIcon className="h-5 w-5 text-gray-400 animate-spin" />
                )}
                {upload.status === 'complete' && (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                )}
                {upload.status === 'error' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); retryUpload(index); }}
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); removeUpload(index); }}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Existing Documents */}
      {existingDocuments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Documents</h4>
          {existingDocuments.map(doc => (
            <div
              key={doc.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                doc.rejected ? 'bg-red-50 border-red-200' :
                doc.verified ? 'bg-green-50 border-green-200' :
                'bg-white border-gray-200'
              )}
            >
              <span className="text-xl">{getFileIcon(doc.fileType)}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.fileName}
                  </p>
                  {doc.verified && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  )}
                  {doc.rejected && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                      Rejected
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {formatFileSize(doc.fileSize)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
                {doc.rejected && doc.rejectionReason && (
                  <p className="text-xs text-red-600 mt-1">Reason: {doc.rejectionReason}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(doc.fileUrl, '_blank')}
                >
                  <EyeIcon className="h-4 w-4" />
                </Button>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteExisting(doc.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DocumentUpload;
