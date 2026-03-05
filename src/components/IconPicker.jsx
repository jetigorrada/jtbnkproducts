import { useState, useMemo } from 'react';

const BASE = import.meta.env.BASE_URL; // e.g. /jtbnkproducts/

// All available icons from the public/icons directory
const ICON_FILES = [
  '1.-in-review-1.png',
  '1.welcome-back-resend-1.png',
  '2.refused_b-1.png',
  '3.email-1.png',
  '3.jetplan-1.png',
  '3.succesful_b-1.png',
  'alarm-1.png',
  'bench-1.png',
  'bicycle-1.png',
  'calculator-1.png',
  'calendar-1.png',
  'car-1.png',
  'cards-1.png',
  'chair-1.png',
  'cinema-1.png',
  'coffee-1.png',
  'coin-empty-1.png',
  'coin-succeess-1.png',
  'document-1.png',
  'document-signed-1.png',
  'dog-1.png',
  'email-1.png',
  'giftbox-4-2.png',
  'house-1.png',
  'jet-euro-packet.png',
  'jet-lek-packet.png',
  'laptop-1.png',
  'laptop-error-1.png',
  'laptop-success-1.png',
  'lock-error-1.png',
  'lock-success-1.png',
  'maintenance-1.png',
  'messages-1.png',
  'mobile-banking-1.png',
  'mobile-error-1.png',
  'mobile-success-1.png',
  'money-3-1.png',
  'notification-1.png',
  'office-1.png',
  'online-banking-1.png',
  'piggy-bank-1.png',
  'refresh-1.png',
  'sandclock2-1.png',
  'satelite-1.png',
  'search-1.png',
  'shield-1.png',
  'target-1.png',
  'taxport-1.png',
  'travel-2.png',
  'vault-1.png',
  'wallet-1.png',
];

/** Derive a friendly display name from the filename */
function friendlyName(filename) {
  return filename
    .replace(/\.png$/i, '')       // strip extension
    .replace(/-\d+$/, '')         // trailing "-1", "-2" etc.
    .replace(/^\d+\./, '')        // leading "3."
    .replace(/[-_]+/g, ' ')       // hyphens/underscores → spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()) // title case
    .trim();
}

/**
 * IconPicker — lets the user either type a URL or pick from the built-in icon library.
 * value: the current icon string (URL or path)
 * onChange: callback with the new value
 */
export default function IconPicker({ value, onChange }) {
  const [mode, setMode] = useState(value && !value.startsWith(BASE + 'icons/') ? 'url' : 'picker');
  const [search, setSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const iconUrl = (filename) => `${BASE}icons/${encodeURIComponent(filename)}`;

  const filtered = useMemo(() => {
    if (!search) return ICON_FILES;
    const q = search.toLowerCase();
    return ICON_FILES.filter((f) => friendlyName(f).toLowerCase().includes(q));
  }, [search]);

  const selectedFile = ICON_FILES.find((f) => iconUrl(f) === value);

  const handlePickerSelect = (filename) => {
    onChange(iconUrl(filename));
    setPickerOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange('');
    setPickerOpen(false);
    setSearch('');
  };

  return (
    <div className="icon-picker">
      {/* Mode toggle */}
      <div className="icon-picker-tabs">
        <button
          type="button"
          className={`icon-picker-tab${mode === 'picker' ? ' active' : ''}`}
          onClick={() => setMode('picker')}
        >
          🎨 Icon Library
        </button>
        <button
          type="button"
          className={`icon-picker-tab${mode === 'url' ? ' active' : ''}`}
          onClick={() => setMode('url')}
        >
          🔗 URL
        </button>
      </div>

      {mode === 'url' ? (
        /* URL input mode */
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/icon.png"
          className="field-input"
        />
      ) : (
        /* Picker mode */
        <div className="icon-picker-selector">
          {/* Current selection / trigger button */}
          <button
            type="button"
            className="icon-picker-trigger"
            onClick={() => setPickerOpen((o) => !o)}
          >
            {selectedFile ? (
              <span className="icon-picker-selected">
                <img src={iconUrl(selectedFile)} alt="" className="icon-picker-thumb" />
                <span className="icon-picker-name">{friendlyName(selectedFile)}</span>
              </span>
            ) : (
              <span className="icon-picker-placeholder">Choose an icon…</span>
            )}
            <span className={`icon-picker-chevron${pickerOpen ? ' open' : ''}`}>▾</span>
          </button>

          {value && (
            <button type="button" className="icon-picker-clear" onClick={handleClear} title="Clear icon">
              ×
            </button>
          )}

          {/* Dropdown grid */}
          {pickerOpen && (
            <div className="icon-picker-dropdown">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search icons…"
                className="field-input icon-picker-search"
                autoFocus
              />
              <div className="icon-picker-grid">
                {filtered.length === 0 && (
                  <span className="icon-picker-empty">No icons match "{search}"</span>
                )}
                {filtered.map((file) => (
                  <button
                    key={file}
                    type="button"
                    className={`icon-picker-item${value === iconUrl(file) ? ' selected' : ''}`}
                    onClick={() => handlePickerSelect(file)}
                    title={friendlyName(file)}
                  >
                    <img src={iconUrl(file)} alt="" className="icon-picker-item-img" />
                    <span className="icon-picker-item-label">{friendlyName(file)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="icon-picker-preview">
          <img
            src={value}
            alt="icon preview"
            className="icon-picker-preview-img"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span className="icon-picker-preview-path">{value}</span>
        </div>
      )}
    </div>
  );
}
