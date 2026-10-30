# Sierra Leone — Interactive Political & Regional Telemetry Map

A production-grade geospatial web application for exploring the **Republic of Sierra Leone's** administrative boundaries, districts, cities, and real-time regional infrastructure telemetry across all five provinces (**Western Area**, **Northern Province**, **North West Province**, **Southern Province**, and **Eastern Province**).

---

## 1. Key Capabilities

### Cartographic & Geospatial Engine
- **Official GADM 4.1 Projected GeoJSON Boundaries**: High-precision vector polygons for all **5 administrative provinces** and **16 districts**, including coastal islands (Sherbro Island, Bonthe, Banana Islands), major river basins (Rokel, Sewa, Moa, Great & Little Scarcies), and the international border chain with **Guinea** and **Liberia**.
- **Bidirectional WGS84 Equirectangular Projection (`projectLngLat` / `unprojectPoint`)**: Real-time forward projection of WGS84 GPS coordinates (`°N, °W`) to SVG canvas space (`850 × 1024`) and inverse coordinate readout under the user's cursor.
- **40+ Georeferenced Cities & Towns**: Authentic GPS coordinates, population estimates, district capitals, elevations, landmarks, and socio-economic profiles.
- **Interactive Viewport Controls**: Smooth pan, zoom (`1x` – `3.2x`), one-click view reset, district boundary toggle, interactive symbol highlighting from the legend, and nearest-city spatial hit-testing (`findNearestCityAtPoint`).

### Real-Time Regional Metrics & Data Layer Switcher
- **5-Layer Sector Switcher**:
  - **Political**: Classic administrative map displaying the 5 provinces, 16 districts, national/provincial capitals, and international borders.
  - **Healthcare**: Hospital & Peripheral Health Unit (PHU) readiness index, solar vaccine cold-chain uptime, skilled maternal coverage, and NEMS ambulance response times.
  - **Telecom**: 4G LTE/5G population coverage, national ECOWAN fiber ring uptime, median broadband throughput, and active tower sites.
  - **Energy**: Bumbuna hydro & CLSG 225kV transmission grid availability, rural solar mini-grid share, regional load (`MW`), and voltage stability.
  - **Agri & Trade**: Export & market output index, rice/cocoa/coffee yield performance, port & cross-border corridor flow, and weekly regional trade tonnage.
- **Live Telemetry Stream Simulator**: Continuous 4.5-second interval telemetry stream (**Live** / **Paused** toggle) plus an instant **Pulse** trigger that deterministically updates regional KPIs, sub-metric progress bars, and status tiers.
- **Dynamic Choropleth Shading & On-Map KPI Badges**: Provinces dynamically re-color across 4 performance tiers (**Optimal**, **Good**, **Moderate**, **Priority**) with live on-canvas SVG KPI pills (`88.4% · Optimal`) and an adaptive bottom-left Legend card.
- **CSV / JSON Telemetry Export & WhatsApp Field Reporting**:
  - One-click **Export CSV** and **Export JSON** downloads for the active city and province's regional telemetry.
  - Interactive **WhatsApp Field Reporting** form allowing field coordinators to log status dispatches (**Nominal**, **Maintenance**, **Priority Alert**) directly into application state and generate formatted WhatsApp share payloads (`https://wa.me/?text=...`) with GPS coordinates and live sector scores.

---

## 2. Core Technologies & Tools Used

| Category | Technology / Tool | Version | Purpose in Application |
| :--- | :--- | :--- | :--- |
| **UI Framework** | **React** (`react`, `react-dom`) | `^19.0.1` | Component architecture, declarative SVG cartography, and reactive state management |
| **Language** | **TypeScript** (`typescript`) | `^7.0.2` | End-to-end static typing for GeoJSON rings, GPS coordinates, and telemetry schemas |
| **Build Tool & Dev Server** | **Vite** (`vite`, `@vitejs/plugin-react`) | `^8.3.0` | Fast ES module bundling, asset pipeline, and development server |
| **Styling System** | **Tailwind CSS v4** (`tailwindcss`, `@tailwindcss/vite`) | `^4.3.3` | Utility-first layout, glassmorphic floating toolbars, tabular numeral alignment, and responsive panels |
| **Iconography** | **Lucide React** (`lucide-react`) | `^0.546.0` | Vector UI icons for map controls, telemetry sectors, export actions, and field dispatches |
| **Geospatial Data** | **GADM 4.1 GeoJSON + Custom WGS84 Projection** | WGS84 (`EPSG:4326`) | Multi-ring polygon rendering for 5 provinces, 16 districts, rivers, and 40+ GPS city markers |
| **Unit Test Runner** | **Node.js Test Runner + TSX** (`node:test`, `tsx`) | `^4.21.0` | Zero-dependency unit testing of pure spatial filters, coordinate projection, and telemetry simulation |
| **Browser Verification** | **Playwright CLI** | Headless Chromium | Automated viewport rendering, DOM interaction, download verification, and console inspection |

---

## 3. Project Architecture & Directory Structure

