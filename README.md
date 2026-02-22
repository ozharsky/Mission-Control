# Mission Control

**Central command for OZ3DPrint business operations.**

Live Dashboard: https://ozharsky.github.io/mission-control/

## Overview

Mission Control is a self-contained business operations dashboard with:
- 📊 Real-time metrics (orders, revenue, goals)
- 📋 Kanban project management
- ⭐ Priority tracking with due dates
- 🗓️ Business timeline with milestones
- 🎯 Lead management
- 🖨️ 3D printer status (via SimplyPrint API)
- 💾 GitHub-powered data persistence

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Browser       │────▶│  GitHub Pages   │────▶│  Static HTML    │
│   (User)        │     │  (Hosting)      │     │  (Dashboard)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                               │
         │                                               │
         ▼                                               ▼
┌─────────────────┐                          ┌─────────────────┐
│  GitHub API     │◀─────────────────────────│  GitHub Repo    │
│  (Data Storage) │                          │  (JSON Files)   │
└─────────────────┘                          └─────────────────┘
```

## Data Flow

1. **Dashboard** loads from GitHub API (or localStorage fallback)
2. **User actions** update local state immediately
3. **Auto-save** pushes changes to GitHub API
4. **Version history** maintained via Git commits

## Setup

### 1. Fork/Clone this repo

```bash
git clone https://github.com/ozharsky/mission-control.git
cd mission-control
```

### 2. Configure GitHub Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` scope
3. Open dashboard → Settings → Enter token

### 3. Enable GitHub Pages

1. Repo Settings → Pages
2. Source: Deploy from a branch
3. Branch: main / (root)
4. Save

## Local Development

```bash
# Start local server
python3 -m http.server 8000

# Or with Node
npx serve .
```

Visit http://localhost:8000

## Data Structure

All data stored in `data/` directory:

- `mc-data.json` - Main dashboard data
- `mc-activity.json` - Activity log

### Schema

```json
{
  "orders": 125,
  "ordersTarget": 150,
  "revenueGoal": 5400,
  "totalRevenue": 3248.80,
  "revenueHistory": [...],
  "priorities": [...],
  "projects": {
    "backlog": [...],
    "inprogress": [...],
    "done": [...]
  },
  "timeline": [...],
  "leads": [...],
  "events": [...]
}
```

## API Endpoints (GitHub)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/repos/{owner}/{repo}/contents/data/mc-data.json` | Load data |
| PUT | `/repos/{owner}/{repo}/contents/data/mc-data.json` | Save data |
| GET | `/repos/{owner}/{repo}/contents/data/mc-activity.json` | Load activity |
| PUT | `/repos/{owner}/{repo}/contents/data/mc-activity.json` | Save activity |

## Features

- ✅ **Zero backend** - Pure client-side + GitHub API
- ✅ **Version control** - Every change is a commit
- ✅ **Free hosting** - GitHub Pages
- ✅ **Offline support** - localStorage fallback
- ✅ **Cross-device sync** - Access from anywhere
- ✅ **Private data** - Token-based access control

## File Structure

```
mission-control/
├── index.html              # Main dashboard
├── github-storage.js       # GitHub API adapter
├── data/
│   ├── mc-data.json       # Main data file
│   └── mc-activity.json   # Activity log
├── server.mjs             # Optional local server
├── printer-api.py         # SimplyPrint integration
└── README.md
```

## Security Notes

- GitHub token stored in browser localStorage
- Use fine-grained tokens with minimal permissions
- Repo can be private for data privacy
- Token never sent to third-party servers

## License

MIT - Free to use and modify.
