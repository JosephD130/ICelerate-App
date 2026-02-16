"use client";

import Link from "next/link";
import { GitBranch, ArrowRight } from "lucide-react";

export default function DecisionPackagePage() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
      <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--color-semantic-purple-dim)] flex items-center justify-center mb-4">
        <GitBranch size={24} className="text-[var(--color-semantic-purple)]" />
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        Stakeholder Position Brief
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-md mb-6">
        The Position Brief tool is available inside each risk item under the Stakeholder Update mode. Select a risk item from the Project Control Center to generate stakeholder-adapted communications.
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
