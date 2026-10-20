# JSA v0.1.0 — JavaScript Analytics Platform

> Node.js command-line data-table toolkit: CSV/JSON loading, column typing, descriptive statistics, simple KPIs, and JSON dashboard output.

| | |
| --- | --- |
| **Package** | `jsa-analytics` |
| **Version** | `0.1.0` |
| **Release stage** | Pre-phase (command-line stage) · CLI toolkit prototype |
| **Application type** | Node.js command-line toolkit |
| **Status** | Historical release |

[Root README](../../README.md) · [Version history](../../README.md#version-history) · [Release notes](RELEASE_NOTES.md) · [Audit](AUDIT.md) · [License](LICENSE)

## What JSA is

JSA is a JavaScript analytics platform for importing tabular datasets, preparing and cleaning them, running analytical operations, generating rule-based insights, creating KPIs and charts, assembling dashboards, and exporting results.

In this release JSA is a Node.js command-line toolkit. It loads a file into an in-memory table, infers column types, prints a profile with summary statistics, and writes a JSON dashboard document. There is no browser interface at this stage.

## Purpose of this release

Node.js command-line data-table toolkit: CSV/JSON loading, column typing, descriptive statistics, simple KPIs, and JSON dashboard output.

## Features in this release

Core data helpers only; see the module overview below.

## Requirements

- Node.js 18 or newer (the test suite uses the built-in `node:test` runner).
- npm.

## Installation

Each version folder is an independent project. Install dependencies inside the version directory, not at the repository root, which only holds repository-wide documentation, the license, and the version folders.

```bash
git clone https://github.com/munachi-me/JSA.git
cd JSA/jsa-v0.1.0
npm install
```

`package-lock.json` is included, so `npm ci` is also valid for a reproducible install.

## Development and startup

```bash
npm start
```

`npm start` runs `examples/quick-start.js`. You can also call the CLI directly:

```bash
node src/cli.js examples/sales.csv
```

Output is written to `jsa-output/`.

## npm scripts

Verified against this folder's `package.json`:

| Script | Command | Purpose |
| --- | --- | --- |
| `start` | `node examples/quick-start.js` | Run the example script. |
| `test` | `node --test` | Run the full Vitest suite once (non-watch mode). |
| `check` | `node --check src/index.js && node --check src/jsa.js && node --check src/data-table.js && node --check src/cli.js` | Syntax-check each source file with `node --check`. |

## Testing

```bash
npm test
```

This release ships no automated test files.

Read the output instead of assuming success. The audit document for this version records what was actually executed and when.

## Build

This release has no build step; it is plain ESM JavaScript executed directly by Node.js. Use `npm run check` to syntax-check the sources.

## Application modules

### `src/(root)`

| File | Purpose |
| --- | --- |
| `cli.js` | No description recorded. |
| `data-table.js` | No description recorded. |
| `index.js` | No description recorded. |
| `jsa.js` | No description recorded. |

## Usage guide

1. Point the CLI at a CSV or JSON file (`node src/cli.js examples/sales.csv`).
2. JSA parses the file, infers column types, and prints a profile with summary statistics.
3. A dashboard document is written to `jsa-output/jsa-dashboard.json` for inspection.

## Known limitations

- None recorded beyond the general limitations described in the [audit](AUDIT.md).

The [audit](AUDIT.md) separates confirmed limitations from items that still require verification.

## Related documentation

- [Root README](../../README.md) — project overview, architecture, and the full version history.
- [RELEASE_NOTES.md](RELEASE_NOTES.md) — what changed in this release and its verification status.
- [AUDIT.md](AUDIT.md) — technical audit of this release.
- [Screenshot capture guide](../../docs/screenshots/README.md) — how to capture and contribute screenshots (none are committed yet).
- [LICENSE](LICENSE) — MIT License for this release.

## License

This release is distributed under the MIT License. See the version [LICENSE](LICENSE) and the repository-root [LICENSE](../../LICENSE).
