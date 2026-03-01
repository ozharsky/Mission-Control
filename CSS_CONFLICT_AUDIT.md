# CSS Conflict Audit Report - Mission Control V5
**Date:** 2026-03-01
**Version:** v97
**Auditor:** Subagent CSS Audit

---

## EXECUTIVE SUMMARY

Found **MAJOR CSS CONFLICTS** across multiple active CSS files. The same classes are defined in multiple files with overlapping media queries, causing specificity wars and unpredictable styling.

### Critical Issues:
1. `.mobile-menu-btn` defined in **5+ active files**
2. `.bottom-tabs` defined in **4+ active files**  
3. `.bottom-tab` defined in **5+ active files**
4. `.nav` mobile styles defined in **4+ active files**

---

## DETAILED CONFLICT ANALYSIS

### 1. CONFLICT: `.mobile-menu-btn`

#### Files Defining This Class (ACTIVE FILES ONLY):

| File | Line | Properties Set | Media Query |
|------|------|----------------|-------------|
| `navigation.css` | 234 | `display: none` | None (desktop default) |
| `navigation.css` | 272 | `display: flex !important` | `@media (max-width: 768px)` |
| `navigation.css` | 457 | Various | `@media (max-width: 414px)` |
| `mobile-navigation.css` | 165 | Full styling with `!important` | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 195 | `:hover, :active` states | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 204 | `.active` state | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 212 | `.menu-icon` child | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 449 | Small phone override | `@media (max-width: 414px)` |
| `mobile-navigation.css` | 499 | Extra small override | `@media (max-width: 374px)` |
| `mobile-navigation.css` | 541 | Landscape override | `@media (max-width: 768px) and (orientation: landscape)` |
| `mobile-navigation.css` | 556 | Hide on tablet | `@media (min-width: 769px) and (max-width: 1024px)` |
| `mobile-core.css` | 609 | Partial override | `@media (max-width: 768px)` |
| `accessibility-enhanced.css` | 247 | Touch target sizing | `@media (pointer: coarse)` |

#### Conflicting Properties:

**Position:**
- `mobile-navigation.css`: `bottom: calc(92px + env(safe-area-inset-bottom, 0)) !important; right: 1rem !important;`
- `navigation.css`: No position defined (relies on defaults)

**Display:**
- `navigation.css`: `display: flex !important;` (line 272)
- `mobile-navigation.css`: `display: flex !important;` (line 165)
- Both use `!important` - last one in cascade wins

**Z-Index:**
- `mobile-navigation.css`: `z-index: 200 !important;`
- `navigation.css`: No z-index defined

**Sizing:**
- `mobile-navigation.css`: `width: 60px !important; height: 60px !important;`
- `navigation.css`: No explicit sizing

---

### 2. CONFLICT: `.bottom-tabs`

#### Files Defining This Class (ACTIVE FILES ONLY):

| File | Line | Properties Set | Media Query |
|------|------|----------------|-------------|
| `navigation.css` | 239 | `display: none` | None (desktop default) |
| `navigation.css` | 293 | Full mobile styling | `@media (max-width: 768px)` |
| `navigation.css` | 403 | Small phone override | `@media (max-width: 414px)` |
| `navigation.css` | 430 | Extra small override | `@media (max-width: 374px)` |
| `navigation.css` | 459 | Hide on desktop | `@media (min-width: 769px)` |
| `mobile-navigation.css` | 13 | Full mobile styling | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 427 | Small phone override | `@media (max-width: 414px)` |
| `mobile-navigation.css` | 478 | Extra small override | `@media (max-width: 374px)` |
| `mobile-navigation.css` | 523 | Landscape override | `@media (max-width: 768px) and (orientation: landscape)` |
| `mobile-navigation.css` | 557 | Hide on tablet | `@media (min-width: 769px) and (max-width: 1024px)` |
| `accessibility-enhanced.css` | 246 | Print styles | `@media print` |

#### Conflicting Properties:

**Height:**
- `navigation.css`: `height: 80px; height: calc(80px + env(safe-area-inset-bottom, 0));`
- `mobile-navigation.css`: Same values

**Background:**
- `navigation.css`: `background: var(--bg-secondary);`
- `mobile-navigation.css`: `background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);`

