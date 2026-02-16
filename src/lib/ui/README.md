# Typography Contract

Single source of truth: `src/lib/ui/typography.ts`

## Type Ladder

| Token             | Tailwind Classes                                    | Use For                        |
|-------------------|-----------------------------------------------------|--------------------------------|
| `TYPO.pageTitle`  | `text-2xl font-semibold`                            | Page headings (24px)           |
| `TYPO.cardTitle`  | `text-base font-semibold`                           | Card/panel titles (16px)       |
| `TYPO.sectionHeader` | `text-xs font-semibold uppercase tracking-[1.2px]` | Section labels (12px)       |
| `TYPO.body`       | `text-sm`                                           | Body, buttons, inputs (14px)   |
| `TYPO.meta`       | `text-xs`                                           | Labels, meta text (12px)       |
| `TYPO.kpi`        | `text-3xl font-data font-bold`                      | KPI numbers (30px)             |
| `TYPO.badgeTiny`  | `text-[10px] leading-none`                          | Tiny badges only               |

## Usage

```tsx
import { TYPO, cx } from "@/lib/ui/typography";

// With cx helper (for combining with color/layout overrides)
<h3 className={cx(TYPO.sectionHeader, "text-[var(--color-text-muted)]")}>
  Section Title
</h3>

// With template literal (simpler cases)
<span className={`${TYPO.meta} text-[var(--color-text-dim)]`}>
  Last updated 2 hours ago
</span>
```

## Rules

- Import `TYPO.*` instead of writing raw text size classes.
- Do **not** invent new `text-[Npx]` sizes. Banned: `text-[8px]`, `text-[9px]`, `text-[11px]`, `text-[12px]`, `text-[13px]`.
- Run `npm run lint:typography` to check for violations.
- `text-[10px]` is allowed only via `TYPO.badgeTiny` for compact badges.
