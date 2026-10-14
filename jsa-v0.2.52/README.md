# JSA — JavaScript Analytics (v0.2.52)

Status: Phase 1–5.

Overview

JSA v0.2.52 follows the project's prototype progression. This patch aligns with other 0.2.x releases and documents features across the Phase 1–5 roadmap.

Verified features

- Import/inspection (CSV & JSON)
- Cleaning pipeline and transforms
- Filters and KPI engine
- Chart spec & chart-data transformations
- Dashboard schema and export/import configuration described

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
npm run test:core  # runs: vitest run src/tests/core-smoke.test.js
```

Usage

- npm run dev

Notes

- This README follows the repository's descriptive phase-based docs. Confirm source-level detail in core/ and src/ if you need to verify behaviour.

## Build & test verification

The project owner reports that for v0.2.52 the code was built and the test suite was executed locally and passed successfully. This statement is provided by the project owner and recorded here for documentation purposes. It does not imply that any CI pipeline was executed.

License

MIT. See LICENSE.
