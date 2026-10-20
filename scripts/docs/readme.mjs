import { PURPOSE, capabilityHighlights, moduleOverview, stepsTable, workflowGuide } from './sections.mjs';

export function buildReadme(d, prev, next, h) {
  const isCli = d.v === '0.1.0';
  const newest = !next;
  const L = [];
  const p = (s = '') => L.push(s);

  p(`# JSA v${d.v} — JavaScript Analytics Platform`);
  p();
  p(`> ${h.summary || 'JSA release.'}`);
  p();
  p('| | |');
  p('| --- | --- |');
  p(`| **Package** | \`${d.pkg.name}\` |`);
  p(`| **Version** | \`${d.pkg.version}\` |`);
  p(`| **Release stage** | ${h.phase || 'Unverified'}${h.milestone ? ` · ${h.milestone}` : ''} |`);
  p(`| **Application type** | ${isCli ? 'Node.js command-line toolkit' : 'Browser-based, client-side analytics application'} |`);
  p(`| **Status** | ${newest ? 'Latest release in this repository' : 'Historical release'} |`);
  p();
  p(`[Root README](../../README.md) · [Version history](../../README.md#version-history) · [Release notes](RELEASE_NOTES.md) · [Audit](AUDIT.md) · [License](LICENSE)`);
  p();

  p('## What JSA is');
  p();
  p('JSA is a JavaScript analytics platform for importing tabular datasets, preparing and cleaning them, running analytical operations, generating rule-based insights, creating KPIs and charts, assembling dashboards, and exporting results.');
  p();
  if (isCli) {
    p('In this release JSA is a Node.js command-line toolkit. It loads a file into an in-memory table, infers column types, prints a profile with summary statistics, and writes a JSON dashboard document. There is no browser interface at this stage.');
  } else {
    p('In this release JSA is a single-page React application that runs entirely in the browser. Datasets are parsed, transformed, aggregated, and charted on the client, and persisted in IndexedDB in the current browser profile. There is no JSA backend to deploy and no server-side data store.');
  }
  p();

  p('## Purpose of this release');
  p();
  p(h.summary || 'No verified release-specific summary is available for this version.');
  if (h.newFeatures?.length) {
    p();
    p('**Introduced or materially changed in this release**');
    p();
    for (const f of h.newFeatures) p(`- ${f}`);
  }
  if (prev) {
    const newSteps = d.steps.filter((s) => !prev.steps.includes(s));
    const kept = d.steps.filter((s) => prev.steps.includes(s));
    const newRoutes = d.routes.filter((r) => !prev.routes.includes(r));
    p();
    p('**Inherited from earlier releases** (verified by comparing the source trees of the adjacent version folders)');
    p();
    if (newSteps.length) p(`- Pipeline steps added here: ${newSteps.map((s) => `\`${s}\``).join(', ')}.`);
    else if (d.steps.length) p('- No pipeline steps were added here; all existing steps were inherited.');
    if (kept.length) p(`- Pipeline steps inherited unchanged: ${kept.length}.`);
    if (newRoutes.length) p(`- Routes added here: ${newRoutes.map((r) => `\`${r}\``).join(', ')}.`);
    else if (d.routes.length) p('- No new routes were added here.');
  }
  p();

  p('## Features in this release');
  p();
  const caps = capabilityHighlights(d);
  if (caps.length) {
    p('| Capability | State in this release |');
    p('| --- | --- |');
    for (const [k, v] of caps) p(`| ${k} | ${v} |`);
  } else {
    p('Core data helpers only; see the module overview below.');
  }
  if (d.routes.length) {
    p();
    p(`**Application routes:** ${d.routes.map((r) => `\`${r}\``).join(', ')}`);
  }
  if (d.charts.length) {
    p();
    p(`**Chart types in the chart registry:** ${d.charts.map((c) => `\`${c}\``).join(', ')}`);
  }
  p();

  p('## Requirements');
  p();
  if (isCli) {
    p('- Node.js 18 or newer (the test suite uses the built-in `node:test` runner).');
    p('- npm.');
  } else {
    p('- Node.js 18 or newer is recommended.');
    p('- npm.');
    p('- A modern browser with JavaScript and IndexedDB support.');
  }
  p();

  p('## Installation');
  p();
  p('Each version folder is an independent project. Install dependencies inside the version directory, not at the repository root, which only holds repository-wide documentation, the license, and the version folders.');
  p();
  p('```bash');
  p('git clone https://github.com/munachi-me/JSA.git');
  p(`cd JSA/jsa-v${d.v}`);
  p('npm install');
  p('```');
  p();
  p('`package-lock.json` is included, so `npm ci` is also valid for a reproducible install.');
  p();

  p(isCli ? '## Development and startup' : '## Development and startup');
  p();
  p('```bash');
  p(isCli ? 'npm start' : 'npm run dev');
  p('```');
  p();
  if (isCli) {
    p('`npm start` runs `examples/quick-start.js`. You can also call the CLI directly:');
    p();
    p('```bash');
    p('node src/cli.js examples/sales.csv');
    p('```');
    p();
    p('Output is written to `jsa-output/`.');
  } else {
    p('Vite prints a local URL (by default `http://localhost:5173`). The bundled sample dataset is `public/sample-data/sales.csv`.');
  }
  p();

  p('## npm scripts');
  p();
  p('Verified against this folder\'s `package.json`:');
  p();
  p('| Script | Command | Purpose |');
  p('| --- | --- | --- |');
  for (const [k, cmd] of Object.entries(d.pkg.scripts || {})) p(`| \`${k}\` | \`${cmd}\` | ${PURPOSE[k] || 'No description recorded.'} |`);
  p();

  p('## Testing');
  p();
  p('```bash');
  p('npm test');
  if (!isCli && d.pkg.scripts['test:core']) p('npm run test:core   # optional, smaller subset');
  p('```');
  p();
  if (d.tests.length) {
    p(`Test files (${d.tests.length}):`);
    p();
    for (const t of d.tests) p(`- \`${t}\``);
    p();
  } else {
    p('This release ships no automated test files.');
    p();
  }
  if (!isCli) {
    p('Vitest is configured with `environment: \'node\'` in `vite.config.js`. Files with a `.jsx` extension use React APIs but still execute in the Node environment, so they can only pass if they do not require a real DOM. Treat a failure there as an environment limitation of the suite, not as proof that the feature is broken.');
    p();
  }
  p('Read the output instead of assuming success. The audit document for this version records what was actually executed and when.');
  p();

  p('## Build');
  p();
  if (d.pkg.scripts?.build) {
    p('```bash');
    p('npm run build');
    if (d.pkg.scripts.preview) p('npm run preview   # optional local check of the built output');
    p('```');
    p();
    p('The build writes to `dist/`, which is git-ignored. Later releases emit a chunk-size warning for the main bundle; that is informational, not a build failure.');
  } else {
    p('This release has no build step; it is plain ESM JavaScript executed directly by Node.js. Use `npm run check` to syntax-check the sources.');
  }
  p();

  p('## Application modules');
  p();
  p(moduleOverview(d));
  if (d.steps.length) {
    p('### Transformation step registry');
    p();
    p(`\`src/core/transforms/stepRegistry.js\` declares ${d.steps.length} pipeline steps. Every step declares its parameters, so the UI renders forms generically, and returns a new dataset plus a plain-language summary of what changed.`);
    p();
    p(stepsTable(d.steps));
    p();
  }

  p('## Usage guide');
  p();
  p(workflowGuide(d, isCli));
  p();

  const limits = [...(h.limitations || [])];
  if (!isCli) {
    limits.push('Datasets and workspace state are stored in the current browser profile only; clearing site data removes them, and there is no built-in cloud sync or multi-user access.');
  }
  if (h.notes?.length) for (const n of h.notes) limits.push(n);
  p('## Known limitations');
  p();
  for (const l of limits) p(`- ${l}`);
  if (!limits.length) p('- None recorded beyond the general limitations described in the [audit](AUDIT.md).');
  p();
  p('The [audit](AUDIT.md) separates confirmed limitations from items that still require verification.');
  p();

  p('## Related documentation');
  p();
  p('- [Root README](../../README.md) — project overview, architecture, and the full version history.');
  p('- [RELEASE_NOTES.md](RELEASE_NOTES.md) — what changed in this release and its verification status.');
  p('- [AUDIT.md](AUDIT.md) — technical audit of this release.');
  p('- [Screenshot capture guide](../../docs/screenshots/README.md) — how to capture and contribute screenshots (none are committed yet).');
  p('- [LICENSE](LICENSE) — MIT License for this release.');
  p();

  p('## License');
  p();
  p('This release is distributed under the MIT License. See the version [LICENSE](LICENSE) and the repository-root [LICENSE](../../LICENSE).');
  p();
  return L.join('\n');
}
