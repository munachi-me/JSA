# JSA — JavaScript Analytics (v0.2.64)

Status: Phase 1–5.

Overview

v0.2.64 is an incremental release in the 0.2.x series. The repository includes Vite+React app files and test helpers.

Verified features

- CSV & JSON import
- Cleaning/transforms and filters
- KPI engine and saved analyses
- Chart spec & visualization preparation
- Dashboard schema and persistence references

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

- The README follows the project’s phase-based documentation and points readers to core/ and src/ for concrete implementations.

License

MIT. See LICENSE.
