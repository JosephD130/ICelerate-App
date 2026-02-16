"use client";

import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

export default function RfiPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
      <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--color-semantic-blue-dim)] flex items-center justify-center mb-4">
        <FileText size={24} className="text-[var(--color-semantic-blue)]" />
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        RFI Generator
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-md mb-6">
        The RFI Generator is available inside each risk item under the Contract Position mode. Select a risk item from the Project Control Center to generate an RFI.
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
