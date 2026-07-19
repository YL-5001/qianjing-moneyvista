---
name: MoneyVista Luxe
colors:
  surface: '#f9f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f9f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f5'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e4'
  on-surface: '#1a1c1d'
  on-surface-variant: '#3f484c'
  inverse-surface: '#2f3132'
  inverse-on-surface: '#f0f0f2'
  outline: '#6f787d'
  outline-variant: '#bfc8cd'
  surface-tint: '#0c6780'
  primary: '#0c6780'
  on-primary: '#ffffff'
  primary-container: '#87ceeb'
  on-primary-container: '#005870'
  inverse-primary: '#89d0ed'
  secondary: '#005ab7'
  on-secondary: '#ffffff'
  secondary-container: '#0372e4'
  on-secondary-container: '#fefcff'
  tertiary: '#5f5e60'
  on-tertiary: '#ffffff'
  tertiary-container: '#c6c3c6'
  on-tertiary-container: '#515053'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#baeaff'
  primary-fixed-dim: '#89d0ed'
  on-primary-fixed: '#001f29'
  on-primary-fixed-variant: '#004d62'
  secondary-fixed: '#d7e2ff'
  secondary-fixed-dim: '#abc7ff'
  on-secondary-fixed: '#001b3f'
  on-secondary-fixed-variant: '#00458f'
  tertiary-fixed: '#e4e2e4'
  tertiary-fixed-dim: '#c8c6c8'
  on-tertiary-fixed: '#1b1b1d'
  on-tertiary-fixed-variant: '#474649'
  background: '#f9f9fb'
  on-background: '#1a1c1d'
  surface-variant: '#e2e2e4'
  background-white: '#FFFFFF'
  surface-gray: '#F5F5F7'
  text-primary: '#1D1D1F'
  text-secondary: '#6E6E73'
  glass-stroke: rgba(255, 255, 255, 0.4)
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 19px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1200px
  gutter: 24px
  margin-mobile: 20px
  section-gap: 80px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered to evoke a sense of clarity, prosperity, and effortless control. It targets high-net-worth individuals and meticulous financial planners who value transparency and aesthetic precision. 

The design style is **Apple-inspired Minimalism** infused with **Glassmorphism**. It prioritizes vast negative space to reduce cognitive load, allowing complex financial data to "breathe." The aesthetic is premium and institutional yet approachable, utilizing the "MoneyVista" concept to provide a clear view of one's financial future through translucent layers and high-fidelity interactions.

## Colors

The palette is anchored by **Skyblue (#87CEEB)**, used strategically for primary actions and "growth" indicators to symbolize optimism and clarity. 

- **Primary:** Skyblue serves as the brand's signature accent, used for interactive elements and data highlights.
- **Secondary:** An Apple-inspired Blue (#0071E3) is reserved for critical links and navigational prompts.
- **Backgrounds:** The interface utilizes a tiered white-on-gray approach. Pure white (#FFFFFF) is used for elevated cards, while the light gray (#F5F5F7) provides a soft foundation for the page body.
- **Typography:** Deep charcoal (#1D1D1F) ensures maximum legibility and a premium "ink-on-paper" feel against light backgrounds.

## Typography

This design system utilizes **Inter** to replicate the systematic, neutral, and highly legible characteristics of San Francisco. 

The typographic hierarchy is "top-heavy," using large display sizes for wealth totals and portfolio headers. To maintain the premium Apple-esque feel, tracking is slightly tightened on larger headlines and loosened on small labels. Body text should always prioritize line height (1.5x) to ensure the interface feels spacious and easy to scan.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for desktop to maintain a cinematic, curated experience, transitioning to a fluid model for mobile.

- **Grid:** A 12-column grid with 24px gutters. Content is typically centered in a 1200px container.
- **Rhythm:** Spacing follows an 8px base unit. Section gaps are intentionally large (80px+) to distinguish different financial modules (e.g., separating Net Worth from Asset Allocation).
- **Mobile:** Margins shrink to 20px, and complex 3-column layouts reflow into a single vertical stack.

## Elevation & Depth

Hierarchy is achieved through **Glassmorphism** and soft environmental shadows rather than heavy borders.

- **Surfaces:** Use high-diffusion backdrop blurs (20px to 40px) for navigation bars and modal overlays. 
- **Cards:** White surfaces feature a "soft-glow" shadow—very low opacity (#000000 at 4%) with a wide spread (30px to 40px) to make elements appear as if they are floating slightly above the light gray background.
- **Accents:** Use a 1px semi-transparent white border (`glass-stroke`) on cards to define edges against bright backgrounds, mimicking the reflective edge of physical glass.

## Shapes

The shape language is defined by **Rounded (2xl)** corners. 

- **Primary Containers:** Large cards and dashboard modules use 1.5rem (24px) corner radii to appear soft and modern.
- **Interactive Elements:** Buttons and input fields use 0.75rem (12px) to maintain a cohesive look without becoming full pills, which can feel too casual for wealth management.
- **Charts:** Bar charts and progress indicators must have fully rounded ends to align with the soft aesthetic.

## Components

- **Glass Cards:** The centerpiece of the UI. Backgrounds should be `rgba(255, 255, 255, 0.7)` with a `backdrop-filter: blur(20px)`.
- **Buttons:** Primary buttons use the Skyblue background with white text. They should have a subtle scale-down effect (0.98x) on click to feel tactile.
- **Progress Bars:** Use a thick (12px) track. The filled portion should use a linear gradient from Skyblue to a slightly darker blue to show "momentum."
- **Interactive Charts:** Lines should be thick (3pt) with soft "caps." Use area gradients below trend lines that fade to transparent near the X-axis.
- **Input Fields:** Minimalist design with a light gray fill (#F5F5F7) that shifts to white with a 1px Skyblue border on focus. 
- **Value Displays:** Large currency amounts should use the `display-lg` typography level with a slightly decreased font weight for the currency symbol.