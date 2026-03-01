# SUBAGENT TASK TEMPLATE - Workflow B

## How to Use This Template

When spawning a subagent, copy this template and fill in the [BRACKETS]

---

## TASK INSTRUCTIONS

```
## MISSION: [Brief Task Name]

### BEFORE YOU START (MANDATORY)
1. Read `/root/.openclaw/workspace/Mission-Control-V5/MISSION_CONTROL_CONTEXT.md`
2. Read the REFERENCE implementation at `js/sections/Dashboard.js`
3. Read these RELATED files: [list other sections that should match]

### YOUR TASK
[Detailed description of what to do]

### REQUIREMENTS
- Use ONLY classes from CONTEXT.md (`.m-*` classes)
- Follow the EXACT pattern from Dashboard.js
- DO NOT create new CSS classes
- DO NOT use inline styles
- Ensure 44px touch targets
- Test at 375px width

### FILES TO MODIFY
- [List specific files]

### VERIFICATION CHECKLIST
Before reporting complete, verify:
- [ ] `node --check` passes on all JS files
- [ ] No horizontal scroll at 375px
- [ ] All touch targets 44px+
- [ ] Pattern matches Dashboard.js
- [ ] No new CSS classes created

### REPORT BACK
1. What files you modified
2. What pattern you followed (reference line numbers from Dashboard.js)
3. Any issues encountered
4. Confirmation all verification checks passed

### TIME LIMIT
[X] minutes. Report back when done or if stuck.
```

---

## EXAMPLE: Mobile Layout Fix for Revenue Section

```
## MISSION: Fix Revenue Section Mobile Layout

### BEFORE YOU START (MANDATORY)
1. Read `/root/.openclaw/workspace/Mission-Control-V5/MISSION_CONTROL_CONTEXT.md`
2. Read the REFERENCE implementation at `js/sections/Dashboard.js` (lines 45-120)
3. Read these RELATED files: `js/sections/Priorities.js`, `js/sections/Projects.js`

### YOUR TASK
Fix the Revenue section to use the same mobile layout pattern as Dashboard.

Current: Uses old inline styles
Target: Use `.m-card`, `.m-grid-2`, `.m-touch` classes

### REQUIREMENTS
- Use ONLY classes from CONTEXT.md (`.m-*` classes)
- Follow the EXACT pattern from Dashboard.js lines 45-120
- DO NOT create new CSS classes
- DO NOT use inline styles
- Ensure 44px touch targets
- Test at 375px width

### FILES TO MODIFY
- `js/sections/Revenue.js`

### VERIFICATION CHECKLIST
Before reporting complete, verify:
- [ ] `node --check js/sections/Revenue.js` passes
- [ ] No horizontal scroll at 375px
- [ ] All touch targets 44px+
- [ ] Pattern matches Dashboard.js
- [ ] No new CSS classes created

### REPORT BACK
1. What files you modified
2. What pattern you followed (reference line numbers from Dashboard.js)
3. Any issues encountered
4. Confirmation all verification checks passed

### TIME LIMIT
25 minutes. Report back when done or if stuck.
```

---

## WORKFLOW RULES

### 1. Sequential, Not Parallel
- Maximum 2 subagents at a time
- Wait for verification before next batch

### 2. Template First
- Subagent 1: Fix the "template" section (usually Dashboard)
- Verify it's perfect
- Then replicate to other sections

### 3. Replication Pattern
```
Subagent 1: Fix Dashboard (template) → VERIFY
Subagent 2: Apply Dashboard pattern to Priorities → VERIFY
Subagent 3: Apply Dashboard pattern to Projects → VERIFY
Subagent 4: Apply Dashboard pattern to Calendar → VERIFY
```

### 4. My Verification Steps
After each subagent:
1. Check their changes against CONTEXT.md
2. Run syntax check
3. Verify consistency with other sections
4. Update CONTEXT.md if needed
5. Only then spawn next subagent

---

## COMMON TASK TYPES

### Type A: Layout Fix
- Reference: Dashboard.js
- Pattern: `.m-card`, `.m-grid-*`, `.m-list-item`
- Check: No horizontal scroll

### Type B: Component Update
- Reference: mobile-components.css
- Pattern: `.m-btn`, `.m-input`, `.m-fab`
- Check: Touch targets 44px+

### Type C: Interaction Add
- Reference: mobileInteractions.js
- Pattern: `addTouchFeedback()`, `initSwipe()`
- Check: Touch feedback visible

---

## EMERGENCY PROCEDURES

### If Subagent Is Stuck
1. Ask them to report what they completed
2. Check their partial work
3. Either fix it yourself or respawn with clearer instructions

### If Subagent Creates Wrong Pattern
1. Reject the changes
2. Explain why it doesn't match CONTEXT.md
3. Respawn with clearer reference to Dashboard.js

### If Pattern Needs to Change
1. Update CONTEXT.md first
2. Update Dashboard.js (template)
3. Then replicate to other sections

---

**END OF TEMPLATE**
