# BeHalix Frontend — Brand & Design Guide

## Brand Identity
BeHalix — "Where Interests Become Meetups". The logo is "The Latch": two interlocking hooks with a pink-to-orange-to-teal gradient, representing connection.

## Brand Colors

| Token | Hex | OKLCH | Usage |
|---|---|---|---|
| `brand-pink` | #FF4D6D | `oklch(0.65 0.25 10)` | Primary CTA, links, buttons, focus rings |
| `brand-teal` | #00C9A7 | `oklch(0.75 0.15 175)` | Secondary accent, success states, highlights |
| `brand-orange` | #FF8C42 | `oklch(0.75 0.18 55)` | Warm accent, badges, hover states |
| `brand-dark` | #0F0F1A | `oklch(0.15 0.02 280)` | Logo text, headings on light backgrounds |

### Semantic Mapping
- `--primary` → brand-pink (#FF4D6D)
- `--primary-foreground` → white
- `--accent` → brand-teal (#00C9A7)
- `--ring` → brand-pink at 40% opacity
- `--brand-gradient` → `linear-gradient(135deg, brand-pink, brand-orange, brand-teal)`

## Typography
- **Font:** "Plus Jakarta Sans" (Google Fonts), fallback: Inter, system-ui, sans-serif
- **Headings:** weight 700 (bold)
- **Body:** weight 400 (regular), 500 for UI labels
- **Sizes:** Tailwind defaults

## Component Patterns
- Use **shadcn/ui** components with Tailwind utilities
- Colors via CSS custom properties (`bg-primary`, `text-brand-pink`, etc.)
- Brand gradient for hero sections: `bg-gradient-to-br from-brand-pink via-brand-orange to-brand-teal`
- Rounded corners: `rounded-lg` (default), `rounded-full` for pills/avatars

## Logo Usage
- Component: `<BeHalixLogo size="sm|md|lg" showText={true|false} />`
- Static files: `/public/logo.svg` (full), `/public/favicon.svg` (icon only)
- "Be" renders in brand-pink, "Halix" in foreground color
- Minimum size: 24px icon height

## Do's
- Use brand colors via CSS variables or Tailwind classes
- Keep buttons and CTAs in brand-pink (`bg-primary`)
- Use brand gradient sparingly — hero sections and feature highlights
- Maintain contrast ratios (WCAG AA minimum)

## Don'ts
- Don't use raw hex values — always use CSS variables or Tailwind tokens
- Don't alter the logo gradient colors or hook shapes
- Don't use brand-pink for destructive actions (use `destructive` token)
- Don't override the font stack — use `font-sans` utility
