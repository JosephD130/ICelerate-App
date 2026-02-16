"use client";

import Link from "next/link";
import { MessageSquare, ArrowRight } from "lucide-react";

export default function TranslatorPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
      <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--color-accent-dim)] flex items-center justify-center mb-4">
        <MessageSquare size={24} className="text-[var(--color-accent)]" />
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        Stakeholder Update Draft
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-md mb-6">
        The Update Draft tool is available inside each risk item under the Stakeholder Update mode. Select a risk item from the Project Control Center to draft updates for different audiences.
      </p>
      <Link
        href="/workspace"
        className="flex items-center gap-2 text-sm font-medium text-[var(--color-accent)] hover:underline"
      >
        Go to Project Control Center <ArrowRight size={14} />
      </Link>
    </div>
  );
}
