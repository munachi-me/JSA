# JSA — JavaScript Analytics (v0.2.53)

Status: Phase 1–5.

Overview

v0.2.53 is a continuation of the prototype work. The repo maintains similar scripts and dependencies as other 0.2.x releases.

Verified features

- CSV/JSON import and dataset model
- Cleaning and transforms
- Filters, KPI engine, and saved analyses
- Chart spec and visualization data preparation
- Dashboard configuration export/import described in docs

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
npm run test:core  # runs vitest run src/tests/core-smoke.test.js
```

Notes

- Confirm feature-level details by inspecting the code in core/visualization, core/transforms, and src/pages.

License

MIT. See LICENSE.
