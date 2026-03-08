'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ACCEPT_TYPES = '.xlsx,.xls,.pdf';
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

interface FileDropzoneProps {
  onFileSelect: (file: File) => void | Promise<void>;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return FileText;
  return FileSpreadsheet;
}

export function FileDropzone({ onFileSelect, className }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['xlsx', 'xls', 'pdf'].includes(ext)) {
      return '지원하지 않는 파일 형식입니다. (xlsx, pdf만 지원)';
    }
    if (file.size > MAX_SIZE) {
      return '파일 크기가 50MB를 초과합니다.';
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await onFileSelect(selectedFile);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const FileIcon = selectedFile ? getFileIcon(selectedFile.name) : Upload;

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-[10px] border-2 border-dashed p-8 transition-colors',
          isDragging
            ? 'border-accent1 bg-accent1/5'
            : selectedFile
              ? 'border-success/50 bg-success/5'
              : 'border-border bg-card hover:border-accent1/50 hover:bg-accent1/5'
        )}
      >
        <FileIcon
          className={cn(
            'mb-3 size-8',
            selectedFile ? 'text-success' : 'text-text-lt'
          )}
        />

        {selectedFile ? (
          <div className="text-center">
            <p className="text-sm font-medium text-text">{selectedFile.name}</p>
            <p className="mt-1 text-xs text-text-lt">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-text-mid">
              파일을 드래그하거나 클릭하여 선택
            </p>
            <p className="mt-1 text-xs text-text-lt">
              xlsx, pdf 파일 지원 (최대 50MB)
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_TYPES}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {selectedFile && (
        <div className="flex gap-2">
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? '업로드 중...' : '업로드'}
          </Button>
          <Button variant="outline" onClick={handleClear}>
            <X className="size-4" />
            취소
          </Button>
        </div>
      )}
    </div>
  );
}
