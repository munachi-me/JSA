import { describe, expect, it } from 'vitest';
import { analysisReportMarkdown, buildAnalysisReport, csvCell, toCsv } from '../core/export/reporting.js';

describe('export reporting utilities', () => {
  it('quotes CSV delimiters and protects spreadsheet formulas', () => {
    expect(csvCell('hello, "world"')).toBe('"hello, ""world"""');
    expect(csvCell('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(csvCell('  @SUM(A1)')).toBe("'  @SUM(A1)");
    expect(csvCell(-12)).toBe('-12');
    expect(toCsv(['name', 'value'], [{ name: 'East', value: 2 }])).toContain('name,value\r\nEast,2');
  });

  it('creates a portable analysis report with source, definition, summary and rows', () => {
    const report = buildAnalysisReport({
      dataset: { id: 'ds1', name: 'Sales', rowCount: 12, columns: [{ id: 'region', name: 'Region', type: 'text' }] },
      definition: { name: 'Revenue by region', groupBy: ['region'], measures: [{ op: 'sum', column: 'revenue', as: 'Total revenue' }], filters: [], filterMode: 'all' },
      result: { columns: ['region', 'Total revenue'], rows: [{ region: 'East', 'Total revenue': 150 }], rowsTotal: 12, rowsUsed: 8, warnings: [] },
      generatedAt: '2026-10-15T12:00:00.000Z',
    });
    expect(report.schema).toBe('jsa.analysis-report');
    expect(report.summary.rowsUsed).toBe(8);
    expect(report.results[0]['Total revenue']).toBe(150);
    expect(analysisReportMarkdown(report)).toContain('| East | 150 |');
  });

  it('rejects incomplete report inputs', () => {
    expect(() => buildAnalysisReport({})).toThrow(/completed analysis result/);
    expect(() => analysisReportMarkdown({})).toThrow(/valid JSA analysis report/);
  });
});
