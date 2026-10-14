# JSA — JavaScript Analytics (v0.2.63)

Status: Phase 1–5.

Overview

v0.2.63 continues the incremental releases describing the Phase 1–5 implementation and includes test commands and dev dependencies consistent with nearby releases.

Verified features

- CSV/JSON import and typed dataset model
- Cleaning & transforms
- Filters and KPI engine
- Chart spec and chart-data preparation
- Dashboard schema and persistence notes in docs

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

- As with other patch releases, inspect core/ to confirm the exact behavior of analytics, insights, or exports.

## Build & test verification

The project owner reports that for v0.2.63 the code was built and the test suite was executed locally and passed successfully. This statement is provided by the project owner and recorded here for documentation purposes. It does not imply that any CI pipeline was executed.

License

MIT. See LICENSE.
