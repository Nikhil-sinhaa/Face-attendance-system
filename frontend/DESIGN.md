# FaceVPlus design system — "The Register"

A classroom roll book: warm graphite paper, ruled lines, one marker accent.
All tokens live in `src/index.css` (`@theme`). Existing Tailwind colour names are remapped,
so utilities like `bg-slate-900` or `text-indigo-400` resolve to the values below.

## Colour
| Role | Token | Notes |
|---|---|---|
| Page / surface / raised | `slate-950` / `slate-900` / `slate-800` | Depth from surface steps and rules, not shadows |
| Rules | `slate-800` (quiet), `slate-700`/`600` (controls) | |
| Text | `slate-50` heading, `slate-100` body, `slate-300` secondary, `slate-400` meta | `slate-500` is placeholder-only |
| Primary action / focus | `indigo-*` → marker amber (`indigo-400` fills, `indigo-300` hover) | Dark text on amber (`slate-950`) |
| Teacher side | `pink-*` → terracotta | Portal label, subject codes |
| Semantic | `emerald` present, `red` absent/error, `amber` warning | Always paired with text or icon, never colour alone |

## Type
- Display: Bricolage Grotesque (`font-display`) — headings, tight tracking, `text-wrap: balance`.
- Body: Public Sans (`font-sans`).
- Data: JetBrains Mono (`font-mono`, `.num`) — IDs, codes, counts, timestamps; tabular figures.
- Scale: eyebrow `0.6875rem` mono caps · body `0.875–1rem` · h3 `1.125–1.25rem` · h1 `1.875–4.25rem` responsive.

## Space, layout, breakpoints
- 4px base unit (`--spacing`). Section rhythm: 8 (32px) between blocks, 4–6 inside.
- Page max width `--container-page` (80rem); prose `36rem`; forms `32rem`.
- Breakpoints: sm 640 · md 768 · lg 1024 (two-column layouts start) · xl 1280.

## Shape and depth
- Radii: controls 6px (`rounded-md`), surfaces 8px (`rounded-lg`). No pill buttons.
- Shadows: none, except dialogs (`shadow-2xl`). No glow, no glass blur.

## Components (`src/components/common`)
`Button` (primary · secondary · tertiary · outline · danger · ghost; sm/md/lg; loading), `Input`, `Badge`,
`Modal` (focus trap, Esc, focus return), `Notice` (error/success), `LoadingSpinner`, `EmptyState`,
`PageHeader`, `AuthShell`, `Logo`. CSS helpers: `.eyebrow`, `.num`, `.sheet`, `.field-select`, `.rise`.

## Interaction
- Focus: 2px amber outline, 2px offset, on every interactive element.
- Hover: colour/border change only (≤150ms). Press: 1px translate.
- Motion: one entrance (`.rise`, 500ms, staggered ≤ 60ms) and nothing looping.
  `prefers-reduced-motion` disables all of it.
- Disabled buttons are neutral grey, never a dimmed accent.