**Z-Index:**
- `navigation.css`: `z-index: 150;`
- `mobile-navigation.css`: `z-index: 150;` (same, but could diverge)

**Box Shadow:**
- `navigation.css`: `box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);`
- `mobile-navigation.css`: More complex shadow with inset

---

### 3. CONFLICT: `.bottom-tab`

#### Files Defining This Class (ACTIVE FILES ONLY):

| File | Line | Properties Set | Media Query |
|------|------|----------------|-------------|
| `navigation.css` | 317 | Full styling | `@media (max-width: 768px)` |
| `navigation.css` | 338 | `::before` pseudo-element | `@media (max-width: 768px)` |
| `navigation.css` | 351 | `:hover` state | `@media (max-width: 768px)` |
| `navigation.css` | 355 | `.active` state | `@media (max-width: 768px)` |
| `navigation.css` | 359 | `.active::before` | `@media (max-width: 768px)` |
| `navigation.css` | 363 | `.bottom-tab-icon` | `@media (max-width: 768px)` |
| `navigation.css` | 374 | `.active .bottom-tab-icon` | `@media (max-width: 768px)` |
| `navigation.css` | 378 | `.bottom-tab-label` | `@media (max-width: 768px)` |
| `navigation.css` | 408 | Small phone override | `@media (max-width: 414px)` |
| `navigation.css` | 435 | Extra small override | `@media (max-width: 374px)` |
| `mobile-navigation.css` | 39 | Full styling | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 61 | `::before` pseudo-element | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 74 | `.active::before` | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 78 | `.active` state | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 82 | `.bottom-tab-icon` | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 93 | `.active .bottom-tab-icon` | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 98 | `.bottom-tab-label` | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 110 | `.active .bottom-tab-label` | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 115 | `.bottom-tab-badge` | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 141 | `::after` ripple | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 154 | `:active::after` | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 432 | Small phone override | `@media (max-width: 414px)` |
| `mobile-navigation.css` | 483 | Extra small override | `@media (max-width: 374px)` |
| `mobile-core.css` | 411 | `.bottom-tab-label` | `@media (max-width: 380px)` |
| `mobile-core.css` | 415 | `.bottom-tab-icon` | `@media (max-width: 380px)` |
| `mobile-core.css` | 600 | Touch target sizing | `@media (max-width: 768px)` |
| `base.css` | 514 | Touch targets | `@media (max-width: 768px)` |
| `base.css` | 589 | Touch targets | `@media (max-width: 768px)` |
| `mobile-components.css` | 184 | Touch targets | `@media (max-width: 768px)` |
| `accessibility-enhanced.css` | 104 | Touch targets | `@media (pointer: coarse)` |

#### Conflicting Properties:

**Min-Height:**
- `navigation.css`: `min-height: 48px;`
- `mobile-navigation.css`: `min-height: 48px;` (same)
- `base.css`: `min-height: 44px;` via touch target grouping
- `accessibility-enhanced.css`: `min-height: 44px;`

**Active Icon Transform:**
- `navigation.css`: `transform: translateY(-3px) scale(1.1);`
- `mobile-navigation.css`: `transform: translateY(-4px) scale(1.15);`

**Font Sizes:**
- `navigation.css`: `.bottom-tab-label { font-size: 0.75rem; }`
- `mobile-navigation.css`: `.bottom-tab-label { font-size: 0.75rem; }` (same)
- `mobile-core.css` (380px): `.bottom-tab-label { font-size: 0.625rem; }`

---

### 4. CONFLICT: `.nav` (Mobile Styles)

#### Files Defining This Class (ACTIVE FILES ONLY):

| File | Line | Properties Set | Media Query |
|------|------|----------------|-------------|
| `navigation.css` | 1-20 | Desktop default styles | None |
| `navigation.css` | 239 | Mobile slide-out | `@media (max-width: 768px)` |
| `navigation.css` | 243 | `.nav.open` | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 227 | Mobile slide-out | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 243 | `.nav.open` | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 248 | `.nav-header` | `@media (max-width: 768px)` |
| `mobile-navigation.css` | 545 | Landscape override | `@media (max-width: 768px) and (orientation: landscape)` |
| `mobile-core.css` | 499 | Mobile styles | `@media (max-width: 768px)` |
| `mobile-core.css` | 538 | `.nav-item:hover` | `@media (max-width: 768px)` |
| `mobile-core.css` | 603 | Hidden state | `@media (max-width: 768px)` |
| `mobile-core.css` | 614 | `.nav.open` | `@media (max-width: 768px)` |

