# Mission Control V5 - Application State Document
# Version: v100
# Last Updated: 2026-03-01
# Purpose: Comprehensive documentation for subagents and developers

---

## 1. APPLICATION OVERVIEW

### 1.1 Core Purpose
Mission Control V5 is a modular business operations dashboard for OZ3DPrint (Etsy shop selling 3D printed nicotine pouch accessories). It provides:
- Task/Priority management with Kanban boards
- Project tracking
- Revenue tracking and analytics
- Calendar with events
- Inventory/SKU management
- Document storage with Firebase
- Lead management
- Multi-board support (Etsy, Photography, B2B, 3D Printing)

### 1.2 Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+), CSS3, HTML5
- **State Management**: Custom store with Firebase sync
- **Storage**: localStorage (primary), Firebase Realtime DB (sync), Firebase Storage (files)
- **Build**: None (static files)
- **Hosting**: GitHub Pages (ozharsky.github.io/Mission-Control/)
- **CDN**: Firebase SDK v10.8.0

### 1.3 Architecture
```
Mission-Control-V5/
├── index.html              # Entry point
├── main.js                 # App initialization, version v87
├── sw.js                   # Service Worker v87
├── css/                    # 25+ CSS files
├── js/
│   ├── components/         # UI components
│   ├── sections/           # Page sections (Dashboard, Priorities, etc.)
│   ├── utils/              # Utilities (performance, validation, etc.)
│   │   ├── animations.js   # NEW: Animation utilities with reduced motion support
│   │   ├── errorRecovery.js # NEW: Error handling and recovery utilities
│   │   └── lazyLoader-v2.js # UPDATED: Improved with cleanup and safety checks
│   ├── state/              # State management
│   ├── storage/            # Sync adapters
│   └── firebase.js         # Firebase config
└── assets/                 # Icons, manifests
```

---

## 2. STATE MANAGEMENT

### 2.1 Store Structure (store.js)
Central state object stored in localStorage and synced to Firebase:

```javascript
{
  priorities: [],        // Task items with status, assignee, due dates
  projects: {            // Projects by status
    todo: [],
    inprogress: [],
    review: [],
    done: []
  },
  revenue: number,       // Total revenue
  revenueHistory: [],    // Monthly revenue data
  skus: [],              // Inventory items
  events: [],            // Calendar events
  leads: [],             // B2B leads
  docs: [],              // Documents metadata
  settings: {},          // User settings
  lastSync: timestamp    // Last Firebase sync
}
```

### 2.2 State Flow
1. **Load**: localStorage → Store → UI render
2. **Update**: User action → Store update → localStorage save → Firebase sync (if configured)
3. **Sync**: Firebase changes → Store update → UI re-render

### 2.3 Key Store Methods
- `store.get(key)` - Get value
- `store.set(key, value)` - Set value (triggers listeners)
- `store.getState()` - Get entire state
- `store.subscribe(callback)` - Listen for changes

---

## 3. COMPONENTS ARCHITECTURE

### 3.1 Core Components (js/components/)
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **DashboardWidgets.js** | Dashboard stats/cards | Stat cards, sparklines, progress rings |
| **Toast.js** | Notifications | Success/error/warning toasts with actions |
| **Modal.js** | Dialogs | Create/edit modals for all entities |
| **Search.js** | Global search | Command palette (Cmd+K), fuzzy search |
| **Bulk.js** | Batch operations | Multi-select, bulk actions |
| **CommandPalette.js** | Quick actions | Keyboard shortcuts, navigation |
| **LoadingStates.js** | Loading UI | Skeletons, spinners, progress |
| **OfflineManager.js** | Offline support | Sync queue, conflict resolution |
| **DataManager.js** | Import/export | JSON/CSV export, validation |
| **Navigation.js** | Sidebar/nav | Mobile bottom tabs, desktop sidebar |
| **BoardSelector.js** | Board switching | Etsy/Photo/B2B/3D Print boards |
| **SettingsModal.js** | App settings | Firebase config, GitHub backup |

### 3.2 Section Components (js/sections/)
Each section is a page with its own render function:
- **Dashboard.js** - Overview, stats, quick actions
- **Priorities.js** - Kanban board, task management
- **Projects.js** - Project boards
- **Revenue.js** - Revenue tracking, charts
- **Calendar.js** - Event calendar
- **Inventory.js** - SKU management
- **Leads.js** - B2B lead tracking
- **Docs.js** - Document management with Firebase Storage
- **Events.js** - Event management
- **SKUs.js** - SKU details
- **Timeline.js** - Project timeline
- **Review.js** - Review management
- **Notes.js** - Quick notes
- **Settings.js** - App settings page

