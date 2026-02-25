import TranslationsField from './TranslationsField';
import KeyValueField from './KeyValueField';
import HierarchyField from './HierarchyField';
import CategoryPicker from './CategoryPicker';

/**
 * Recursively renders form fields based on field schema definitions.
 * Handles: text, number, datetime, array (simple & object), key-value, translations, hierarchy
 */
export default function FieldRenderer({ fields, values, onChange }) {
  const updateField = (key, val) => {
    onChange({ ...values, [key]: val });
  };

  return (
    <div className="field-renderer">
      {fields.map((field) => (
        <FieldItem
          key={field.key}
          field={field}
          value={values[field.key]}
          onChange={(val) => updateField(field.key, val)}
        />
      ))}
    </div>
  );
}

function FieldItem({ field, value, onChange }) {
  const { key, label, type, required, placeholder, description, maxLength, multiline, min, max, minLength, minItems } = field;

  // Compose constraint info
  let constraintInfo = [];
  if (required) constraintInfo.push('Required');
  if (typeof minLength === 'number') constraintInfo.push(`Min length: ${minLength}`);
  if (typeof maxLength === 'number') constraintInfo.push(`Max length: ${maxLength}`);
  if (typeof min === 'number') constraintInfo.push(`Min value: ${min}`);
  if (typeof max === 'number') constraintInfo.push(`Max value: ${max}`);
  if (typeof minItems === 'number') constraintInfo.push(`At least ${minItems} item${minItems > 1 ? 's' : ''}`);
  const constraintText = constraintInfo.length > 0 ? constraintInfo.join(' · ') : null;

  const renderLabel = () => (
    <label className="field-label">
      {label}
      {required && <span className="required-star">*</span>}
      {description && <span className="field-desc">{description}</span>}
      {constraintText && <span className="field-constraints">{constraintText}</span>}
    </label>
  );

  // Simple text input
  if (type === 'text') {
    if (multiline) {
      return (
        <div className="field-group">
          {renderLabel()}
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            className="field-input field-textarea"
            rows={3}
          />
        </div>
      );
    }
    return (
      <div className="field-group">
        {renderLabel()}
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="field-input"
        />
      </div>
    );
  }

  // Number input
  if (type === 'number') {
    return (
      <div className="field-group">
        {renderLabel()}
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === '' ? undefined : parseFloat(v));
          }}
          placeholder={placeholder}
          min={min}
          max={max}
          step="any"
          className="field-input"
        />
      </div>
    );
  }

  // Datetime input — date/time pickers that output ISO 8601 (e.g. 2025-06-01T00:00:00Z)
  if (type === 'datetime') {
    // Parse existing ISO value into date and time parts
    const isoVal = value || '';
    let dateVal = '';
    let timeVal = '';
    if (isoVal) {
      const match = isoVal.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}(?::\d{2})?))?/);
      if (match) {
        dateVal = match[1] || '';
        timeVal = match[2] || '00:00:00';
      }
    }

    const buildIso = (d, t) => {
      if (!d) return '';
      const timePart = t || '00:00:00';
      // Ensure seconds are included
      const parts = timePart.split(':');
      const hh = parts[0] || '00';
      const mm = parts[1] || '00';
      const ss = parts[2] || '00';
      return `${d}T${hh}:${mm}:${ss}Z`;
    };

    return (
      <div className="field-group">
        {renderLabel()}
        <div className="datetime-picker-row">
          <div className="datetime-part">
            <span className="datetime-label">Date</span>
            <input
              type="date"
              value={dateVal}
              onChange={(e) => onChange(buildIso(e.target.value, timeVal))}
              className="field-input"
            />
          </div>
          <div className="datetime-part">
            <span className="datetime-label">Time</span>
            <input
              type="time"
              value={timeVal ? timeVal.slice(0, 5) : ''}
              step="1"
              onChange={(e) => {
                const t = e.target.value || '00:00:00';
                onChange(buildIso(dateVal, t));
              }}
              className="field-input"
            />
          </div>
        </div>
        {isoVal && <span className="field-hint datetime-preview">Output: {isoVal}</span>}
        {!isoVal && <span className="field-hint">Select date &amp; time → outputs ISO 8601 (e.g. 2025-06-01T00:00:00Z)</span>}
      </div>
    );
  }

  // Key-value (additions)
  if (type === 'key-value') {
    return (
      <div className="field-group">
        {renderLabel()}
        <KeyValueField value={value || {}} onChange={onChange} />
      </div>
    );
  }

  // Translations
  if (type === 'translations') {
    return (
      <div className="field-group">
        {renderLabel()}
        <TranslationsField value={value || {}} onChange={onChange} />
      </div>
    );
  }

  // Category picker (select from saved categories)
  if (type === 'category-picker') {
    return (
      <div className="field-group">
        {renderLabel()}
        <CategoryPicker value={value || []} onChange={onChange} />
      </div>
    );
  }

  // Hierarchy (recursive tree)
  if (type === 'hierarchy') {
    return (
      <div className="field-group">
        {renderLabel()}
        <HierarchyField value={value || []} onChange={onChange} />
      </div>
    );
  }

  // Array field
  if (type === 'array') {
    return (
      <div className="field-group">
        {renderLabel()}
        <ArrayFieldRenderer field={field} value={value || []} onChange={onChange} />
      </div>
    );
  }

  return null;
}

function ArrayFieldRenderer({ field, value, onChange }) {
  const { itemType, itemField, itemFields, itemLabel, minItems } = field;

  const addItem = () => {
    if (itemType === 'simple') {
      onChange([...value, '']);
    } else {
      onChange([...value, {}]);
    }
  };

  const removeItem = (idx) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, val) => {
    const next = [...value];
    next[idx] = val;
    onChange(next);
  };

  // Simple array (array of strings)
  if (itemType === 'simple') {
    return (
      <div className="array-field">
        {value.map((item, idx) => (
          <div key={idx} className="array-simple-item">
            <input
              type="text"
              value={item || ''}
              onChange={(e) => updateItem(idx, e.target.value)}
              placeholder={itemField?.placeholder}
              maxLength={itemField?.maxLength}
              className="field-input"
            />
            <button type="button" className="btn-remove-sm" onClick={() => removeItem(idx)}>
              ×
            </button>
          </div>
        ))}
        <button type="button" className="btn-add" onClick={addItem}>
          + Add {itemField?.label || 'Item'}
        </button>
      </div>
    );
  }

  // Object array
  return (
    <div className="array-field">
      {value.map((item, idx) => (
        <div key={idx} className="array-object-item">
          <div className="array-item-header">
            <span className="array-item-label">{itemLabel || 'Item'} #{idx + 1}</span>
            <button type="button" className="btn-remove-sm" onClick={() => removeItem(idx)}>
              ×
            </button>
          </div>
          <FieldRenderer
            fields={itemFields}
            values={item || {}}
            onChange={(val) => updateItem(idx, val)}
          />
        </div>
      ))}
      <button type="button" className="btn-add" onClick={addItem}>
        + Add {itemLabel || 'Item'}
      </button>
    </div>
  );
}
