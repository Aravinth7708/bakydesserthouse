# Baky Dessert House — Dashboard UI Replica

Build a pixel-faithful static replica of the Figma dashboard as the app's home page, using the existing TanStack Start + React + TypeScript + Tailwind v4 stack.

> Note: The project runs on TanStack Start (Lovable's supported stack), not Next.js. The rendered UI will match the Figma exactly; only the framework underneath differs.

## Visual spec (from Figma)

```text
┌───────────┬─────────────────────────────────────────────┐
│  SIDEBAR  │  Topbar: "Dashboard"      [Last 7 Days v][🔔][⚙][○]│
│  (321px)  ├─────────────────────────────────────────────┤
│  Logo     │  ┌ Sales Overview ──────┐  ┌ Top Selling ──┐ │
│  Baky...  │  │ ₹1,800  +12.5%       │  │   ◯ donut     │ │
│  Mgmt     │  │  bar chart (7 bars)  │  │   75 Total    │ │
│           │  └──────────────────────┘  └──────────────┘ │
│ ▸Dashboard│  ┌Today ┐┌Today ┐┌ blank ┐┌ Low Stock ┐    │
│  Orders   │  │Orders││Rev.  ││       ││ 2 Action  │    │
│  Menu     │  └──────┘└──────┘└───────┘└───────────┘    │
│  Inventory│  ┌ Recent Orders ───────┐  ┌ Low Inventory┐ │
│  Help     │  │ table headers        │  │ 3 progress   │ │
│           │  └──────────────────────┘  └ bars         │ │
│  Logout   │                                             │
└───────────┴─────────────────────────────────────────────┘
```

### Colors (exact from Figma)
- Page background: `#FFFFFF`
- Sidebar / topbar background: `#FAFAFA`
- Cards / pills: `#EFEFEF`
- Active nav pill: `#EFEFEF` (rounded 13px)
- Text primary: `#000000`, secondary/muted: `#686868`, inactive icons: `#8B8B8B`
- Positive stat green: `#0AC655`, alert red: `#FF0000`
- Bars light: `#EBCCF5`, bars highlighted (Fri/Sat): `#D5A5E3`
- Donut ring / progress fill track: `#686868` ring, `#D9D9D9` track, `#D5A5E3` fill
- Card radius 15px, pills 12–13px, bar radius 7px top

### Typography
- `Anek Latin` (Google Fonts) loaded via `<link>` in `src/routes/__root.tsx` head; set `--font-sans` in `@theme`.

## Files to change

1. **`src/routes/__root.tsx`** — add Google Fonts `<link>` (preconnect + Anek Latin 300/400/500) to the root `head()`; update `title`/`description`/og tags to "Baky Dessert House — Dashboard".

2. **`src/styles.css`** — set `--font-sans: "Anek Latin", sans-serif;` in `@theme`; optionally add the custom hex accent tokens (`--stat-green`, `--bar-light`, `--bar-strong`) as CSS vars for reuse.

3. **`src/routes/index.tsx`** — replace placeholder with the dashboard `Index` component composed of the sections below.

4. **`src/components/dashboard/`** — small focused components:
   - `Sidebar.tsx` — logo mark (round green "B" avatar), title/subtitle, nav items (Dashboard active, Orders, Menu, Inventory, Help Center) with lucide icons (`LayoutGrid`, `ShoppingCart`, `UtensilsCrossed`, `FileCheck`, `Info`), Logout at bottom (`LogOut`).
   - `Topbar.tsx` — "Dashboard" title, "Last 7 Days" pill w/ chevron, bell + settings pill buttons, avatar circle.
   - `SalesOverviewCard.tsx` — heading, ₹1,800, "Last 7 Days +12.5%", 7 CSS bars (Mon–Sun) at exact relative heights, day labels.
   - `TopSellingCard.tsx` — CSS donut ring (conic/ border ring) with "75 / Total Sold" centered, legend dots (Triple Chocolate Brownie, Matlida).
   - `StatCards.tsx` — Today Orders (75, +4.25%), Today Revenue (1,030, +8.16%), one empty card, Low Stock Items (2, "Action required").
   - `RecentOrdersCard.tsx` — heading + table header row (Order # / Product / Amount / Status) with divider line; empty body per Figma.
   - `LowInventoryCard.tsx` — heading + 3 rows (Waffle flour 5/50, Brownie parcel plate 2/10, Dark compound 1/10) each with a `#D9D9D9` track + `#D5A5E3` fill proportional to the ratio.

## Layout approach
- Use responsive fl/grid Tailwind layout (sidebar `w-[321px]` fixed, main area flex-1) rather than absolute pixel positioning, so it looks correct and stays maintainable while matching proportions. Bars/donut/progress widths use the exact ratios from the Figma pixel values.
- All values hardcoded (static replica) as chosen.

## Verification
- Run typecheck/build; then screenshot the running preview at 1280px+ width via Playwright and compare against the Figma image for layout, colors, and spacing.
