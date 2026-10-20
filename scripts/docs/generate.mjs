#!/usr/bin/env node
// Generates README.md, AUDIT.md and RELEASE_NOTES.md for every JSA version folder,
// using only verifiable facts: package.json, the source tree, source diffs between
// adjacent versions, milestone docs shipped with each version, and curated history.
import fs from 'fs';
import path from 'path';
import { HISTORY_A } from './history-a.mjs';
import { HISTORY_B } from './history-b.mjs';
import { buildReadme } from './readme.mjs';
import { buildAudit } from './audit.mjs';
import { buildReleaseNotes } from './release-notes.mjs';

const ROOT = path.resolve(process.argv[2] || '.');
const HISTORY = { ...HISTORY_A, ...HISTORY_B };
const SKIP = new Set(['node_modules', 'dist', 'build', 'coverage']);

const versions = fs.readdirSync(ROOT)
  .filter((n) => /^jsa-v\d/.test(n) && fs.statSync(path.join(ROOT, n)).isDirectory())
  .map((n) => n.replace(/^jsa-v/, ''))
  .sort((a, b) => {
    const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = (pa[i] ?? 0) - (pb[i] ?? 0);
      if (d) return d;
    }
    return 0;
  });

function walk(dir, base, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, base, out);
    else out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out;
}

function load(v) {
  const dir = path.join(ROOT, `jsa-v${v}`);
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const files = walk(dir, dir).sort();
  const src = files.filter((f) => f.startsWith('src/'));
  const tests = src.filter((f) => f.includes('tests/'));
  const modules = src.filter((f) => !f.includes('tests/'));
  const loc = modules.reduce((s, f) => s + fs.readFileSync(path.join(dir, f), 'utf8').split('\n').length, 0);
  const testLoc = tests.reduce((s, f) => s + fs.readFileSync(path.join(dir, f), 'utf8').split('\n').length, 0);
  const read = (rel) => {
    const p = path.join(dir, rel);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  };
  const reg = read('src/core/transforms/stepRegistry.js');
  const steps = [...reg.matchAll(/^ {2}(\w+): \{\n {4}label: '([^']+)'/gm)].map((m) => m[1]);
  const app = read('src/app/App.jsx');
  const routes = [...app.matchAll(/<Route path="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((x, i, a) => a.indexOf(x) === i);
  const chartReg = read('src/core/visualization/chartRegistry.js');
  const charts = [...chartReg.matchAll(/^ {2}(\w+): \{/gm)].map((m) => m[1]);
  const sidecar = files.filter((f) => /MILESTONE|PHASE/.test(f));
  return { v, dir, pkg, files, src, tests, modules, loc, testLoc, steps, routes, charts, sidecar };
}

const data = new Map();
for (const v of versions) data.set(v, load(v));

let written = 0;
for (let i = 0; i < versions.length; i++) {
  const v = versions[i];
  const d = data.get(v);
  const prev = i > 0 ? data.get(versions[i - 1]) : null;
  const next = i < versions.length - 1 ? data.get(versions[i + 1]) : null;
  const h = HISTORY[v] || {};
  fs.writeFileSync(path.join(d.dir, 'README.md'), buildReadme(d, prev, next, h));
  fs.writeFileSync(path.join(d.dir, 'AUDIT.md'), buildAudit(d, h));
  fs.writeFileSync(path.join(d.dir, 'RELEASE_NOTES.md'), buildReleaseNotes(d, h, prev, next));
  written += 3;
}

console.log(`Generated ${written} documents across ${versions.length} version folders.`);
console.log(`Versions: ${versions.join(', ')}`);
