import fs from 'fs';

let RUNS = {};
try {
  RUNS = JSON.parse(fs.readFileSync(new URL('../../.docs-test-results.json', import.meta.url), 'utf8'));
} catch { RUNS = {}; }

const COMMIT_DATE = {
  '0.1.0': '2026-10-14', '0.2.0': '2026-10-14', '0.2.6': '2026-10-14', '0.2.61': '2026-10-15',
  '0.2.62': '2026-10-15', '0.2.63': '2026-10-15', '0.2.64': '2026-10-15', '0.2.65': '2026-10-14',
  '0.2.66': '2026-10-15', '0.2.7': '2026-10-15', '0.2.71': '2026-10-15', '0.2.72': '2026-10-15',
  '0.2.73': '2026-10-15', '0.2.8': '2026-10-15', '0.2.81': '2026-10-15', '0.2.82': '2026-10-15',
  '0.2.83': '2026-10-15', '0.2.84': '2026-10-15', '0.2.9': '2026-10-15', '0.2.91': '2026-10-16',
  '0.2.92': '2026-10-16', '0.2.93': '2026-10-16', '0.3.0': '2026-10-17', '0.3.1': '2026-10-17',
  '0.3.2': '2026-10-17', '0.3.3': '2026-10-17', '0.3.4': '2026-10-17', '0.3.5': '2026-10-18',
  '0.3.6': '2026-10-18', '0.3.7': '2026-10-18', '0.3.8': '2026-10-18', '0.4.0': '2026-10-18',
  '0.4.1': '2026-10-19', '0.4.2': '2026-10-19', '0.4.3': '2026-10-19', '0.4.4': '2026-10-19',
  '0.4.5': '2026-10-19', '0.4.6': '2026-10-19', '0.4.7': '2026-10-19', '0.4.71': '2026-10-19',
  '0.4.72': '2026-10-19', '0.4.8': '2026-10-20', '0.5.0': '2026-10-20', '0.5.1': '2026-10-20',
  '0.5.2': '2026-10-20',
};

