# Mission Control - Data Safety Guidelines

## ⚠️ CRITICAL: How to Add Data Without Breaking Arrays

### The Problem
Firebase PATCH converts arrays to objects with numeric keys:
```javascript
// Before (array):
projects: { inprogress: [{id: 1}, {id: 2}] }

// After PATCH (object):
projects: { inprogress: {"0": {id: 1}, "1": {id: 2}} }
```

This breaks the JavaScript `.filter()` and `.map()` methods!

---

## ✅ Safe Methods to Add Data

### Method 1: Use Mission Control UI (Safest)
Always add projects/priorities through the Mission Control interface:
1. Click "+ Add Project" or "+ Add Priority"
2. Fill in the form
3. Click Save

This ensures proper array handling.

### Method 2: Use PUT to Replace Entire Array
If you MUST add via API, replace the entire array:

```bash
# 1. First GET the current array
curl -s "https://mission-control-sync-default-rtdb.firebaseio.com/missionControl/projects/inprogress.json"

# 2. Add your item to the array locally
# 3. PUT the entire array back (NOT PATCH)
curl -X PUT "https://mission-control-sync-default-rtdb.firebaseio.com/missionControl/projects/inprogress.json" \
  -H "Content-Type: application/json" \
  -d '[{...existing items...}, {...new item...}]'
```

### Method 3: Use the Server API
If the Node.js server is running, use its REST endpoints which handle arrays properly.

---

## ❌ NEVER Do This

```bash
# DON'T use PATCH on arrays - converts them to objects!
curl -X PATCH ".../inprogress.json" -d '{"newId": {...}}'

# DON'T use PUT on individual items
curl -X PUT ".../inprogress/0.json" -d '{...}'
```

---

## Recovery Steps (If Data Gets Corrupted)

1. **Check GitHub snapshot** - `data/mc-data.json` in your repo
2. **Download and restore**:
   ```bash
   curl -s "https://raw.githubusercontent.com/ozharsky/Mission-Control/main/data/mc-data.json" \
     | curl -X PUT "https://mission-control-sync-default-rtdb.firebaseio.com/missionControl.json" \
       -H "Content-Type: application/json" -d @-
   ```
3. **Refresh Mission Control** - data should be restored

---

## Backup Strategy

1. **GitHub snapshots** - Create regularly via UI button
2. **Auto-backup** - Runs every 5 minutes if configured
3. **Google Drive** - Workspace backed up every 8 hours

---

## Testing Changes

Before making manual Firebase changes:
1. Create a GitHub snapshot first
2. Test on a copy of the data
3. Verify arrays are preserved
4. If broken, restore from snapshot

---

Last updated: 2026-02-23
