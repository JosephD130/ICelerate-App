"use client";

import { useState } from "react";
import { CheckCircle, X, PenLine } from "lucide-react";

export interface ReviewItem {
  label: string;
  value: string;
  editable: boolean;
}

interface Props {
  title?: string;
  items: ReviewItem[];
  onApprove: (modified: ReviewItem[]) => void;
  onReject: () => void;
}

export default function ImpactReviewPanel({
  title = "Review Before Saving",
  items,
  onApprove,
  onReject,
}: Props) {
  const [editedItems, setEditedItems] = useState<ReviewItem[]>(items);

  const updateValue = (index: number, value: string) => {
    setEditedItems((prev) => prev.map((item, i) => (i === index ? { ...item, value } : item)));
  };

  return (
    <div className="mt-4 bg-[var(--color-surface)] border border-[var(--color-semantic-yellow)] rounded-[var(--radius-card)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <PenLine size={14} className="text-[var(--color-semantic-yellow)]" />
        <span className="text-sm font-semibold uppercase tracking-wider text-[var(--color-semantic-yellow)]">
          {title}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {editedItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider w-28 shrink-0 pt-1.5">
              {item.label}
            </span>
            {item.editable ? (
              <input
                type="text"
                value={item.value}
                onChange={(e) => updateValue(i, e.target.value)}
                className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 py-1 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            ) : (
              <span className="flex-1 text-sm text-[var(--color-text-secondary)] pt-1">
                {item.value}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onApprove(editedItems)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--color-semantic-green)" }}
        >
          <CheckCircle size={12} />
          Approve & Apply
        </button>
        <button
          onClick={onReject}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-semantic-red)] transition-colors border border-[var(--color-border)]"
        >
          <X size={12} />
          Reject
        </button>
      </div>
    </div>
  );
}
