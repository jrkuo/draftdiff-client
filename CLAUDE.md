# DraftDiff Client

## Project Overview

DraftDiff is a **Dota 2 draft analysis web application** that helps players analyze matchups between two teams. It provides a visual interface for comparing hero picks and assessing draft differences, with comfort zone analysis and intuitive drag-and-drop interactions.

**Tech Stack:** React 18 + React Router + Styled Components + PostHog Analytics
**Deployment:** Cloudflare Pages
**Data Source:** AWS S3 (gzipped JSON matchup data)

---

## Project Structure

```
draftdiff-client/
├── src/
│   ├── App.js                    # Root component with sidebar layout & mode toggle
│   ├── App.css                   # Main layout styles
│   ├── SelectTable.js            # Core: Dual team comparison table (374 LOC)
│   ├── SelectTable.css           # Data table styling
│   ├── component/
│   │   ├── heroCell.js           # Draggable hero display card
│   │   ├── TeamCell.js           # Hero pick slots (5 per team)
│   │   ├── ComfortZone.js        # Drag-drop zone for comfort heroes
│   │   └── *.css                 # Component styles
│   ├── constants/
│   │   └── heroes.js             # Master hero list (~120 heroes)
│   ├── hooks/
│   │   └── useHeroData.js        # Custom hook for S3 data loading
│   ├── utils/
│   │   └── s3DataLoader.js       # S3 data fetching utility
│   ├── types/
│   │   └── heroTypes.js          # Type definitions & S3 config
│   └── img/heroes/               # ~120 hero icon PNG files
├── public/                       # Static assets
├── scripts/
│   └── download_hero_icons.py    # Python script for hero icons
└── package.json
```

---

## Core Features

### 1. Dual Team Draft Comparison
- Side-by-side **Ally Team** vs **Enemy Team** analysis
- Each team can pick up to **5 heroes**
- Real-time matchup statistics in sortable data tables
- URL-based state management for shareability

### 2. Matchup Analysis
- Displays win-rate percentages for each hero pair
- Color-coded: **Green** for positive matchups (>0), **Red** for negative (<0)
- **Grand Total** column shows cumulative matchup strength
- Data loaded from AWS S3 (gzipped JSON format)

### 3. Comfort Zone System
- Drag-drop interface to mark heroes as "comfort picks"
- Emoji indicators: 😊 (your team), 😈 (enemy team)
- Horizontal scrolling with wheel support
- URL parameter persistence

### 4. Hero Selection
- **120+ Dota 2 heroes** with icons
- Filter search by hero name or initials
- Drag-drop from sidebar to team slots or comfort zones
- Two display sizes: full (sidebar) and small (tables/zones)

### 5. Mode Toggle
- **Draft Diff Mode:** Active - Full comparison interface
- **Draft Game Mode:** Placeholder for future functionality

---

## Key Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI framework |
| React Router DOM | 6.26.1 | Client-side routing |
| React Data Table Component | 7.6.2 | Sortable data tables |
| React Select | 5.8.0 | Searchable dropdowns |
| Styled Components | 6.1.12 | CSS-in-JS styling |
| PostHog JS | 1.161.3 | Product analytics |
| Pako | 2.1.0 | Gzip compression |
| Axios | 1.8.4 | HTTP client |
| Create React App | 5.0.1 | Build tooling |
| Wrangler | 3.65.1 | Cloudflare deployment |

---

## Important Components

### `App.js`
Root component managing:
- Layout structure (sidebar + main content)
- Mode toggle (Diff/Game)
- Hero filter and list in sidebar
- DualSelectTable container

### `SelectTable.js` (Core Logic)
**`DualSelectTable()`**: Container for both teams
- Manages ally/enemy comfort heroes and picks
- Coordinates URL parameter sync

**`SelectTable()`**: Individual team component
- Loads matchup data via `useHeroData()` hook
- Generates data table columns dynamically
- Integrates ComfortZone and TeamCell components
- Handles URL parameter sync for picks/comfort

### `ComfortZone.js`
- Drag-drop container for comfort hero picks
- Horizontal scrolling with wheel support
- Displays comfort heroes with remove buttons
- URL persistence for selections

### `TeamCell.js`
- 5-slot grid for team hero selections
- Drag-drop functionality
- Prevents duplicate hero picks across teams
- Styled as gray container with dashed slot borders

### `HeroCell.js`
Reusable draggable hero card:
- Two sizes: regular (16:9 aspect) and small (54px height)
- Shows hero image from local file
- Remove button (hover, small variant only)
- Drag data includes hero name and type

### `useHeroData()` Hook
- Async data loading from S3
- Returns `{ data, loading, error }`
- Provides matchup data keyed by hero name

---

## Data Flow

```
AWS S3 (data.json.gz)
         ↓
useHeroData() → fetches & decompresses
         ↓
SelectTable (Ally & Enemy) → processes matchup data
         ↓
DataTable Component → displays with sorting/filtering
         ↓
URL Parameters → maintains state persistence
```

