import { useState } from 'react';

/**
 * Recursive hierarchy node editor for UpsertHierarchyPayload.roots
 * Each node has: { category: string, subCategories: [...nodes] }
 */
export default function HierarchyField({ value = [], onChange }) {
  return (
    <div className="hierarchy-field">
      {value.map((node, idx) => (
        <HierarchyNode
          key={idx}
          node={node}
          depth={0}
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

function HierarchyNode({ node, depth, onChange, onRemove }) {
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
        <input
          type="text"
          value={node.category || ''}
          onChange={(e) => updateCategory(e.target.value)}
          placeholder="Category key (e.g. cards)"
          className="field-input hierarchy-input"
        />
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
