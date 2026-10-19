const spreadsheetFormula = /^[\s\u0000-\u001f]*[=+@\-]/;

/** Escape a value for CSV and neutralize spreadsheet formulas in untrusted text. */
export function csvCell(value) {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && spreadsheetFormula.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(columns, rows, labels = {}) {
  const header = columns.map((column) => labels[column] ?? column);
  return '\uFEFF' + [header, ...rows.map((row) => columns.map((column) => row?.[column]))]
    .map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function buildAnalysisReport({ dataset, definition, result, generatedAt = new Date().toISOString() }) {
  if (!dataset || !result || !Array.isArray(result.columns) || !Array.isArray(result.rows)) {
    throw new Error('A dataset and completed analysis result are required to create a report.');
  }
  return {
    schema: 'jsa.analysis-report', schemaVersion: 1, generatedAt,
    dataset: { id: dataset.id ?? null, name: dataset.name ?? 'Untitled dataset', rowCount: Number(dataset.rowCount ?? result.rowsTotal ?? 0), columns: (dataset.columns ?? []).map(({ id, name, type }) => ({ id, name, type })) },
    analysis: { name: definition?.name?.trim() || 'Untitled analysis', groupBy: [...(definition?.groupBy ?? [])], measures: (definition?.measures ?? []).map((measure) => ({ ...measure })), filters: (definition?.filters ?? []).map((filter) => ({ ...filter })), filterMode: definition?.filterMode ?? 'all', sortBy: definition?.sortBy ?? null, sortDir: definition?.sortDir ?? 'desc', limit: definition?.limit ?? null },
    summary: { rowsTotal: Number(result.rowsTotal ?? dataset.rowCount ?? 0), rowsUsed: Number(result.rowsUsed ?? 0), resultRows: result.rows.length, resultColumns: [...result.columns], warnings: [...(result.warnings ?? [])] },
    results: result.rows.map((row) => Object.fromEntries(result.columns.map((column) => [column, row[column] ?? null]))),
  };
}

export function analysisReportMarkdown(report) {
  if (!report || report.schema !== 'jsa.analysis-report') throw new Error('A valid JSA analysis report is required.');
  const safe = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
  const lines = [`# ${safe(report.analysis.name)}`, '', `- **Dataset:** ${safe(report.dataset.name)}`, `- **Generated:** ${safe(report.generatedAt)}`, `- **Source rows:** ${report.summary.rowsTotal.toLocaleString()}`, `- **Rows used:** ${report.summary.rowsUsed.toLocaleString()}`, `- **Result rows:** ${report.summary.resultRows.toLocaleString()}`, '', '## Results', '', `| ${report.summary.resultColumns.map(safe).join(' | ')} |`, `| ${report.summary.resultColumns.map(() => '---').join(' | ')} |`, ...report.results.map((row) => `| ${report.summary.resultColumns.map((column) => safe(row[column])).join(' | ')} |`)];
  if (report.summary.warnings.length) lines.push('', '## Warnings', '', ...report.summary.warnings.map((warning) => `- ${safe(warning)}`));
  lines.push('', '---', '*Generated with JSA. Validate results before making decisions.*', '');
  return lines.join('\n');
}
