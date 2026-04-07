# Navigable Web Treemap Browser — Design Spec

Date: 2026-04-08
Status: Draft
Owner: @badday
Governs: ADR-0072 Phase 2
Related: `docs/plans/2026-04-07-shared-cellar-snapshots-design.md`

---

## 1. Scope

Phase 2 of ADR-0072: transform the static share preview at `vynr.app/s/{shareId}` into a navigable, drill-down treemap browser.

### Ships

- Country-level grouping as default top level (fixes the flat-region bug)
- Click-to-drill-down: country -> region -> appellation -> individual wines
- Breadcrumb back-navigation
- Treemap/list view toggle
- Read-only wine detail panel (slide-over on desktop, sheet on mobile)

### Does not ship

- Deep-linkable drill paths in URL (client-side state only)
- Animated zoom transitions
- Atlas inline overlays or embedded education
- Search within share
- Account-aware or write features
- Personal cellar browsing on web

### Constraints (ADR-0072)

- Pack JSON is the sole data source. No atlas data fetches.
- No additional network calls beyond the initial pack fetch.
- Treemap is the primary identity surface; list supports but does not replace it.
- Atlas context is link-out only, not embedded.
- Shared snapshots are immutable; rendering reflects the published artifact.

---

## 2. Domain Layer: `lib/cellar-tree.ts`

Pure TypeScript. No React. No layout concerns. No async. No external dependencies.

### 2.1 Types

```typescript
interface CellarNode {
  id: string;            // stable, scoped key (see ID scheme below)
  label: string;         // display name
  kind: 'country' | 'region' | 'appellation' | 'wine';
  wineType?: string;     // dominant type for groups, entry type for wines; undefined when mixed
  weight: number;        // wine count (groups) or 1 (leaf)
  children: CellarNode[];
  entry?: ShareEntry;    // present only on wine leaves
}
```

### 2.2 Hierarchy Building

`buildHierarchy(entries: ShareEntry[]): CellarNode[]` returns an array of country-level root nodes.

**Algorithm:**

1. For each entry, determine the geography path from available fields:
   - `country` -> `region` -> `appellation` -> wine (full path)
   - `country` -> `region` -> wine (no appellation)
   - `country` -> wine (no region, no appellation)
