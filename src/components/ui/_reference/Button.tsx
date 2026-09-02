/**
 * StellarForge — Button
 *
 * Revision 2. Ported to the derived token set.
 *
 * What changed from v1 and why:
 *   • ghost border  sf-border-strong (1.45:1) → sf-line-interactive (3.10:1)
 *     A ghost button's LABEL measured 18.5:1 while its BOUNDARY measured
 *     1.45:1. It wasn't unreadable — it didn't look like a button.
 *   • disabled      opacity-40 (2.21:1) → explicit sf-disabled-* tokens.
 *     Opacity multiplies against whatever is behind it and guarantees nothing.
 *   • hit target    every size now clears 44px. `sm` was ~30px.
 *   • focus         explicit :focus-visible ring. v1 had hover states and no
 *                   focus state at all, which made the app unusable by keyboard.
 *   • label colour  hardcoded #08110C → sf-on-primary (solved, 8.16:1 in default).
 *   • role vs meaning  primary uses sf-primary, the USER-CHOSEN accent, not
 *                   sf-teal. Teal is what Integration means; primary is what
 *                   "the action" means. 70 themes swap the former; the latter
 *                   never moves. See 13-THE-LIFT.md §0.
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger' | 'quiet';
  size?: 'sm' | 'md' | 'lg';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center gap-2',
        'font-sans font-medium uppercase tracking-[0.06em]',
        'rounded-none border transition-sf duration-base ease-sf-out cursor-pointer select-none',
        'min-h-hit',                                  // WCAG 2.5.8
        'focus-visible:outline focus-visible:outline-2',
        'focus-visible:outline-offset-2 focus-visible:outline-sf-focus',

        // Disabled is a colour, never opacity.
        'disabled:cursor-not-allowed disabled:shadow-none',
        'disabled:bg-sf-disabled-bg disabled:border-sf-disabled-line',
        'disabled:text-sf-disabled-text disabled:translate-y-0',

        size === 'sm' && 'text-[13px] px-sf-4 py-sf-2',
        size === 'md' && 'text-[14px] px-sf-6 py-sf-3',
        size === 'lg' && 'text-[15px] px-sf-8 py-sf-4',

        // Teal fill. sf-on-teal is solved at 8.16:1 against the fill.
        variant === 'primary' && [
          'bg-sf-primary border-sf-primary text-sf-on-primary',
          'hover:bg-sf-primary-bright hover:border-sf-primary-bright',
          'hover:shadow-sf-glow-teal hover:-translate-y-[1px]',
        ],

        // Outline. The border is the affordance, so it must clear 3:1.
        variant === 'ghost' && [
          'bg-transparent border-sf-line-interactive text-t1',
          'hover:border-sf-primary hover:text-sf-primary-text',
        ],

        // Destructive. Crimson canonical for the border, -text for the label —
        // the canonical hue fails 4.5:1 as body-size text on elevated.
        variant === 'danger' && [
          'bg-transparent border-sf-crimson text-sf-crimson-text',
          'hover:bg-sf-crimson hover:text-sf-on-crimson',
        ],

        // Lowest emphasis. Still bounded — no invisible buttons.
        variant === 'quiet' && [
          'bg-transparent border-transparent text-t3',
          'hover:border-sf-line-interactive hover:text-t1',
        ],

        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = 'Button';

/* ─── Usage ───
<Button>Initialize</Button>
<Button variant="ghost">Abort</Button>
<Button variant="danger" size="sm">Delete World</Button>

Icon-only buttons MUST carry an accessible name:
<Button aria-label="Close panel" className="px-sf-3"><XIcon /></Button>

One primary button per screen.
*/
