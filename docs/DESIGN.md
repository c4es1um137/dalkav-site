# Design system: "Linear / Modern"

Deep near-blacks (`#050506`, never pure black) with soft pools of indigo
light; precise, fast, crafted like premium developer tools. Dark only.

All tokens are defined once in `src/styles/global.css` under `@theme`, so each
is also a CSS custom property (`--color-…`, `--shadow-…`, `--ease-expo-out`)
and a Tailwind utility (`bg-background-base`, `text-foreground-muted`,
`shadow-card`, …).

## Colour tokens

| Token | Value | Usage |
|---|---|---|
| `background-deep` | `#020203` | Footer, deepest layers |
| `background-base` | `#050506` | Page canvas |
| `background-elevated` | `#0a0a0c` | Elevated surfaces |
| `surface` / `surface-hover` | `rgba(255,255,255,0.05)` / `0.08` | Cards, containers |
| `foreground` | `#EDEDEF` | Primary text (≈ 15:1 on base) |
| `foreground-muted` | `#8A8F98` | Body text, metadata (≈ 6:1 on base) |
| `foreground-subtle` | `rgba(255,255,255,0.60)` | Tertiary text |
| `foreground-prose` | `#C6C9D0` | Long-form body text |
| `accent` | `#5E6AD2` | Buttons, glows (**never text**) |
| `accent-bright` | `#6872D9` | Hover accent |
| `accent-glow` | `rgba(94,106,210,0.3)` | Glows |
| `accent-text` | `#6872D9` | Accent text on the base canvas (≈ 4.85:1) |
| `accent-text-raised` | `#7C85E3` | Accent text on cards/code; focus ring (≈ 5.0:1) |
| `border-default` / `border-hover` / `border-accent` | white 6% / 10%, accent 30% | Hairlines |
| `input` | `#0F0F12` | Input background |
| `code-*` | see below | Syntax highlighting |
| `selection` | `rgba(94,106,210,0.35)` | `::selection` |
| `test-banner-bg` / `-fg` | `#F5B83D` / `#050506` | TEST banner |

Code tokens: `code-bg #0A0A0C`, `code-border rgba(255,255,255,0.06)`,
`code-fg #EDEDEF`, `code-comment #8A8F98`, `code-keyword #9EA5F0`,
`code-string #9FD4B0`, `code-number #E6B98A`, `code-function #C9CDF7`,
`code-type #8CC8E8`, `code-punctuation #A1A5AD`, `code-inline-bg
rgba(255,255,255,0.06)`, `code-line-highlight rgba(94,106,210,0.12)`.
`src/styles/code-theme.ts` builds the Shiki theme from these and swaps Shiki's
inline colours for `tok-*` classes (the CSP forbids `style` attributes).

## Typography

Inter Variable (normal + italic) and JetBrains Mono Variable, self-hosted by
Astro's Fonts API (Fontsource, `latin` + `latin-ext`, which covers ç ğ ı İ ö ş
ü). Only the Inter latin normal file is preloaded; `font-display: swap` with
metric-matched fallbacks.

| Level | Classes |
|---|---|
| Display (hero) | `text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-semibold tracking-[-0.03em]` |
| H1 | `text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight` |
| H2 | `text-3xl md:text-4xl font-semibold tracking-tight` |
| H3 | `text-xl md:text-2xl font-semibold tracking-tight` |
| Body Large | `text-lg md:text-xl` |
| Body | `text-sm`–`text-base`, `leading-relaxed` |
| Label | `.label-text` (mono, `text-xs`, `tracking-widest`, uppercase via CSS, so `lang="tr"` gives "İLETİŞİM") |

Gradient text is two custom utilities with plain colour stops:
`text-gradient-headline` (white → 95% → 70%) and `text-gradient-accent`
(`#6872D9 → #818CF8 → #6872D9`, large text only, shimmer 2 × 2.5 s then
stops). Both set a solid `color` first, go transparent only inside
`@supports (background-clip: text)`, and have a `forced-colors` fallback.

