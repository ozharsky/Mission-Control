# MISSION CONTROL V5 - MASTER CONTEXT
**Version:** v103
**Date:** 2026-03-01
**Purpose:** Single source of truth for ALL subagent tasks

---

## 📋 PROJECT OVERVIEW

**What is Mission Control V5?**
- Business operations dashboard for OZ3DPrint (Etsy shop)
- Tech stack: Vanilla JavaScript, CSS, Firebase
- Single-page application with multiple sections
- Desktop-first design with mobile-responsive fallback

**Current State:**
- Version: v103
- Major refactor completed: CSS consolidated, mobile overhaul done
- Status: Functional but needs polish and consistency

---

## 🏗️ ARCHITECTURE

### File Structure
```
Mission-Control-V5/
├── index.html              (entry point, loads all CSS/JS)
├── main.js                 (app initialization, routing)
├── sw.js                   (service worker, caching)
├── css/
│   ├── variables.css       (CSS custom properties - colors, spacing)
│   ├── base.css           (reset, typography)
│   ├── layout.css         (navigation, content layout)
│   ├── components.css     (buttons, cards, forms)
│   ├── mobile-visual.css  (mobile spacing, typography, touch targets)
│   ├── mobile-components.css (mobile cards, lists, FAB)
│   └── [other feature CSS files]
├── js/
│   ├── components/        (Navigation.js, Modal.js, etc.)
│   ├── sections/          (Dashboard.js, Priorities.js, etc.)
│   ├── utils/             (mobileInteractions.js, etc.)
│   └── state/             (store.js for state management)
└── css/_deprecated/       (old CSS files - DO NOT USE)
```

### Section Files (ALL must follow same patterns)
- `js/sections/Dashboard.js` - TEMPLATE/REFERENCE for others
- `js/sections/Priorities.js`
- `js/sections/Projects.js`
- `js/sections/Calendar.js`
- `js/sections/Revenue.js`
- `js/sections/Inventory.js`
- `js/sections/Settings.js`
- `js/sections/Docs.js`
- `js/sections/Notes.js`

### Shared Components
- `js/components/Navigation.js` - Handles desktop/mobile nav
- `js/components/Modal.js` - All modals use this
- `js/components/Toast.js` - Notifications

---

## 🎨 DESIGN SYSTEM

### CSS Variables (ALWAYS use these, never hardcode)
```css
/* Colors */
--accent-primary: #6366f1;
--accent-secondary: #8b5cf6;
--bg-primary: #0a0a0f;
--bg-secondary: #13131f;
--bg-tertiary: #1a1a2e;
--text-primary: #f1f1f4;
--text-secondary: #a1a1aa;
--text-muted: #71717a;
--border-color: #27273a;

/* Mobile Spacing (from mobile-visual.css) */
--m-space-xs: 0.25rem;
--m-space-sm: 0.5rem;
--m-space-md: 0.75rem;
--m-space-lg: 1rem;
--m-space-xl: 1.5rem;
--m-space-2xl: 2rem;

/* Layout */
--nav-width: 260px;
--bottom-tabs-height: 80px;
```

### Mobile Class Naming Convention (MANDATORY)
ALL mobile-specific classes use `.m-` prefix:

| Class | Purpose | Use When |
|-------|---------|----------|
| `.m-card` | Mobile card container | Any card on mobile |
| `.m-list-item` | List row item | Priority, project, calendar items |
| `.m-touch` | 44px touch target | Buttons, clickable elements |
| `.m-touch-lg` | 48px touch target | Primary actions |
| `.m-title` | Section title | Headers on mobile |
| `.m-body` | Body text | Paragraphs on mobile |
| `.m-btn` | Mobile button | All buttons on mobile |
| `.m-input` | Form input | Inputs on mobile (16px font!) |
| `.m-fab` | Floating action button | Add buttons |
| `.m-grid-2` | 2-column grid | Stats, insights |
| `.m-scroll-x` | Horizontal scroll | Filter bars |

### Typography Scale (Mobile)
```css
.m-title { font-size: 1.25rem; font-weight: 700; }
.m-subtitle { font-size: 1rem; font-weight: 600; }
.m-body { font-size: 0.9375rem; }
.m-caption { font-size: 0.8125rem; color: var(--text-muted); }
```

### Touch Targets (CRITICAL - NEVER break this)
- Minimum: 44px × 44px
- Primary actions: 48px × 48px
- Use `.m-touch` and `.m-touch-lg` classes

