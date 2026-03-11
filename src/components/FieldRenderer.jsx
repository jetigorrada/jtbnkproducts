import { useState, useRef, useEffect } from 'react';
import TranslationsField from './TranslationsField';
import KeyValueField from './KeyValueField';
import HierarchyField from './HierarchyField';
import CategoryPicker from './CategoryPicker';
import IconPicker from './IconPicker';
import { getItems } from '../storage';

/**
 * Recursively renders form fields based on field schema definitions.
 * Handles: text, number, datetime, array (simple & object), key-value, translations, hierarchy
 */
export default function FieldRenderer({ fields, values, onChange, endpointId, editingItemId }) {
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
          allFields={fields}
          allValues={values}
          endpointId={endpointId}
          editingItemId={editingItemId}
        />
      ))}
    </div>
  );
}

function FieldItem({ field, value, onChange, allFields, allValues, endpointId, editingItemId }) {
  const { key, label, type, required, placeholder, description, maxLength, multiline, min, max, minLength, minItems } = field;

  // Compose constraint info in a user-friendly way
  let constraintParts = [];
  if (required) constraintParts.push('Required');
  if (typeof minLength === 'number' && minLength > 0) constraintParts.push(`Min ${minLength} chars`);
  if (typeof maxLength === 'number') constraintParts.push(`Max ${maxLength} chars`);
  if (typeof min === 'number') constraintParts.push(`Min: ${min}`);
  if (typeof max === 'number') constraintParts.push(`Max: ${max}`);
  if (typeof minItems === 'number') constraintParts.push(`At least ${minItems}`);
  const constraintText = constraintParts.length > 0 ? constraintParts.join(' · ') : null;

  const renderLabel = () => (
    <label className="field-label">
      <span>{label}</span>
      {required && <span className="required-star">*</span>}
      {!required && <span className="optional-tag">(optional)</span>}
      {(description || constraintText) && (
        <HelpTip description={description} constraints={constraintText} />
      )}
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

  // Slider input (segmented rank bar) — shows taken ranks from saved products
  if (type === 'slider') {
    const sliderMin = field.min ?? 0;
    const sliderMax = field.max ?? 50;
    const current = value ?? sliderMin;

    // Collect ranks already used by other saved products in the SAME category
    const takenMap = new Map(); // rank -> product name
    if (endpointId) {
      try {
        // Get the currently selected categories for this product
        const selectedCategories = allValues?.categories || [];
        const saved = getItems(endpointId) || [];
        saved.forEach((item) => {
          if (editingItemId && item.id === editingItemId) return;
          const r = item.data?.bodyValues?.rank;
          if (typeof r !== 'number') return;
          // Only mark as taken if the saved product shares at least one category
          const itemCats = item.data?.bodyValues?.categories || [];
          const overlaps = selectedCategories.length === 0 ||
            itemCats.some((c) => selectedCategories.includes(c));
          if (overlaps) {
            takenMap.set(r, item.name);
          }
        });
      } catch { /* storage unavailable */ }
    }

    const cells = [];
    for (let i = sliderMin; i < sliderMax; i++) {
      const isTaken = takenMap.has(i);
      const isSelected = i === current;
      let cls = 'rank-cell';
      if (isSelected) cls += ' rank-cell-selected';
      else if (isTaken) cls += ' rank-cell-taken';
      else cls += ' rank-cell-free';

      cells.push(
        <button
          key={i}
          type="button"
          className={cls}
          onClick={() => { if (!isTaken) onChange(i); }}
          disabled={isTaken}
          title={isTaken ? `Rank ${i} — ${takenMap.get(i)}` : `Rank ${i}`}
        >
          <span className="rank-cell-num">{i}</span>
          {isTaken && <span className="rank-cell-tooltip">{takenMap.get(i)}</span>}
        </button>
      );
    }

    return (
      <div className="field-group">
        {renderLabel()}
        <div className="rank-bar-wrapper">
          <div className="rank-bar">
            {cells}
          </div>
        </div>
        <div className="rank-bar-legend">
          <span className="rank-legend-item"><span className="rank-swatch rank-swatch-free"></span> Available</span>
          <span className="rank-legend-item"><span className="rank-swatch rank-swatch-taken"></span> Taken</span>
          <span className="rank-legend-item"><span className="rank-swatch rank-swatch-selected"></span> Selected ({current})</span>
        </div>
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

  // Key-value (additions) — collapsible, closed by default
  if (type === 'key-value') {
    return <CollapsibleKeyValue label={label} description={description} value={value} onChange={onChange} pinnedKeys={field.pinnedKeys} />;
  }

  // Translations
  if (type === 'translations') {
    // Extract sibling text fields as translatable properties
    const translatableFields = (allFields || [])
      .filter((f) => f.key !== key && f.type === 'text' && f.translatable !== false)
      .map((f) => ({ key: f.key, label: f.label, multiline: !!f.multiline }));
    // Collect current sibling values for English auto-fill
    const siblingValues = {};
    translatableFields.forEach((tf) => {
      if (allValues && allValues[tf.key]) siblingValues[tf.key] = allValues[tf.key];
    });
    return (
      <div className="field-group">
        {renderLabel()}
        <TranslationsField value={value || {}} onChange={onChange} translatableFields={translatableFields} siblingValues={siblingValues} />
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

  // Icon picker (URL or icon library)
  if (type === 'icon') {
    return (
      <div className="field-group">
        {renderLabel()}
        <IconPicker value={value || ''} onChange={onChange} />
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

  // Descriptions (preset description types)
  if (type === 'descriptions') {
    return (
      <div className="field-group">
        {renderLabel()}
        <DescriptionsPresetField field={field} value={value || []} onChange={onChange} />
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

/** Clickable ? icon that shows a popup with field description and constraints */
function HelpTip({ description, constraints }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <span className="help-tip-wrapper" ref={ref}>
      <button
        type="button"
        className={`help-tip-btn${open ? ' active' : ''}`}
        onClick={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        aria-label="More info"
      >
        ?
      </button>
      {open && (
        <div className="help-tip-popup">
          {description && <div className="help-tip-desc">{description}</div>}
          {constraints && <div className="help-tip-constraints">{constraints}</div>}
        </div>
      )}
    </span>
  );
}

/**
 * Preset descriptions renderer — shows a fixed set of description slots.
 * Confirmed types are shown normally; unconfirmed ones are grouped in a collapsible section.
 * Value is an array of { type, content, additions, translations }.
 */
function DescriptionsPresetField({ field, value, onChange }) {
  const presets = field.presets || [];
  const [showUnconfirmed, setShowUnconfirmed] = useState(false);

  const confirmed = presets.filter((p) => p.confirmed);
  const unconfirmed = presets.filter((p) => !p.confirmed);

  // Get content for a preset type
  const getContent = (presetType) => {
    const item = value.find((d) => d.type === presetType);
    return item?.content || '';
  };

  // Get translation for a preset type
  const getTranslation = (presetType, locale) => {
    const item = value.find((d) => d.type === presetType);
    return item?.translations?.[locale]?.content || '';
  };

  // Ensure an item exists in the array for this presetType, returning the updated array
  const ensureItem = (arr, presetType) => {
    const idx = arr.findIndex((d) => d.type === presetType);
    if (idx >= 0) return arr;
    return [...arr, { type: presetType, content: '', additions: {}, translations: {} }];
  };

  // Update content for a preset type
  const setContent = (presetType, content) => {
    let next = [...value];
    const idx = next.findIndex((d) => d.type === presetType);
    if (idx >= 0) {
      if (content) {
        // Also auto-update English translation
        const existing = next[idx];
        const trans = { ...(existing.translations || {}) };
        trans['en-US'] = { content };
        next[idx] = { ...existing, content, translations: trans };
      } else {
        // If content cleared and no Albanian translation, remove the item
        const hasAlb = next[idx]?.translations?.['sq-AL']?.content?.trim();
        if (!hasAlb) {
          next.splice(idx, 1);
        } else {
          const trans = { ...(next[idx].translations || {}) };
          delete trans['en-US'];
          next[idx] = { ...next[idx], content: '', translations: trans };
        }
      }
    } else if (content) {
      next.push({ type: presetType, content, additions: {}, translations: { 'en-US': { content } } });
    }
    onChange(next);
  };

  // Update translation for a preset type + locale
  const setTranslation = (presetType, locale, text) => {
    let next = ensureItem([...value], presetType);
    const idx = next.findIndex((d) => d.type === presetType);
    const item = { ...next[idx] };
    const trans = { ...(item.translations || {}) };
    if (text.trim()) {
      trans[locale] = { content: text };
    } else {
      delete trans[locale];
    }
    item.translations = trans;
    next[idx] = item;
    // Clean up item if totally empty (no content and no translations)
    if (!item.content?.trim() && Object.keys(item.translations).length === 0) {
      next.splice(idx, 1);
    }
    onChange(next);
  };

  const renderSlot = (preset) => {
    const content = getContent(preset.type);
    const albTranslation = getTranslation(preset.type, 'sq-AL');

    return (
      <div key={preset.type} className={`desc-preset-slot${!preset.confirmed ? ' desc-preset-unconfirmed' : ''}`}>
        <div className="desc-preset-label">
          <span className="desc-preset-name">
            {preset.label}
            {preset.required && <span className="required-star">*</span>}
          </span>
          <span className="desc-preset-type">{preset.type}</span>
        </div>
        {preset.multiline ? (
          <textarea
            value={content}
            onChange={(e) => setContent(preset.type, e.target.value)}
            placeholder={preset.placeholder}
            className="field-input desc-preset-input"
            rows={3}
          />
        ) : (
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(preset.type, e.target.value)}
            placeholder={preset.placeholder}
            className="field-input desc-preset-input"
          />
        )}
        {/* Albanian translation row */}
        <div className="desc-trans-row">
          <span className="desc-trans-flag" title="Albanian translation">🇦🇱</span>
          {preset.multiline ? (
            <textarea
              value={albTranslation}
              onChange={(e) => setTranslation(preset.type, 'sq-AL', e.target.value)}
              placeholder={`${preset.label} in Shqip`}
              className="field-input desc-trans-input"
              rows={2}
            />
          ) : (
            <input
              type="text"
              value={albTranslation}
              onChange={(e) => setTranslation(preset.type, 'sq-AL', e.target.value)}
              placeholder={`${preset.label} in Shqip`}
              className="field-input desc-trans-input"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="desc-presets">
      {confirmed.map(renderSlot)}

      {unconfirmed.length > 0 && (
        <div className="desc-unconfirmed-section">
          <button
            type="button"
            className="desc-unconfirmed-toggle"
            onClick={() => setShowUnconfirmed(!showUnconfirmed)}
          >
            <span className={`toggle-chevron${!showUnconfirmed ? ' chevron-collapsed' : ''}`}>▾</span>
            Additional types
            <span className="desc-unconfirmed-badge">⚠ not confirmed</span>
          </button>
          {showUnconfirmed && (
            <div className="desc-unconfirmed-list">
              {unconfirmed.map(renderSlot)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ArrayFieldRenderer({ field, value, onChange }) {
  const { itemType, itemField, itemFields, itemLabel, minItems, maxItems } = field;
  const atMax = maxItems != null && value.length >= maxItems;

  const addItem = () => {
    if (atMax) return;
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
        {!atMax && (
          <button type="button" className="btn-add" onClick={addItem}>
            + Add {itemField?.label || 'Item'}
          </button>
        )}
        {atMax && <span className="array-max-msg">Maximum of {maxItems} reached</span>}
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
      {!atMax && (
        <button type="button" className="btn-add" onClick={addItem}>
          + Add {itemLabel || 'Item'}
        </button>
      )}
      {atMax && <span className="array-max-msg">Maximum of {maxItems} reached</span>}
    </div>
  );
}

/** Collapsible wrapper for Additions (key-value) — hidden by default */
function CollapsibleKeyValue({ label, description, value, onChange, pinnedKeys }) {
  const hasValues = value && Object.keys(value).length > 0;
  const hasPinned = pinnedKeys && pinnedKeys.length > 0;
  const [open, setOpen] = useState(hasValues || hasPinned);

  return (
    <div className="field-group additions-toggle-group">
      <button
        type="button"
        className={`additions-toggle-btn${open ? ' additions-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`additions-chevron${open ? ' additions-chevron-open' : ''}`}>▸</span>
        <span className="additions-toggle-label">{label || 'Additions'}</span>
        {description && <span className="additions-toggle-desc">— {description}</span>}
        {hasValues && !open && (
          <span className="additions-badge">{Object.keys(value).length}</span>
        )}
      </button>
      {open && (
        <div className="additions-content">
          <KeyValueField value={value || {}} onChange={onChange} pinnedKeys={pinnedKeys} />
        </div>
      )}
    </div>
  );
}
