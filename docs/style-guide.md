# Guestly Style Guide

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary (Burgundy) | `#722F37` | Navbar, headings, primary buttons |
| Primary Dark | `#5a252c` | Hover states |
| Primary Light | `#8d3a44` | Subtle borders, highlights |
| Accent (Gold) | `#C9A84C` | Form focus rings, decorative accents |
| Accent Dark | `#a8893c` | Accent hover |
| Background | `#FAF8F5` | Page background (cream) |
| Card Background | `#ffffff` | Card/panel backgrounds |
| Text | `#2C2C2C` | Body text (dark charcoal) |
| Muted Text | `#6c757d` | Labels, placeholders |
| Border | `#e8e0d8` | Card and table borders |
| Late / Error | `#dc3545` | Late reservation highlights, danger badges |

All colors are defined as CSS custom properties in `src/styles.css` under `:root`.

---

## Typography

| Property | Value |
|----------|-------|
| UI Font | `system-ui, -apple-system, 'Segoe UI', sans-serif` |
| Display Font | `'Georgia', 'Times New Roman', serif` |
| Base Size | `16px` |
| Small | `14px` |
| Large | `18px` |
| XL | `24px` |
| 2XL (Page Titles) | `32px` |

- Page titles (`.page-title`) use the serif display font in `#722F37`.
- Navbar brand uses Georgia serif, 24px, bold.
- Body text uses the system UI font at 16px.
- Table headers: 14px, semi-bold, burgundy tint background.

---

## Component Patterns

### Buttons
- **Primary actions** (Book Table, Sign In, Instant Seat): `.btn-primary-custom` — burgundy background, white text.
- **Destructive actions** (Cancel): `variant="outline-danger"`.
- **Status changes** (Seat Party): `variant="success"`, (Complete): `variant="secondary"`.
- All buttons use 8px border radius.

### Status Badges
Component: `<StatusBadge status={...} />`

| Status | Bootstrap Variant | Color |
|--------|------------------|-------|
| Confirmed | `primary` | Blue |
| Seated | `success` | Green |
| Completed | `secondary` | Grey |
| Cancelled | `danger` | Red |
| Late | `danger` | Red |

### Cards
Class `.section-card` — white background, `#e8e0d8` border, 12px radius, subtle shadow.

### Forms
- Bootstrap `Form.Control` components.
- Focus state: gold (`#C9A84C`) border + glow.
- Validation feedback uses Bootstrap's built-in `.is-invalid` styling.

### Tables
Class `.reservations-table` — header row has a light burgundy tint; rows vertically aligned middle.

---

## Layout & Spacing

- **Grid**: Bootstrap 12-column grid system.
- **Page padding**: `2rem` top/bottom via `.page-container`.
- **Card padding**: Bootstrap default (`1.25rem`).
- **Gap between action buttons**: `0.5rem` (`gap-2`).
- **Max content width**: Full-width on host pages (fluid container); `540px` max on guest detail/walk-in pages.

---

## Navbar

- Background: `#722F37` (burgundy).
- Brand: Georgia serif, white, 24px.
- Right side: role badge (gold for host, cyan for guest) + username + logout button.

---

## Responsive Breakpoints

Follows Bootstrap 5 defaults:
- `xs`: < 576px
- `sm`: ≥ 576px
- `md`: ≥ 768px
- `lg`: ≥ 992px

Time slot grid collapses from 4 columns (`md`) → 3 (`sm`) → 2 (`xs`).
Action button rows use `flex-wrap` to stack on narrow screens.
