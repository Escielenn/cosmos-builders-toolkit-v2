/**
 * StellarForge — Starfield + Grain background layer
 *
 * Mount ONCE at the root of the app (e.g. in layout.tsx / App.tsx) so every
 * page inherits the void + starfield + grain texture.
 */

export function StellarBackground() {
  return (
    <>
      {/* Starfield: fixed, behind everything */}
      <div aria-hidden className="sf-starfield" />
      {/* Grain: fixed overlay, 3% opacity, on top of starfield */}
      <div aria-hidden className="sf-grain" />
    </>
  );
}

/* ─── Usage ───
// app/layout.tsx (Next.js) or src/main.tsx (Vite)
import { StellarBackground } from '@/components/StellarBackground';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-sf-void text-t2 font-sans min-h-screen relative">
        <StellarBackground />
        <div className="relative z-[2]">{children}</div>
      </body>
    </html>
  );
}
*/
