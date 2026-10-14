# JSA — JavaScript Analytics (v0.2.62)

Status: Phase 1–5.

Overview

v0.2.62 continues the 0.2.x line with the same documented feature set and test helpers.

Verified features

- CSV/JSON import and dataset model
- Cleaning/transforms, filters
- KPI engine and saved analyses
- Chart spec, chart-data transformation
- Dashboard config and persistence notes

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

- Verify specifics in core/ and src/ if you need exact implementation details for a feature.

License

MIT. See LICENSE.
