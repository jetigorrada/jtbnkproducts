import { useState, useEffect } from 'react';

/**
 * Translations field — fixed to English (en-US) and Albanian (sq).
 * English is auto-populated from the main form fields (read-only).
 * The user only needs to fill in Albanian translations.
 *
 * Data structure: { "en-US": { "name": "...", ... }, "sq": { "name": "...", ... } }
 */

const LOCALES = [
  { code: 'en-US', label: 'English', flag: '🇬🇧' },
  { code: 'sq-AL', label: 'Shqip', flag: '🇦🇱' },
];

export default function TranslationsField({ value = {}, onChange, translatableFields = [], siblingValues = {} }) {
  // Auto-sync English values from sibling form fields
  useEffect(() => {
    if (translatableFields.length === 0) return;
    const enObj = {};
    let hasAny = false;
    translatableFields.forEach((tf) => {
      if (siblingValues[tf.key]) {
        enObj[tf.key] = siblingValues[tf.key];
        hasAny = true;
      }
    });
    if (!hasAny) return;
    // Only update if different from current English values
    const currentEn = value['en-US'] || {};
    const needsUpdate = translatableFields.some(
      (tf) => (enObj[tf.key] || '') !== (currentEn[tf.key] || '')
    );
    if (needsUpdate) {
      onChange({ ...value, 'en-US': { ...currentEn, ...enObj } });
    }
  }, [siblingValues]);

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

  const [activeTab, setActiveTab] = useState('sq-AL');

  const activeLocale = LOCALES.find((l) => l.code === activeTab);
  const localeValues = value[activeTab] || {};
  const isEnglish = activeTab === 'en-US';

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
              {loc.code === 'en-US' && hasValues && <span className="trans-auto-badge">auto</span>}
            </button>
          );
        })}
      </div>

      {/* Translation inputs */}
      <div className="trans-body">
        {isEnglish && hasFields && (
          <div className="trans-auto-notice">
            ✓ English is auto-filled from the form fields above. Edit the main fields to update.
          </div>
        )}
        {hasFields ? (
          translatableFields.map((tf) => (
            <div key={tf.key} className="trans-row">
              <label className="trans-prop-label">
                {tf.label}
                {tf.multiline && <span className="trans-hint">(text)</span>}
                {isEnglish && <span className="trans-hint">(auto)</span>}
              </label>
              {tf.multiline ? (
                <textarea
                  value={localeValues[tf.key] || ''}
                  onChange={(e) => updateProp(activeTab, tf.key, e.target.value)}
                  placeholder={`${activeLocale.flag} ${tf.label} in ${activeLocale.label}`}
                  className={`field-input field-textarea trans-input${isEnglish ? ' trans-readonly' : ''}`}
                  rows={2}
                  readOnly={isEnglish}
                />
              ) : (
                <input
                  type="text"
                  value={localeValues[tf.key] || ''}
                  onChange={(e) => updateProp(activeTab, tf.key, e.target.value)}
                  placeholder={`${activeLocale.flag} ${tf.label} in ${activeLocale.label}`}
                  className={`field-input trans-input${isEnglish ? ' trans-readonly' : ''}`}
                  readOnly={isEnglish}
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

