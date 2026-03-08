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

const testTypeOptions = [
  { value: 'field_test', label: '필드 테스트' },
  { value: 'internal', label: '내부 테스트' },
  { value: 'fgt', label: 'FGT' },
  { value: 'cbt', label: 'CBT' },
  { value: 'soft_launch', label: '소프트 런치' },
  { value: 'other', label: '기타' },
];

interface BuildFormData {
  name: string;
  version: string;
  date: string;
  testType: string;
  notes: string;
  changes: string;
  testTarget: string;
  testCount: string;
  playTime: string;
  caution: string;
}

interface BuildFormProps {
  initialData?: Partial<BuildFormData>;
  onSubmit: (data: BuildFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function BuildForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BuildFormProps) {
  const [form, setForm] = useState<BuildFormData>({
    name: initialData?.name ?? '',
    version: initialData?.version ?? '',
    date: initialData?.date ?? new Date().toISOString().split('T')[0],
    testType: initialData?.testType ?? 'field_test',
    notes: initialData?.notes ?? '',
    changes: initialData?.changes ?? '',
    testTarget: initialData?.testTarget ?? '',
    testCount: initialData?.testCount ?? '',
    playTime: initialData?.playTime ?? '',
    caution: initialData?.caution ?? '',
  });

  const update = (key: keyof BuildFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="buildName">빌드 이름</Label>
          <Input
            id="buildName"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="예: 알파 빌드 v0.3"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="version">버전</Label>
          <Input
            id="version"
            value={form.version}
            onChange={(e) => update('version', e.target.value)}
            placeholder="예: 0.3.1"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="buildDate">테스트 날짜</Label>
          <Input
            id="buildDate"
            type="date"
            value={form.date}
            onChange={(e) => update('date', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>테스트 유형</Label>
          <Select
            value={form.testType}
            onValueChange={(val) => update('testType', val ?? '')}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {testTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">메모</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="이번 빌드에 대한 메모"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="changes">주요 변경사항</Label>
        <Textarea
          id="changes"
          value={form.changes}
          onChange={(e) => update('changes', e.target.value)}
          placeholder="이전 빌드 대비 주요 변경 사항을 기술하세요"
          rows={4}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="testTarget">테스트 대상</Label>
          <Input
            id="testTarget"
            value={form.testTarget}
            onChange={(e) => update('testTarget', e.target.value)}
            placeholder="예: 20~30대 MMORPG 유저"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="testCount">테스트 인원</Label>
          <Input
            id="testCount"
            value={form.testCount}
            onChange={(e) => update('testCount', e.target.value)}
            placeholder="예: 30"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="playTime">플레이 시간</Label>
          <Input
            id="playTime"
            value={form.playTime}
            onChange={(e) => update('playTime', e.target.value)}
            placeholder="예: 2시간"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="caution">주의사항</Label>
          <Input
            id="caution"
            value={form.caution}
            onChange={(e) => update('caution', e.target.value)}
            placeholder="분석 시 참고할 주의사항"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting || !form.name.trim() || !form.date}>
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
