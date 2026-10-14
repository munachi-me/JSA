# JSA — JavaScript Analytics (v0.2.65)

Status: Current release (0.2.65) — Phase 6 Milestone 9 (as documented).

Overview

v0.2.65 is the most recent 0.2.x release in the repository. It is a Vite+React browser application with multiple pages (datasets, cleaning, analysis, charts, insights, dashboards) and supporting core modules. The README in this directory documents Phase 1–5 implementations and the Phase 6 stabilization roadmap.

Verified features

- React + Vite app structure with routes (Home, Datasets, Clean, Analysis, Charts, Insights, Dashboards)
  - src/app/App.jsx shows routes and navigation
- Dashboard builder with editor, import/export configuration, static and interactive HTML export
  - src/pages/DashboardPage.jsx implements editor and export actions
  - core/dashboard contains schema and portable/export code
- Chart spec and chart-data preparation modules (core/visualization)
- Cleaning pipeline and transforms (core/transforms)
- Insight engine (core/insights)
- IndexedDB persistence references (storage/idb.js)

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
npm run test:core  # vitest run src/tests/core-smoke.test.js
```

Usage (quickstart)

1. npm install
2. npm run dev
3. Open the Vite dev URL in your browser (usually http://localhost:5173)
4. Use Datasets → Import to load a CSV or JSON, then move through Clean → Analysis → Charts → Insights → Dashboards

Notes & verification

- The README documents the Phase 6 stabilization roadmap and includes a verification note: a fresh build/test run had not been completed in the Phase 6 audit environment. The code and package.json contain scripts for dev/build/test but do not guarantee passing tests in your environment.

## Build & test verification

The project owner reports that for v0.2.65 the code was built and the test suite was executed locally and passed successfully. This statement is provided by the project owner and recorded here for documentation purposes. It does not imply that any CI pipeline was executed.

- For clarity: the verification note above refers to an external audit environment and is distinct from the project-owner verification recorded here.

License

MIT. See LICENSE.
