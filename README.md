# HomeScouter

A premium real estate scoring tool that evaluates any address on four key dimensions: crime safety, walkability, property fit, and proximity to Trader Joe's.

Built as a portfolio project — React + Vite, deployed to GitHub Pages.

## Live Demo

[homescouter.github.io/HomeScouter](https://yourusername.github.io/HomeScouter/)

## Features

- **Address Search** — Autocomplete geocoding via Nominatim (OpenStreetMap)
- **Interactive Map** — Dark-themed Leaflet map with home + Trader Joe's pins
- **Crime Score** — State-level data from the FBI Crime Data Explorer API
- **Walk Score** — Walkability index (requires free API key)
- **Property Fit** — Score based on beds, baths, and rent vs. area median
- **Trader Joe's Proximity** — Nearest location via Google Places API
- **Composite Score** — Weighted average of all four pillars (A–F grade)
- **Radar Chart** — Visual breakdown of all category scores
- **Adjustable Weights** — Sliders to customize which factors matter most
- **Save & Compare** — Store up to 10 addresses in localStorage
- **Share via URL** — Encode scores in query parameters for sharing
- **Dark/Light Mode** — Toggleable theme with persistent preference

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/yourusername/HomeScouter.git
cd HomeScouter
npm install
```

### 2. Configure API keys

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

| Variable | Source | Required? |
|---|---|---|
| `VITE_WALKSCORE_KEY` | [walkscore.com/professional/api.php](https://www.walkscore.com/professional/api.php) | Optional (falls back to estimate) |
| `VITE_GOOGLE_PLACES_KEY` | [console.cloud.google.com](https://console.cloud.google.com) | Optional (Trader Joe's disabled without it) |
| `VITE_FBI_API_KEY` | Pre-configured public key | Already set |

For `VITE_GOOGLE_PLACES_KEY`, enable these APIs in your Google Cloud project:
- Maps JavaScript API
- Places API

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000/HomeScouter/](http://localhost:3000/HomeScouter/)

### 4. Build for production

```bash
npm run build
```

## Deployment (GitHub Pages)

### Option A: GitHub Actions (recommended)

1. Push to `main` branch — the workflow in `.github/workflows/deploy.yml` handles the rest
2. In your repo settings, go to **Pages** → Source: **GitHub Actions**
3. Add your API keys as repository secrets (Settings → Secrets → Actions)

### Option B: Manual deploy

```bash
npm run deploy
```

## Scoring Logic

### Composite Score
```
composite = Σ(score_i × weight_i) / Σ(weight_i)
```

Default weights: 25% each. User-adjustable via sliders.

### Crime Score
```
score = max(0, 100 - (violent_crime_rate_per_100k / 8))
```
National average: ~380/100k → score ~52. Source: FBI CDE API.

### Walk Score
Uses Walk Score API (0-100 native). Falls back to urban density heuristic if API unavailable.

### Property Score
| Factor | Weight | Criteria |
|---|---|---|
| Beds match | 40 pts | 40=exact, 28=±1, 15=±2 |
| Baths match | 30 pts | 30=exact, scale down for gap |
| Rent vs median | 30 pts | 30=≤80% median, 0=>150% median |

### Proximity Score (Trader Joe's)
| Distance | Score |
|---|---|
| <0.5 mi | 100 |
| 0.5–1 mi | 85 |
| 1–2 mi | 65 |
| 2–5 mi | 40 |
| 5–10 mi | 15 |
| >10 mi | 0 |

## Grade Scale

| Grade | Score | Label |
|---|---|---|
| A | 90–100 | Excellent |
| B | 80–89 | Great |
| C | 70–79 | Good |
| D | 60–69 | Fair |
| F | 0–59 | Poor |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Maps | Leaflet + React-Leaflet |
| Charts | Recharts |
| State | Zustand (with localStorage persistence) |
| Geocoding | Nominatim (OpenStreetMap) |
| Crime Data | FBI Crime Data Explorer API |
| Walk Score | Walk Score Professional API |
| Places | Google Maps JS API (Places library) |
| Deployment | GitHub Pages via GitHub Actions |

## License

MIT — free for personal and portfolio use.

---

*Data sources: FBI CDE, OpenStreetMap/Nominatim, Walk Score, Google Places. Crime scores are state-level estimates. This is not financial or real estate advice.*
