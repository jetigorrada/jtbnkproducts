import { useState } from 'react';

/**
 * Translations field — fixed to English (en) and Albanian (sq).
 * Automatically shows inputs for all translatable sibling text fields.
 *
 * Data structure: { "en": { "name": "...", ... }, "sq": { "name": "...", ... } }
 */

const LOCALES = [
  { code: 'en-US', label: 'English', flag: '🇬🇧' },
  { code: 'sq', label: 'Shqip', flag: '🇦🇱' },
];

export default function TranslationsField({ value = {}, onChange, translatableFields = [] }) {
  const [activeTab, setActiveTab] = useState('en-US');

  const updateProp = (locale, propKey, propVal) => {
    const localeObj = { ...(value[locale] || {}) };
    if (propVal === '') {
      delete localeObj[propKey];
    } else {
      localeObj[propKey] = propVal;
    }
    // Clean up empty locale objects
    const next = { ...value };
    if (Object.keys(localeObj).length === 0) {
      delete next[locale];
    } else {
      next[locale] = localeObj;
    }
    onChange(next);
  };

  const activeLocale = LOCALES.find((l) => l.code === activeTab);
  const localeValues = value[activeTab] || {};

  // If no translatable fields detected, show a compact free-form fallback
  const hasFields = translatableFields.length > 0;

  return (
    <div className="trans-field">
      {/* Language tabs */}
      <div className="trans-tabs">
        {LOCALES.map((loc) => {
          const hasValues = value[loc.code] && Object.keys(value[loc.code]).length > 0;
          return (
            <button
              key={loc.code}
              type="button"
              className={`trans-tab${activeTab === loc.code ? ' trans-tab-active' : ''}`}
              onClick={() => setActiveTab(loc.code)}
            >
              <span className="trans-tab-flag">{loc.flag}</span>
              <span className="trans-tab-label">{loc.label}</span>
              {hasValues && <span className="trans-tab-dot" />}
            </button>
          );
        })}
      </div>

      {/* Translation inputs */}
      <div className="trans-body">
        {hasFields ? (
          translatableFields.map((tf) => (
            <div key={tf.key} className="trans-row">
              <label className="trans-prop-label">
                {tf.label}
                {tf.multiline && <span className="trans-hint">(text)</span>}
              </label>
              {tf.multiline ? (
                <textarea
                  value={localeValues[tf.key] || ''}
                  onChange={(e) => updateProp(activeTab, tf.key, e.target.value)}
                  placeholder={`${activeLocale.flag} ${tf.label} in ${activeLocale.label}`}
                  className="field-input field-textarea trans-input"
                  rows={2}
                />
              ) : (
                <input
                  type="text"
                  value={localeValues[tf.key] || ''}
                  onChange={(e) => updateProp(activeTab, tf.key, e.target.value)}
                  placeholder={`${activeLocale.flag} ${tf.label} in ${activeLocale.label}`}
                  className="field-input trans-input"
                />
              )}
            </div>
          ))
        ) : (
          <FreeFormTranslation
            locale={activeTab}
            localeInfo={activeLocale}
            values={localeValues}
            onUpdate={(propKey, propVal) => updateProp(activeTab, propKey, propVal)}
          />
        )}
      </div>
    </div>
  );
}

/** Fallback: free-form key/value for locales without known sibling fields */
function FreeFormTranslation({ locale, localeInfo, values, onUpdate }) {
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  const addProp = () => {
    const k = newKey.trim();
    if (!k) return;
    onUpdate(k, newVal);
    setNewKey('');
    setNewVal('');
  };

  return (
    <div className="trans-freeform">
      {Object.entries(values).map(([propKey, propVal]) => (
        <div key={propKey} className="trans-row">
          <span className="trans-prop-label trans-prop-key">{propKey}</span>
          <input
            type="text"
            value={propVal}
            onChange={(e) => onUpdate(propKey, e.target.value)}
            placeholder={`${localeInfo.flag} Translation`}
            className="field-input trans-input"
          />
        </div>
      ))}
      <div className="trans-add-row">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Property name"
          className="field-input"
          onKeyDown={(e) => e.key === 'Enter' && addProp()}
        />
        <input
          type="text"
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          placeholder={`${localeInfo.flag} Value`}
          className="field-input"
          onKeyDown={(e) => e.key === 'Enter' && addProp()}
        />
        <button type="button" className="btn-add-sm" onClick={addProp}>+</button>
      </div>
    </div>
  );
}

