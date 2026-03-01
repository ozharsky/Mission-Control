# Mission Control V5 - Complete UI/UX Redesign Plan

## Current Issues
- Inconsistent styling across pages
- Printer cards not displaying correctly
- CSS caching issues
- Mixed design patterns (old + new)
- Mobile responsiveness problems

## Goal
Complete redesign with clean, consistent, modern UI that works perfectly on desktop and mobile.

## Design System

### Color Palette
- **Primary**: #6366f1 (Indigo)
- **Secondary**: #8b5cf6 (Purple)
- **Success**: #22c55e (Green)
- **Warning**: #f59e0b (Amber)
- **Danger**: #ef4444 (Red)
- **Background**: #0f0f1a (Dark)
- **Surface**: #1a1a2e (Card bg)
- **Border**: rgba(255,255,255,0.1)
- **Text Primary**: #ffffff
- **Text Secondary**: rgba(255,255,255,0.7)
- **Text Muted**: rgba(255,255,255,0.5)

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: 600 weight
- **Body**: 400 weight
- **Small**: 12px, 14px, 16px, 18px, 20px, 24px scale

### Spacing
- **Base unit**: 4px
- **Scale**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

### Components

#### Buttons
```
Primary: bg-indigo-500, white text, rounded-lg, px-4 py-2
Secondary: bg-transparent, border, rounded-lg, px-4 py-2
Danger: bg-red-500, white text, rounded-lg, px-4 py-2
Ghost: transparent, hover:bg-white/5
Size: min-height 44px (touch target)
```

#### Cards
```
Background: surface color
Border: 1px solid border color
Border-radius: 12px
Padding: 16px
Shadow: none (flat design)
Hover: border-color lighten
```

#### Inputs
```
Background: surface color
Border: 1px solid border color
Border-radius: 8px
Padding: 12px 16px
Focus: border-indigo-500, ring-2 ring-indigo-500/20
```

#### Badges
```
Small rounded pills
Padding: 4px 12px
Font-size: 12px
Variants: primary, success, warning, danger, neutral
```

## Layout Structure

### Mobile (< 768px)
- Single column layout
- Bottom navigation bar (70px height)
- Full-width cards
- Stacked elements

### Desktop (>= 768px)
- Sidebar navigation (240px width)
- Main content area
- Grid layouts where appropriate
- Max-width container (1400px)

## Page Structure

### 1. Dashboard
**Purpose**: Overview of all key metrics
**Elements**:
- Welcome header with stats
- Quick action buttons
- Active printers grid
- Recent jobs list
- Revenue chart
- Priority tasks

### 2. Printers (Inventory)
**Purpose**: Monitor and control 3D printers
**Elements**:
- Printer grid (2 columns desktop, 1 mobile)
- Each printer card shows:
  - Name + status badge
  - Live camera thumbnail (if available)
  - Temperatures (nozzle/bed)
  - Current job progress
  - Time remaining
  - Action buttons (pause, cancel)
- Filter by status
- Refresh button

### 3. Jobs
**Purpose**: View print jobs
**Elements**:
- Active jobs list
- Completed jobs list
- Job details: file, printer, progress, time
- Preview thumbnails

### 4. Priorities
**Purpose**: Task management
**Elements**:
- Kanban board (desktop) / List (mobile)
- Priority cards with:
  - Title, description
  - Due date
  - Assignee
  - Status
  - Tags
- Drag & drop (desktop)

### 5. Projects
**Purpose**: Project organization
**Elements**:
- Project cards
- Progress bars
- Team members
- Associated priorities

### 6. Revenue
**Purpose**: Financial tracking
**Elements**:
- Revenue chart
- Monthly stats
- Goals/progress
- Import from Etsy

### 7. Calendar
**Purpose**: Event scheduling
**Elements**:
- Month/week/day views
- Event cards
- SimplyPrint integration

### 8. Settings
**Purpose**: App configuration
**Elements**:
- Sections: General, Appearance, Integrations, Data
- Firebase config
- SimplyPrint config
- Theme toggle

## Navigation

### Mobile
- Bottom tab bar: Dashboard, Printers, Priorities, More
- "More" opens sheet with: Projects, Jobs, Revenue, Calendar, Settings

### Desktop
- Left sidebar with all sections
- Collapsible on smaller screens
- Active state indicator

## Animation & Interactions

### Transitions
- Page transitions: 200ms ease
- Card hover: 150ms ease
- Button press: 100ms ease
- Modal: 300ms ease-out

### Loading States
- Skeleton screens for cards
- Spinner for buttons
- Progress bars for jobs

### Feedback
- Toast notifications (bottom-right)
- Success: green
- Error: red
- Info: blue
- Warning: amber

## Technical Requirements

### CSS Architecture
- Single CSS file: `styles.css`
- CSS variables for theming
- Mobile-first media queries
- No inline styles
- BEM naming convention

### JavaScript
- Modular ES6 modules
- State management via store.js
- Event delegation
- Lazy loading for images
- Debounced search

### Performance
- Minified assets
- Optimized images
- Lazy load below fold
- Cache strategies

## Implementation Phases

### Phase 1: Foundation
- [ ] Create new CSS file with design system
- [ ] Update base HTML structure
- [ ] Implement navigation (mobile + desktop)
- [ ] Create component library (buttons, cards, inputs, badges)

### Phase 2: Pages
- [ ] Dashboard redesign
- [ ] Printers page with new card design
- [ ] Jobs page
- [ ] Priorities (kanban + list)
- [ ] Projects
- [ ] Revenue
- [ ] Calendar
- [ ] Settings

### Phase 3: Polish
- [ ] Animations & transitions
- [ ] Loading states
- [ ] Error handling
- [ ] Mobile optimization
- [ ] Accessibility (a11y)

### Phase 4: Testing
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Performance audit
- [ ] Bug fixes

## File Structure

```
/css
  styles.css (single file, all styles)
/js
  /components
    Button.js
    Card.js
    Input.js
    Badge.js
    Modal.js
    Toast.js
    Navigation.js
  /sections
    Dashboard.js
    Printers.js
    Jobs.js
    Priorities.js
    Projects.js
    Revenue.js
    Calendar.js
    Settings.js
  /utils
    store.js
    api.js
    helpers.js
  app.js (main entry)
index.html
```

## Success Criteria
- [ ] All pages use consistent design system
- [ ] Mobile-first, responsive on all devices
- [ ] No console errors
- [ ] Fast load times (< 3s)
- [ ] Smooth animations
- [ ] Accessible (keyboard nav, screen reader)
- [ ] SimplyPrint integration working
- [ ] All features functional

## Notes for Subagents
1. Read this plan completely before starting
2. Follow the design system exactly
3. Mobile-first approach always
4. Test on both desktop and mobile
5. Use Lucide icons only (no emojis)
6. CSS variables for all colors/spacing
7. No inline styles
8. Validate HTML/JS before committing
