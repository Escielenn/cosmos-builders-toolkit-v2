/**
 * StellarForge — Button component (reference port)
 *
 * Two variants: primary (teal fill) and ghost (outline).
 * Zero radius. Uppercase. Tracked. 180ms motion.
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          // Base
          'inline-flex items-center gap-2 font-sans font-medium uppercase',
          'tracking-[1.2px] rounded-none border transition-base ease-sf-out',
          'cursor-pointer no-underline select-none',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',

          // Size
          size === 'sm' && 'text-[11px] px-4 py-2',
          size === 'md' && 'text-[13px] px-[22px] py-3',
          size === 'lg' && 'text-[14px] px-7 py-4',

          // Variant: Primary
          variant === 'primary' && [
            'bg-sf-teal border-sf-teal text-[#08110C]',
            'hover:shadow-sf-glow-teal hover:-translate-y-[1px]',
          ],

          // Variant: Ghost
          variant === 'ghost' && [
            'bg-transparent border-sf-border-strong text-t1',
            'hover:border-sf-teal hover:text-sf-teal-bright hover:shadow-sf-inset-teal',
          ],

          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

/* ─── Usage ───
<Button>Initialize</Button>
<Button variant="ghost">Abort</Button>
<Button variant="primary" size="lg">Launch →</Button>
*/
