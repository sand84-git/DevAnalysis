'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { Priority, TaskStatus } from '@/types';

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'P0', label: 'P0 - 긴급' },
  { value: 'P1', label: 'P1 - 중요' },
  { value: 'P2', label: 'P2 - 보통' },
  { value: 'discuss', label: '논의 필요' },
];

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'open', label: '열림' },
  { value: 'improving', label: '개선 중' },
  { value: 'resolved', label: '해결됨' },
  { value: 'hold', label: '보류' },
  { value: 'worsened', label: '악화' },
];

interface TaskFormData {
  title: string;
  description: string;
  section: string;
  priority: Priority;
  status: TaskStatus;
}

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  showStatus?: boolean;
}

export function TaskForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  showStatus = false,
}: TaskFormProps) {
  const [form, setForm] = useState<TaskFormData>({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    section: initialData?.section ?? '',
    priority: initialData?.priority ?? 'P1',
    status: initialData?.status ?? 'open',
  });

  const update = (key: keyof TaskFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="taskTitle">제목</Label>
        <Input
          id="taskTitle"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="태스크 제목을 입력하세요"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="taskDesc">설명</Label>
        <Textarea
          id="taskDesc"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="태스크에 대한 상세 설명"
          rows={4}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="section">섹션</Label>
          <Input
            id="section"
            value={form.section}
            onChange={(e) => update('section', e.target.value)}
            placeholder="예: 전투, UI, 밸런스"
          />
        </div>

        <div className="space-y-2">
          <Label>우선순위</Label>
          <Select
            value={form.priority}
            onValueChange={(val) => update('priority', val as string)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showStatus && (
          <div className="space-y-2">
            <Label>상태</Label>
            <Select
              value={form.status}
              onValueChange={(val) => update('status', val as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting || !form.title.trim()}>
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
