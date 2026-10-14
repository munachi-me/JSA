# JSA — JavaScript Analytics (v0.2.5)

Status: Phase 1–5.

Overview

JSA v0.2.5 is a prototype release in the documented Phase 1–5 progression. The repo includes a Vite-based React app with features for import, cleaning, analysis, visualization schemas, and early dashboard work.

Verified features

- CSV & JSON import and dataset model
- Cleaning pipeline and row/column transforms
- Filters and KPI engine
- Chart specification and chart-data preparation
- Dashboard schema (layout and component definitions) referenced in docs

Requirements

- Node.js and npm

Installation

```bash
npm install
```

Available scripts (from package.json)

```bash
npm run dev
npm run build
npm run preview
npm test
```

Usage

- npm run dev
- Open the Vite app in the browser and use the UI to import and inspect datasets

Notes

- This README follows the existing in-repo documentation; if you need to confirm a specific feature, inspect the corresponding source file under core/ or src/.

License

MIT. See LICENSE.
