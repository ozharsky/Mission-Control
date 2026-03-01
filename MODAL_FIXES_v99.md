# Mobile Modal Fixes - v99

## Issues Found

1. **Modal sizing inconsistent** - `modal.css` and `mobile-components.css` had conflicting mobile modal styles
2. **No scroll lock** - Body could scroll behind modals on mobile
3. **Form layout issues** - Two-column grids were too cramped on mobile
4. **Button stacking** - Primary button wasn't consistently on top
5. **Missing sticky header/footer** - Modal header/footer could scroll out of view

## Changes Made

### CSS Changes

#### `css/modal.css`
- Consolidated mobile modal styles
- Added `position: sticky` to header and footer
- Fixed `max-height: calc(90vh - 140px)` for modal body
- Added `overscroll-behavior: contain` to prevent body scroll
- Added CSS to force single-column layout for form grids on mobile
- Added CSS for template grid (2 columns on mobile)
- Primary button now appears on top in stacked layout

#### `css/mobile-components.css`
- Updated mobile modal section with consistent styles
- Added sticky header/footer positioning
- Added body scroll lock CSS classes
- Added landscape mobile adjustments

### JavaScript Changes

#### New File: `js/utils/modalScrollLock.js`
- `lockBodyScroll()` - Locks body scroll, saves position
- `unlockBodyScroll()` - Restores body scroll and position
- `forceUnlockBodyScroll()` - Emergency cleanup
- Prevents touchmove events on body when modal is open
- Tracks nested modal opens with counter

#### Updated Modal Components:
1. **PriorityModal.js** - Added scroll lock on open/close
2. **ProjectModal.js** - Added scroll lock on open/close
3. **EventModal.js** - Added scroll lock on open/close
4. **EditProjectModal.js** - Added scroll lock on open/close
5. **EditPriorityModal.js** - Added scroll lock on open/close
6. **BackupModal.js** - Added scroll lock on open/close
7. **SampleDataModal.js** - Added scroll lock on open/close
8. **ShortcutsHelp.js** - Added scroll lock on open/close

### Version Bump
- main.js: v99 (already set)
- sw.js: v99 (already set)
- index.html: All cache-busting query params updated to ?v=99

## Success Criteria

- [x] Modal fits viewport (max-height: 90vh)
- [x] Content scrollable within modal body
- [x] Buttons always visible (sticky footer)
- [x] Forms usable (single column on mobile, 16px font to prevent iOS zoom)
- [x] No body scroll behind modal (scroll lock implemented)
- [x] Primary button on top in stacked layout
- [x] Template grid responsive (2 columns on mobile)
- [x] Safe area insets handled for notched devices

## Testing Notes

Test on mobile devices or Chrome DevTools mobile emulation:
1. Open any modal (Add Priority, Add Project, etc.)
2. Verify body doesn't scroll behind modal
3. Verify modal content scrolls smoothly
4. Verify buttons are always visible at bottom
5. Verify form inputs are usable (16px font size)
6. Verify template cards display in 2 columns
