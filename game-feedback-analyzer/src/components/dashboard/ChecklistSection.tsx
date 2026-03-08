'use client';

import { useState } from 'react';
import type { Priority } from '@/types';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: string;
  completed: boolean;
}

interface ChecklistSectionProps {
  items: ChecklistItem[];
  onToggle?: (id: string, completed: boolean) => void;
}

const PRIORITY_ORDER: Priority[] = ['P0', 'P1', 'P2', 'discuss'];

const PRIORITY_STYLES: Record<Priority, { label: string; className: string }> = {
  P0: { label: 'P0 긴급', className: 'bg-danger text-white' },
  P1: { label: 'P1 높음', className: 'bg-warn text-white' },
  P2: { label: 'P2 보통', className: 'bg-accent2 text-white' },
  discuss: { label: '논의 필요', className: 'bg-purple text-white' },
};

export default function ChecklistSection({ items, onToggle }: ChecklistSectionProps) {
  const [localItems, setLocalItems] = useState(items);

  const handleToggle = (id: string) => {
    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
    const item = localItems.find((i) => i.id === id);
    if (item) {
      onToggle?.(id, !item.completed);
    }
  };

  const grouped = PRIORITY_ORDER.map((priority) => ({
    priority,
    items: localItems.filter((item) => item.priority === priority),
  })).filter((g) => g.items.length > 0);

  const totalCount = localItems.length;
  const completedCount = localItems.filter((i) => i.completed).length;

  return (
    <div className="rounded-[10px] border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg text-text">액션 아이템</h3>
        <span className="text-sm text-text-mid">
          {completedCount}/{totalCount} 완료
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full bg-success transition-all duration-300"
          style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      <div className="space-y-6">
        {grouped.map(({ priority, items: groupItems }) => {
          const style = PRIORITY_STYLES[priority];
          return (
            <div key={priority}>
              <div className="mb-3 flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${style.className}`}>
                  {style.label}
                </span>
                <span className="text-xs text-text-lt">
                  {groupItems.filter((i) => i.completed).length}/{groupItems.length}
                </span>
              </div>
              <div className="space-y-2">
                {groupItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-bg"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggle(item.id)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-accent1"
                    />
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium ${item.completed ? 'text-text-lt line-through' : 'text-text'}`}
                      >
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-text-lt">{item.description}</p>
                      <span className="mt-1 inline-block rounded bg-bg px-1.5 py-0.5 text-xs text-text-mid">
                        {item.category}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { ChecklistItem };
