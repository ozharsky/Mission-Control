# MISSION: Adapt React MobileNav to Vanilla JS

## Overview
Adapt the mobile navigation design from the React app to the current vanilla JS Mission Control V5.

## Reference Design (from React App)
- **Top header** with hamburger menu (Mission Control logo + menu button)
- **Bottom tab bar** with 5 main items + "More" button
- **Grid menu** (3x3) when "More" is clicked
- **Clean overlay** for closing

## Implementation Plan

### Phase 1: Create New Mobile Navigation Component
**Subagent 1:** Build the new mobile nav structure
- Create new Navigation.js with top header + bottom tabs + grid menu
- Replace problematic slide-out menu
- Use vanilla JS (no React dependencies)
- Keep existing store.js integration

### Phase 2: Style with CSS
**Subagent 2:** Create mobile-nav.css
- Top header: fixed, 56px height, backdrop blur
- Bottom tabs: fixed, 64px height, 5 items + more
- Grid menu: 3x3 grid, slides down from top
- Overlay: semi-transparent, clickable to close
- Use CSS variables for consistency

### Phase 3: Integrate and Test
**Subagent 3:** Wire everything together
- Update index.html to use new navigation
- Ensure all existing nav items work
- Test on mobile (375px, 414px)
- Verify touch targets (44px+)

## Key Features to Implement

### Top Header
```
[Logo] Mission Control    [☰ Menu]
```
- Fixed at top
- Backdrop blur effect
- Z-index: 50

### Bottom Tab Bar
```
[Home] [Projects] [Tasks] [Revenue] [More]
```
- Fixed at bottom
- 5 primary items
- "More" opens grid menu
- Active state highlighting

### Grid Menu (when "More" clicked)
```
[Dashboard] [Projects] [Tasks]
[Files]     [Printers] [Inventory]
[Calendar]  [Revenue]  [Settings]
```
- 3x3 grid layout
- Icons + labels
- Click to navigate
- Close on selection

## Technical Requirements

### Must Use:
- Existing store.js for state
- Existing section IDs
- CSS variables from variables.css
- `.m-touch` class for touch targets
- No inline styles

### Must NOT:
- Use React
- Use TypeScript
- Break existing desktop nav
- Change data layer

## Success Criteria
- [ ] Top header visible on mobile
- [ ] Bottom tabs visible and clickable
- [ ] Grid menu opens when "More" clicked
- [ ] All navigation items work
- [ ] Touch targets 44px+
- [ ] Smooth animations
- [ ] No console errors
- [ ] Desktop nav unchanged

## Files to Modify
- js/components/Navigation.js (replace)
- css/mobile-nav.css (create)
- index.html (update nav structure)
- sw.js (cache new CSS)

## Workflow
1. Subagent 1: Build navigation structure
2. Verify structure is correct
3. Subagent 2: Add CSS styling
4. Verify styling is correct
5. Subagent 3: Integration and testing
6. Final verification
7. Sync to Google Drive

## Timeline
- Phase 1: 30 min
- Phase 2: 25 min
- Phase 3: 20 min
- Total: ~75 min

## Risk Mitigation
- Keep backup of old Navigation.js
- Test desktop view after each change
- Verify all sections still accessible
- Check console for errors

---

Ready to start Phase 1?
