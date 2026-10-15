# JSA v0.2.84 — Export & Reporting Pack

## Highlights
- Export grouped analysis results to CSV with UTF-8 BOM, correct quoting, and spreadsheet-formula injection mitigation for untrusted text values.
- Export a portable JSON analysis report with dataset metadata, analysis definition, row counts, result columns, warnings, and result rows.
- Export a readable Markdown report summary for documentation, project reports, and GitHub.
- Keep CSV, JSON, and Markdown exports tied to the currently displayed successful analysis result.
- Revoke temporary download URLs after the browser has had time to start the download.

## Compatibility
- Builds on v0.2.83 and retains the existing dataset, preparation, analytical, charting, dashboard, and interactive/static HTML export workflows.
- Existing project structure is preserved. `node_modules` is intentionally excluded; run `npm install` after extracting.

## Verification
Run `npm test` and `npm run build` in the project directory. Automated coverage includes CSV escaping/formula protection, report metadata, Markdown output, and invalid report input handling.

## License
JSA is distributed under the MIT License. See [`LICENSE`](./LICENSE).
