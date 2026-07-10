// Shared React components for the campaign hub
// Attach to window so other script files can use them.

const { useState, useEffect, useRef } = React;

// ---------- BRAND CHROME ----------

function Cube({ size = 24, color = '#15C17B' }) {
  // Abstract 3D cube wireframe used throughout the brand
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`cube-g-${color}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.9" />
          <stop offset="1" stopColor={color} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path d="M20 4 L34 12 L34 28 L20 36 L6 28 L6 12 Z" stroke={`url(#cube-g-${color})`} strokeWidth="1.2" />
      <path d="M20 4 L20 20 M20 20 L6 12 M20 20 L34 12" stroke={color} strokeWidth="1" opacity="0.7" />
      <path d="M20 20 L20 36" stroke={color} strokeWidth="1" opacity="0.5" />
      <circle cx="20" cy="20" r="1.6" fill={color} />
    </svg>
  );
}

function Wordmark({ color = '#FAFAFA' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Cube size={22} color="#3DFFCD" />
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 300,
        fontSize: 15,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color
      }}>STELLAR<span style={{ color: '#15C17B' }}>FORGE</span></div>
    </div>
  );
}

function StatusPill({ label = 'BETA', color = '#15C17B', dot = true }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '4px 10px', border: `1px solid ${color}40`,
      background: `${color}0D`,
      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '1.5px',
      textTransform: 'uppercase', color
    }}>
      {dot && <span style={{
        width: 6, height: 6, background: color, borderRadius: '50%',
        boxShadow: `0 0 8px ${color}`, animation: 'sfPulse 2s ease-in-out infinite'
      }} />}
      {label}
    </div>
  );
}

function Bracket({ children, accent = '#15C17B', padding = 18 }) {
  const b = {
    position: 'absolute', width: 10, height: 10, borderColor: accent
  };
  return (
    <div style={{ position: 'relative', padding }}>
      <span style={{ ...b, top: 0, left: 0, borderLeft: `1px solid ${accent}`, borderTop: `1px solid ${accent}` }} />
      <span style={{ ...b, top: 0, right: 0, borderRight: `1px solid ${accent}`, borderTop: `1px solid ${accent}` }} />
      <span style={{ ...b, bottom: 0, left: 0, borderLeft: `1px solid ${accent}`, borderBottom: `1px solid ${accent}` }} />
      <span style={{ ...b, bottom: 0, right: 0, borderRight: `1px solid ${accent}`, borderBottom: `1px solid ${accent}` }} />
      {children}
    </div>
  );
}

function Readout({ label, value, accent = '#15C17B' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <div className="sf-label" style={{ color: 'var(--t3)' }}>{label}</div>
      <div className="sf-mono" style={{ color: accent, fontSize: 13 }}>{value}</div>
    </div>
  );
}

// ---------- LAYOUT ----------

function SectionHeader({ code, title, subtitle, accent = '#15C17B' }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ width: 24, height: 1, background: accent }} />
        <span className="sf-mono" style={{ color: accent, fontSize: 11, letterSpacing: '2px' }}>{code}</span>
      </div>
      <h2 className="sf-h1" style={{ fontSize: 34, margin: 0, lineHeight: 1.1 }}>{title}</h2>
      {subtitle && <p style={{ color: 'var(--t3)', margin: '10px 0 0', maxWidth: 720, fontSize: 15 }}>{subtitle}</p>}
    </div>
  );
}

function StatCard({ label, value, sub, accent = '#15C17B' }) {
  return (
    <div className="sf-panel" style={{ padding: 20, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: accent, opacity: 0.6 }} />
      <div className="sf-label">{label}</div>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 300,
        fontSize: 38, lineHeight: 1, color: 'var(--t1)',
        margin: '8px 0', letterSpacing: '0.04em'
      }}>{value}</div>
      {sub && <div className="sf-mono" style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{sub}</div>}
    </div>
  );
}

// ---------- ANIMATION KEYFRAMES ----------
const sfKeyframes = `
@keyframes sfPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes sfScan { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }
@keyframes sfFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;
if (typeof document !== 'undefined' && !document.getElementById('sf-keyframes')) {
  const s = document.createElement('style');
  s.id = 'sf-keyframes';
  s.textContent = sfKeyframes;
  document.head.appendChild(s);
}

Object.assign(window, { Cube, Wordmark, StatusPill, Bracket, Readout, SectionHeader, StatCard });
