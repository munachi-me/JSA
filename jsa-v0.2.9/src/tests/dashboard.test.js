import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { datasetFromCsv } from '../core/data/datasetModel.js';
import { evaluateFilters } from '../core/transforms/filters.js';
import { selectRows } from '../core/transforms/rows.js';
import { COLS, overlaps, settle, placeNew, clampRect } from '../core/dashboard/layout.js';
import { makeDashboard, addComponent, removeComponent, duplicateComponent, updateComponent, setLayout, validateDashboard, migrateDashboard, findBrokenReferences } from '../core/dashboard/dashboardSchema.js';
import { controlConditions, filterKind, selectOptions } from '../core/dashboard/filters.js';
import { exportDashboard, importDashboard } from '../core/dashboard/portable.js';
import { createIdbStore } from '../storage/idb.js';
import { buildChartData } from '../core/visualization/chartData.js';
import { makeSpec } from '../core/visualization/chartSpec.js';

const noOverlap = (items) => items.every((a, i) => items.every((b, j) => i === j || !overlaps(a, b)));
const rects = (d) => d.components.map((c) => ({ id: c.id, ...c.layout }));

describe('layout engine', () => {
  it('places new items in the first free slot, wrapping to new rows', () => {
    expect(placeNew([], 6, 4)).toEqual({ x: 0, y: 0, w: 6, h: 4 });
    expect(placeNew([{ id: 'a', x: 0, y: 0, w: 6, h: 4 }], 6, 4)).toEqual({ x: 6, y: 0, w: 6, h: 4 });
    expect(placeNew([{ id: 'a', x: 0, y: 0, w: 12, h: 3 }], 6, 4)).toEqual({ x: 0, y: 3, w: 6, h: 4 });
  });
  it('clamps size and keeps items inside the grid', () => {
    expect(clampRect({ x: 11, y: -2, w: 5, h: 0 })).toMatchObject({ x: 7, y: 0, w: 5, h: 2 });
    expect(clampRect({ x: 0, y: 0, w: 99, h: 3 }).w).toBe(COLS);
  });
  it('moving an item onto another pushes the other down, with no overlaps', () => {
    const items = [{ id: 'a', x: 0, y: 0, w: 6, h: 3 }, { id: 'b', x: 6, y: 0, w: 6, h: 3 }];
    const out = settle(items.map((i) => (i.id === 'b' ? { ...i, x: 0, y: 0 } : i)), 'b');
    expect(out.find((i) => i.id === 'b')).toMatchObject({ x: 0, y: 0 });
    expect(out.find((i) => i.id === 'a').y).toBe(3);
    expect(noOverlap(out)).toBe(true);
  });
  it('closes gaps (gravity) when nothing is fixed', () => {
    const out = settle([{ id: 'a', x: 0, y: 5, w: 4, h: 2 }, { id: 'b', x: 0, y: 9, w: 4, h: 2 }]);
    expect(out.map((i) => i.y)).toEqual([0, 2]);
  });
  it('random operations never leave overlaps', () => {
    let d = makeDashboard();
    for (let i = 0; i < 12; i++) d = addComponent(d, ['chart', 'kpi', 'text', 'filter'][i % 4], { vizId: 'v', kpiId: 'k', column: 'c0' });
    for (let i = 0; i < 40; i++) {
      const c = d.components[(i * 7) % d.components.length];
      d = setLayout(d, c.id, { x: (i * 5) % 12, y: (i * 3) % 10, w: 2 + (i % 6), h: 2 + (i % 4) });
      expect(noOverlap(rects(d))).toBe(true);
      expect(d.components.every((k) => k.layout.x + k.layout.w <= COLS)).toBe(true);
    }
  });
});

