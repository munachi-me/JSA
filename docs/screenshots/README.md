# Screenshots and visual capture guide

This folder is the designated home for JSA screenshots used by the repository-level
[`README.md`](../../README.md) and by individual version READMEs.

## Current status

**No screenshots have been captured yet.** This directory intentionally contains only
this guide. No placeholder images, stock photos, or mock-ups are used anywhere in the
repository, and the root README is written so that it reads correctly without images.

Do not add fake or unrelated images here. When real screenshots exist, add them with the
file names listed below so the documented references stay stable.

## How to capture screenshots

1. Check out or copy the version you want to illustrate. For current UI, use `jsa-v0.5.2`:

   ```bash
   cd jsa-v0.5.2
   npm install
   npm run dev
   ```

2. Open the printed local URL (Vite defaults to `http://localhost:5173`).
3. Import a dataset. The bundled sample is `public/sample-data/sales.csv`; the Home page
   also offers a sample-data action.
4. Use representative, **non-confidential** data. Do not capture real customer,
   financial, or personal records. If a screenshot needs rich data, generate a synthetic
   dataset with realistic column names.
5. Capture at a desktop width of about 1440 px, the design width used by the exported
   dashboards. Add one mobile capture for responsive proof if you want to demonstrate it.
6. Crop to the application viewport. Keep browser chrome out of the image unless the
   browser itself is the subject.
7. Save as PNG at 1x or 2x, then optimise the file (for example with `pngquant` or
   `oxipng`) before committing. Keep each file under roughly 500 KB.
8. Open the exported HTML files in a normal browser tab so the captured file is the
   actual export, not a preview inside JSA.

## Recommended captures

| # | Suggested file name | Screen | What the image should show |
|---|---------------------|--------|----------------------------|
| 1 | `01-home-workspace.png` | Home (`/`) | Workspace shell, navigation rail, dataset summary cards, import actions, and open-dataset list. |
| 2 | `02-dataset-explorer.png` | Datasets (`/dataset`) | Imported dataset with summary cards, column schema table, and the data-quality / Dataset Intelligence findings. |
| 3 | `03-clean-pipeline.png` | Clean data (`/clean`) | An ordered transformation pipeline with step summaries, row-count impact, and the step builder. |
| 4 | `04-analysis-workspace.png` | Analysis (`/analysis`) | Recommended analyses at the top, with the "Explore your data" disclosure either collapsed or open. |
| 5 | `05-kpi-suggestions.png` | Analysis (KPI section) | Suggested KPIs and the KPI definition editor. |
| 6 | `06-chart-builder.png` | Chart Builder (`/chart-builder`) | Chart type selection, dimension/measure controls, live preview, and chart suggestions. |
| 7 | `07-chart-library.png` | Charts (`/charts`) | Saved-chart library with preview cards, search, and edit/delete actions. |
| 8 | `08-dashboard-builder.png` | Dashboards (`/dashboards/:id`) | Grid canvas with chart, KPI, text, and filter components plus the component settings panel. |
| 9 | `09-export-appearance.png` | Export Appearance Studio | Preset selection, palette, typography, and the live appearance preview. |
| 10 | `10-exported-dashboard.png` | Exported interactive HTML | A standalone exported dashboard opened directly from the file system, filters visible. |

Numbers 1–9 are the priority set; 10 is valuable because the export path is a defining
JSA capability.

## Attribution when embedding

When a screenshot is added, reference it from Markdown with a caption that states the
version it was captured from, for example:

```markdown
![JSA v0.5.2 Analysis workspace](docs/screenshots/04-analysis-workspace.png)
*Analysis workspace in JSA v0.5.2, using the bundled sample dataset.*
```

Update the root README section "Screenshots and visual demonstrations" at the same time,
and remove the note that screenshots are not yet available.

## Data hygiene checklist

- [ ] Dataset is synthetic or explicitly cleared for publication.
- [ ] No personal names, emails, addresses, account numbers, or customer identifiers.
- [ ] No API keys, tokens, or environment values visible in any panel.
- [ ] Exported-HTML screenshots contain no embedded row-level data you would not publish.