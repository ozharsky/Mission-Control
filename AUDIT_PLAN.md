# Mission Control V5 - Complete Site Audit & Cleanup Plan

## Phase 1: Remove Search References
### Files to Check:
- js/components/Search.js (DELETE)
- js/components/CommandPalette.js (remove search functionality)
- js/sections/*.js (remove search inputs/buttons)
- index.html (remove search CSS/JS imports)
- css/search.css (DELETE)

## Phase 2: Remove Notifications References
### Files to Check:
- js/components/Toast.js (keep but check for notification-specific code)
- js/sections/*.js (remove notification bell/icons)
- js/state/store.js (check for notifications array)

## Phase 3: Remove Onboarding References
### Files to Check:
- js/components/SampleDataModal.js (DELETE if onboarding only)
- js/utils/onboarding.js (DELETE if exists)
- js/sections/*.js (remove onboarding tooltips/walkthroughs)

## Phase 4: Complete Site Audit
### Check Every File For:
1. **Syntax Errors** - Run `node --check` on all JS files
2. **Broken Imports** - Check all import statements resolve
3. **CSS Inconsistencies** - Ensure all elements use .m-* classes
4. **Missing Variables** - Check CSS variables are defined
5. **Console Errors** - Look for potential runtime errors

### Files to Audit:
#### JS Sections (14 files):
- js/sections/Dashboard.js
- js/sections/Projects.js
- js/sections/Priorities.js
- js/sections/Revenue.js
- js/sections/Notes.js
- js/sections/Calendar.js
- js/sections/Events.js
- js/sections/Inventory.js
- js/sections/SKUs.js
- js/sections/Leads.js
- js/sections/Timeline.js
- js/sections/Review.js
- js/sections/Docs.js
- js/sections/Settings.js

#### JS Components (40+ files):
- All files in js/components/
- All files in js/components/ui/
- All files in js/utils/
- All files in js/state/
- All files in js/api/

#### CSS Files (30+ files):
- All files in css/

#### HTML:
- index.html

## Success Criteria:
- [ ] No search functionality remains
- [ ] No notification system remains
- [ ] No onboarding system remains
- [ ] All JS files pass syntax check
- [ ] All imports resolve correctly
- [ ] Consistent styling across all pages
- [ ] No console errors
