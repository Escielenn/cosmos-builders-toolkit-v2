// Shared class strings for small rail action buttons (Canon Capture, ledger,
// proposed-fact actions). DM Sans, 500, uppercase, 44px hit, zero radius,
// solid lines; disabled is a colour state, never opacity.

const BASE =
  "inline-flex min-h-hit items-center gap-1.5 border px-3 font-sans text-[12px] font-medium uppercase transition-colors duration-fast disabled:border-sf-disabled-line disabled:bg-sf-disabled-bg disabled:text-sf-disabled-text";

export const ACTION_QUIET = `${BASE} border-sf-line text-t2 hover:border-sf-line-emphasis hover:text-t1`;
export const ACTION_PRIMARY = `${BASE} border-sf-primary bg-sf-primary/[0.06] text-sf-primary-text hover:bg-sf-primary/[0.12]`;