#### Conflicting Properties:

**Width:**
- `navigation.css`: `width: 85%; max-width: 320px;`
- `mobile-navigation.css`: `width: 85%; max-width: 320px;` (same)

**Transform:**
- `navigation.css`: `transform: translateX(-110%);`
- `mobile-navigation.css`: `transform: translateX(-110%);` (same)

**Z-Index:**
- `navigation.css`: `z-index: 200;`
- `mobile-navigation.css`: `z-index: 200;` (same)

**Background:**
- `navigation.css`: Default `var(--bg-secondary)`
- `mobile-navigation.css`: `linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);`

---

## ROOT CAUSE ANALYSIS

### Why These Conflicts Exist:

1. **Multiple Subagents Created Files Without Coordination**
   - Each subagent created their own "improved" version
   - No single source of truth was established

2. **Files Load Order in index.html:**
   ```
   navigation.css (line 24)
   ... (other CSS)
   mobile-core.css (line 45)
   mobile-navigation.css (line 46)
   ...
   accessibility-enhanced.css (line 60)
   ```
   
   **Problem:** `mobile-navigation.css` loads AFTER `navigation.css`, so it SHOULD override.
   But `accessibility-enhanced.css` loads LAST, potentially overriding critical styles.

3. **Deprecated Files Still Exist**
   - Files in `css/_deprecated/` still contain active CSS
   - They may be referenced or cached

---

## RECOMMENDED FIX STRATEGY

### Option A: Consolidate to ONE File (RECOMMENDED)

**Keep:** `mobile-navigation.css` as the single source of truth
**Remove mobile nav styles from:**
- `navigation.css` (keep only desktop styles)
- `mobile-core.css` (remove all nav-related styles)
- `accessibility-enhanced.css` (keep only touch targets, remove layout)

### Option B: Strict Separation of Concerns

**`navigation.css`:** Desktop navigation ONLY
**`mobile-navigation.css`:** Mobile navigation ONLY  
**`accessibility-enhanced.css`:** Touch targets and focus styles ONLY (no layout)

### Specific Changes Needed:

#### 1. navigation.css
**REMOVE lines 239-459** (all mobile @media blocks for nav, bottom-tabs, mobile-menu-btn)
**KEEP:** Desktop `.nav` styles (lines 1-230)
**KEEP:** Final hide rule `@media (min-width: 769px)` (lines 459+)

#### 2. mobile-core.css
**REMOVE lines 499-614** (all `.nav`, `.nav.open`, `.bottom-tab-*` styles)
**KEEP:** General mobile layout styles (cards, forms, etc.)

#### 3. accessibility-enhanced.css
**KEEP lines 104, 247** (touch targets)
**REMOVE any layout positioning** (if present)

#### 4. mobile-navigation.css
**KEEP ALL** - This becomes the authoritative source
**ADD comment header:** `/* AUTHORITATIVE: Mobile Navigation Styles */`

---

## VERIFICATION CHECKLIST

After fixes, verify:
- [ ] `.mobile-menu-btn` defined in ONLY `mobile-navigation.css`
- [ ] `.bottom-tabs` defined in ONLY `mobile-navigation.css`
- [ ] `.bottom-tab` base styles in ONLY `mobile-navigation.css`
- [ ] `.nav` mobile styles in ONLY `mobile-navigation.css`
- [ ] No `!important` wars (use specificity instead)
- [ ] Touch targets still work (`accessibility-enhanced.css`)

---

## FILES REQUIRING MODIFICATION

1. ✅ `css/navigation.css` - Remove mobile styles
2. ✅ `css/mobile-core.css` - Remove nav-related styles  
3. ✅ `css/mobile-navigation.css` - Add authoritative header (optional)
4. ❌ `css/accessibility-enhanced.css` - Verify no layout conflicts

---

## END OF AUDIT