---

## 4. UTILITIES

### 4.1 Performance Utilities (js/utils/)
- **performance.js** - Throttle, debounce, memoization, lazy loading
- **performanceMonitor.js** - FPS monitoring, memory tracking
- **lazyLoader-v2.js** - Intersection Observer for lazy loading (UPDATED v87)
- **viewportObserver.js** - Scroll animations, parallax
- **scrollAnimations.js** - Reveal on scroll
- **animations.js** - NEW: Animation utilities with reduced motion support
- **errorRecovery.js** - NEW: Error handling with retry, circuit breaker, fallbacks

### 4.2 UI Utilities
- **focusManager.js** - Focus trapping, ARIA announcements
- **keyboardShortcuts.js** - Vim-style shortcuts (g+d, g+p, etc.)
- **touchFeedback.js** - Haptic feedback, touch animations
- **smoothScroll.js** - Smooth scrolling
- **animations-utilities.css** - Animation classes

### 4.3 Data Utilities
- **validation.js** - Input validation
- **sanitize.js** - XSS protection, HTML escaping
- **storageManager.js** - Firebase Storage integration
- **cache.js** - Local caching
- **dom.js** - DOM helpers

---

## 5. MOBILE ARCHITECTURE

### 5.1 Mobile-First Design
- **Bottom Navigation**: Fixed bottom tabs (70px height)
- **Floating Menu Button**: Bottom right, above tabs
- **Swipe Gestures**: Cards swipeable on mobile
- **Touch Targets**: Minimum 44px for all buttons
- **Safe Areas**: env(safe-area-inset-*) for notched devices

### 5.2 Mobile CSS Files (Consolidated v96)
- **mobile-core.css** - Base mobile styles, typography, safe areas
- **mobile-navigation.css** - Bottom tabs, floating menu button, slide-out nav
- **mobile-layouts.css** - Section-specific layouts (dashboard, priorities, projects, calendar)
- **mobile-components.css** - Cards, buttons, forms, modals, lists
- **mobile-utilities.css** - Helper classes, touch feedback, responsive utilities

*Old files moved to `css/_deprecated/`*

### 5.3 Responsive Breakpoints
- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px
- **Small Mobile**: < 380px

---

## 6. FIREBASE INTEGRATION

### 6.1 Firebase Services Used
- **Realtime Database** - Data sync
- **Storage** - File uploads (Docs section)
- **Authentication** - Not currently used (planned)

### 6.2 Configuration (localStorage keys)
```
mc_firebase_api_key
mc_firebase_auth_domain
mc_firebase_url
mc_firebase_project_id
mc_firebase_storage_bucket
mc_firebase_messaging_sender_id
mc_firebase_app_id
mc_firebase_secret (legacy REST API)
```

### 6.3 Storage Structure
```
/documents/{userId}/
  - {timestamp}_{filename}
```

### 6.4 Security Rules Required
Database: Public read/write (for development)
Storage: Allow read/write for development

---

## 7. KEY FEATURES IMPLEMENTED

### 7.1 Completed Features ✅
- [x] Dashboard with widgets and stats
- [x] Kanban board for priorities
- [x] Project management
- [x] Revenue tracking with charts
- [x] Calendar with events
- [x] Inventory/SKU management
- [x] B2B lead tracking
- [x] Multi-board support
- [x] Bulk operations
- [x] Search with command palette
- [x] Offline support
- [x] Mobile-responsive UI
- [x] Toast notifications
- [x] Data import/export
- [x] Firebase sync
- [x] File upload (Docs)
- [x] Keyboard shortcuts
- [x] Loading states
- [x] Animations and transitions

### 7.2 Known Issues ⚠️
- [ ] Firebase Storage requires manual configuration
- [ ] Some mobile layouts need refinement
- [ ] Service worker caching can be aggressive
- [ ] Upload modal needs testing with real Firebase config

### 7.3 Planned Features 📋
- [ ] User authentication
- [ ] Team collaboration
- [ ] Advanced reporting
- [ ] Email notifications
- [ ] Mobile app (PWA enhancements)
- [ ] AI-powered insights
- [ ] Integration with Etsy API
- [ ] Automated backups

---

## 8. CODING STANDARDS

### 8.1 File Organization
- Components: `js/components/ComponentName.js`
- Sections: `js/sections/SectionName.js`
- Utils: `js/utils/utilName.js`
- CSS: `css/feature-name.css`

