/**
 * StellarForge — Panel component (reference port)
 *
 * The fundamental surface. Three layers — void / surface / elevated — never
 * stack four deep. Backdrop blur, 1px subtle border, optional bracket corners.
 */

import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  layer?: 'void' | 'surface' | 'elevated';
  bracket?: boolean;   // adds teal corner brackets (focal panels only)
  glow?: boolean;      // teal underline pulse
};

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ layer = 'surface', bracket, glow, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'relative border border-sf-border backdrop-blur-sf-panel rounded-none',
          layer === 'void'      && 'bg-sf-void',
          layer === 'surface'   && 'bg-sf-surface/90',
          layer === 'elevated'  && 'bg-sf-surface-elevated',
          bracket && 'sf-bracket',
          glow && 'sf-panel-glow',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Panel.displayName = 'Panel';

/* ─── Usage ───
<Panel layer="surface" className="p-6">
  <div className="font-heading text-[12px] tracking-wide uppercase text-t3 mb-3">
    SECTION LABEL
  </div>
  <h3 className="font-display text-sf-h3 text-t1">The content.</h3>
</Panel>

<Panel bracket glow className="p-8">
  <h2 className="font-display text-sf-h2 text-t1">Focal moment.</h2>
</Panel>
*/
