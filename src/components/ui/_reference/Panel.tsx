/**
 * StellarForge — Panel
 *
 * Revision 2. The fundamental surface.
 *
 * What changed from v1 and why:
 *   • border    sf-border (1.20:1) → sf-line (2.40:1). At 1.20:1 the panel
 *               edge was invisible, and since the planes only separated at
 *               1.04:1 there was nothing else to read the boundary from.
 *   • layers    bg-sf-surface/90 → bg-sf-surface. The /90 alpha composited
 *               against the starfield and grain, so a panel's actual colour
 *               depended on what was drifting behind it that frame.
 *   • planes    the ramp itself now steps 1.23:1 per layer, so a Panel is
 *               visible as a plane BEFORE its border is drawn.
 *
 * Three layers, never four. Modals use `elevated` above <Scrim />.
 */

import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  layer?: 'void' | 'surface' | 'elevated';
  /** Teal corner brackets. Focal panels only — one per screen. */
  bracket?: boolean;
  /** Teal underline. Decoration; never the only indicator of a state. */
  glow?: boolean;
  /** Interactive panels (clickable cards) need a 3:1 boundary, not 2.4:1. */
  interactive?: boolean;
};

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ layer = 'surface', bracket, glow, interactive, className, children, ...props }, ref) => (
    <div
      ref={ref}
      // An interactive Panel is a button in a div's clothing. Without these it
      // can never receive focus, so its focus ring could never fire.
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                (e.currentTarget as HTMLDivElement).click();
              }
            }
          : undefined
      }
      className={clsx(
        'relative rounded-none border',
        interactive ? 'border-sf-line-interactive' : 'border-sf-line',
        layer === 'void' && 'bg-sf-void',
        layer === 'surface' && 'bg-sf-surface',
        layer === 'elevated' && 'bg-sf-surface-elevated',
        interactive && [
          'transition-sf duration-base ease-sf-out cursor-pointer',
          'hover:border-sf-line-emphasis hover:bg-sf-surface-elevated',
          'focus-visible:outline focus-visible:outline-2',
          'focus-visible:outline-offset-2 focus-visible:outline-sf-focus',
        ],
        bracket && 'sf-bracket',
        glow && 'sf-panel-glow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Panel.displayName = 'Panel';

/**
 * Scrim — sits behind a modal so `elevated` still reads as raised without
 * inventing a fourth plane.
 */
export function Scrim({ onClick }: { onClick?: () => void }) {
  return (
    <div
      aria-hidden
      onClick={onClick}
      className="fixed inset-0 z-40"
      style={{ background: 'var(--sf-scrim)' }}
    />
  );
}

/* ─── Usage ───
<Panel layer="surface" className="p-sf-6">
  <div className="font-mono text-sf-mono uppercase text-t4 mb-sf-3">// SECTION LABEL</div>
  <h3 className="font-display text-sf-h3 text-t1">The content.</h3>
  <p className="text-sf-body text-t2 sf-measure">Body copy, bounded to 68ch.</p>
</Panel>

<Panel interactive onClick={open}>…</Panel>     // clickable card — keyboard-operable
<Panel bracket className="p-sf-8">…</Panel>     // the one focal moment

// Modal
<><Scrim onClick={close} />
  <Panel layer="elevated" className="fixed z-50 …">…</Panel></>
*/
