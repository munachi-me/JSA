# JSA — JavaScript Analytics (v0.2.54)

Status: Phase 1–5.

Overview

v0.2.54 continues the Phase 1–5 progression. This release's package.json includes a test:core command to run a focused smoke test.

Verified features

- Import (CSV/JSON)
- Cleaning pipeline and filters
- KPI engine and saved analyses
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

- This README mirrors the repository's phase documentation and highlights the presence of a core smoke test in this patch.

License

MIT. See LICENSE.
