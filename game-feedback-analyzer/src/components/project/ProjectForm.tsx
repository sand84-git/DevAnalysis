'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Upload, FileText, Loader2, RefreshCw } from 'lucide-react';

interface ProjectFormData {
  name: string;
  description: string;
  directionDoc: string;
  categories: string[];
}

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  onSubmit: (data: ProjectFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function ProjectForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ProjectFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(
    initialData?.description ?? ''
  );
  const [directionDoc, setDirectionDoc] = useState(
    initialData?.directionDoc ?? ''
  );
  const [categories, setCategories] = useState<string[]>(
    initialData?.categories ?? []
  );
  const [newCategory, setNewCategory] = useState('');
  const [fileName, setFileName] = useState<string | null>(
    initialData?.directionDoc ? '기존 문서 있음' : null
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_EXTENSIONS = ['.txt', '.md'];

  const suggestCategories = useCallback(async (docText: string) => {
    if (!docText.trim()) return;
    setIsSuggesting(true);
    setSuggestError(null);
    try {
      const res = await fetch('/api/suggest-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directionDoc: docText }),
      });
      if (res.ok) {
        const { categories: suggested } = await res.json();
        if (Array.isArray(suggested) && suggested.length > 0) {
          setCategories(suggested);
        }
      } else {
        setSuggestError('카테고리 제안에 실패했습니다.');
      }
    } catch {
      setSuggestError('카테고리 제안 중 오류가 발생했습니다.');
    } finally {
      setIsSuggesting(false);
    }
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        alert('.txt 또는 .md 파일만 업로드할 수 있습니다.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setDirectionDoc(text);
        setFileName(file.name);
        // 카테고리가 비어있을 때만 AI 제안 자동 실행 (새 프로젝트 생성 시)
        if (categories.length === 0) {
          suggestCategories(text);
        }
      };
      reader.readAsText(file);
    },
    [setDirectionDoc, categories.length, suggestCategories]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = () => {
    setDirectionDoc('');
    setFileName(null);
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, directionDoc, categories });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">프로젝트 이름</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="게임 이름을 입력하세요"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="프로젝트에 대한 간단한 설명"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>기획 방향 문서</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md"
          onChange={handleFileInputChange}
          className="hidden"
        />
        {fileName ? (
          <div className="flex items-center gap-3 rounded-md border border-border bg-muted/50 px-4 py-3">
            <FileText className="size-5 shrink-0 text-accent1" />
            <span className="flex-1 truncate text-sm">{fileName}</span>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="shrink-0 text-muted-foreground hover:text-danger"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-8 transition-colors ${
              isDragOver
                ? 'border-accent1 bg-accent1/5'
                : 'border-border hover:border-accent1/50 hover:bg-muted/30'
            }`}
          >
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              .txt 또는 .md 파일을 드래그하거나 클릭하여 업로드
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>카테고리</Label>
          {directionDoc && (
            <button
              type="button"
              onClick={() => suggestCategories(directionDoc)}
              disabled={isSuggesting}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent1 disabled:opacity-50"
            >
              <RefreshCw className={`size-3 ${isSuggesting ? 'animate-spin' : ''}`} />
              AI 재제안
            </button>
          )}
        </div>
        {isSuggesting && (
          <div className="flex items-center gap-2 rounded-md border border-accent1/20 bg-accent1/5 px-3 py-2 text-sm text-accent1">
            <Loader2 className="size-4 animate-spin" />
            AI가 기획 문서를 분석하여 카테고리를 제안 중...
          </div>
        )}
        {suggestError && (
          <p className="text-sm text-danger">{suggestError}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 rounded-full bg-accent1/10 px-3 py-1 text-sm text-accent1"
            >
              {cat}
              <button
                type="button"
                onClick={() => handleRemoveCategory(cat)}
                className="hover:text-danger"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="새 카테고리 추가"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCategory();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={handleAddCategory}>
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting ? '저장 중...' : '저장'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
        )}
      </div>
    </form>
  );
}
