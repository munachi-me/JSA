# JSA — JavaScript Analytics (v0.2.4)

Status: Phase 1–5 (prototype progression).

Overview

JSA v0.2.4 continues the prototype work described in earlier releases. This version's README indicates progress through Phases 1–5 in documentation, whereas the codebase remains an in-browser, Vite+React application.

Verified features

- CSV/JSON import and dataset inspection
- Cleaning/transforms and filter support
- KPI engine and saved analyses
- Chart spec and rendering-data preparation (chart types described in the project docs)
- Dashboard schema foundations and configuration import/export described

Limitations

- Many features are documented as part of the roadmap and should be verified by reading the corresponding source files (core/* and src/pages/*) for exact behavior in this tagged release.
- Persistence and production-grade publishing are still in the roadmap for later phases.

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
```

Quickstart

- npm run dev
- Open the Vite dev URL and import sample data via the UI.

Notes

- This README preserves the repository's phase-based documentation. When using this release, inspect core/visualization, core/transforms, and storage/idb.js (if present) to confirm features.

License

MIT. See LICENSE.
