# StellarForge.tools Comprehensive QA Audit Document

**For Claude Code Implementation**  
**Version:** 1.0  
**Date:** February 17, 2026  
**Author:** Jason D. Batt, Ph.D.

---

## Purpose

This document provides a systematic audit checklist for reviewing and correcting all UI inconsistencies, typography errors, color mismatches, form bugs, and styling deviations across stellarforge.tools. Claude Code should use this document to identify and fix issues throughout the codebase.

---

## Table of Contents

1. [Global CSS Variables & Standards](#1-global-css-variables--standards)
2. [Typography Audit](#2-typography-audit)
3. [Color System Audit](#3-color-system-audit)
4. [Button Component Audit](#4-button-component-audit)
5. [Form Elements Audit](#5-form-elements-audit)
6. [Card Components Audit](#6-card-components-audit)
7. [Panel & Modal Audit](#7-panel--modal-audit)
8. [Navigation & Header Audit](#8-navigation--header-audit)
9. [Footer Audit](#9-footer-audit)
10. [Simulator Pages Audit](#10-simulator-pages-audit)
11. [Calculator Pages Audit](#11-calculator-pages-audit)
12. [Worksheet Pages Audit](#12-worksheet-pages-audit)
13. [Dashboard & User Pages Audit](#13-dashboard--user-pages-audit)
14. [Authentication Pages Audit](#14-authentication-pages-audit)
15. [Learn Section Audit](#15-learn-section-audit)
16. [Pricing Page Audit](#16-pricing-page-audit)
17. [Homepage Audit](#17-homepage-audit)
18. [Responsive Design Audit](#18-responsive-design-audit)
19. [Accessibility Audit](#19-accessibility-audit)
20. [Content & Copy Audit](#20-content--copy-audit)

---

## 1. Global CSS Variables & Standards

### Required CSS Custom Properties

Verify these CSS variables exist in the global stylesheet (likely `globals.css` or `index.css`):

```css
:root {
  /* Core Colors */
  --color-background: #09090B;
  --color-surface: #0F0F10;
  --color-surface-alpha: rgba(15, 15, 16, 0.92);
  --color-accent-cyan: #00D4FF;
  --color-text-primary: #FAFAFA;
  --color-text-secondary: #C8C8C8;
  --color-text-muted: rgba(255, 255, 255, 0.35);
  --color-text-ghost: rgba(255, 255, 255, 0.18);
  
  /* Status Colors */
  --color-status-cyan: #00D4FF;
  --color-status-orange: #FFA500;
  --color-status-green: #2ECC71;
  --color-status-red: #E74C3C;
  --color-status-gold: #FFD43B;
  
  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-default: rgba(255, 255, 255, 0.1);
  --border-cyan: rgba(0, 212, 255, 0.2);
  --border-cyan-active: rgba(0, 212, 255, 0.3);
  
  /* Backgrounds - Interactive States */
  --bg-hover-cyan: rgba(0, 212, 255, 0.08);
  --bg-active-cyan: rgba(0, 212, 255, 0.1);
  
  /* Border Radius */
  --radius-button: 6px;
  --radius-input: 6px;
  --radius-panel: 8px;
  --radius-card: 12px;
  --radius-modal: 12px;
  
  /* Transitions */
  --transition-fast: 0.2s ease;
  --transition-medium: 0.3s ease;
  --transition-slow: 0.5s ease;
  
  /* Shadows & Effects */
  --blur-panel: blur(16px);
  --blur-modal: blur(20px);
  
  /* Fonts */
  --font-heading: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### ✅ AUDIT CHECKLIST - Global Styles

- [ ] All CSS variables defined in root
- [ ] No hardcoded color values outside variables (search for `#09090B`, `#00D4FF`, etc.)
- [ ] Font imports include all three required fonts with correct weights
- [ ] Body background is `#09090B`
- [ ] Default body font is DM Sans
- [ ] Default text color is `#FAFAFA` or `#C8C8C8`

### Required Font Import

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet">
```

---

## 2. Typography Audit

### Font Assignment Rules

| Element Type | Font Family | Weight | Size | Letter Spacing | Transform |
|---|---|---|---|---|---|
| Hero H1 | Space Grotesk | 300 | 36px (mobile) → 72px (desktop) | expanded | none |
| Page H1 | Space Grotesk | 300 | 26-32px | 4-6px | uppercase |
| Section H2 | Space Grotesk | 600-700 | 24-32px | normal | uppercase or title |
| Card/Tool H3 | Space Grotesk | 500-600 | 18-20px | normal | none |
| Body text | DM Sans | 400 | 14-16px | normal | none |
| Small labels | DM Sans | 400 | 8-8.5px | 1.2px | uppercase |
| Data values | JetBrains Mono | 300-500 | 9-10px | normal | none |
| Buttons | Space Grotesk | 500 | 8px (simulator) / 14px (site) | 1.5px | uppercase |

### ✅ AUDIT CHECKLIST - Typography

Search for and fix these common errors:

- [ ] **All headings (h1-h4)** use `font-family: 'Space Grotesk'`
- [ ] **All body text** uses `font-family: 'DM Sans'`
- [ ] **All numerical data** (prices, calculations, coordinates) uses `font-family: 'JetBrains Mono'`
- [ ] **Hero title** uses weight 300 (light), NOT bold
- [ ] **Buttons** use Space Grotesk, uppercase, correct letter-spacing
- [ ] **Labels in forms** are uppercase with 1.2px letter-spacing
- [ ] **No instances** of JetBrains Mono used for prose/paragraphs
- [ ] **No instances** of Space Grotesk used for body paragraphs
- [ ] Line height is 1.5-1.6 for body text

### Common Typography Bugs to Fix

```css
/* WRONG - Too heavy for hero */
h1 { font-weight: 700; }

/* CORRECT */
h1 { font-weight: 300; }

/* WRONG - Body font on heading */
h2 { font-family: 'DM Sans'; }

/* CORRECT */
h2 { font-family: 'Space Grotesk', sans-serif; }

/* WRONG - Heading font on data */
.price { font-family: 'Space Grotesk'; }

/* CORRECT */
.price { font-family: 'JetBrains Mono', monospace; }
```

---

## 3. Color System Audit

### Primary Color Values

| Color Name | Hex Value | Usage |
|---|---|---|
| Deep Space Background | `#09090B` | Body, canvas, page backgrounds |
| Surface | `#0F0F10` | Cards, panels |
| Surface Alpha | `rgba(15, 15, 16, 0.92)` | Floating panels with backdrop blur |
| Primary Cyan | `#00D4FF` | CTAs, active states, links, accents |
| Text Primary | `#FAFAFA` | Headings, emphasized text |
| Text Secondary | `#C8C8C8` | Body text |
| Text Muted | `rgba(255, 255, 255, 0.35)` | Labels, supporting text |
| Text Ghost | `rgba(255, 255, 255, 0.18)` | Credits, hints |

### Status Color Opacity Pattern (CRITICAL)

Every status color MUST follow this opacity structure:

```
Background:  rgba(COLOR, 0.08)
Border:      rgba(COLOR, 0.2)
Text:        COLOR at full opacity (1.0)
```

This is the "glow from within" pattern. Examples:

```css
/* Cyan status */
.status-active {
  background: rgba(0, 212, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.2);
  color: #00D4FF;
}

/* Green success */
.status-success {
  background: rgba(46, 204, 113, 0.08);
  border: 1px solid rgba(46, 204, 113, 0.2);
  color: #2ECC71;
}

/* Red danger */
.status-danger {
  background: rgba(231, 76, 60, 0.08);
  border: 1px solid rgba(231, 76, 60, 0.2);
  color: #E74C3C;
}

/* Orange warning */
.status-warning {
  background: rgba(255, 165, 0, 0.08);
  border: 1px solid rgba(255, 165, 0, 0.2);
  color: #FFA500;
}
```

### Section Header Cyan (Muted)

Section dividers use muted cyan, never full `#00D4FF`:

```css
.section-header {
  color: rgba(0, 212, 255, 0.35);
  border-bottom: 1px solid rgba(0, 212, 255, 0.06);
}
```

### ✅ AUDIT CHECKLIST - Colors

- [ ] Background color is `#09090B` on body/html
- [ ] No variation of background colors (no `#000`, `#111`, `#1a1a1a`, etc.)
- [ ] All cyan accents use exactly `#00D4FF`
- [ ] No other cyan/teal variations (check for `#0ff`, `#00ffff`, `#06b6d4`, etc.)
- [ ] Status badges follow 0.08/0.2/1.0 opacity pattern
- [ ] Active/selected states follow 0.1/0.3/1.0 pattern
- [ ] Section headers use muted cyan `rgba(0, 212, 255, 0.35)`
- [ ] Pro badges use gold (`#FFD43B`) consistently
- [ ] Error states use `#E74C3C`
- [ ] Success states use `#2ECC71`

---

## 4. Button Component Audit

### Button Variants Required

#### Primary CTA Button (Site-wide)
```css
.btn-primary {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  background: #00D4FF;
  color: #FFFFFF;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: scale(1.05);
  /* OR: filter: brightness(1.1); */
}
```

#### Secondary Button (Site-wide)
```css
.btn-secondary {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  background: transparent;
  color: #FFFFFF;
  padding: 12px 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}
```

#### Simulator/Tool Button (Compact)
```css
.btn-tool {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 8px;
  font-weight: 500;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 7px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-tool:hover {
  background: rgba(0, 212, 255, 0.08);
  border-color: rgba(0, 212, 255, 0.2);
  color: #FFFFFF;
}

.btn-tool.active,
.btn-tool:active {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.3);
  color: #00D4FF;
}
```

### ✅ AUDIT CHECKLIST - Buttons

- [ ] All buttons use Space Grotesk font
- [ ] All buttons are uppercase
- [ ] Letter spacing is 1.5px
- [ ] Border radius is 6px (not 4px, not 8px for buttons)
- [ ] Hover states use cyan glow pattern (0.08 bg, 0.2 border)
- [ ] Active states use cyan pattern (0.1 bg, 0.3 border, #00D4FF text)
- [ ] Primary buttons have solid cyan background
- [ ] Secondary buttons have transparent background with white border
- [ ] No browser default button styles showing
- [ ] Transition is 0.2s
- [ ] No mixed button styles on same page

---

## 5. Form Elements Audit

### Text Inputs
```css
input[type="text"],
input[type="email"],
input[type="password"],
input[type="number"],
input[type="search"],
textarea {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px; /* 10px for simulator compacts */
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 14px; /* 7px 10px for compact */
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s ease;
}

input:focus,
textarea:focus {
  border-color: rgba(0, 212, 255, 0.35);
}

input::placeholder,
textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}
```

### Select Dropdowns
```css
select {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px; /* 9px for simulators */
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 14px; /* 6px 8px for compact */
  border-radius: 6px;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  /* Add custom dropdown arrow */
  background-image: url("data:image/svg+xml,..."); /* cyan chevron */
  background-repeat: no-repeat;
  background-position: right 10px center;
}

select option {
  background: #0F0F10;
  color: #C8C8C8;
}
```

### Range Sliders
```css
input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 1px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #00D4FF;
  cursor: pointer;
  border: 2px solid rgba(0, 0, 0, 0.5);
}

input[type="range"]::-moz-range-thumb {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #00D4FF;
  cursor: pointer;
  border: 2px solid rgba(0, 0, 0, 0.5);
}
```

### Checkboxes
```css
input[type="checkbox"] {
  accent-color: #00D4FF;
  width: 14px; /* 11px for compact */
  height: 14px;
  cursor: pointer;
}
```

### Labels
```css
label {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px; /* 8-8.5px for simulator labels */
  font-weight: 400;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  display: block;
  margin-bottom: 6px;
}
```

### Slider Value Displays
```css
.slider-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.5);
  float: right;
}
```

### ✅ AUDIT CHECKLIST - Forms

- [ ] All inputs use DM Sans font
- [ ] All inputs have `border-radius: 6px`
- [ ] All inputs have background `rgba(255, 255, 255, 0.04)`
- [ ] All inputs have border `rgba(255, 255, 255, 0.1)`
- [ ] Focus state changes border to cyan `rgba(0, 212, 255, 0.35)`
- [ ] No browser default input styling visible
- [ ] Placeholder text is muted gray
- [ ] Slider thumbs are cyan circles (#00D4FF)
- [ ] Slider track is 2px height
- [ ] Checkboxes use cyan accent color
- [ ] Labels are uppercase with letter-spacing
- [ ] Numeric values in forms use JetBrains Mono
- [ ] Select dropdowns are styled (no browser defaults)

---

## 6. Card Components Audit

### Tool Card Standard
```css
.tool-card {
  background: #0F0F10;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 32px;
  transition: all 0.2s ease;
}

.tool-card:hover {
  transform: translateY(-4px);
  border-color: rgba(0, 212, 255, 0.15);
}

.tool-card .icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
}

.tool-card .title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 500;
  color: #FAFAFA;
  margin-bottom: 8px;
}

.tool-card .description {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
}
```

### Pro Badge
```css
.badge-pro {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: rgba(255, 212, 59, 0.15);
  color: #FFD43B;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 212, 59, 0.25);
}
```

### ✅ AUDIT CHECKLIST - Cards

- [ ] All cards use `border-radius: 12px`
- [ ] Card background is `#0F0F10`
- [ ] Card border is `rgba(255, 255, 255, 0.08)`
- [ ] Card padding is 32px
- [ ] Hover effect is translateY(-4px)
- [ ] Card titles use Space Grotesk
- [ ] Card descriptions use DM Sans
- [ ] Pro badges are gold/amber colored
- [ ] Icons are consistent size (48-64px)
- [ ] Card spacing in grids is 16-24px

---

## 7. Panel & Modal Audit

### Floating Panel (Simulators/Tools)
```css
.panel {
  background: rgba(15, 15, 16, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 8px;
  padding: 14px 18px;
}
```

### Modal Overlay
```css
.modal-overlay {
  background: rgba(9, 9, 11, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.modal-content {
  max-width: 680px;
  padding: 30px 36px;
  background: rgba(15, 15, 16, 0.98);
  border: 1px solid rgba(0, 212, 255, 0.08);
  border-radius: 12px;
}

.modal-title {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 300;
  font-size: 28px;
  letter-spacing: 4px;
}
```

### Panel Section Headers
```css
.panel-section-header {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 7.5px;
  font-weight: 600;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: rgba(0, 212, 255, 0.35);
  margin-top: 14px;
  margin-bottom: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.06);
}
```

### Custom Scrollbars
```css
.panel::-webkit-scrollbar {
  width: 3px;
}

.panel::-webkit-scrollbar-track {
  background: transparent;
}

.panel::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.12);
  border-radius: 2px;
}
```

### ✅ AUDIT CHECKLIST - Panels & Modals

- [ ] Floating panels have backdrop blur (16px)
- [ ] Modals have stronger backdrop blur (20px)
- [ ] Panel border-radius is 8px
- [ ] Modal border-radius is 12px
- [ ] Panel background uses alpha (0.92)
- [ ] Custom scrollbars on all scrollable panels
- [ ] Scrollbar thumb is cyan (0.12 opacity)
- [ ] Section headers use muted cyan
- [ ] Modal titles use Space Grotesk weight 300
- [ ] No browser default scrollbars visible

---

## 8. Navigation & Header Audit

### Navigation Bar
```css
.nav-header {
  background: rgba(9, 9, 11, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 16px 24px;
}

.nav-logo {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 500;
  font-size: 18px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #FAFAFA;
}

.nav-link {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: #FFFFFF;
}

.nav-link.active {
  color: #00D4FF;
}
```

### ✅ AUDIT CHECKLIST - Navigation

- [ ] Navigation has subtle backdrop blur
- [ ] Logo uses Space Grotesk, uppercase
- [ ] Nav links use DM Sans
- [ ] Active nav link is cyan
- [ ] Hover state brightens link color
- [ ] Mobile hamburger menu is functional
- [ ] No horizontal overflow on mobile
- [ ] Logo is clickable and returns to home

---

## 9. Footer Audit

### Footer Styling
```css
.footer {
  background: #09090B;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 60px 24px;
}

.footer-link {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
}

.footer-link:hover {
  color: #00D4FF;
}

.footer-copyright {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.25);
}
```

### ✅ AUDIT CHECKLIST - Footer

- [ ] Footer background matches body (#09090B)
- [ ] Copyright text is muted (0.25 or less)
- [ ] Copyright uses correct format: "© 2025–2026 Jason D. Batt, Ph.D."
- [ ] En-dash (–) used in year range, not hyphen (-)
- [ ] Footer links have hover states
- [ ] Social icons (if present) are properly styled

---

## 10. Simulator Pages Audit (ROGUE, ExoSky, TIDELOCK)

### Title Block Structure
```css
.simulator-title {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 300;
  font-size: 26px;
  letter-spacing: 6px;
  text-transform: uppercase;
  color: #FAFAFA;
}

.simulator-subtitle {
  font-family: 'DM Sans', sans-serif;
  font-weight: 400;
  font-size: 8px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.28);
}

.simulator-credit {
  font-family: 'DM Sans', sans-serif;
  font-size: 7px;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.12);
}

.simulator-credit a {
  color: rgba(0, 212, 255, 0.25);
}
```

### Status Badge
```css
.status-badge {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: 6px;
  transition: all 0.5s ease;
}

/* States */
.status-waiting {
  background: rgba(0, 212, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.08);
  color: rgba(0, 212, 255, 0.4);
}

.status-active {
  background: rgba(0, 212, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.2);
  color: #00D4FF;
}

.status-success {
  background: rgba(46, 204, 113, 0.08);
  border: 1px solid rgba(46, 204, 113, 0.2);
  color: #2ECC71;
  animation: pulse 2s infinite;
}

.status-danger {
  background: rgba(231, 76, 60, 0.08);
  border: 1px solid rgba(231, 76, 60, 0.2);
  color: #E74C3C;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
}
```

### Transport Controls
```css
.transport {
  display: flex;
  gap: 3px;
  align-items: center;
}

.transport button {
  flex: 1;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  text-align: center;
  margin: 0;
  padding: 7px 6px;
  letter-spacing: 0; /* Exception for transport icons */
}
```

### Data Readout
```css
.data-row {
  display: flex;
  justify-content: space-between;
  line-height: 1.9;
}

.data-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 9.5px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.3);
}

.data-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}
```

### ✅ AUDIT CHECKLIST - Simulators

For each simulator (ROGUE, ExoSky, TIDELOCK):

- [ ] Canvas background is `#09090B`
- [ ] Three fonts loaded (Space Grotesk, DM Sans, JetBrains Mono)
- [ ] Title uses Space Grotesk 300 (light weight)
- [ ] Title is uppercase with 6px letter-spacing
- [ ] STELLARFORGE.TOOLS subtitle present and styled correctly
- [ ] Credit line opacity is 0.12
- [ ] Status badge present and correctly styled
- [ ] Status badge transitions smoothly (0.5s)
- [ ] Floating panels have backdrop blur
- [ ] Panel background is `rgba(15, 15, 16, 0.92)`
- [ ] All data values use JetBrains Mono
- [ ] All labels use DM Sans uppercase
- [ ] Buttons follow simulator button pattern
- [ ] Hover states have cyan glow
- [ ] Active states have cyan text and borders
- [ ] Slider thumbs are cyan
- [ ] Custom scrollbars (3px cyan)
- [ ] Transport controls present (if time-based)
- [ ] Mobile responsive panel collapse

---

## 11. Calculator Pages Audit

### Calculator Layout
```css
.calculator-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 24px;
}

.calculator-title {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 300;
  font-size: 32px;
  margin-bottom: 8px;
}

.calculator-description {
  font-family: 'DM Sans', sans-serif;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 32px;
}
```

### Result Display
```css
.result-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 24px;
  font-weight: 500;
  color: #00D4FF;
}

.result-unit {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-left: 8px;
}

.result-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
}
```

### ✅ AUDIT CHECKLIST - Calculators

- [ ] Calculator titles use Space Grotesk 300
- [ ] Input labels are uppercase
- [ ] All numeric results use JetBrains Mono
- [ ] Result values are highlighted (cyan or large)
- [ ] Units displayed next to values
- [ ] Form validation shows errors in red
- [ ] Calculate button uses primary cyan style
- [ ] Reset/Clear button uses secondary style
- [ ] Results update without page reload
- [ ] Scientific notation formatted correctly

---

## 12. Worksheet Pages Audit

### Worksheet Structure
```css
.worksheet-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px;
}

.worksheet-section {
  margin-bottom: 48px;
}

.worksheet-section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 20px;
  font-weight: 500;
  color: #FAFAFA;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.worksheet-field-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
}

.worksheet-helper-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 4px;
}
```

### Save/Export Bar
```css
.worksheet-actions {
  position: sticky;
  bottom: 0;
  background: rgba(9, 9, 11, 0.95);
  backdrop-filter: blur(12px);
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
```

### ✅ AUDIT CHECKLIST - Worksheets

- [ ] Section titles use Space Grotesk
- [ ] Field labels have consistent styling
- [ ] Helper text is muted and smaller
- [ ] All text inputs properly styled
- [ ] Textarea expands appropriately
- [ ] Save button is primary cyan
- [ ] Export dropdown is styled
- [ ] Auto-save indicator visible (if applicable)
- [ ] Progress/completion indicator (if applicable)
- [ ] Unsaved changes warning works
- [ ] Form data persists on refresh

---

## 13. Dashboard & User Pages Audit

### Dashboard Cards
```css
.dashboard-card {
  background: #0F0F10;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 24px;
}

.dashboard-stat {
  font-family: 'JetBrains Mono', monospace;
  font-size: 32px;
  font-weight: 500;
  color: #00D4FF;
}

.dashboard-stat-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
}
```

### ✅ AUDIT CHECKLIST - Dashboard

- [ ] User name displayed correctly
- [ ] Statistics use JetBrains Mono
- [ ] Progress indicators styled correctly
- [ ] Recent activity list formatted
- [ ] Quick action buttons accessible
- [ ] Empty states have helpful messaging
- [ ] Subscription status visible
- [ ] Pro features marked appropriately

---

## 14. Authentication Pages Audit

### Auth Container
```css
.auth-container {
  max-width: 420px;
  margin: 80px auto;
  padding: 40px;
  background: #0F0F10;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.auth-title {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 300;
  font-size: 28px;
  text-align: center;
  margin-bottom: 32px;
}

.auth-divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}
```

### ✅ AUDIT CHECKLIST - Authentication

- [ ] Login/signup forms centered
- [ ] Form container has consistent styling
- [ ] Social login buttons (Google, etc.) styled
- [ ] Password visibility toggle works
- [ ] Error messages styled in red
- [ ] Success messages styled in green
- [ ] Loading states on submit buttons
- [ ] Forgot password link visible
- [ ] Terms/privacy links in footer
- [ ] Redirect after auth works correctly

---

## 15. Learn Section Audit

### Article Card
```css
.article-card {
  background: #0F0F10;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
}

.article-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.article-content {
  padding: 24px;
}

.article-tag {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #00D4FF;
  margin-bottom: 8px;
}

.article-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 500;
  color: #FAFAFA;
  margin-bottom: 8px;
}

.article-excerpt {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
}
```

### ✅ AUDIT CHECKLIST - Learn Section

- [ ] Article cards follow card standards
- [ ] Images have consistent aspect ratio
- [ ] Tags are cyan colored
- [ ] Reading time displayed (if applicable)
- [ ] Author info styled consistently
- [ ] Article body text is readable (16px)
- [ ] Code blocks styled (if present)
- [ ] Related articles section styled

---

## 16. Pricing Page Audit

### Pricing Card
```css
.pricing-card {
  background: #0F0F10;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 40px 32px;
  text-align: center;
}

.pricing-card.featured {
  border-color: rgba(0, 212, 255, 0.3);
  position: relative;
}

.pricing-card.featured::before {
  content: 'BEST VALUE';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #00D4FF;
  color: #09090B;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 600;
  padding: 4px 16px;
  border-radius: 4px;
}

.pricing-amount {
  font-family: 'JetBrains Mono', monospace;
  font-size: 48px;
  font-weight: 500;
  color: #FAFAFA;
}

.pricing-period {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
}

.pricing-feature {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.pricing-feature svg {
  color: #2ECC71;
  margin-right: 8px;
}
```

### ✅ AUDIT CHECKLIST - Pricing

- [ ] Prices use JetBrains Mono
- [ ] Featured plan has cyan border
- [ ] Feature lists aligned
- [ ] Checkmarks are green
- [ ] CTA buttons are prominent
- [ ] Monthly/yearly toggle works (if present)
- [ ] Savings percentage displayed
- [ ] FAQ section accessible
- [ ] Guarantee/refund info visible

---

## 17. Homepage Audit

### Hero Section
```css
.hero {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 24px;
}

.hero-title {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 300;
  font-size: 48px; /* mobile */
  font-size: clamp(48px, 8vw, 72px); /* fluid */
  line-height: 1.1;
}

.hero-title .highlight {
  color: #00D4FF;
}

.hero-subtitle {
  font-family: 'DM Sans', sans-serif;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  max-width: 600px;
  margin: 24px auto 40px;
}

.hero-cta {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}
```

### Tool Grid Section
```css
.tools-section {
  padding: 80px 24px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
```

### ✅ AUDIT CHECKLIST - Homepage

- [ ] Hero title uses Space Grotesk 300
- [ ] "THAT FEEL REAL" (or similar) is cyan
- [ ] CTA buttons are prominent
- [ ] Tool grid displays correctly
- [ ] Tool icons are colorful and consistent
- [ ] Pro badges visible on premium tools
- [ ] Testimonials styled (if present)
- [ ] Beta banner visible (if applicable)
- [ ] Newsletter signup styled
- [ ] Social proof elements visible

---

## 18. Responsive Design Audit

### Breakpoints
```css
/* Mobile first */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### ✅ AUDIT CHECKLIST - Responsive

- [ ] No horizontal overflow on mobile
- [ ] Text is readable on mobile (min 14px body)
- [ ] Touch targets are 44px minimum
- [ ] Navigation collapses to hamburger
- [ ] Cards stack on mobile
- [ ] Hero text scales down appropriately
- [ ] Modals are scrollable on mobile
- [ ] Simulator panels collapse appropriately
- [ ] Forms are usable on mobile
- [ ] Tables scroll horizontally if needed

---

## 19. Accessibility Audit

### ✅ AUDIT CHECKLIST - Accessibility

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] Focus states visible on all interactive elements
- [ ] Skip links present (or navigation is keyboard accessible)
- [ ] Modal traps focus correctly
- [ ] ARIA labels on icon-only buttons
- [ ] Error messages associated with inputs
- [ ] Headings in correct order (h1 → h2 → h3)
- [ ] Links are distinguishable from text

---

## 20. Content & Copy Audit

### ✅ AUDIT CHECKLIST - Content

- [ ] Copyright year is "2025–2026" (with en-dash)
- [ ] No lorem ipsum or placeholder text
- [ ] Consistent capitalization (Title Case for headings)
- [ ] No typos in navigation items
- [ ] Error messages are helpful
- [ ] Empty states have guidance
- [ ] Loading states have feedback
- [ ] Tooltips are consistent
- [ ] All links work (no 404s)
- [ ] Meta titles and descriptions present

---

## Implementation Priority

### P0 - Critical (Fix Immediately)
1. Global color variables not defined
2. Wrong fonts used on headings
3. Browser default form styling visible
4. Broken functionality (forms, navigation)
5. Missing accessibility labels

### P1 - High (Fix This Sprint)
1. Typography weight inconsistencies
2. Button state styling incorrect
3. Status badge opacity pattern wrong
4. Missing hover/focus states
5. Mobile layout issues

### P2 - Medium (Fix Next Sprint)
1. Scrollbar styling
2. Animation timing inconsistencies
3. Minor spacing issues
4. Inconsistent icon sizes
5. Loading state polish

### P3 - Low (Fix When Possible)
1. Micro-interaction polish
2. Performance optimizations
3. Advanced responsive refinements
4. Progressive enhancement features

---

## How to Use This Document

1. **Global fixes first**: Start with Section 1 (CSS Variables) to establish the foundation
2. **Component by component**: Work through each section systematically
3. **Search codebase**: Use search to find hardcoded values that should use variables
4. **Test each change**: Verify fixes don't break other components
5. **Cross-browser check**: Test in Chrome, Firefox, Safari
6. **Mobile testing**: Verify all changes on actual mobile devices

---

*Document version: 1.0*  
*Last updated: February 17, 2026*  
*For stellarforge.tools by Jason D. Batt, Ph.D.*
