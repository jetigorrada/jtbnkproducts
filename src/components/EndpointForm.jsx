import { useState } from 'react';
import { useFormState } from '../hooks/useFormState';
import FieldRenderer from './FieldRenderer';
import JsonOutput from './JsonOutput';
import SavedItems from './SavedItems';
import PhonePreview from './PhonePreview';
import { saveItem, updateItem, getSavedCategories } from '../storage';
import { methodColors } from '../endpoints';
import { exampleData } from '../exampleData';

export default function EndpointForm({ endpoint }) {
  const {
    pathValues,
    setPathValues,
    queryValues,
    setQueryValues,
    bodyValues,
    setBodyValues,
    baseUrl,
    setBaseUrl,
    reset,
    buildOutput,
  } = useFormState(endpoint);

  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [savedRefreshKey, setSavedRefreshKey] = useState(0);
  const [loadedItemId, setLoadedItemId] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [outputCollapsed, setOutputCollapsed] = useState(false);

  const output = buildOutput();
  const mc = methodColors[endpoint.method];

  /** Walk fields and collect missing-required errors */
  const validate = () => {
    const errors = [];

    // Check path params
    (endpoint.pathParams || []).forEach((p) => {
      if (p.required && !pathValues[p.key]?.toString().trim()) {
        errors.push(`${p.label || p.key} is required`);
      }
    });

    // Recursive body field checker
    const checkFields = (fields, values, prefix = '') => {
      (fields || []).forEach((f) => {
        const label = prefix ? `${prefix} → ${f.label || f.key}` : (f.label || f.key);
        const val = values?.[f.key];

        if (f.required) {
          if (f.type === 'array') {
            if (!Array.isArray(val) || val.length === 0) {
              errors.push(`${label} requires at least one item`);
            } else {
              if (f.maxItems && val.length > f.maxItems) {
                errors.push(`${label} allows at most ${f.maxItems} items`);
              }
              if (f.itemFields) {
                val.forEach((item, idx) => {
                  checkFields(f.itemFields, item, `${label} #${idx + 1}`);
                });
              }
            }
          } else if (f.type === 'category-picker') {
            if (!Array.isArray(val) || val.length === 0) {
              errors.push(`${label} is required`);
            }
          } else if (f.type === 'translations') {
            // translations auto-filled — skip
          } else if (f.type === 'hierarchy') {
            if (!Array.isArray(val) || val.length === 0) {
              errors.push(`${label} is required`);
            }
          } else if (f.type === 'key-value') {
            // handled via pinnedKeys below
          } else if (val === undefined || val === null || val.toString().trim() === '') {
            errors.push(`${label} is required`);
          }
        }

        // Validate pinnedKeys inside key-value fields
        if (f.type === 'key-value' && f.pinnedKeys) {
          const kvVal = val || {};
          f.pinnedKeys.forEach((pin) => {
            if (pin.type === 'yesno') {
              if (pin.required && kvVal[pin.key] !== 'yes' && kvVal[pin.key] !== 'no') {
                errors.push(`${pin.label || pin.key} — you must choose Yes or No`);
              }
            } else if (pin.showWhen) {
              // Only validate conditional pins when their yesno is "yes"
              if (kvVal[pin.showWhen] === 'yes' && pin.required) {
                if (!kvVal[pin.key]?.toString().trim()) {
                  errors.push(`${pin.label || pin.key} is required`);
                }
              }
            } else if (pin.required) {
              if (!kvVal[pin.key]?.toString().trim()) {
                errors.push(`${pin.label || pin.key} is required`);
              }
            }
          });
        }

        // Recurse into non-array object fields
        if (f.type === 'object' && f.fields) {
          checkFields(f.fields, val || {}, label);
        }
      });
    };

    checkFields(endpoint.bodyFields, bodyValues);
    return errors;
  };

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) {
      setValidationErrors(['Please enter a name for this item']);
      return;
    }

    const errors = validate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    const formData = { pathValues, queryValues, bodyValues };

    if (loadedItemId) {
      updateItem(loadedItemId, endpoint.id, name, formData);
    } else {
      saveItem(endpoint.id, name, formData);
    }

    setSaveName('');
    setShowSaveInput(false);
    setSavedRefreshKey((k) => k + 1);
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(null), 2000);
  };

  const handleLoad = (item) => {
    const { pathValues: pv, queryValues: qv, bodyValues: bv } = item.data;
    setPathValues(pv || {});
    setQueryValues(qv || {});
    setBodyValues(bv || {});
    setLoadedItemId(item.id);
    setSaveName(item.name);
    setShowSaveInput(false);
    setValidationErrors([]);
  };

  const handleReset = () => {
    reset();
    setLoadedItemId(null);
    setSaveName('');
    setShowSaveInput(false);
    setValidationErrors([]);
  };

  const handleLoadExample = () => {
    const example = exampleData[endpoint.id];
    if (!example) return;
    setPathValues(example.pathValues || {});
    setQueryValues(example.queryValues || {});
    setBodyValues(example.bodyValues || {});
    setLoadedItemId(null);
    setSaveName('');
    setShowSaveInput(false);
    setValidationErrors([]);
  };

  const hasExample = !!exampleData[endpoint.id];

  const isUpsertCategory = endpoint.id === 'upsertCategory';
  const isCreateProduct = endpoint.id === 'createProduct';
  const isProductEndpoint = endpoint.tag === 'Products';

  // Block ALL product endpoints when no categories exist
  const savedCategories = isProductEndpoint ? getSavedCategories() : [];
  const noCategoriesBlock = isProductEndpoint && savedCategories.length === 0;

  // Build current category preview data from path + body values
  const currentCategory = isUpsertCategory
    ? {
        categoryKey: pathValues.categoryKey || '',
        name: bodyValues.name || '',
        description: bodyValues.description || '',
        icon: bodyValues.icon || '',
        additionalDescriptions: bodyValues.additionalDescriptions || [],
      }
    : null;

  // Build current product preview data from body values
  const currentProduct = isCreateProduct
    ? {
        productKey: bodyValues.productKey || '',
        name: bodyValues.name || '',
        icon: bodyValues.icon || '',
        rank: bodyValues.rank,
        categories: bodyValues.categories || [],
        descriptions: bodyValues.descriptions || [],
        features: bodyValues.features || [],
        faqs: bodyValues.faqs || [],
        linkGroups: bodyValues.linkGroups || [],
      }
    : null;

  // If it's any product endpoint and there are no categories, show a blocker
  if (noCategoriesBlock) {
    return (
      <div className="no-categories-block">
        <div className="no-categories-block-inner">
          <span className="block-icon">📂</span>
          <h2 className="block-title">Create a Category First</h2>
          <p className="block-desc">
            You need at least one saved category before you can work with products.<br/>
            Go to <strong>Upsert Category</strong> in the sidebar, fill in the details, and save it.
          </p>
          <div className="block-steps">
            <div className="block-step"><span className="block-step-num">1</span> Open <strong>Upsert Category</strong> from the sidebar</div>
            <div className="block-step"><span className="block-step-num">2</span> Fill in the category key, name, and description</div>
            <div className="block-step"><span className="block-step-num">3</span> Click <strong>Save</strong> to store it</div>
            <div className="block-step"><span className="block-step-num">4</span> Come back here to create products</div>
          </div>
        </div>
      </div>
    );
  }

  // Shared split-layout for category and product forms
  if (isUpsertCategory || isCreateProduct) {
    return (
      <div className="category-layout">
        <div className="category-top">
          {/* Form Panel */}
          <div className="form-panel category-form-panel">
            {renderFormContent()}
          </div>
          {/* Preview Panel */}
          <div className="category-preview-panel">
            <div className="preview-header">
              <h3>App Preview</h3>
              <span className="preview-subtitle">
                How it appears in the mobile app — click to navigate
              </span>
            </div>
            <PhonePreview
              mode={isUpsertCategory ? 'category' : 'product'}
              currentCategory={currentCategory}
              currentProduct={currentProduct}
            />
          </div>
        </div>
        {/* Output at bottom */}
        <div className={`category-output-panel${outputCollapsed ? ' collapsed' : ''}`}>
          <div className="output-header output-toggle" onClick={() => setOutputCollapsed((c) => !c)}>
            <h3>
              <span className={`toggle-chevron${outputCollapsed ? ' chevron-collapsed' : ''}`}>▾</span>
              Generated API Call
            </h3>
          </div>
          {!outputCollapsed && <JsonOutput output={output} />}
        </div>
      </div>
    );
  }

  return (
    <div className="endpoint-form-layout">
      {/* Form Panel */}
      <div className="form-panel">
        <div className="form-header">
          <div className="endpoint-info">
            <span
              className="method-badge"
              style={{ background: mc.bg, color: mc.color, border: `1px solid ${mc.border}` }}
            >
              {endpoint.method}
            </span>
            <span className="endpoint-path">{endpoint.path}</span>
          </div>
          <p className="endpoint-summary">{endpoint.summary}</p>
          {hasExample && (
            <button
              type="button"
              className="btn-load-example"
              onClick={handleLoadExample}
            >
              📋 Load Example
            </button>
          )}
        </div>

        <div className="form-body">
          {/* Base URL */}
          <div className="form-section">
            <h3 className="section-title">Base URL</h3>
            <p className="section-desc">The server address where the API is running</p>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="field-input"
              placeholder="http://localhost:8080"
            />
          </div>

          {/* Path Parameters */}
          {endpoint.pathParams.length > 0 && (
            <div className="form-section">
              <h3 className="section-title">Path Parameters</h3>
              <p className="section-desc">Values that go directly into the URL path</p>
              <FieldRenderer
                fields={endpoint.pathParams}
                values={pathValues}
                onChange={setPathValues}
              />
            </div>
          )}

          {/* Query Parameters */}
          {endpoint.queryParams.length > 0 && (
            <div className="form-section">
              <h3 className="section-title">Query Parameters</h3>
              <p className="section-desc">Optional filters added to the URL as ?key=value</p>
              <FieldRenderer
                fields={endpoint.queryParams}
                values={queryValues}
                onChange={setQueryValues}
              />
            </div>
          )}

          {/* Request Body */}
          {endpoint.bodyFields.length > 0 && (
            <div className="form-section">
              <h3 className="section-title">Request Body</h3>
              <p className="section-desc">The data that will be sent as JSON in the request</p>
              <FieldRenderer
                fields={endpoint.bodyFields}
                values={bodyValues}
                onChange={setBodyValues}
              />
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="validation-errors">
              <strong>⚠ Please fix the following before saving:</strong>
              <ul>
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-reset" onClick={handleReset}>
              Reset Form
            </button>

            {!showSaveInput ? (
              <button
                type="button"
                className="btn-save"
                onClick={() => setShowSaveInput(true)}
              >
                {loadedItemId ? '💾 Update' : '💾 Save'}
              </button>
            ) : (
              <div className="save-input-row">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Enter a name (e.g. Mortgage Product Q2)"
                  className="field-input save-name-input"
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
                <button type="button" className="btn-save" onClick={handleSave}>
                  Save
                </button>
                <button
                  type="button"
                  className="btn-cancel-sm"
                  onClick={() => setShowSaveInput(false)}
                >
                  Cancel
                </button>
              </div>
            )}

            {saveMsg && <span className="save-msg">{saveMsg}</span>}
          </div>

          {/* Saved Items */}
          <SavedItems
            endpointId={endpoint.id}
            endpoint={endpoint}
            onLoad={handleLoad}
            refreshKey={savedRefreshKey}
          />
        </div>
      </div>

      {/* Output Panel */}
      <div className={`output-panel${outputCollapsed ? ' collapsed' : ''}`}>
        <div className="output-header output-toggle" onClick={() => setOutputCollapsed((c) => !c)}>
          <h3>
            <span className={`toggle-chevron${outputCollapsed ? ' chevron-collapsed' : ''}`}>▾</span>
            Generated API Call
          </h3>
        </div>
        {!outputCollapsed && <JsonOutput output={output} />}
      </div>
    </div>
  );

  // Extracted form content to reuse in both layouts
  function renderFormContent() {
    return (
      <>
        <div className="form-header">
          <div className="endpoint-info">
            <span
              className="method-badge"
              style={{ background: mc.bg, color: mc.color, border: `1px solid ${mc.border}` }}
            >
              {endpoint.method}
            </span>
            <span className="endpoint-path">{endpoint.path}</span>
          </div>
          <p className="endpoint-summary">{endpoint.summary}</p>
          {hasExample && (
            <button type="button" className="btn-load-example" onClick={handleLoadExample}>
              📋 Load Example
            </button>
          )}
        </div>

        <div className="form-body">
          <div className="form-section">
            <h3 className="section-title">Base URL</h3>
            <p className="section-desc">The server address where the API is running</p>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="field-input"
              placeholder="http://localhost:8080"
            />
          </div>

          {endpoint.pathParams.length > 0 && (
            <div className="form-section">
              <h3 className="section-title">Path Parameters</h3>
              <p className="section-desc">Values that go directly into the URL path</p>
              <FieldRenderer fields={endpoint.pathParams} values={pathValues} onChange={setPathValues} />
            </div>
          )}

          {endpoint.queryParams.length > 0 && (
            <div className="form-section">
              <h3 className="section-title">Query Parameters</h3>
              <p className="section-desc">Optional filters added to the URL as ?key=value</p>
              <FieldRenderer fields={endpoint.queryParams} values={queryValues} onChange={setQueryValues} />
            </div>
          )}

          {endpoint.bodyFields.length > 0 && (
            <div className="form-section">
              <h3 className="section-title">Request Body</h3>
              <p className="section-desc">The data that will be sent as JSON in the request</p>
              <FieldRenderer fields={endpoint.bodyFields} values={bodyValues} onChange={setBodyValues} endpointId={endpoint.id} editingItemId={loadedItemId} />
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="validation-errors">
              <strong>⚠ Please fix the following before saving:</strong>
              <ul>
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-reset" onClick={handleReset}>Reset Form</button>
            {!showSaveInput ? (
              <button type="button" className="btn-save" onClick={() => setShowSaveInput(true)}>
                {loadedItemId ? '💾 Update' : '💾 Save'}
              </button>
            ) : (
              <div className="save-input-row">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Enter a name (e.g. Mortgage Product Q2)"
                  className="field-input save-name-input"
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
                <button type="button" className="btn-save" onClick={handleSave}>Save</button>
                <button type="button" className="btn-cancel-sm" onClick={() => setShowSaveInput(false)}>Cancel</button>
              </div>
            )}
            {saveMsg && <span className="save-msg">{saveMsg}</span>}
          </div>

          <SavedItems endpointId={endpoint.id} endpoint={endpoint} onLoad={handleLoad} refreshKey={savedRefreshKey} />
        </div>
      </>
    );
  }
}