---

## 📱 CURRENT MOBILE IMPLEMENTATION

### What's Working (v103)
- Mobile menu button (☰) visible and functional
- Bottom tabs navigation (Home, Projects, Tasks, Revenue, Notes)
- Touch feedback on all interactive elements
- Swipe gestures (swipe to complete priorities)
- Pull-to-refresh infrastructure
- Responsive layout at all breakpoints

### Mobile Breakpoints
```css
/* Mobile (default) */
@media (max-width: 1023px) { ... }

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) { ... }

/* Desktop */
@media (min-width: 1024px) { ... }
```

### Navigation Behavior
- **Mobile (< 1024px):** Bottom tabs + floating menu button
- **Desktop (≥ 1024px):** Sidebar navigation, no mobile elements

---

## ⚠️ COMMON PITFALLS (DO NOT DO THESE)

### ❌ NEVER:
1. Create new CSS classes if `.m-*` equivalent exists
2. Use inline styles (`style="..."`) for layout
3. Hardcode colors - use CSS variables
4. Forget touch targets (44px minimum)
5. Use `!important` in CSS
6. Modify desktop-only styles (inside `@media (min-width: 1024px)`)
7. Reference files in `css/_deprecated/`
8. Change patterns without checking other sections

### ✅ ALWAYS:
1. Check `js/sections/Dashboard.js` first - it's the reference
2. Use existing `.m-*` classes
3. Follow the same pattern as other sections
4. Test at 375px (iPhone SE) width
5. Ensure 44px touch targets
6. Use CSS variables for colors/spacing
7. Add to `sw.js` STATIC_ASSETS if creating new files

---

## 🔍 REFERENCE PATTERNS

### Mobile Card Pattern (from Dashboard.js)
```javascript
container.innerHTML = `
  <div class="m-card">
    <div class="m-card-header">
      <h3 class="m-title">Title</h3>
      <button class="m-touch">...</button>
    </div>
    <div class="m-body">Content</div>
    <div class="m-card-meta">
      <span class="m-badge">Tag</span>
    </div>
  </div>
`;
```

### Mobile List Pattern (from Priorities.js)
```javascript
container.innerHTML = `
  <div class="m-list-item">
    <input type="checkbox" class="m-list-item-checkbox m-touch">
    <div class="m-list-item-content">
      <div class="m-list-item-title">Item name</div>
      <div class="m-caption">Due date</div>
    </div>
    <div class="m-list-item-actions">
      <button class="m-touch">...</button>
    </div>
  </div>
`;
```

### Mobile Grid Pattern
```javascript
container.innerHTML = `
  <div class="m-grid-2">
    <div class="m-card">...</div>
    <div class="m-card">...</div>
  </div>
`;
```

---

## ✅ VERIFICATION CHECKLIST

Before marking task complete, verify:

- [ ] **Syntax:** `node --check` passes on all modified JS files
- [ ] **No 404s:** All CSS/JS files referenced exist
- [ ] **Mobile:** No horizontal scroll at 375px width
- [ ] **Touch targets:** All interactive elements 44px+
- [ ] **Consistency:** Pattern matches other sections
- [ ] **No duplication:** Didn't create classes that already exist
- [ ] **Variables:** Used CSS variables, not hardcoded values

---

## 📝 SECTION-SPECIFIC NOTES

### Dashboard.js (REFERENCE IMPLEMENTATION)
- Stats grid: `.m-grid-2`
- Cards: `.m-card`
- Use this as template for other sections

### Priorities.js
- List view: `.m-list-item`
- Swipe to complete implemented
- Filter bar: `.m-scroll-x`

### Projects.js
- Similar to Priorities
- Progress bars visible

### Calendar.js
- Day cells: 60px min-height
- Event dots: color-coded

### Inventory.js
- Cards: `.m-card`
- Printer status badges

---

## 🚨 EMERGENCY CONTACT

If stuck or unclear:
1. Check `js/sections/Dashboard.js` for reference pattern
2. Check `css/mobile-visual.css` for available classes
3. Check `css/mobile-components.css` for component styles
4. Ask for clarification - don't guess

---

## VERSION HISTORY

- v103: Mobile overhaul completed
- v102: Bug fixes (404s, menu button, CORS)
- v101: Layout rebuild
- v100: Initial consolidation

---

**END OF MASTER CONTEXT**
