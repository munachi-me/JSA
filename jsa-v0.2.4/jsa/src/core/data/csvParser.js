// RFC-4180-style CSV parser: quoted fields, escaped quotes (""), embedded newlines,
// configurable delimiter, malformed-row reporting. Pure function, no DOM.

const CANDIDATES = [',', ';', '\t', '|'];

export function detectDelimiter(text) {
  const sample = text.split(/\r?\n/).slice(0, 10).filter(Boolean);
  if (!sample.length) return ',';
  let best = ',';
  let bestScore = -1;
  for (const d of CANDIDATES) {
    const counts = sample.map((l) => parseLine(l, d).length);
    const first = counts[0];
    const consistent = counts.every((c) => c === first);
    const score = first > 1 ? first * (consistent ? 10 : 1) : 0;
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

function parseLine(line, d) {
  return parseCsv(line, { delimiter: d }).header;
}

export function parseCsv(input, options = {}) {
  const text = String(input ?? '').replace(/^\uFEFF/, '');
  const delimiter = options.delimiter || detectDelimiter(text);
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const pushField = () => { row.push(field); field = ''; };
  const pushRow = () => { pushField(); rows.push(row); row = []; };

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"' && field === '') { inQuotes = true; i++; continue; }
    if (c === delimiter) { pushField(); i++; continue; }
    if (c === '\r') { if (text[i + 1] === '\n') i++; pushRow(); i++; continue; }
    if (c === '\n') { pushRow(); i++; continue; }
    field += c; i++;
  }
  const unterminated = inQuotes;
  if (field !== '' || row.length) pushRow();

  // drop fully blank trailing/interior lines
  const cleaned = rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
  const errors = [];
  if (unterminated) errors.push({ type: 'unterminated_quote', message: 'A quoted field was never closed.' });
  if (!cleaned.length) errors.push({ type: 'empty_file', message: 'The file contains no data.' });

  const width = cleaned.length ? cleaned[0].length : 0;
  const body = [];
  cleaned.slice(1).forEach((r, idx) => {
    if (r.length !== width) {
      errors.push({ type: 'malformed_row', row: idx + 2,
        message: `Row ${idx + 2} has ${r.length} fields, expected ${width}.` });
      // normalise: pad or truncate so the dataset stays rectangular
      r = r.length < width ? r.concat(Array(width - r.length).fill('')) : r.slice(0, width);
    }
    body.push(r);
  });

  return { delimiter, header: cleaned[0] || [], rows: body, errors };
}
