---
name: Warm Clinical Health
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#4c4546'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#00668a'
  on-secondary: '#ffffff'
  secondary-container: '#40c2fd'
  on-secondary-container: '#004d6a'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002115'
  on-tertiary-container: '#479173'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#a6f2cf'
  tertiary-fixed-dim: '#8bd6b4'
  on-tertiary-fixed: '#002115'
  on-tertiary-fixed-variant: '#00513a'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 4rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies warm, soft clinical minimalism engineered for modern healthcare and online pharmacy experiences. It strikes a deliberate balance between pharmaceutical precision and empathetic, approachable hospitality. The emotional tone is calming, dependable, and disarmingly simple—eliminating the sterile intimidation of legacy medical portals and the frantic clutter of e-commerce.

Visually, the system marries high-contrast utilitarian essentials (deep charcoal text, high-density black interactive pills) with soothing, soft-touch pastel grounding surfaces. Clean silhouettes, generous macro-whitespace, and hyper-tactile rounded geometry evoke comfort, safety, and modern scientific credibility.

## Colors

The palette relies on deliberate contrast between functional mechanics and comforting environmental tones:

- **Canvas & Underlays**: The foundational application backdrop is `#F5F7F8` (soft off-white/light gray), mitigating glare while retaining clean medical clarity.
- **Core Dark / Primary Contrast**: `#000000` is reserved strictly for primary interactive anchors (solid action buttons, high-priority pills). `#111827` (deep slate charcoal) serves as the primary text and high-emphasis typography tone to ensure maximum legibility without the harshness of pitch black.
- **Support Pastels & Accents**:
  - *Butter Pastel Yellow* (`#FAF8DE` default container, `#FEFDE8` surface highlight): Applied to provider cards, consultation banners, and bottom structural footers.
  - *Soft Sky Blue* (`#E0F2FE` soft surface, `#38BDF8` accent): Signifies clinical support, delivery statuses, and telemetry.
  - *Mint Sage* (`#ECFDF5` soft surface, `#A7F3D0` / `#059669` accent): Communicates dosage safety, verification badges, prescription renewals, and organic wellness categories.
- **Borders & Separators**: Hairline structural definition uses `#E5E7EB` (neutral-200), ensuring boundaries remain quiet and non-intrusive.

## Typography

The type system is powered entirely by **Plus Jakarta Sans**, offering a clean, contemporary aesthetic with gently curved terminals and geometric foundations that soften clinical data. 

- **Headlines**: Set in weights 700 and 800 with tight negative letter tracking to provide strong typographic authority and structure over soft pastel surfaces.
- **Body**: Maintained at weight 400 with spacious line heights to maximize readability for complex dosage schedules, contraindications, and active ingredient breakdowns.
- **Labels & Microcopy**: Medium and bold weights with slightly expanded tracking for small UI chips, dosage tags (`label-sm`), and tabular medical data.

## Layout & Spacing

The layout is built around a structured, fluid 12-column grid on desktop (conforming to a maximum content width of 1280px) and collapsing to a 4-column system on mobile viewports.

- **Rhythm & Breathing Room**: The system utilizes an 8pt modular base scale. Spacing within clinical cards relies on ample internal padding (`space-lg` to `space-xl`) to establish an unhurried, reassuring cadence.
- **Breakpoints**:
  - **Mobile (< 768px)**: 4 columns, `margin: 1rem`, `gutter: 1rem`. Stacks product cards and consultation timelines into full-width units.
  - **Tablet (768px – 1023px)**: 8 columns, `margin-md: 2rem`, `gutter: 1.5rem`.
  - **Desktop (1024px+)**: 12 columns, `margin-lg: 4rem`, `gutter-lg: 2rem`. Asymmetrical splits (e.g., 7 columns for treatment overview, 5 columns for prescription selector and provider details).

## Elevation & Depth