### Data Structure
```javascript
{
  "Axe": [
    { name: "Anti-Mage", Axe: 0.45, ... },
    { name: "Crystal Maiden", Axe: 0.52, ... }
  ],
  "Anti-Mage": [ ... ],
  // ... ~120 heroes
}
```

### URL Parameters
- `?allyPicks=Axe,Anti-Mage,...`
- `&allyComfort=Crystal%20Maiden,...`
- `&enemyPicks=...`
- `&enemyComfort=...`

---

## Configuration

### S3 Data Source
Located in [src/types/heroTypes.js](src/types/heroTypes.js):
```javascript
export const S3_BUCKET_URL = 'https://draftdiff.s3.amazonaws.com';
export const S3_DATA_FILE = 'public/data.json.gz';
```

### Heroes List
[src/constants/heroes.js](src/constants/heroes.js) contains ~120 hero definitions:
```javascript
{ value: 'Anti-Mage', label: 'Anti-Mage', image: '/img/heroes/antimage.png' }
```

### Environment Variables
Create `.env` file with:
```
REACT_APP_PUBLIC_POSTHOG_KEY=your_posthog_key
REACT_APP_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## Development

### Setup
```bash
npm install
npm start              # Dev server on localhost:3000
```

### Available Scripts
```bash
npm start              # Development mode
npm run build          # Production build
npm test               # Run tests
npm run deploy         # Build & deploy to Cloudflare Pages
npm run preview        # Build & preview locally
```

### Hero Icons
Download hero icons from Steam CDN:
```bash
python scripts/download_hero_icons.py
```

---

## Styling Architecture

### Key CSS Classes
- `.AppLayout`: Full-height flex container (sidebar + main)
- `.Sidebar`: 250px fixed width with scrollable hero list
- `.MainContent`: Flex-grow container for dual tables
- `.hero-cell`: Full size (16:9 aspect, draggable)
- `.hero-cell-small`: Compact version (54px height)
- `.team-cell-container`: Gray flex container for pick slots
- `.team-slot`: Individual hero slot (96x54px, dashed borders)
- `.comfort-zone-container`: Horizontal scrolling zone

### Styling Features
- Hidden scrollbars (Firefox, Chrome, Edge)
- Drag-over state highlighting
- Color-coded matchup strength (green/red)
- Hover effects and transitions
- Responsive flex layouts

---

## Build & Deployment

**Bundler:** Webpack (via Create React App)
**Hosting:** Cloudflare Pages
**Build Output:** `/build` directory

### Deployment
```bash
npm run deploy         # Build and push to Cloudflare Pages
npm run preview        # Test locally with Pages dev server
```

---

## Recent Development History

- `b9f318c` - Reworked the UI (latest)
- `955dfe2` - Reading from S3
- `d725f69` - Search by initials functionality
- `fe31d87` - PostHog analytics integration
- `43767f9` - Added Kez hero
- `f2ef212` - Primary feature (SelectTable)

---

## Known Limitations & TODOs

1. **Draft Game Mode** - Currently just a placeholder message
2. **Test Coverage** - Minimal testing with React Testing Library
3. **Axios** - Imported but not actively used (fetch API used instead)
4. **Pako** - Imported but browser handles gzip automatically

---

## External Dependencies

- **AWS S3:** Hosts matchup data (public bucket)
- **PostHog:** Analytics platform
- **Cloudflare Pages:** Hosting & CI/CD
- **Steam CDN:** Hero icon source (via Python script)

---

## Contributing

**Repository:** `git@github.com:jrkuo/draftdiff-client.git`
**License:** MIT (Copyright 2024 Jeffrey Kuo)
**Main Branch:** main

---

## Architecture Notes for AI Assistants

### When Working with This Codebase:

1. **State Management**: This app uses URL parameters extensively for state persistence. Any changes to hero picks or comfort zones should update URL params.

2. **Data Loading**: Hero matchup data is fetched once on mount via the `useHeroData()` hook. The data structure is keyed by hero name with arrays of matchup objects.

3. **Drag & Drop**: The app uses HTML5 drag-and-drop API. Data transfer format is JSON with `{ heroName, type }`.

4. **Duplicate Prevention**: Heroes cannot be picked by both teams. Check both ally and enemy picks before allowing drops.

5. **Component Hierarchy**:
   ```
   App
   └── DualSelectTable
       ├── SelectTable (Ally)
       │   ├── ComfortZone
       │   ├── TeamCell
       │   └── DataTable
       └── SelectTable (Enemy)
           ├── ComfortZone
           ├── TeamCell
           └── DataTable
   ```

6. **Styling**: Mix of CSS modules and inline styles. Main layout uses flexbox. Tables use React Data Table Component with custom styling hooks.

7. **Analytics**: PostHog is initialized in [src/index.js](src/index.js). Can track custom events throughout the app.

8. **Hero Icons**: All stored locally in [src/img/heroes/](src/img/heroes/). Names are normalized (lowercase, no spaces/special chars).