2. Insert each entry into the tree, creating intermediate nodes as needed.
3. After all entries are inserted, aggregate weights bottom-up (each group node's weight = sum of descendant wine count).
4. Compute `wineType` on group nodes via `dominantWineType()` from `treemap-colors.ts`. `dominantWineType()` must be deterministic for tied distributions and must return `undefined` rather than arbitrarily selecting a type when the dominant type is not meaningful (e.g., even split across 3+ types).
5. Sort children at each level: weight descending, then label alphabetical (tie-breaker).

**Missing levels collapse upward gracefully.** If entries have region but no appellation, wines sit directly under region. No synthetic "Unknown Appellation" or "Other" nodes are created.

**`country` is assumed always present** (required field in pack schema v3). The collapse rules handle missing `region` and `appellation`, but not missing `country`. No "Unknown Country" root bucket exists or should be invented.

### 2.3 Node ID Scheme

IDs are deterministic, normalized, and scoped to parent path.

**`normalizeKey(raw: string): string`** — lowercase, trimmed, whitespace-collapsed. Applied to all geography values before ID construction.

| Kind | Format | Example |
|------|--------|---------|
| Country | `country:{key}` | `country:france` |
| Region | `region:{country}/{key}` | `region:france/burgundy` |
| Appellation | `appellation:{country}/{region}/{key}` | `appellation:france/burgundy/volnay` |
| Wine | `wine:{parentPath}/{entryId}` | `wine:france/burgundy/volnay/abc123` |

`externalEntryId` is assumed unique within a pack (per pack schema v3 contract).

### 2.4 Invariant

**Tree construction is deterministic for a given input set.** Same entries produce the same structure, same IDs, same layout. This is critical for visual stability and debugging.

### 2.5 Pure Functions

```typescript
// Resolve the current scope from a path. Returns the scoped children for rendering,
// plus the validated path (trimmed to closest valid ancestor if input path is stale).
// Empty path returns roots. Always returns a usable result — never fails.
resolveScope(roots: CellarNode[], pathIds: string[]): { children: CellarNode[]; resolvedPath: string[] }

// Resolve the current node itself (not its children). Returns null only for root (no single node).
// Used when the caller needs the parent context (e.g., aria-label "4 regions in France").
resolveCurrentNode(roots: CellarNode[], pathIds: string[]): CellarNode | null

// Path segments for breadcrumb display.
breadcrumbSegments(roots: CellarNode[], pathIds: string[]): { id: string; label: string }[]

// True when node has children and all children are wine leaves.
isLeafLevel(node: CellarNode): boolean  // children.length > 0 && all children kind === 'wine'

// True when node is a wine leaf.
isWineNode(node: CellarNode): boolean   // kind === 'wine'

// True when node can be drilled into.
canDrill(node: CellarNode): boolean     // children.length > 0 && kind !== 'wine'

// Recursively collect all wine entries under a node.
flattenWines(node: CellarNode): ShareEntry[]
```

### 2.6 Tree-Wide Indexes

Built once from the immutable tree:

```typescript
// All nodes indexed by ID for O(1) lookup.
buildNodeIndex(roots: CellarNode[]): Map<string, CellarNode>

// All wine entries indexed by wine node ID for O(1) selection resolution.
buildWineIndex(roots: CellarNode[]): Map<string, ShareEntry>
```

These indexes are built in `CellarBrowser` via `useMemo` from the immutable tree prop. Selection always resolves from the index, independent of current navigation path.

---

## 3. Layout Engine: `lib/treemap-layout.ts`

Existing squarified layout engine. Reused unchanged for initial implementation.

Layout-specific refinements (minimum tile thresholds, label visibility policies) can happen inside `treemap-layout.ts` later without changing `TreemapView`'s contract.

The layout engine has no knowledge of hierarchy, navigation, or React. It takes weighted items and a bounding rectangle; it returns positioned rectangles.

---

## 4. Component Architecture

### 4.1 Component Tree

```
page.tsx (server component -- fetches pack, builds hierarchy)
  |-- Header (title, provider, description -- unchanged from Phase 1)
  |-- CellarBrowser (client component -- owns navigation state)
  |     |-- BreadcrumbRow
  |     |     |-- Breadcrumb
  |     |     |-- ViewToggle
  |     |-- TreemapView  -or-  ListView  (switched by viewMode)
  |     |-- WineDetailPanel (overlay, conditionally rendered)
  |-- CTA footer (open in vynr, get vynr -- unchanged)
```

### 4.2 State Model (`CellarBrowser`)

```typescript
const [pathIds, setPathIds] = useState<string[]>([]);
const [viewMode, setViewMode] = useState<'treemap' | 'list'>('treemap');
const [selectedWineId, setSelectedWineId] = useState<string | null>(null);
const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);  // desktop cosmetic only
```

**Derived values** (via `useMemo`):

- `nodeIndex` — `buildNodeIndex(tree)`, computed once
- `wineIndex` — `buildWineIndex(tree)`, computed once
- `{ currentChildren, resolvedPath }` — `resolveScope(tree, pathIds)` (always valid, closest ancestor fallback)
- `currentNode` — `resolveCurrentNode(tree, pathIds)` (null at root level)
- `breadcrumb` — `breadcrumbSegments(tree, pathIds)`
- `isTerminalPath` — `currentChildren.length > 0 && currentChildren.every(isWineNode)`
- `selectedWine` — `wineIndex.get(selectedWineId)` (tree-wide lookup, not path-dependent)

**Invariant:** State changes never rebuild hierarchy. Navigation, toggling, hover, and selection operate over an immutable prebuilt tree.

### 4.3 Central Click Handler

```typescript
function handleNodeClick(node: CellarNode) {
  if (canDrill(node)) {
    setPathIds([...pathIds, node.id]);
  } else if (isWineNode(node)) {
    setSelectedWineId(node.id);
  }
}
```

All surfaces (`TreemapView`, `ListView`) call `onNodeClick(node)`. `CellarBrowser` is the single place where drill-vs-inspect is resolved. Components never decide interaction semantics.

### 4.4 Props Flow

`page.tsx` builds the tree server-side and passes it as a serialized prop:

```typescript
const tree = buildHierarchy(pack.entries);
return <CellarBrowser tree={tree} pack={pack} shareId={shareId} />;
```

The tree is immutable for the lifetime of the page. Monitor serialized tree size; revisit server-vs-client build only if materially heavier than raw entries.

---

## 5. Component Specifications

### 5.1 TreemapView

**Props:** `nodes: CellarNode[]`, `isTerminalPath: boolean`, `hoveredNodeId: string | null`, `onNodeClick(node)`, `onNodeHover(nodeId | null)`.

**Self-measures** via `ResizeObserver` hook on its container `<div>`.

**Height policy:** Width-driven. Target aspect ratio 3:2 on desktop, 4:3 on mobile (<768px). Clamped: min 250px, max 500px on desktop; min 200px, max 400px on mobile.

**Rendering:** SVG-based.

**Group tiles** (geography nodes):
- Fill: `nodeTint(node.wineType)` — neutral fallback when undefined
- Label: node label, scaled font. Min dimension >= 60px for label visibility.
- Sub-label: wine count. Min dimension >= 40px.
- Below 40px: colored tile, no label. On desktop, tooltip provides content. On coarse pointers (no tooltip), unlabeled tiles are inspectable via tap (opens detail or drills) or via list view fallback.
- Cursor: `pointer`
- Hover: `nodeHoverTint(node.wineType)`, consistent neutral when undefined

**Wine tiles** (leaf level):
- Fill: `wineTypeTint(entry.wineType)` — always defined on entries
- Label: most discriminating concise label (wine name preferred, producer as sub-label when space allows). Shared formatter decides based on available data.
- Cursor: `pointer`, tile border thickens slightly on hover to signal "inspect" vs "drill"

**Tooltip:** Positioned `<div>` outside SVG. Group nodes: label + wine count. Wine nodes: name, producer, vintage. Lightweight. Pointer-events none. Desktop only — hidden on coarse pointers.

**Accessibility:**
- Tiles are keyboard-focusable interactive elements with button-like semantics
- Tab/Shift-Tab for navigation, Enter/Space to activate
- Focus ring: dedicated stroke treatment on focused rect within SVG
- Arrow-key spatial navigation deferred to later pass
- SVG `aria-label` describes current level ("5 countries", "4 regions in France")
- Implementation must be tested across major browsers/AT

**Tint helpers** (`nodeTint`, `nodeHoverTint`) tolerate `undefined` identically — neutral base and neutral hover. Hover state never implies a dominant wine type when base state is neutral.

**Invariant:** TreemapView renders current node's children only. Never changes hierarchy or selection semantics.

### 5.2 ListView

**Props:** `nodes: CellarNode[]`, `isTerminalPath: boolean`, `onNodeClick(node)`.

**Group rows** (when `canDrill(node)`):
- Horizontal: label (left), wine count + subtle right chevron (right)
- One subtle accent maximum (wine-type dot or thin border, not both)
- Background: `var(--atlas-card)`, border: `var(--atlas-card-stroke)`
- Min height 48px for touch targets
- Click: navigates (routed through `CellarBrowser.handleNodeClick`)

**Wine rows** (when `isWineNode(node)`):
- Extracted shared `WineCard` component (not imported from page.tsx — neutral, reusable)
- Content: name, producer, vintage, geography, type pill, varietals, provider note
- No chevron
- Click: opens detail panel

**Visual hierarchy:** Group rows are quieter and structurally simpler than wine rows. A group row must never be mistaken for a wine card.

**Sorting:** Same order as treemap — weight descending, alpha tie-breaker. ListView and TreemapView consume the same pre-sorted `currentChildren`.

**Invariants:**
- ListView is an alternate representation of the current node scope, not a flattened global search/result surface.
- List rows are rendered from `currentChildren` directly. ListView never flattens descendants except when a future feature explicitly requires it.

### 5.3 Breadcrumb

**Props:** `segments: { id: string; label: string }[]`, `onNavigate(pathIds: string[])`.

**Structure:**
```
[Root] > [Country] > [Region] > [Appellation]
 clickable  clickable   clickable   non-clickable (current)
```

- **Root segment:** Always present. Label = `pack.snapshot.snapshotTitle`, fallback `"Cellar"`. Click emits `onNavigate([])`.
- **Intermediate segments:** Clickable. Segment at index `i` emits `onNavigate(pathIds.slice(0, i + 1))` (inclusive of clicked segment).
- **Terminal segment (current):** Non-clickable. Primary tone, medium weight — signals "you are here."
- **Clickable ancestors:** Secondary tone.
- **Separator:** ` > ` (thin, low contrast)
- **Mobile:** Horizontally scrollable (`overflow-x: auto`). Auto-scrolls to terminal segment on navigation change only (not every render).

**Edge case:** At root level (empty path), breadcrumb shows only the root label, non-clickable. The breadcrumb bar never disappears.

### 5.4 ViewToggle

**Props:** `viewMode: 'treemap' | 'list'`, `onToggle(mode)`.

- Two-icon toggle (grid icon / list icon)
- Active state: filled, slightly bolder. Inactive: outlined, muted.
- Position: right-aligned on the breadcrumb row
- Small and quiet — utility control, not feature
- On narrow mobile widths, may wrap to second row beneath breadcrumb rather than compressing readability

### 5.5 WineDetailPanel

**Props:** `wine: ShareEntry | null`, `onDismiss()`.

**Desktop (>=768px):** Right-side slide-over, 360-400px wide. Light/subtle semi-transparent backdrop. Slides in from right with brief CSS transition.

**Mobile (<768px):** Bottom sheet, ~70% viewport height, clamped with safe-area awareness. Internal content scroll (page scroll locked behind sheet). Stronger backdrop. Slides up.

**Content (top to bottom):**
- Close button (top-right; x on desktop, chevron-down on mobile)
- Wine name (primary, larger)
- Producer
- Vintage
- Geography line (country, region, appellation joined by middot)
- Wine type pill (one badge only — no accumulation of chips)
- Varietals (style TBD during implementation — verify against vynr typography)
- Provider note (attributed box style, collapses entirely when absent)

**Dismiss:** Click backdrop, close button, or Escape. All route to `onDismiss()`.

**Focus management:** Focus moves into panel on open. Focus returns to triggering tile/row on dismiss.

**No atlas link-out in this pass.**

**Invariant:** Panel is a read-only inspection surface. It never triggers navigation, selection changes, or any state mutation beyond its own dismissal.

---

## 6. Responsive Behavior

### 6.1 Breakpoints

| | Desktop (>=768px) | Mobile (<768px) |
|---|---|---|
| Treemap aspect | 3:2 target, 250-500px height | 4:3 target, 200-400px height |
| Detail panel | Right slide-over, 360-400px | Bottom sheet, ~70vh |
| Breadcrumb + toggle | Single row, toggle right | Breadcrumb scrollable, toggle may wrap |
| Tooltip | Hover-triggered (pointer capable) | Hidden |
| Interaction | Hover highlights, click acts | Tap acts directly |

### 6.2 Mobile Interaction

No hover on mobile. No intermediate "selected" state.

- **Group tiles:** Single tap drills down
- **Wine tiles:** Single tap opens detail panel
- **ListView:** Same — single tap navigates or opens detail
- **Recovery:** Breadcrumb provides reliable back-navigation at all times

Single-tap drill is safe because the breadcrumb is always visible and provides escape.

Where tiles become too small for reliable touch interaction, the list view is the explicit accessible fallback.

### 6.3 Treemap Container

Full-width within the page's `max-width: 640px` content column. On mobile, framed within content padding (16px horizontal) — not true edge-to-edge bleed. The treemap should feel framed, not full-bleed marketing.

### 6.4 Tooltip Behavior

Tooltips are shown for hover-capable pointers only (`@media (hover: hover)`). Coarse/touch pointers never see tooltips. This handles hybrid devices (touch laptops, tablets) correctly.

### 6.5 Resize Invariant

Changing viewport size or breakpoint must not reset navigation path, view mode, or selected wine. Panel presentation adapts (slide-over to sheet or vice versa), but browser state is preserved.

---

## 7. Page Integration

`ActiveShareView` in `page.tsx` currently renders: header -> treemap hero -> divider -> wine list.

Phase 2 replaces the treemap hero and wine list with `CellarBrowser`. The divider disappears. The browser is one unified interactive surface.

```
page.tsx (server)
  |-- Header (title, provider, description -- unchanged)
  |-- CellarBrowser (client -- replaces treemap hero + wine list)
  |-- CTA footer (open in vynr, get vynr -- unchanged)
```

Header and CTA footer remain outside `CellarBrowser`. The browser is the interactive core, not the whole page.

---

## 8. File Structure

### New files

```
lib/cellar-tree.ts                    -- hierarchy building, traversal, indexes
lib/__tests__/cellar-tree.test.ts     -- unit tests for hierarchy and traversal
app/s/[shareId]/CellarBrowser.tsx     -- stateful client shell
app/s/[shareId]/TreemapView.tsx       -- treemap rendering (replaces current Treemap.tsx)
app/s/[shareId]/ListView.tsx          -- list view rendering
app/s/[shareId]/Breadcrumb.tsx        -- breadcrumb navigation
app/s/[shareId]/ViewToggle.tsx        -- treemap/list toggle
app/s/[shareId]/WineDetailPanel.tsx   -- read-only wine detail
app/components/WineCard.tsx           -- shared presentational wine card (extracted)
```

### Modified files

```
app/s/[shareId]/page.tsx              -- builds tree, renders CellarBrowser instead of static layout
```

### Removed files

```
app/s/[shareId]/Treemap.tsx           -- replaced by TreemapView.tsx (remove after TreemapView is verified working)
```

### Unchanged files

```
lib/treemap-layout.ts                 -- squarify engine, reused as-is
lib/treemap-colors.ts                 -- wine type palette, reused as-is
lib/share-api.ts                      -- pack fetching, unchanged
```

---

## 9. Testing Strategy

### Domain layer (`cellar-tree.test.ts`)

- Hierarchy from entries with full geography (country + region + appellation)
- Hierarchy with missing levels (no appellation, no region)
- Empty entries -> empty roots
- Weight aggregation bottom-up
- Determinism: same input -> same tree
- Node ID normalization (casing, whitespace)
- `resolveScope` with valid path
- `resolveScope` with stale/invalid path -> closest valid ancestor's children
- `resolveScope` at root (empty path) returns roots
- `resolveCurrentNode` returns correct parent node or null at root
- `breadcrumbSegments` correctness
- `isLeafLevel`, `canDrill`, `isWineNode` edge cases
- Sort: weight descending with alpha tie-breaker
- Index building (`nodeIndex`, `wineIndex`)
- Wine node ID includes parent path context

### Component tests (if time allows)

- `CellarBrowser`: drill-down updates pathIds, view toggle preserves path
- `Breadcrumb`: segment clicks emit correct pathIds
- `WineDetailPanel`: renders wine data, dismiss callback fires

### Manual verification

- Render a real shared pack and drill through hierarchy
- Verify breadcrumb at each level
- Toggle between treemap and list at each level
- Open wine detail from both treemap and list
- Test on mobile viewport
- Keyboard navigation (Tab + Enter)
- Resize across 768px breakpoint while drilled into a deep path with wine panel open (tests resize invariant)

---

## 10. Acceptance Criteria

1. A shared cellar opens to a country-level treemap
2. Clicking a country tile drills into regions within that country
3. Clicking a region tile drills into appellations (or wines if no appellations)
4. Clicking an appellation tile drills into wines
5. Clicking a wine tile opens a read-only detail panel
6. Breadcrumb shows current path and navigates upward on click
7. View toggle switches between treemap and list at every level
8. List and treemap reflect the same scoped node and same sort order
9. No additional data fetch beyond the initial pack fetch
10. No write, auth, or account behavior appears
11. Degraded packs (missing geography) still render sensibly (graceful collapse)
12. Keyboard accessible (Tab + Enter at minimum)

---

## 11. Deferred

| Item | Rationale |
|------|-----------|
| Deep-linkable breadcrumb paths in URL | Client-side state first; URL encoding later |
| Animated zoom transitions | Polish, not MVP |
| Atlas inline overlays | ADR-0072 boundary: link-out only |
| Arrow-key spatial navigation in treemap | Tab+Enter first, spatial nav later |
| Search within share | Phase 3 territory |
| Compare views | Phase 3 territory |
| Account-aware features | ADR-0072 boundary |
| Varietals italic styling decision | Verify against vynr typography during implementation |