## Surfaces and components

- **Cards** (`.card`): gradient surface white 8% → 2% on `#0B0B0D`, 1px
  white-6% border, `rounded-2xl`, top glow line, three-layer shadow.
  `.card-interactive` lifts 4px, brightens the border, adds the hover shadow
  and the gradient border (mask + `-webkit-mask-composite: xor`). Variants:
  `.card-glass`, `.card-gradient`. Mouse spotlight: `::before` radial
  gradient (300px, accent 15%) at `--spot-x/--spot-y`, set via CSSOM by
  `src/scripts/effects.ts` on fine pointers only.
- **Buttons** (`.btn` + `.btn-primary | .btn-secondary | .btn-ghost`,
  `.btn-sm`): `rounded-lg`, min height 44px. The primary stays `#5E6AD2` on hover
  (white on `#6872D9` fails contrast); hover adds glow, a brighter border and a
  shine sweep. Active: `scale(0.98)`.
- **Pills/tags** (`.pill`): `rounded-full`, accent-30% border, mono `text-xs`,
  `accent-text-raised`; tags render as `#tag`.
- **Bento** (`.bento`): 1 column < 768px, 2 columns ≥ 768px, 6 columns ≥ 1024px
  with `minmax(180px, auto)` rows. `src/lib/bento.ts` places cards (hero 4×2,
  tall 2×2, wide 3, standard 2) and fills every row asymmetrically using
  static `lg:col-*`/`lg:row-*` classes.
- **Prose** (`.prose`, `src/styles/prose.css`): 68ch, `foreground-prose`,
  underlined accent links, Label-style table headers, focusable labelled scroll
  regions for tables and code blocks.

## Background and motion

- Ambient layers (`AmbientBackground.astro`): radial base gradient, SVG noise
  at 1.5%, four blurred blobs (two below 768px) animating `transform` only, a
  64px grid at 2%. One fixed container with `contain: strict`.
- Easing `cubic-bezier(0.16, 1, 0.3, 1)` everywhere; quick 200ms, standard
  300ms, entrance 600ms; hover moves at most 4px; no bounce.
- Hero parallax (home only): pure CSS scroll-driven animation on a view
  timeline named on the hero section, over the first half of the hero leaving
  the viewport: opacity 1→0, scale 1→0.95, y 0→100px.
- Entrance reveal: only for elements below the fold; content is visible by
  default and nothing is hidden if JS fails.
- **Motion off** = `prefers-reduced-motion: reduce` **or** the footer "Pause
  animations" switch (`#motion-pause`, works without JS via `:has()`; JS
  persists it). Both set `--play: paused` (blobs freeze visibly, shimmer stops)
  and `--lift: 0px`, and disable parallax and reveal.

## Overrides that win over the original spec

1. Dark only (`color-scheme: dark`).
2. Accent-coloured text uses `accent-text` / `accent-text-raised`, never
   `#5E6AD2`; prose links are underlined.
3. Primary buttons keep `#5E6AD2` on hover.
4. Focus ring: 2px `#7C85E3` with a 2px `#050506` offset on `:focus-visible`;
   `scroll-padding-top` equals the header height plus 1rem.
5. Placeholder text `#8A8F98`.
6. Accent gradient text only on large text; shimmer ≤ 2 cycles.
7. Gradient text has solid-colour and forced-colours fallbacks.
8. Translucent surfaces behind text use `rgba()` values, never `/NN` opacity
   modifiers (those compile to `color-mix()`); `body` colours are plain hex.
9. Bento rows `minmax(180px, auto)`; headings `overflow-wrap: break-word` and
   `text-wrap: balance`.
10. "Pause animations" switch (WCAG 2.2.2).
11. Tailwind v4 names (`bg-linear-to-*` etc.); `container` redefined with
    `@utility`.

## Anti-patterns

Flat backgrounds; `#000000`; pure white body text; hover moves over 8px;
uniform grids; harsh borders; accent everywhere; spring easing; accent buttons
without glow; inline `style` attributes.
