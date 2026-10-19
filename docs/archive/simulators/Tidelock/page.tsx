import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TIDELOCK — Tidally Locked World Simulator · StellarForge.tools',
  description:
    'Interactive 3D simulator for tidally locked exoplanets. Explore habitable zones, atmospheric dynamics, and surface conditions around M-dwarf and K-dwarf stars. A StellarForge.tools science fiction worldbuilding instrument.',
  openGraph: {
    title: 'TIDELOCK — Tidally Locked World Simulator',
    description:
      'Interactive 3D simulator for tidally locked exoplanets. A StellarForge.tools worldbuilding instrument.',
    url: 'https://stellarforge.tools/tools/tidelock',
    siteName: 'StellarForge.tools',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TIDELOCK — Tidally Locked World Simulator',
    description:
      'Interactive 3D simulator for tidally locked exoplanets. A StellarForge.tools worldbuilding instrument.',
  },
}

export default function TidelockPage() {
  return (
    <iframe
      src="/tools/tidelock/index.html"
      title="TIDELOCK — Tidally Locked World Simulator"
      allow="fullscreen"
      style={{
        width: '100vw',
        height: '100vh',
        border: 'none',
        display: 'block',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
        background: '#09090B',
      }}
    />
  )
}
