const OPERATORS = [
  ['eq', 'equals'], ['ne', 'does not equal'], ['contains', 'contains'], ['notContains', 'does not contain'],
  ['gt', 'greater than'], ['gte', 'greater than or equal'], ['lt', 'less than'], ['lte', 'less than or equal'],
  ['isMissing', 'is missing'], ['isNotMissing', 'is not missing'],
];
const noValue = (op) => op === 'isMissing' || op === 'isNotMissing';
const newCondition = (column = '') => ({ column, op: 'eq', value: '' });
const newRule = (column = '') => ({ match: 'all', conditions: [newCondition(column)], result: '' });

export default function ConditionalRulesEditor({ columns, value = [], onChange }) {
  const rules = Array.isArray(value) ? value : [];
  const updateRule = (ri, patch) => onChange(rules.map((rule, i) => i === ri ? { ...rule, ...patch } : rule));
  const updateCondition = (ri, ci, patch) => onChange(rules.map((rule, i) => i === ri ? {
    ...rule, conditions: rule.conditions.map((condition, j) => j === ci ? { ...condition, ...patch } : condition),
  } : rule));
  const addCondition = (ri) => onChange(rules.map((rule, i) => {
    if (i !== ri) return rule;
    const current = rule.conditions || [];
    const column = current[current.length - 1]?.column || columns[0]?.id || '';
    return { ...rule, conditions: [...current, newCondition(column)] };
  }));
  const removeCondition = (ri, ci) => onChange(rules.map((rule, i) => i === ri ? { ...rule, conditions: rule.conditions.filter((_, j) => j !== ci) } : rule));

  return (
    <div className="conditional-rules">
      <p className="small">Rules are evaluated from top to bottom. The first matching rule supplies the result.</p>
      {rules.map((rule, ri) => (
        <fieldset className="part conditional-rule" key={ri}>
          <legend>IF rule {ri + 1}</legend>
          <div className="field">
            <label htmlFor={`conditional-match-${ri}`}>Match conditions</label>
            <select id={`conditional-match-${ri}`} value={rule.match || 'all'} onChange={(e) => updateRule(ri, { match: e.target.value })}>
              <option value="all">All conditions (AND)</option><option value="any">Any condition (OR)</option>
            </select>
          </div>
          {(rule.conditions || []).length === 0 && (
            <p className="small muted" role="status">No conditions in this rule. Add a condition to configure it.</p>
          )}
          {(rule.conditions || []).map((condition, ci) => (
            <div className="conditional-condition" key={ci}>
              <div className="field">
                <label htmlFor={`conditional-col-${ri}-${ci}`}>Column</label>
                <select id={`conditional-col-${ri}-${ci}`} value={condition.column || ''} onChange={(e) => updateCondition(ri, ci, { column: e.target.value })}>
                  {columns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor={`conditional-op-${ri}-${ci}`}>Condition</label>
                <select id={`conditional-op-${ri}-${ci}`} value={condition.op || 'eq'} onChange={(e) => updateCondition(ri, ci, { op: e.target.value, value: '' })}>
                  {OPERATORS.map(([op, label]) => <option key={op} value={op}>{label}</option>)}
                </select>
              </div>
              {!noValue(condition.op) && <div className="field">
                <label htmlFor={`conditional-value-${ri}-${ci}`}>Value</label>
                <input id={`conditional-value-${ri}-${ci}`} value={condition.value ?? ''} onChange={(e) => updateCondition(ri, ci, { value: e.target.value })} />
              </div>}
              <button type="button" className="btn small-btn" aria-label={`Remove condition ${ci + 1} from rule ${ri + 1}`} onClick={() => removeCondition(ri, ci)}>Remove condition</button>
            </div>
          ))}
          <div className="row tight">
            <button type="button" className="btn small-btn" disabled={columns.length === 0} onClick={() => addCondition(ri)}>+ Add condition</button>
            <div className="field conditional-result">
              <label htmlFor={`conditional-result-${ri}`}>THEN result</label>
              <input id={`conditional-result-${ri}`} value={rule.result ?? ''} onChange={(e) => updateRule(ri, { result: e.target.value })} placeholder="e.g. Adult" />
            </div>
            <button type="button" className="btn small-btn" aria-label={`Remove IF rule ${ri + 1}`} disabled={rules.length <= 1} onClick={() => onChange(rules.filter((_, i) => i !== ri))}>Remove rule</button>
          </div>
        </fieldset>
      ))}
      <button type="button" className="btn primary" disabled={columns.length === 0} onClick={() => onChange([...rules, newRule(columns[0]?.id || '')])}>+ Add IF rule</button>
    </div>
  );
}
