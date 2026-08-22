/**
 * StellarForge — Field primitives: Label, Input, Select, Textarea, Tag, Hint, FieldError
 *
 * NEW in revision 2. v1 shipped no form primitives, so every tool page grew
 * its own — which is how the 11px / 0.18em / 2.45:1 mono eyebrow ended up
 * being the label style across 27 tools.
 *
 * Rules encoded here:
 *   • Labels are 12px / 0.12em / t4 — never 11px, never tracked wider.
 *   • Inputs carry sf-line-interactive (3.10:1). A field boundary is an
 *     affordance and must clear WCAG 1.4.11.
 *   • font-size 16px. Below 16px, iOS Safari zooms the viewport on focus.
 *   • min-height 44px.
 *   • Placeholders are t3 minimum. A placeholder is content until typed.
 *   • Disabled uses colour tokens, never opacity.
 *   • Errors carry a `//` prefix as well as crimson — colour is never the
 *     only signal.
 *   • Accent text uses the -text stop; canonical accents fail 4.5:1 at body size.
 */

import {
  InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes,
  LabelHTMLAttributes, ReactNode, forwardRef, useId,
} from 'react';
import { clsx } from 'clsx';

const CONTROL = clsx(
  'w-full rounded-none min-h-hit px-sf-4 py-sf-3',
  'bg-sf-surface border border-sf-line-interactive',
  'text-t1 text-[16px] font-sans',
  'placeholder:text-t3',
  'transition-sf duration-fast ease-sf-out',
  'hover:border-sf-line-emphasis',
  'focus-visible:outline focus-visible:outline-2',
  'focus-visible:outline-offset-2 focus-visible:outline-sf-focus',
  'disabled:bg-sf-disabled-bg disabled:border-sf-disabled-line',
  'disabled:text-sf-disabled-text disabled:cursor-not-allowed',
  'aria-[invalid=true]:border-sf-crimson'
);

export function Label({ className, children, ...p }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={clsx('block font-mono text-sf-mono uppercase text-t4 mb-sf-2', className)}
      {...p}
    >
      {children}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...p }, ref) => <input ref={ref} className={clsx(CONTROL, className)} {...p} />
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...p }, ref) => (
    <textarea ref={ref} className={clsx(CONTROL, 'min-h-[120px] leading-[1.6]', className)} {...p} />
  )
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...p }, ref) => (
    <select ref={ref} className={clsx(CONTROL, 'appearance-none pr-sf-10', className)} {...p}>
      {children}
    </select>
  )
);
Select.displayName = 'Select';

/** Helper text. t3, never t4 — this is content, not a micro label. */
export function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-sf-2 text-sf-small text-t3 sf-measure">{children}</p>;
}

/** Error. Crimson -text stop plus a `//` prefix, so colour is not the only signal. */
export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-sf-2 font-mono text-sf-mono text-sf-crimson-text">
      // {children}
    </p>
  );
}

const TAG_TONES = {
  teal: 'border-sf-teal text-sf-teal-text',
  amber: 'border-sf-amber text-sf-amber-text',
  azure: 'border-sf-azure text-sf-azure-text',
  violet: 'border-sf-violet text-sf-violet-text',
  emerald: 'border-sf-emerald text-sf-emerald-text',
  stellar: 'border-sf-stellar text-sf-stellar-text',
  crimson: 'border-sf-crimson text-sf-crimson-text',
  neutral: 'border-sf-line text-t3',
} as const;

/** The only 2px radius in the system. Canonical border, -text label. */
export function Tag({
  tone = 'neutral', children, className,
}: { tone?: keyof typeof TAG_TONES; children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-sf-tag border bg-transparent',
        'px-sf-2 py-[3px] font-mono text-sf-mono uppercase',
        TAG_TONES[tone], className
      )}
    >
      {children}
    </span>
  );
}

/** Label + control + hint/error, wired with the right aria plumbing. */
export function Field({
  label, hint, error, children,
}: { label: string; hint?: ReactNode; error?: ReactNode; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="mb-sf-6">
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
      {hint && !error && <Hint>{hint}</Hint>}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

/* ─── Usage ───
<Field label="Planet Name" hint="Used across every tool in this world.">
  {(id) => <Input id={id} placeholder="Enter designation" />}
</Field>

<Field label="Surface Gravity" error="Parameters outside operational range.">
  {(id) => <Input id={id} aria-invalid defaultValue="42" />}
</Field>

<Tag tone="teal">CANON</Tag> <Tag tone="amber">PROPOSED</Tag>
*/