### 8.2 Naming Conventions
- Components: PascalCase (e.g., `DashboardWidgets`)
- Functions: camelCase (e.g., `renderStatCard`)
- CSS classes: kebab-case (e.g., `stat-card`)
- Constants: UPPER_SNAKE_CASE

### 8.3 Import Patterns
```javascript
// Good
import { store } from './js/state/store.js'
import { toast } from './js/components/Toast.js'

// Bad - avoid
import { something } from 'firebase/storage' // Use CDN URL instead
```

### 8.4 State Updates
Always use store.set() to trigger re-renders:
```javascript
const docs = store.get('docs') || []
docs.push(newDoc)
store.set('docs', docs) // This triggers UI update
```

---

## 9. SUBAGENT GUIDELINES

### 9.1 Before Making Changes
1. **Read this state file** - Understand current architecture
2. **Check version** - Note current version (v84)
3. **Review existing code** - Look at similar implementations
4. **Test on mobile** - All changes must be mobile-responsive

### 9.2 Safe Operations ✅
- Add new CSS files
- Create new utility functions
- Add components to existing sections
- Update styles (maintain mobile compatibility)
- Fix bugs
- Add validation
- Improve error handling

### 9.3 Dangerous Operations ⚠️ (Ask First)
- Modify store structure
- Change Firebase integration
- Delete existing components
- Modify core state management
- Change routing/navigation
- Update service worker caching strategy

### 9.4 Required After Changes
1. **Bump version** in main.js
2. **Update sw.js** cache name
3. **Add new files** to sw.js STATIC_ASSETS
4. **Sync to Google Drive**
5. **Update this state file** if architecture changes

### 9.5 Testing Checklist
- [ ] Desktop view works
- [ ] Mobile view works (< 768px)
- [ ] No console errors
- [ ] Touch targets >= 44px on mobile
- [ ] Animations respect prefers-reduced-motion
- [ ] Works offline (if applicable)

---

## 10. VERSION HISTORY

| Version | Date | Key Changes |
|---------|------|-------------|
| v57-61 | 2026-02-28 | Cron job improvements, viewportObserver, validation |
| v62-65 | 2026-02-28 | Bug fixes, isLowPowerDevice, exports fixed |
| v66-70 | 2026-03-01 | Mobile overhaul, responsive grids, UI polish |
| v71-75 | 2026-03-01 | lazyLoader fixes, syntax errors resolved |
| v76-80 | 2026-03-01 | Dashboard redesign, mobile headers, overlap fixes |
| v88 | 2026-03-01 | DashboardWidgets memoization, lazyLoader cleanup, new animations/errorRecovery utils, accessibility CSS |
| v89 | 2026-03-01 | File upload fixes, numeric separator bug fixes, Firebase Storage working |
| v98 | 2026-03-01 | **CSS Conflict Resolution**: Fixed conflicting CSS definitions across multiple files. Removed duplicate `.mobile-menu-btn`, `.bottom-tabs`, `.bottom-tab`, and mobile `.nav` styles from `navigation.css` and `mobile-core.css`. These are now ONLY defined in `mobile-navigation.css` (authoritative source). Eliminated specificity wars, reduced CSS bloat, improved mobile navigation reliability. |
| v96 | 2026-03-01 | **Mobile CSS Consolidation**: Consolidated 13+ mobile CSS files into 5 logical files: mobile-core.css (base styles), mobile-navigation.css (bottom tabs, menu button, nav), mobile-layouts.css (section layouts), mobile-components.css (cards, buttons, forms, modals), mobile-utilities.css (helpers, touch feedback). Moved old files to css/_deprecated/. Reduced HTTP requests, eliminated specificity wars, improved maintainability. |
| v95 | 2026-03-01 | **Auto-Improvements Cron v95**: Enhanced error handling in main.js with user-friendly error UI, improved focus management utilities with skip links and focus-visible support, new LoadingStates component with skeleton screens and progress indicators, enhanced OfflineManager with connection quality monitoring and sync queue persistence |
| v92 | 2026-03-01 | **Mobile Menu Button Fix**: Fixed visibility issue where menu button was not showing on mobile. Removed conflicting CSS from mobile-overlap-fixes.css and mobile-overhaul.css. Added `!important` flags to mobile-bottom-buttons.css to ensure proper positioning at bottom right (above tabs). Button now properly sized at 60px with high contrast gradient background and z-index 200. |
| v92 | 2026-03-01 | Fixed Printer section PNG transparency: removed background-color from .printer-image and added transparent background to printer images to allow transparent PNGs to display properly |
| v92 | 2026-03-01 | Dashboard layout fix: AI Insights section moved above Revenue Trend, insight stat items now clickable with navigation to respective sections (Revenue, Inventory, Projects) |
| v92 | 2026-03-01 | Dashboard Revenue Trend mobile layout: Changed to vertical stack layout on mobile (sparkline top, revenue amount middle, progress ring bottom). Full-width sparkline at 180px height, larger prominent revenue amount (2.25rem), centered progress ring (100px). Better spacing with 1.25rem gaps. Small phone adjustments maintain vertical layout with reduced sizes. |
| v91 | 2026-03-01 | Dashboard Revenue Trend layout fix: larger sparkline (200px mobile/280px desktop), larger progress ring (80px mobile/100px desktop), better flexbox distribution, centered elements. Mobile Bottom Bar complete overhaul: full width (100vw), larger icons (1.75rem), larger text (0.75rem), 48px touch targets, improved floating menu button (60px with high contrast), better spacing and shadows |
| v90 | 2026-03-01 | Settings consolidation: unified settings interface with tabs, removed duplicate SettingsModal, mobile-friendly navigation dropdown, complete Firebase/GitHub/Printer config in Integrations tab |
| v87 | 2026-03-01 | Mobile UI improvements, touch targets, responsive fixes |
| v84 | 2026-03-01 | Firebase Storage integration, bottom buttons fix |

