# JSA — JavaScript Analytics (v0.2.6)

Status: Phase 1–5.

Overview

v0.2.6 is a routine patch in the 0.2 series. The repository continues to use Vite and React for the web UI and documents the same Phase progression.

Verified features

- CSV & JSON import
- Cleaning/transforms (core/transforms)
- Filters and KPI engine
- Chart spec & visualization preparation
- Dashboard schema referenced in docs

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
npm run test:core  # vitest run src/tests/core-smoke.test.js in this release
```

Notes

- This patch follows the same feature set described in Phase 1–5 documentation. For exact behavior, inspect the source files in core/ and src/.

License

MIT. See LICENSE.
