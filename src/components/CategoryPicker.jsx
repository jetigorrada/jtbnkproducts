import { useState, useEffect } from 'react';
import { getSavedCategories } from '../storage';

/**
 * Category picker that shows saved categories as checkboxes.
 * value = array of category key strings
 * onChange = (newArray) => void
 */
export default function CategoryPicker({ value = [], onChange }) {
  const [categories, setCategories] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setCategories(getSavedCategories());
  }, [refreshKey]);

  const toggle = (key) => {
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key));
    } else {
      onChange([...value, key]);
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
          Then come back here to select categories for your product.
        </p>
      </div>
    );
  }

  return (
    <div className="category-picker">
      <div className="category-picker-header">
        <span className="picker-count">
          {value.length} of {categories.length} selected
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
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(cat.key)}
                className="picker-checkbox"
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
          {value.map((key) => (
            <span key={key} className="picker-tag">
              {key}
              <button
                type="button"
                className="picker-tag-remove"
                onClick={() => toggle(key)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
