# JSA — JavaScript Analytics (v0.2.51)

Status: Phase 1–5 (intermediate patch series).

Overview

This release (0.2.51) follows the same prototype structure as the other 0.2.x releases. The package in this directory includes a Vite+React app with scripts for dev/build/test. Some test helpers differ in this patch (note test:core uses node --test in this patch).

Verified features

- CSV/JSON import and dataset inspection (Phase 1 foundations)
- Cleaning pipeline and filters (Phase 2)
- Chart spec and visualization prep (Phase 3)
- Dashboard schema and persistence foundations referenced in docs (Phase 4)
- Insight engine documented (Phase 5)

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
npm run test:core  # runs node --test src/tests/core-smoke.test.js in this patch
```

Notes

- The tests and smoke tests can differ across patch releases. Use the package.json in this directory for exact commands.
- The repo documents a stabilization/Phase 6 roadmap which is outside the scope of this patch.

License

MIT. See LICENSE.
