import { useState } from 'react';

/**
 * Key-value pairs editor for "additions" objects.
 * Supports pinnedKeys — keys shown at the top with optional dropdown options.
 * Supports yesno-type pins (Yes/No buttons, no default) that conditionally reveal other pins (showWhen).
 */
export default function KeyValueField({ value = {}, onChange, pinnedKeys = [] }) {
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  // yesno pins store their state as a hidden __key in the value (not sent to API)
  const conditionalKeys = pinnedKeys.filter((p) => p.showWhen);
  const yesnoPins = pinnedKeys.filter((p) => p.type === 'yesno');

  // Detect initial yes/no state from existing data
  const initYesNo = {};
  yesnoPins.forEach((yn) => {
    if (value[yn.key] === 'yes') initYesNo[yn.key] = 'yes';
    else if (value[yn.key] === 'no') initYesNo[yn.key] = 'no';
    else {
      // Auto-detect from conditional data
      const hasData = conditionalKeys
        .filter((p) => p.showWhen === yn.key)
        .some((p) => value[p.key] !== undefined && value[p.key] !== '');
      if (hasData) initYesNo[yn.key] = 'yes';
      // else leave undefined (no default)
    }
  });
  const [yesNoState, setYesNoState] = useState(initYesNo);

  const pinnedKeySet = new Set(pinnedKeys.map((p) => p.key));
  const entries = Object.entries(value).filter(([k]) => !pinnedKeySet.has(k));

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

  const handleYesNo = (ynKey, choice) => {
    setYesNoState((prev) => ({ ...prev, [ynKey]: choice }));
    const next = { ...value, [ynKey]: choice };
    if (choice === 'no') {
      // Remove conditional keys
      conditionalKeys.forEach((p) => {
        if (p.showWhen === ynKey) delete next[p.key];
      });
    }
    onChange(next);
  };

  // Which pins are currently visible?
  const visiblePins = pinnedKeys.filter((pin) => {
    if (pin.type === 'yesno') return true;
    if (pin.showWhen) return yesNoState[pin.showWhen] === 'yes';
    return true;
  });

  return (
    <div className="kv-field">
      {/* Pinned keys */}
      {visiblePins.map((pin) => {
        // Yes / No choice
        if (pin.type === 'yesno') {
          const current = yesNoState[pin.key]; // undefined | 'yes' | 'no'
          return (
            <div key={pin.key} className="kv-row kv-row-yesno">
              <span className="kv-yesno-label">
                {pin.label}
                {pin.required && <span className="required-star">*</span>}
              </span>
              <div className="kv-yesno-btns">
                <button
                  type="button"
                  className={`kv-yesno-btn kv-yn-yes${current === 'yes' ? ' kv-yn-active' : ''}`}
                  onClick={() => handleYesNo(pin.key, 'yes')}
                >Yes</button>
                <button
                  type="button"
                  className={`kv-yesno-btn kv-yn-no${current === 'no' ? ' kv-yn-active' : ''}`}
                  onClick={() => handleYesNo(pin.key, 'no')}
                >No</button>
              </div>
            </div>
          );
        }

        // Regular pinned key (dropdown, number, or text)
        return (
          <div key={pin.key} className={`kv-row kv-row-pinned${pin.showWhen ? ' kv-row-conditional' : ''}`}>
            <span className="kv-key kv-key-pinned">
              {pin.label || pin.key}
              {pin.required && <span className="required-star">*</span>}
            </span>
            {pin.options ? (
              <select
                value={value[pin.key] || ''}
                onChange={(e) => update(pin.key, e.target.value)}
                className="field-input kv-select"
              >
                <option value="">— Select {pin.label || pin.key} —</option>
                {pin.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={pin.inputType || 'text'}
                value={value[pin.key] || ''}
                onChange={(e) => update(pin.key, e.target.value)}
                placeholder={pin.placeholder || ''}
                className="field-input"
              />
            )}
          </div>
        );
      })}

      {/* Regular key-value entries */}
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
