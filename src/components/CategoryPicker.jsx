import { useState, useEffect } from 'react';
import { getSavedCategories } from '../storage';

/**
 * Category picker — single-select radio buttons.
 * value = array with one category key string (e.g. ['cards'])
 * onChange = (newArray) => void
 */
export default function CategoryPicker({ value = [], onChange }) {
  const [categories, setCategories] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const raw = getSavedCategories();
    const map = new Map();
    for (const cat of raw) {
      if (cat.key) map.set(cat.key, cat);
    }
    setCategories(Array.from(map.values()));
  }, [refreshKey]);

  const select = (key) => {
    // Toggle off if already selected, otherwise select this one only
    if (value.includes(key)) {
      onChange([]);
    } else {
      onChange([key]);
    }
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  if (categories.length === 0) {
    return (
      <div className="category-picker-empty">
        <div className="picker-empty-icon">📁</div>
        <p className="picker-empty-text">No categories saved yet</p>
        <p className="picker-empty-hint">
          Go to <strong>Upsert Category</strong> in the sidebar, fill in a category, and save it first.
          Then come back here to select a category for your product.
        </p>
      </div>
    );
  }

  return (
    <div className="category-picker">
      <div className="category-picker-header">
        <span className="picker-count">
          {value.length ? '1 selected' : 'None selected'}
        </span>
        <button type="button" className="btn-add-sm" onClick={refresh}>
          ↻ Refresh
        </button>
      </div>
      <div className="category-picker-list">
        {categories.map((cat) => {
          const isSelected = value.includes(cat.key);
          return (
            <label
              key={cat.key}
              className={`category-picker-item ${isSelected ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="category-pick"
                checked={isSelected}
                onChange={() => select(cat.key)}
                className="picker-radio"
              />
              <div className="picker-item-info">
                <span className="picker-item-key">{cat.key}</span>
                <span className="picker-item-name">{cat.name}</span>
              </div>
            </label>
          );
        })}
      </div>
      {value.length > 0 && (
        <div className="picker-selected-tags">
          <span className="picker-tag">
            {value[0]}
            <button
              type="button"
              className="picker-tag-remove"
              onClick={() => onChange([])}
            >
              ×
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