describe('dashboard operations', () => {
  it('supports a separate chart table dashboard component', () => {
    let d = makeDashboard({ title: 'Table test' });
    d = addComponent(d, 'chart', { vizId: 'v1' }, 'Revenue');
    d = addComponent(d, 'table', { vizId: 'v1' }, 'Revenue — data table');
    expect(d.components.map((c) => c.type)).toEqual(['chart', 'table']);
    expect(validateDashboard(d).ok).toBe(true);
  });
  it('add, duplicate, update and remove components', () => {
    let d = makeDashboard({ title: 'T' });
    d = addComponent(d, 'kpi', { kpiId: 'k1' }, 'Revenue');
    d = addComponent(d, 'kpi', { kpiId: 'k2' });
    const [a, b] = d.components;
    expect(a.layout).toMatchObject({ x: 0, y: 0 });
    expect(b.layout).toMatchObject({ x: 3, y: 0 });
    d = duplicateComponent(d, a.id);
    expect(d.components).toHaveLength(3);
    expect(d.components[2].id).not.toBe(a.id);
    d = updateComponent(d, a.id, { title: 'Sales', config: { ignoreFilters: true } });
    expect(d.components[0]).toMatchObject({ title: 'Sales', config: { kpiId: 'k1', ignoreFilters: true } });
    d = removeComponent(d, b.id);
    expect(d.components).toHaveLength(2);
    expect(noOverlap(rects(d))).toBe(true);
    expect(() => addComponent(d, 'bogus')).toThrow();
  });
});

describe('validation, migration, references', () => {
  const good = () => { let d = makeDashboard({ title: 'D' }); d = addComponent(d, 'chart', { vizId: 'v1' }); return d; };
  it('accepts a valid dashboard and survives a JSON round trip', () => {
    const r = validateDashboard(JSON.parse(JSON.stringify(good())));
    expect(r.ok).toBe(true);
    expect(r.dashboard.components[0].config.vizId).toBe('v1');
  });
  it('rejects corrupt documents with readable errors', () => {
    expect(validateDashboard(null).ok).toBe(false);
    expect(validateDashboard({ schemaVersion: 'x' }).errors[0]).toMatch(/schemaVersion/);
    const bad = good(); bad.components[0].layout.w = 99;
    expect(validateDashboard(bad).errors.join()).toMatch(/invalid layout/);
    const unk = good(); unk.components[0].type = 'script';
    expect(validateDashboard(unk).errors.join()).toMatch(/unsupported type/);
    const dup = addComponent(good(), 'text', { text: 'hi' }); dup.components[1].id = dup.components[0].id;
    expect(validateDashboard(dup).errors.join()).toMatch(/repeats the id/);
    const nov = good(); nov.components[0].config = {};
    expect(validateDashboard(nov).errors.join()).toMatch(/saved chart/);
  });
  it('repairs overlapping layouts on load', () => {
    let d = addComponent(good(), 'chart', { vizId: 'v2' });
    d.components[1].layout = { ...d.components[0].layout };
    expect(noOverlap(rects(validateDashboard(d).dashboard))).toBe(true);
  });
  it('supports insight components and rejects ones without a reference', () => {
    let d = addComponent(makeDashboard({ title: 'I' }), 'insight', { insightId: 'topBottom:c1:c2:sum' });
    expect(validateDashboard(d).ok).toBe(true);
    d.components[0].config = {};
    expect(validateDashboard(d).errors.join()).toMatch(/reference an insight/);
  });
  it('refuses newer schemas and runs migrations in order', () => {
    expect(validateDashboard({ ...good(), schemaVersion: 99 }).errors[0]).toMatch(/newer version/);
    const mig = { 1: (d) => ({ ...d, title: `${d.title}+1` }), 2: (d) => ({ ...d, title: `${d.title}+2` }) };
    expect(migrateDashboard({ ...good(), schemaVersion: 1 }, mig, 3).title).toBe('D+1+2');
    expect(() => migrateDashboard({ ...good(), schemaVersion: 1 }, {}, 2)).toThrow(/No migration/);
  });
  it('reports broken references', () => {
    const ds = { visualizations: [], kpis: [], columns: [] };
    expect(findBrokenReferences(good(), ds)[0]).toMatch(/no longer exists/);
  });
});

