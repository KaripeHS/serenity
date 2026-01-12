import { useState, useRef } from 'react';
import { UserCircleIcon, CameraIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null;
  staffId: string;
  staffName: string;
  canEdit: boolean;
  onUploadSuccess: (url: string) => void;
  onDeleteSuccess: () => void;
  onMagnify: () => void;
}

export function ProfilePictureUpload({
  currentImageUrl,
  staffId,
  staffName,
  canEdit,
  onUploadSuccess,
  onDeleteSuccess,
  onMagnify
}: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const token = localStorage.getItem('serenity_access_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/console/hr/staff/${staffId}/profile-picture`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload image');
      }

      const data = await response.json();
      onUploadSuccess(data.profilePictureUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this profile picture?')) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem('serenity_access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/console/hr/staff/${staffId}/profile-picture`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete image');
      }

      onDeleteSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Profile Picture Container */}
      <div className="relative group">
        {/* Image or Placeholder */}
        <div
          onClick={() => currentImageUrl && onMagnify()}
          className={`h-32 w-32 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center ${
            currentImageUrl ? 'cursor-pointer' : ''
          }`}
        >
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt={staffName}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserCircleIcon className="h-24 w-24 text-primary-400" />
          )}

          {/* Uploading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}

          {/* Click to view hint */}
          {currentImageUrl && !isUploading && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center rounded-full transition-colors opacity-0 group-hover:opacity-100">
              <span className="text-white text-xs font-medium">Click to view</span>
            </div>
          )}
        </div>

        {/* Edit buttons - only show if canEdit */}
        {canEdit && !isUploading && (
          <div className="absolute -bottom-1 -right-1 flex gap-1">
            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors"
              title="Upload photo"
            >
              <CameraIcon className="h-4 w-4" />
            </button>

            {/* Delete button - only show if image exists */}
            {currentImageUrl && (
              <button
                onClick={handleDelete}
                className="p-2 bg-danger-600 text-white rounded-full shadow-lg hover:bg-danger-700 transition-colors"
                title="Remove photo"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-danger-600">{error}</p>
      )}

      {/* Help text */}
      {canEdit && !error && (
        <p className="mt-2 text-xs text-gray-500">
          {currentImageUrl ? 'Click image to enlarge' : 'Upload a profile photo'}
        </p>
      )}
    </div>
  );
}
