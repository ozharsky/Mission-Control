#!/bin/bash
# Commit script for Mission Control V6 changes

cd /root/.openclaw/workspace/00-Mission-Control

git add -A

git commit -m "MC6: UI/UX improvements and bug fixes

- Fixed mobile bottom nav active state styling
- Added 44px touch targets to buttons, tags, filters, pagination
- Fixed modal scroll issues on mobile
- Fixed store data structure (docs → documents)
- Added priority due date color coding (overdue/soon/upcoming)
- Added completed priority visual distinction
- Fixed calendar view toggle buttons
- Added Discord webhook notifier to sync
- Fixed progress cancel button touch target
- Fixed toast close button touch target
- Added mobile-visual.css with activity feed styles
- Updated service worker with new CSS files
- Added CSS variable aliases for backward compatibility"

echo "Changes committed successfully!"