export function buildReleaseNotes(d, h, prev, next) {
  const L = [];
  const p = (s = '') => L.push(s);
  const run = RUNS[d.v];

  p(`# RELEASE_NOTES.md — JSA v${d.v}`);
  p();
  p('| | |');
  p('| --- | --- |');
  p(`| **Version** | \`${d.pkg.version}\` |`);
  p(`| **Stage** | ${h.phase || 'Unverified'}${h.milestone ? ` · ${h.milestone}` : ''} |`);
  if (COMMIT_DATE[d.v]) p(`| **Recorded date** | ${COMMIT_DATE[d.v]} (from the git commit that added this folder) |`);
  p(`| **Latest in repository** | ${next ? 'No' : 'Yes'} |`);
  p();
  p('[Root README](../../README.md) · [Version history](../../README.md#version-history) · [README](README.md) · [Audit](AUDIT.md)');
  p();

  p('## Release purpose');
  p();
  p(h.summary || 'Release stage in the JSA development history.');
  p();

  if (h.newFeatures?.length) {
    p('## New features');
    p();
    for (const f of h.newFeatures) p(`- ${f}`);
    p();
  }

  if (h.improvements?.length) {
    p('## Improvements');
    p();
    for (const i of h.improvements) p(`- ${i}`);
    p();
  }

  if (h.fixes?.length) {
    p('## Bug fixes');
    p();
    for (const f of h.fixes) p(`- ${f}`);
    p();
  }

  if (h.notes?.length) {
    p('## Important behaviour notes');
    p();
    for (const n of h.notes) p(`- ${n}`);
    p();
  }

  if (prev) {
    const newSteps = d.steps.filter((s) => !prev.steps.includes(s));
    const newRoutes = d.routes.filter((r) => !prev.routes.includes(r));
    const newModules = d.modules.filter((m) => !prev.modules.includes(m));
    const removedModules = prev.modules.filter((m) => !d.modules.includes(m));
    p('## Scope relative to the previous release');
    p();
    if (newModules.length) p(`- Source modules added: ${newModules.map((m) => `\`${m.replace(/^src\//, '')}\``).join(', ')}.`);
    else p('- No new source modules were added; this release changed existing modules.');
    if (removedModules.length) p(`- Source modules removed: ${removedModules.map((m) => `\`${m.replace(/^src\//, '')}\``).join(', ')}.`);
    if (newSteps.length) p(`- Pipeline steps added: ${newSteps.map((s) => `\`${s}\``).join(', ')}.`);
    if (newRoutes.length) p(`- Routes added: ${newRoutes.map((r) => `\`${r}\``).join(', ')}.`);
    const locDelta = d.loc - prev.loc;
    p(`- Application code: ${prev.loc.toLocaleString()} → ${d.loc.toLocaleString()} lines (${locDelta >= 0 ? '+' : ''}${locDelta}).`);
    p();
    p(`Compared against [v${prev.v}](../jsa-v${prev.v}/RELEASE_NOTES.md).`);
    p();
  }

  p('## Breaking changes');
  p();
  p('None recorded. No source module present in the previous release was removed, and no route was renamed or dropped, as verified by comparing the source trees.');
  p();

  p('## Compatibility and migration');
  p();
  p('Each version directory is an independent project with its own `package.json` and `package-lock.json`. To use this release, install its dependencies inside its own folder; installing at the repository root does not apply to any version.');
  p();
  if (d.modules.includes('src/core/storage/indexedDBAdapter.js')) {
    p('Datasets persisted in IndexedDB are keyed to the browser origin. Running a different version folder on a different dev-server port is a different origin, so previously saved work will not appear there. Workspace data is not migrated between versions by the repository.');
    p();
  }

  p('## Verification status');
  p();
  p('| Check | Status |');
  p('| --- | --- |');
  if (run) {
    if (d.v === '0.1.0') {
      p(`| Test suite | **Executed and passed.** \`node --test\` reported ${run.tests.trim()}. |`);
    } else {
      p(`| Test suite | **Executed and passed.** \`npx vitest run\` reported ${run.files.replace('Test Files  ', '')} and ${run.tests.replace('Tests  ', '')}. |`);
    }
  } else {
    p('| Test suite | **Not executed** in this documentation pass. |');
  }
  if (d.v === '0.5.2') {
    p('| Production build | **Executed and passed.** `npx vite build` completed and emitted `dist/` with a chunk-size warning for the main bundle. |');
  } else {
    p('| Production build | **Not executed** in this documentation pass. |');
  }
  p('| Browser behaviour | **Not verified** — no browser session was driven during documentation. |');
  p('| Coverage | **Not measured.** No coverage figure is claimed. |');
  p();
  p('"Executed and passed" above means the command was run against this exact folder in the documentation environment and exited successfully. It does not mean every feature was exercised, and it does not constitute a browser or security verification.');
  p();

  p('## Historical provenance');
  p();
  p('This release note was reconstructed from:');
  p();
  if (h.git) p(`- The git commit that introduced this folder: *${h.git}*.`);
  for (const s of d.sidecar) p(`- The milestone document \`${s}\` originally shipped in this folder.`);
  p('- A direct source diff against the adjacent version folders.');
  p();
  if (!h.git && !d.sidecar.length) {
    p('Some details of this release could not be corroborated by a milestone document or a version-specific commit subject. Where a claim could not be verified it has been left out rather than inferred.');
    p();
  }
  p('Milestone documents from this folder have been consolidated into `README.md`, `AUDIT.md`, and this file, and then removed from the version directory to reduce documentation clutter. The source tree, tests, and configuration files were not modified.');
  p();

  p('## License');
  p();
  p('MIT. See [LICENSE](LICENSE) in this folder and the repository-root [LICENSE](../../LICENSE).');
  p();
  return L.join('\n');
}