To avoid visual noise and retain clean medical hygiene, the system shuns heavy drop shadows in favor of **low-contrast outlines** paired with **soft ambient diffusion**.

- **Structural Outlines**: All interactive containers, prescription cards, and modal dialogs rely on a crisp, 1px border (`#E5E7EB`).
- **Ambient Floor Tinting**: Depth is achieved by placing pure `#FFFFFF` or pastel containers (`#FAF8DE`, `#ECFDF5`, `#E0F2FE`) atop the neutral `#F5F7F8` baseline canvas.
- **Floating Overlays & Cart Sheets**: Overlays and dropdown menus use a micro-shadow tinted with brand neutral: `box-shadow: 0 12px 32px -4px rgba(17, 24, 39, 0.04), 0 4px 12px -2px rgba(17, 24, 39, 0.02)`. Hover states on cards translate upward by 2px with no shadow expansion, keeping the aesthetic tactile yet flat.

## Shapes

The design system embraces high-radius curvature inspired by physical pharmaceutical pills, lozenges, and smooth apothecary packaging:

- **Ultra-Rounded Modules (`rounded-3xl` / 2rem–2.5rem)**: Applied to hero banners, large clinical group containers, and provider consultation blocks.
- **Card Containers (`rounded-2xl` / 1rem–1.5rem)**: Standard envelope for medication items, dosage schedules, and health questionnaires.
- **Pill Shape (`rounded-full` / 9999px)**: Applied universally to all interactive buttons, status tags, search inputs, dosage selectors, and quantity steppers.

## Components

### Buttons
- **Primary**: Solid `#000000` fill, white `#FFFFFF` text, `rounded-full`, 48px height (`label-lg`), with horizontal padding of 24px (`space-lg`). Smooth hover transition to `#262626`.
- **Secondary / Ghost**: Pure `#FFFFFF` surface with a 1px `#E5E7EB` border, text `#111827`, and `rounded-full`.
- **Accent Action**: Tonal pastel buttons (e.g., `#ECFDF5` background with `#065F46` label) for non-critical or secondary health actions like "Refill Preview".

### Cards & Medication Units
- Base cards use `rounded-2xl` or `rounded-3xl` geometry, bordered in 1px `#E5E7EB`, with either a solid white `#FFFFFF` interior or one of the three contextual pastels:
  - **Provider & Pharmacist Cards**: Grounded in butter pastel yellow (`#FAF8DE`), featuring verified clinician signatures and consultation badges.
  - **Prescription & Safety Cards**: Grounded in mint sage (`#ECFDF5`) for active medications, refills, and clear verification states.
  - **Telemetry & Shipping**: Grounded in soft sky blue (`#E0F2FE`) for temperature-controlled dispatch and transit metrics.

### Chips & Dosage Pills
- Capsule-shaped elements (`rounded-full`) used for dosage quantities (e.g., "10mg", "Once Daily") and ingredient tags.
- Default state: `#FFFFFF` fill with 1px `#E5E7EB` border.
- Selected state: `#000000` fill with white text, or accent pastel with corresponding dark ink.

### Input Fields & Selectors
- Search and intake inputs are fully rounded (`rounded-full`) with a 52px height, backed by `#FFFFFF`, bordered with 1px `#E5E7EB`, and inset with a soft placeholder `#9CA3AF`.
- Focus state: Border transitions to `#000000` with zero blur spread to maintain crisp architectural clarity.

### Checkboxes & Radios
- Selection controls use pill-radii geometry. Radio buttons feature an outer 20px circle that houses a solid `#000000` inner disk upon activation. Checkboxes maintain a 6px curved square with a stark charcoal check icon against a solid black or mint surface.

### Dosage Timers & Intake Strips (Health-Tech Specific)
- Horizontal capsule strips segmented by time-of-day (Morning, Noon, Night), leveraging minimal borders, gentle status dots in mint sage or sky blue, and high-legibility bold counters.