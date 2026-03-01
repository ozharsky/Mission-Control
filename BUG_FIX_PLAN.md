# Mission Control V5 - BUG FIX PLAN
**Date:** 2026-03-01
**Version:** v101
**Status:** Critical bugs found, fixes in progress

---

## CONFIRMED BUGS

### 1. 404 Errors for Deprecated CSS Files 🔴 CRITICAL
**Symptom:** Browser console shows 404 errors for CSS files that were moved to `_deprecated/`

**Files causing 404s:**
- enhanced-animations.css?v=100
- enhanced-hover.css?v=100
- ui-polish.css?v=100
- ui-polish-enhanced.css?v=100
- accessibility-enhanced.css?v=100
- button-enhanced.css?v=100
- form-enhanced.css?v=100
- modal-enhanced.css?v=100

**Root Cause:** `index.html` still has `<link>` tags for these files after they were moved to `css/_deprecated/`

**Fix:** Remove all deprecated CSS links from index.html

---

### 2. Mobile Menu Button Not Working 🔴 CRITICAL
**Symptom:** Menu button is visible but clicking it doesn't open the navigation

**Root Cause:** Event listener not properly attached or `toggleMobileMenu` not exposed globally

**Fix:** 
- Ensure `toggleMobileMenu` is exposed on `window`
- Add click event listener in Navigation.js
- Test the click handler

---

### 3. Printer API CORS Error 🔴 CRITICAL
**Symptom:** `Access to fetch blocked by CORS policy`

**Error:**
```
Access to fetch at 'https://mission-control-fawn-eight.vercel.app/js/api/printers?action=get_printers' 
from origin 'https://ozharsky.github.io' has been blocked by CORS policy
```

**Root Cause:** Vercel proxy doesn't have CORS headers configured

**Fix:** Update Vercel proxy to add CORS headers:
```javascript
// vercel.json or API route
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
```

**Alternative:** Disable printer polling temporarily until CORS is fixed

---

### 4. Notifications Not Working 🟡 MEDIUM
**Symptom:** Notifications system not functioning

**Investigation needed:**
- Check notification permission request
- Check notification display logic
- Check service worker for push support

---

## FIX IMPLEMENTATION PLAN

### Subagent 1: Fix index.html (Remove Deprecated CSS)
**Task:** Remove all deprecated CSS links from index.html
**Files:** index.html
**Time:** 10 minutes
**Priority:** CRITICAL

### Subagent 2: Fix Mobile Menu Button
**Task:** Debug and fix mobile menu button click handler
**Files:** js/components/Navigation.js, index.html
**Time:** 20 minutes
**Priority:** CRITICAL

### Subagent 3: Fix Printer CORS
**Task:** Either fix CORS on Vercel or disable printer polling
**Files:** js/api/printers.js, js/sections/Inventory.js
**Time:** 15 minutes
**Priority:** CRITICAL

### Subagent 4: Fix Notifications
**Task:** Debug and fix notification system
**Files:** js/utils/notifications.js, sw.js
**Time:** 20 minutes
**Priority:** MEDIUM

### Subagent 5: Final Test & Sync
**Task:** Test all fixes, version bump to v102, sync to Google Drive
**Time:** 15 minutes
**Priority:** HIGH

---

## SUCCESS CRITERIA

- [ ] No 404 errors in console
- [ ] Mobile menu button opens navigation
- [ ] No CORS errors for printers (or printers disabled gracefully)
- [ ] Notifications working (or gracefully degraded)
- [ ] All functionality works on mobile
- [ ] All functionality works on desktop

---

## NOTES

The layout rebuild (v101) was successful structurally, but:
1. index.html wasn't fully cleaned up
2. Some JavaScript event handlers need fixing
3. External API (Vercel) needs CORS configuration

These are "little bugs all over" that need systematic fixing.

---
