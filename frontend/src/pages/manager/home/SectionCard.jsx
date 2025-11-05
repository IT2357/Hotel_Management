/**
 * Section Card Component
 * Reusable card with variant styling
 */

import { cx, SECTION_BASE_CLASS, SECTION_VARIANTS, SECTION_GLOW } from "./constants";

export const SectionCard = ({ variant, className = "", children }) => (
  <div
    className={cx(
      SECTION_BASE_CLASS,
      SECTION_VARIANTS[variant],
      "relative overflow-hidden",
      className
    )}
  >
    <div
      className={cx(
        "pointer-events-none absolute inset-0 opacity-20 blur-2xl",
        SECTION_GLOW[variant]
      )}
    />
    <div className="relative z-10">{children}</div>
  </div>
);