describe('dashboard filters', () => {
  const ds = () => ({ ...datasetFromCsv('region,units,day\nEast,10,2024-01-05\nEast,20,2024-02-05\nWest,5,2024-03-05\nWest,7,2024-04-05'), analyses: [], kpis: [], visualizations: [] });
  it('controls become conditions with one consistent meaning for every component', () => {
    const d = ds();
    const comps = [{ id: 'f1', type: 'filter', config: { column: 'c0' } }, { id: 'f2', type: 'filter', config: { column: 'c2' } }, { id: 'f3', type: 'filter', config: { column: 'c1' } }];
    expect(controlConditions(d, comps, {})).toEqual([]);
    const conds = controlConditions(d, comps, { f1: { value: 'West' }, f2: { value: '2024-03-01', value2: '' }, f3: { value: '', value2: '6' } });
    expect(conds).toEqual([{ column: 'c0', op: 'eq', value: 'West' }, { column: 'c2', op: 'gte', value: '2024-03-01' }, { column: 'c1', op: 'lte', value: '6' }]);
    const filtered = selectRows(d, evaluateFilters(d, conds));
    expect(filtered.rowCount).toBe(1);
    // the same filtered dataset feeds charts, so a chart and the row count always agree
    const r = buildChartData(filtered, makeSpec({ type: 'bar', dimension: 'c0', measures: [{ op: 'sum', column: 'c1', as: '' }] }));
    expect(r.points).toEqual([{ label: 'West', value: 5 }]);
    expect(filterKind(d.columns[0])).toBe('select');
    expect(filterKind(d.columns[1])).toBe('range');
    expect(filterKind(d.columns[2])).toBe('dateRange');
    expect(selectOptions(d, 'c0').options).toEqual(['East', 'West']);
  });
});

describe('export / import', () => {
  const setup = () => {
    const ds = { ...datasetFromCsv('region,units\nEast,10\nWest,5'), id: 'dsA', analyses: [], kpis: [{ id: 'k1', name: 'Units', numerator: { op: 'sum', column: 'c1' } }],
      visualizations: [{ ...makeSpec({ type: 'bar', dimension: 'c0', measures: [{ op: 'sum', column: 'c1', as: '' }] }), id: 'v1', title: 'By region' }] };
    let d = makeDashboard({ title: 'Sales', datasetId: 'dsA' });
    d = addComponent(d, 'chart', { vizId: 'v1' }); d = addComponent(d, 'kpi', { kpiId: 'k1' }); d = addComponent(d, 'filter', { column: 'c0' });
    return { ds, d };
  };
  it('exports a self-contained config and re-imports it with fresh, consistent ids', () => {
    const { ds, d } = setup();
    const payload = JSON.parse(JSON.stringify(exportDashboard(ds, d)));
    expect(payload.visualizations).toHaveLength(1);
    expect(JSON.stringify(payload)).not.toContain('"East"');
    const out = importDashboard({ ...ds, id: 'dsB' }, payload);
    expect(out.dashboard.id).not.toBe(d.id);
    expect(out.dashboard.title).toBe('Sales (imported)');
    const viz = out.visualizations[0], kpi = out.kpis[0];
    expect(viz.id).not.toBe('v1');
    expect(out.dashboard.components.find((c) => c.type === 'chart').config.vizId).toBe(viz.id);
    expect(out.dashboard.components.find((c) => c.type === 'kpi').config.kpiId).toBe(kpi.id);
  });
  it('rejects wrong files and datasets that lack the needed columns', () => {
    const { ds, d } = setup();
    const payload = JSON.parse(JSON.stringify(exportDashboard(ds, d)));
    expect(() => importDashboard(ds, { format: 'other' })).toThrow(/not a JSA dashboard/);
    expect(() => importDashboard({ ...ds, columns: ds.columns.slice(0, 1) }, payload)).toThrow(/does not have the columns/);
    expect(() => importDashboard(ds, { ...payload, dashboard: { ...payload.dashboard, components: 'x' } })).toThrow(/invalid/);
  });
});

describe('IndexedDB store', () => {
  it('round-trips sources and meta, and removes both', async () => {
    const store = createIdbStore();
    const source = datasetFromCsv('a,b\n1,x\n2,y', { name: 'persist-me' });
    await store.saveSource(source);
    await store.saveMeta(source.id, { steps: [{ id: 's1' }], dashboards: [{ id: 'd1' }] });
    const rows = await store.loadAll();
    const row = rows.find((r) => r.source.id === source.id);
    expect(row.source.name).toBe('persist-me');
    expect(row.source.data.c0).toEqual([1, 2]);
    expect(row.meta.dashboards[0].id).toBe('d1');
    await store.remove(source.id);
    expect((await store.loadAll()).some((r) => r.source.id === source.id)).toBe(false);
  });
  it('surfaces write failures instead of swallowing them', async () => {
    const store = createIdbStore();
    await expect(store.saveSource({ id: 'bad', fn: () => 1 })).rejects.toBeTruthy(); // functions cannot be cloned
  });
});
