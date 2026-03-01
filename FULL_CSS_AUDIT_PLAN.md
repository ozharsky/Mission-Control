# Mission Control V5 - Full CSS Audit Plan

## Goal
Audit ALL CSS across all 14 pages to identify inconsistencies, broken styles, and elements that don't match the design system.

## Pages to Audit (14 total)
1. Dashboard
2. Projects
3. Priorities
4. Revenue
5. Notes
6. Calendar
7. Events
8. Inventory (Printers)
9. SKUs
10. Leads
11. Timeline
12. Review
13. Docs
14. Settings

## Audit Checklist Per Page

### Buttons
- [ ] Primary buttons use `.m-btn-primary`
- [ ] Secondary buttons use `.m-btn-secondary`
- [ ] All buttons have `.m-touch` class
- [ ] No inline styles on buttons
- [ ] Button colors match design system

### Cards
- [ ] Cards use `.m-card` class
- [ ] No old card classes (`.card`, `.panel`)
- [ ] Consistent padding and borders
- [ ] Proper hover/active states

### Forms/Inputs
- [ ] Inputs use `.m-input` class
- [ ] Labels use `.m-label`
- [ ] No inline styles on form elements
- [ ] Proper focus states

### Typography
- [ ] Headings use `.m-title`, `.m-headline`
- [ ] Body text uses `.m-body`
- [ ] Captions use `.m-caption`
- [ ] No hardcoded font sizes

### Status Badges
- [ ] Use `.m-badge-*` classes
- [ ] Consistent colors across pages
- [ ] No inline background colors

### Layout
- [ ] Proper spacing with `.m-stack-*`
- [ ] Grid uses `.m-grid`
- [ ] No hardcoded margins/padding
- [ ] Mobile-responsive

### Icons
- [ ] All icons use Lucide
- [ ] No emoji icons
- [ ] Proper sizing

## Common Issues to Look For
1. Inline styles (style="...")
2. Old CSS classes (card, panel, btn-primary-old)
3. Missing .m-touch on interactive elements
4. Hardcoded colors instead of CSS variables
5. Inconsistent spacing
6. Elements not using design system

## Workflow B Execution

### Phase 1: Audit All Pages (Parallel)
Spawn 5 subagents, each auditing 3 pages:
- Subagent A: Dashboard, Projects, Priorities
- Subagent B: Revenue, Notes, Calendar
- Subagent C: Events, Inventory, SKUs
- Subagent D: Leads, Timeline, Review
- Subagent E: Docs, Settings (plus cross-check)

### Phase 2: Consolidate Findings
Compile all issues into master list, prioritize by severity

### Phase 3: Fix Issues (Sequential)
Spawn subagents to fix issues page by page

### Phase 4: Verify & Push
Test all fixes, push to GitHub

## Success Criteria
- [ ] All 14 pages use consistent CSS classes
- [ ] No inline styles remain
- [ ] All buttons look consistent
- [ ] All cards look consistent
- [ ] Mobile navigation works on all pages
- [ ] No console errors
