import { useState, useRef, useEffect } from 'react';
import { Camera, Check, X, Trash2, AlertCircle } from 'lucide-react';
import Avatar from './Avatar';
import Button from './Button';
import Spinner from './Spinner';
import useToast from './useToast';
import { avatarService } from '../../services/avatarService';
import './AvatarUpload.css';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXT = /\.(jpe?g|png|webp)$/i;

function formatMb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

// Resolve a URL string from an upload response that may be `{ avatarUrl }`,
// `{ url }`, or a plain string — falling back to the preview object URL.
function toAvatarUrl(result, fallback) {
  if (typeof result === 'string' && result) return result;
  if (result && typeof result === 'object' && (result.avatarUrl || result.url)) {
    return result.avatarUrl || result.url;
  }
  return fallback;
}

export default function AvatarUpload({
  name = '',
  src = '',
  size = 'lg',
  className = '',
  onUpload,
  onRemove,
  onUploaded,
}) {
  const { addToast } = useToast();

  const [savedSrc, setSavedSrc] = useState(src);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const inputRef = useRef(null);
  const createdUrlsRef = useRef(new Set());

  useEffect(() => {
    const urls = createdUrlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL?.(u));
      urls.clear();
    };
  }, []);

  // Stay in sync when the parent's src changes (e.g. after an auth-context
  // refresh following a successful upload).
  useEffect(() => {
    setSavedSrc(src);
  }, [src]);

  const openPicker = () => {
    setError('');
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_MIME.includes(file.type) && !ACCEPTED_EXT.test(file.name)) {
      const message = `"${file.name}" isn't a supported photo format. Please choose a JPG, PNG, or WebP image.`;
      setError(message);
      addToast({ type: 'error', title: 'Photo not added', message });
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      const message = `"${file.name}" is too large (${formatMb(file.size)} MB). Please choose a photo under 5 MB.`;
      setError(message);
      addToast({ type: 'error', title: 'Photo not added', message });
      return;
    }

    if (file.size === 0) {
      const message = `"${file.name}" couldn't be read. Please try a different photo.`;
      setError(message);
      addToast({ type: 'error', title: 'Photo not added', message });
      return;
    }

    const url = URL.createObjectURL(file);
    createdUrlsRef.current.add(url);
    setError('');
    setSelectedFile(file);
    setPreviewUrl(url);
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL?.(previewUrl);
      createdUrlsRef.current.delete(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setError('');
  };

  const handleSave = async () => {
    if (!selectedFile || !previewUrl) return;
    setUploading(true);
    try {
      const upload = onUpload ?? avatarService.upload;
      const result = await upload(selectedFile, previewUrl);
      const url = toAvatarUrl(result, previewUrl);
      setSavedSrc(url);
      if (url !== previewUrl) {
        URL.revokeObjectURL?.(previewUrl);
        createdUrlsRef.current.delete(previewUrl);
        if (typeof url === 'string' && url.startsWith('blob:')) {
          createdUrlsRef.current.add(url);
        }
      }
      setPreviewUrl(null);
      setSelectedFile(null);
      onUploaded?.(url);
      addToast({
        type: 'success',
        title: 'Photo updated',
        message: 'Your new profile photo has been saved.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Photo not saved',
        message: err.message || 'Upload failed. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      const remove = onRemove ?? avatarService.remove;
      await remove();
      setSavedSrc('');
      onUploaded?.(null);
      addToast({
        type: 'success',
        title: 'Photo removed',
        message: 'Your profile photo has been removed.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not remove photo',
        message: err.message || 'Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const displayedSrc = previewUrl || savedSrc;

  return (
    <div className="avatar-upload">
      <div className="avatar-upload__frame">
        <Avatar name={name} src={displayedSrc} size={size} className={className} />
        <button
          type="button"
          className="avatar-upload__trigger"
          onClick={openPicker}
          disabled={uploading}
          aria-label="Change profile photo"
        >
          <Camera aria-hidden="true" />
        </button>
        {uploading && (
          <div className="avatar-upload__scrim">
            <Spinner size="md" label="Uploading photo" />
          </div>
        )}
      </div>

      <div className="avatar-upload__controls">
        {previewUrl && !uploading ? (
          <div className="avatar-upload__preview-actions" role="group" aria-label="Confirm new photo">
            <Button variant="primary" size="sm" leftIcon={Check} onClick={handleSave}>
              Save Photo
            </Button>
            <Button variant="secondary" size="sm" leftIcon={X} onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="avatar-upload__change"
            onClick={openPicker}
            disabled={uploading}
          >
            <Camera aria-hidden="true" /> Change Photo
          </button>
        )}
        {savedSrc && !previewUrl && !uploading && (
          <button
            type="button"
            className="avatar-upload__remove"
            onClick={handleRemove}
          >
            <Trash2 aria-hidden="true" /> Remove photo
          </button>
        )}
        <p className="avatar-upload__hint">JPG, PNG or WebP &middot; max 5 MB</p>
        {error && (
          <p className="avatar-upload__error" role="alert">
            <AlertCircle aria-hidden="true" /> {error}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="avatar-upload__input"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