```text
/
├── index.html                        # HTML5 entry point, Inter & JetBrains Mono fonts, OpenGraph metadata
├── metadata.json                     # Application metadata & capability manifest
├── package.json                      # Scripts, dependencies, and build configuration
├── tsconfig.json                     # TypeScript compiler configuration
├── vite.config.ts                    # Vite bundler & Tailwind CSS v4 plugin setup
├── public/
│   └── assets/
│       ├── africa-inset.png          # High-resolution Africa locator inset map
│       └── freetown-photo.png        # Freetown harbour & coastal mountains hero photograph
└── src/
    ├── main.tsx                      # React 19 root mount
    ├── index.css                     # Tailwind CSS v4 imports and custom scrollbar rules
    ├── App.tsx                       # Top-level state orchestration (map selection, active layer, live stream, field reports)
    ├── components/
    │   ├── LeftSidebar.tsx           # Search bar, 5 province rows with live KPI badges, city list, and Africa locator card
    │   ├── InteractiveMap.tsx        # Floating Data Layer Switcher, SVG GeoJSON map stage, on-map KPI pills, and adaptive legend
    │   └── RightDetailPanel.tsx      # 5-tab inspector (Overview, Live Metrics, Key Facts, Places, More), CSV/JSON export & WhatsApp dispatch
    ├── data/
    │   ├── sierraLeoneGeoJson.ts     # GADM 4.1 province/district polygon rings, rivers, borders, and WGS84 projection functions
    │   └── sierraLeoneData.ts        # 5 provinces and 40+ cities with GPS coordinates, demographics, and regional facts
    └── utils/
        ├── mapFilters.ts             # Pure functions for search filtering, zoom clamping, and spatial nearest-city lookup
        ├── mapFilters.test.ts        # Unit test suite for geospatial projection and search filters
        ├── telemetryEngine.ts        # Real-time telemetry store, deterministic tick simulator, choropleth resolver, CSV/JSON/WhatsApp formatters
        └── telemetryEngine.test.ts   # Unit test suite for telemetry simulation, choropleth tiers, and data exports
```

---

## 4. Cartographic Projection Specification

The SVG map canvas uses a `viewBox="0 0 850 1024"` coordinate system calibrated to Sierra Leone's WGS84 bounding box with a `0.858` cosine latitude correction factor at `8.5° N`:

```ts
// Forward Projection: WGS84 [lng, lat] -> SVG [x, y]
export function projectLngLat(lng: number, lat: number): [number, number] {
  const x = (lng - (-13.5)) * 222.85 + 20;
  const y = (10.12 - lat) * 260.0 + 35;
  return [Number(x.toFixed(1)), Number(y.toFixed(1))];
}

// Inverse Projection: SVG [x, y] -> WGS84 [lng, lat]
export function unprojectPoint(x: number, y: number): [number, number] {
  const lng = (x - 20) / 222.85 + (-13.5);
  const lat = 10.12 - (y - 35) / 260.0;
  return [Number(lng.toFixed(4)), Number(lat.toFixed(4))];
}
```

---

## 5. Getting Started

### Prerequisites
- **Node.js** `>= 20.x` (with `npm`)

### Installation
```bash
npm install
```

### Start the Development Server
Runs the Vite development server on `http://localhost:3000`:
```bash
npm run dev
```

### Type-Check & Lint
Validates TypeScript types across the entire project without emitting build artifacts:
```bash
npm run lint
```

### Production Build & Preview
Bundles the application into optimized static assets in `dist/`:
```bash
npm run build
npm run preview
```

---

## 6. Running Unit Tests

Pure business logic, WGS84 GeoJSON coordinate projection round-trips, polygon containment, telemetry tick simulation, CSV/JSON serialization, and WhatsApp report formatting are decoupled in `src/utils/` and tested using Node's built-in test runner via `tsx`:

```bash
npx --yes tsx --test src/utils/mapFilters.test.ts src/utils/telemetryEngine.test.ts
```

### Test Coverage Highlights
- **Geospatial & Filter Suite (`mapFilters.test.ts`)**:
  - Verifies default major cities ordering (`Freetown`, `Bo`, `Kenema`, `Makeni`, `Koidu`) and full 40+ city catalog toggle.
  - Verifies exact-match ranking for city, district, and keyword queries.
  - Verifies `projectLngLat` and `unprojectPoint` WGS84 round-trip accuracy within `< 0.01°`.
  - Verifies that all 5 provinces have valid SVG paths and every mapped city projects inside Sierra Leone's bounds.
- **Telemetry & Export Suite (`telemetryEngine.test.ts`)**:
  - Verifies all 5 data layers (`political`, `healthcare`, `telecom`, `energy`, `agri_trade`) and their 4-tier choropleth thresholds.
  - Verifies deterministic telemetry tick updates across all 5 provinces and 4 metric sectors.
  - Verifies RFC-compliant CSV header/row generation and structured JSON export serialization.
  - Verifies WhatsApp field dispatch message generation with GPS coordinates, active sector score, and reporter metadata.
