'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus } from 'lucide-react';

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
        <Label htmlFor="directionDoc">기획 방향 문서</Label>
        <Textarea
          id="directionDoc"
          value={directionDoc}
          onChange={(e) => setDirectionDoc(e.target.value)}
          placeholder="게임의 핵심 기획 방향, 목표 경험, 타겟 유저 등을 기술하세요. AI 분석 시 기획 의도와 유저 피드백의 갭 분석에 활용됩니다."
          rows={8}
        />
      </div>

      <div className="space-y-2">
        <Label>카테고리</Label>
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
