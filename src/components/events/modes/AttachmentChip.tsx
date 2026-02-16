"use client";

import { Image, FileText, Mail, ClipboardList, X, ExternalLink } from "lucide-react";
import type { EventAttachment } from "@/lib/models/decision-event";

const KIND_ICONS: Record<string, React.ReactNode> = {
  photo: <Image size={12} />,
  document: <FileText size={12} />,
  email: <Mail size={12} />,
  "field-report": <ClipboardList size={12} />,
};

interface Props {
  attachment: EventAttachment;
  onRemove?: () => void;
}

export default function AttachmentChip({ attachment, onRemove }: Props) {
  const dataUrl = attachment.metadata.dataUrl;
  const isClickable = !!dataUrl;

  const handleClick = () => {
    if (dataUrl) window.open(dataUrl, "_blank");
  };

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] ${isClickable ? "cursor-pointer hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)] transition-colors" : ""}`}
    >
      <span className="text-[var(--color-accent)] shrink-0">
        {KIND_ICONS[attachment.kind] ?? <FileText size={12} />}
      </span>
      <span className="truncate max-w-[140px]">{attachment.title}</span>
      {isClickable && <ExternalLink size={10} className="shrink-0 opacity-60" />}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="shrink-0 text-[var(--color-text-dim)] hover:text-[var(--color-semantic-red)] transition-colors cursor-pointer"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}
