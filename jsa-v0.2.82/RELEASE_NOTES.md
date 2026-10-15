# JSA v0.2.82 — Analysis Result Export

## Highlights
- Export grouped analysis results directly to CSV from the Analysis page.
- Include readable column headings in the exported file.
- Correctly escape commas, quotes, and line breaks in values.
- Use UTF-8 with BOM to improve compatibility with spreadsheet applications.
- Name the downloaded file from the saved/current analysis name when available.
- Disable export when an analysis has no result rows.

## Compatibility
- Preserves the v0.2.81 Acode-edited baseline and existing features.
- `node_modules` is intentionally excluded; install dependencies locally with `npm install`.
