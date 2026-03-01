# Mission Control V5 - Caching & CSS Consolidation Fix

## Problem Statement
- Browser caching old CSS/JS files
- Old CSS elements appearing on refresh
- Inconsistent styling across sections

## Root Causes
1. Aggressive service worker caching
2. Old CSS files still being referenced
3. Cache-busting not working properly
4. Multiple CSS files with overlapping styles

## Solution Plan (Workflow B)

### Phase 1: Audit Current State
**Task:** Find all CSS files and check which are actually needed
- List all CSS files in css/
- Check which are imported in index.html
- Identify deprecated files still being cached

### Phase 2: Consolidate CSS
**Task:** Merge all section-specific CSS into main files
- Move mobile-*.css content to mobile-components.css
- Move section-specific styles to components.css
- Ensure single source of truth for each component

### Phase 3: Fix Cache Busting
**Task:** Ensure all assets have proper cache-busting
- Update all ?v=XXX query strings
- Add cache-control headers (via meta tags)
- Fix service worker cache strategy

### Phase 4: Clean Up Old Files
**Task:** Remove deprecated CSS files
- Move old files to _deprecated/
- Update sw.js to not cache old files
- Ensure clean build

### Phase 5: Test & Verify
**Task:** Test all sections for consistent styling
- Check each section renders correctly
- Verify no old styles appearing
- Test on mobile and desktop

## Implementation Order
1. Audit → 2. Consolidate → 3. Fix Caching → 4. Clean Up → 5. Test

## Success Criteria
- [ ] All CSS in 3-5 files max
- [ ] No deprecated files being loaded
- [ ] Cache-busting works on every deploy
- [ ] Consistent styling across all sections
- [ ] No old CSS appearing on refresh
