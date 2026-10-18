const KIND = { fact: 'Observed fact', association: 'Statistical association', quality: 'Data quality' };
export const kindLabel = (k) => KIND[k] || k;

const fmtVal = (v) => {
  if (typeof v !== 'number') return String(v);
  if (!Number.isFinite(v)) return '∞';
  if (v !== 0 && Math.abs(v) < 0.0001) return '< 0.0001';
  return Math.abs(v) >= 1000 ? v.toLocaleString(undefined, { maximumFractionDigits: 0 }) : Number(v.toFixed(4)).toLocaleString();
};

/** One insight with its evidence, rule and limitations. `kind` is shown as text, never colour alone. */
export default function InsightCard({ insight, compact, titleOverride, actions, note }) {
  return (
    <article className={`insight ${insight.kind}`} aria-label={insight.title}>
      <div className="row tight"><span className={`badge ${insight.kind}`}>{kindLabel(insight.kind)}</span>{!compact && <span className="muted small">Priority score {insight.score}</span>}</div>
      <h3>{titleOverride || insight.title}</h3>
      <p>{insight.description}</p>
      {note && <p className="warntext small">{note}</p>}
      <details><summary>Evidence ({insight.evidence.length})</summary>
        <dl className="evidence">{insight.evidence.map((e, i) => <div key={i}><dt>{e.label}</dt><dd>{fmtVal(e.value)}</dd></div>)}</dl></details>
      <details><summary>How this was calculated</summary><p className="small">{insight.calculation}</p></details>
      {insight.limitations.length > 0 && <details open={!compact}><summary>Limitations</summary><ul className="small">{insight.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul></details>}
      {insight.followUp && !compact && <p className="small muted"><strong>Suggested follow-up (not a finding):</strong> {insight.followUp}</p>}
      {actions}
    </article>
  );
}
