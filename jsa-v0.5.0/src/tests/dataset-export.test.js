import { describe, expect, it } from 'vitest';
import { datasetToCsv, datasetToJson, datasetToObjects, chartDataToCsv, safeExportName } from '../core/export/datasetExport.js';

const ds = {
  name: 'Sample', rowCount: 2,
  columns: [{ id: 'c0', name: 'Customer', type: 'text' }, { id: 'c1', name: 'Revenue', type: 'decimal' }],
  data: { c0: ['=HYPERLINK("x")', 'East, zone'], c1: [12.5, null] },
};

describe('dataset export', () => {
  it('exports CSV with visible headers, quoting, and formula protection', () => {
    const csv = datasetToCsv(ds);
    expect(csv).toContain('Customer,Revenue');
    expect(csv).toContain(`'=HYPERLINK(""x"")`);
    expect(csv).toContain('"East, zone",');
  });

  it('exports JSON as a re-importable array of named row objects', () => {
    const rows = JSON.parse(datasetToJson(ds));
    expect(rows).toEqual([
      { Customer: '=HYPERLINK("x")', Revenue: 12.5 },
      { Customer: 'East, zone', Revenue: null },
    ]);
    expect(datasetToObjects(ds)).toEqual(rows);
  });

  it('exports plotted chart values for the supported chart data families', () => {
    expect(chartDataToCsv({ kind: 'category', dimensionLabel: 'Region', measureLabel: 'Sales', points: [{ label: 'East', value: 4 }] })).toContain('Region,Sales\r\nEast,4');
    expect(chartDataToCsv({ kind: 'scatter', xLabel: 'Age', yLabel: 'Spend', points: [{ x: 20, y: 10 }] })).toContain('Age,Spend\r\n20,10');
    expect(chartDataToCsv({ kind: 'histogram', bins: [{ x0: 0, x1: 5, count: 3 }] })).toContain('Bin start,Bin end,Count\r\n0,5,3');
  });

  it('creates safe readable filenames', () => {
    expect(safeExportName('My Sales / Q4')).toBe('My_Sales_Q4');
    expect(safeExportName('')).toBe('dataset');
  });
});
