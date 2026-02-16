import type { ReactNode } from "react";
import { TYPO, cx } from "@/lib/ui/typography";

interface SectionTitleProps {
  children: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function SectionTitle({ children, icon, action }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon && (
        <span className="text-[var(--color-text-muted)]">{icon}</span>
      )}
      <h3 className={cx(TYPO.sectionHeader, "text-[var(--color-text-muted)]")}>
        {children}
      </h3>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
