import { useCallback, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';

export default function DropZone({ onFileSelect, accept = '.xlsx,.xls,.csv', maxSize = 10, label = 'Upload File' }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  const maxBytes = maxSize * 1024 * 1024;

  const validateFile = useCallback((file) => {
    setError('');
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const allowedExts = accept.split(',').map(a => a.trim());
    if (!allowedExts.includes(ext)) {
      setError(`Invalid file type. Allowed: ${accept}`);
      return false;
    }
    if (file.size > maxBytes) {
      setError(`File too large. Maximum: ${maxSize}MB`);
      return false;
    }
    return true;
  }, [accept, maxBytes, maxSize]);

  const handleFile = useCallback((file) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect?.(file);
    }
  }, [validateFile, onFileSelect]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setError('');
    onFileSelect?.(null);
  }, [onFileSelect]);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-primary-text mb-1.5">{label}</label>
      {!selectedFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-primary-blue bg-primary-blue-light' : 'border-border hover:border-primary-blue'}
          `}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
            id="dropzone-input"
          />
          <label htmlFor="dropzone-input" className="cursor-pointer">
            <Upload className="w-10 h-10 text-secondary-text mx-auto mb-3" />
            <p className="text-sm font-medium text-primary-text mb-1">Drop your file here, or click to browse</p>
            <p className="text-xs text-secondary-text">Accepted: {accept} (max {maxSize}MB)</p>
          </label>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 border border-border rounded-xl bg-gray-50">
          <FileText className="w-8 h-8 text-primary-blue flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary-text truncate">{selectedFile.name}</p>
            <p className="text-xs text-secondary-text">{(selectedFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <button onClick={removeFile} className="p-1 rounded hover:bg-gray-200 text-secondary-text" aria-label="Remove file">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
    </div>
  );
}
