import { useState } from 'react';

/**
 * Translations field: locale -> { property: translatedValue }
 * Example: { "en-US": { "name": "Product", "description": "This is product" } }
 */
export default function TranslationsField({ value = {}, onChange }) {
  const [newLocale, setNewLocale] = useState('');
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropVal, setNewPropVal] = useState('');
  const [activeLocale, setActiveLocale] = useState(null);

  const locales = Object.keys(value);

  const addLocale = () => {
    const locale = newLocale.trim();
    if (!locale || value[locale]) return;
    onChange({ ...value, [locale]: {} });
    setActiveLocale(locale);
    setNewLocale('');
  };

  const removeLocale = (locale) => {
    const next = { ...value };
    delete next[locale];
    onChange(next);
    if (activeLocale === locale) setActiveLocale(null);
  };

  const addProp = (locale) => {
    const key = newPropKey.trim();
    if (!key) return;
    const localeObj = { ...(value[locale] || {}) };
    localeObj[key] = newPropVal;
    onChange({ ...value, [locale]: localeObj });
    setNewPropKey('');
    setNewPropVal('');
  };

  const updateProp = (locale, propKey, propVal) => {
    const localeObj = { ...(value[locale] || {}) };
    localeObj[propKey] = propVal;
    onChange({ ...value, [locale]: localeObj });
  };

  const removeProp = (locale, propKey) => {
    const localeObj = { ...(value[locale] || {}) };
    delete localeObj[propKey];
    onChange({ ...value, [locale]: localeObj });
  };

  return (
    <div className="translations-field">
      <div className="kv-add-row">
        <input
          type="text"
          value={newLocale}
          onChange={(e) => setNewLocale(e.target.value)}
          placeholder="Locale code (e.g. en-US)"
          className="field-input"
          onKeyDown={(e) => e.key === 'Enter' && addLocale()}
        />
        <button type="button" className="btn-add-sm" onClick={addLocale}>
          + Add Locale
        </button>
      </div>

      {locales.length > 0 && (
        <div className="locale-tags">
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              className={`locale-tag ${activeLocale === locale ? 'active' : ''}`}
              onClick={() => setActiveLocale(activeLocale === locale ? null : locale)}
            >
              {locale}
              <span
                className="locale-tag-remove"
                onClick={(e) => { e.stopPropagation(); removeLocale(locale); }}
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      {activeLocale && value[activeLocale] !== undefined && (
        <div className="locale-props">
          <div className="locale-props-header">{activeLocale} translations</div>
          {Object.entries(value[activeLocale] || {}).map(([propKey, propVal]) => (
            <div key={propKey} className="kv-row">
              <span className="kv-key">{propKey}</span>
              <input
                type="text"
                value={propVal}
                onChange={(e) => updateProp(activeLocale, propKey, e.target.value)}
                className="field-input"
              />
              <button
                type="button"
                className="btn-remove-sm"
                onClick={() => removeProp(activeLocale, propKey)}
              >
                ×
              </button>
            </div>
          ))}
          <div className="kv-add-row">
            <input
              type="text"
              value={newPropKey}
              onChange={(e) => setNewPropKey(e.target.value)}
              placeholder="Property (e.g. name)"
              className="field-input"
            />
            <input
              type="text"
              value={newPropVal}
              onChange={(e) => setNewPropVal(e.target.value)}
              placeholder="Translation"
              className="field-input"
            />
            <button type="button" className="btn-add-sm" onClick={() => addProp(activeLocale)}>
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
