import { useState } from 'react';

/**
 * Key-value pairs editor for "additions" objects
 */
export default function KeyValueField({ value = {}, onChange }) {
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  const entries = Object.entries(value);

  const add = () => {
    const key = newKey.trim();
    if (!key) return;
    onChange({ ...value, [key]: newVal });
    setNewKey('');
    setNewVal('');
  };

  const update = (key, val) => {
    onChange({ ...value, [key]: val });
  };

  const remove = (key) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  return (
    <div className="kv-field">
      {entries.map(([k, v]) => (
        <div key={k} className="kv-row">
          <span className="kv-key">{k}</span>
          <input
            type="text"
            value={v}
            onChange={(e) => update(k, e.target.value)}
            className="field-input"
          />
          <button type="button" className="btn-remove-sm" onClick={() => remove(k)}>
            ×
          </button>
        </div>
      ))}
      <div className="kv-add-row">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Key"
          className="field-input"
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <input
          type="text"
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          placeholder="Value"
          className="field-input"
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button type="button" className="btn-add-sm" onClick={add}>
          +
        </button>
      </div>
    </div>
  );
}