---

## 11. EXTERNAL DEPENDENCIES

### 11.1 CDN Resources
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js"></script>
```

### 11.2 Google Drive Sync
- **Path**: `Gdrive:OpenClaw-Workspace/Mission Control V5 Updates/`
- **Frequency**: Every 8 hours (cron job)
- **Exclusions**: `.git/`, `node_modules/`

---

## 12. CONTACT & CONTEXT

- **Owner**: Oleg (KimiClaw#3259)
- **Business**: OZ3DPrint (Etsy)
- **Location**: Seattle (America/Los_Angeles timezone)
- **Communication**: Async, detailed responses preferred
- **Current Focus**: Mobile UX polish, Firebase integration

---

## 13. QUICK REFERENCE

### 13.1 Common Tasks
```bash
# Sync to Google Drive
rclone sync /root/.openclaw/workspace/Mission-Control-V5 "Gdrive:OpenClaw-Workspace/Mission Control V5 Updates/" --exclude ".git/**" --exclude "node_modules/**"

# Bump version
# Edit main.js: const APP_VERSION = 'vXX'
# Edit sw.js: const CACHE_NAME = 'mission-control-v5-cache-vXX'
# Update all ?v=XX in index.html
```

### 13.2 Key Files to Know
- `main.js` - App entry, version, imports
- `js/state/store.js` - State management
- `js/components/` - Reusable UI
- `js/sections/` - Page content
- `css/` - All styles (mobile-first)
- `sw.js` - Service worker, caching

### 13.3 Debugging Tips
- Check version in console (APP_VERSION)
- Hard refresh (Ctrl+Shift+R) to clear cache
- Check Service Workers in DevTools
- Verify Firebase config in localStorage
- Check Network tab for failed requests

---

## 14. ACTIVE DEVELOPMENT TASKS

### 14.1 Priority-File Association System - Part 2 (IN PROGRESS)
**Status**: In Progress  
**Priority**: High  

**Sub-task A: Priority Page File Display** (ASSIGNED)
- Add file attachment section to priority detail view
- Show download links for associated files
- Allow uploading files directly from priority page

**Sub-task B: Docs Upload Modal Fixes** (ASSIGNED)
- Fix visual glitches in upload modal
- Ensure proper mobile responsiveness
- Test category/priority selectors

**Sub-task C: Mobile Bottom Bar & Menu** (ASSIGNED)
- Fix bottom bar sizing issues
- Ensure floating menu button appears and works
- Test on various mobile screen sizes

**Sub-task D: Dashboard Revenue Trend** (ASSIGNED)
- Fix revenue trend section sizing
- Ensure chart displays properly on all screen sizes
- Mobile optimization

**Sub-task E: Settings Consolidation** (ASSIGNED)
- Merge duplicate settings sections
- Create unified, easy-to-use settings interface
- Ensure all Firebase/GitHub config in one place

---

**END OF STATE DOCUMENT**

This file should be updated whenever:
- New major features are added
- Architecture changes
- New components are created
- Version is bumped significantly
