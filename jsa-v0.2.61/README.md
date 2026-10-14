# JSA — JavaScript Analytics (v0.2.61)

Status: Phase 1–5.

Overview

v0.2.61 is part of the incremental 0.2.x releases. It includes the same Vite + React application structure and documents features through Phase 5.

Verified features

- CSV/JSON import
- Cleaning pipeline and filters
- KPI engine and saved analyses
- Chart spec and chart-data preparation
- Dashboard schema and IndexedDB persistence foundations referenced

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

Notes

- The package.json for this release includes fake-indexeddb as a dev dependency to support test environments.

License

MIT. See LICENSE.
