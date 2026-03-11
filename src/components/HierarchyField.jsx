import { useState } from 'react';
import { getSavedCategories } from '../storage';

/**
 * Recursive hierarchy node editor for UpsertHierarchyPayload.roots
 * Each node has: { category: string, subCategories: [...nodes] }
 * Categories are picked from saved categories.
 */
export default function HierarchyField({ value = [], onChange }) {
  const savedCategories = getSavedCategories();

  // Collect all category keys already used in the tree so we can grey them out
  const collectUsed = (nodes) => {
    const set = new Set();
    for (const n of nodes) {
      if (n.category) set.add(n.category);
      if (n.subCategories) {
        for (const k of collectUsed(n.subCategories)) set.add(k);
      }
    }
    return set;
  };
  const usedKeys = collectUsed(value);

  return (
    <div className="hierarchy-field">
      {value.map((node, idx) => (
        <HierarchyNode
          key={idx}
          node={node}
          depth={0}
          savedCategories={savedCategories}
          usedKeys={usedKeys}
          onChange={(updated) => {
            const next = [...value];
            next[idx] = updated;
            onChange(next);
          }}
          onRemove={() => {
            onChange(value.filter((_, i) => i !== idx));
          }}
        />
      ))}
      <button
        type="button"
        className="btn-add"
        onClick={() => onChange([...value, { category: '', subCategories: [] }])}
      >
        + Add Root Category
      </button>
    </div>
  );
}

function HierarchyNode({ node, depth, onChange, onRemove, savedCategories, usedKeys }) {
  const [collapsed, setCollapsed] = useState(false);

  const updateCategory = (val) => {
    onChange({ ...node, category: val });
  };

  const updateSubCategories = (subs) => {
    onChange({ ...node, subCategories: subs });
  };

  const addSubCategory = () => {
    const subs = [...(node.subCategories || []), { category: '', subCategories: [] }];
    onChange({ ...node, subCategories: subs });
  };

  // Find display name for currently selected category
  const selectedCat = savedCategories.find((c) => c.categoryKey === node.category);

  return (
    <div className="hierarchy-node" style={{ marginLeft: depth * 20 }}>
      <div className="hierarchy-node-header">
        <button
          type="button"
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '▶' : '▼'}
        </button>
        {savedCategories.length > 0 ? (
          <select
            value={node.category || ''}
            onChange={(e) => updateCategory(e.target.value)}
            className="field-input hierarchy-input"
          >
            <option value="">— Select category —</option>
            {savedCategories.map((cat) => {
              const taken = usedKeys.has(cat.categoryKey) && cat.categoryKey !== node.category;
              return (
                <option key={cat.categoryKey} value={cat.categoryKey} disabled={taken}>
                  {cat.name} ({cat.categoryKey}){taken ? ' ✓ used' : ''}
                </option>
              );
            })}
          </select>
        ) : (
          <input
            type="text"
            value={node.category || ''}
            onChange={(e) => updateCategory(e.target.value)}
            placeholder="Category key (e.g. cards)"
            className="field-input hierarchy-input"
          />
        )}
        <button type="button" className="btn-remove-sm" onClick={onRemove}>
          ×
        </button>
      </div>

      {!collapsed && (
        <div className="hierarchy-children">
          {(node.subCategories || []).map((sub, idx) => (
            <HierarchyNode
              key={idx}
              node={sub}
              depth={depth + 1}
              savedCategories={savedCategories}
              usedKeys={usedKeys}
              onChange={(updated) => {
                const subs = [...(node.subCategories || [])];
                subs[idx] = updated;
                updateSubCategories(subs);
              }}
              onRemove={() => {
                updateSubCategories((node.subCategories || []).filter((_, i) => i !== idx));
              }}
            />
          ))}
          <button
            type="button"
            className="btn-add-sm hierarchy-add-sub"
            onClick={addSubCategory}
            style={{ marginLeft: (depth + 1) * 20 }}
          >
            + Sub-category
          </button>
        </div>
      )}
    </div>
  );
}
