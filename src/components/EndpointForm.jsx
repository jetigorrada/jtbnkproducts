import { useState } from 'react';
import { useFormState } from '../hooks/useFormState';
import FieldRenderer from './FieldRenderer';
import JsonOutput from './JsonOutput';
import SavedItems from './SavedItems';
import CategoryPreview from './CategoryPreview';
import ProductPreview from './ProductPreview';
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
  const [outputCollapsed, setOutputCollapsed] = useState(false);

  const output = buildOutput();
  const mc = methodColors[endpoint.method];

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;
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
  };

  const handleReset = () => {
    reset();
    setLoadedItemId(null);
    setSaveName('');
    setShowSaveInput(false);
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
  };

  const hasExample = !!exampleData[endpoint.id];

  const isUpsertCategory = endpoint.id === 'upsertCategory';
  const isCreateProduct = endpoint.id === 'createProduct';

  // Check if this is Create Product and there are no saved categories
  const savedCategories = isCreateProduct ? getSavedCategories() : [];
  const noCategoriesWarning = isCreateProduct && savedCategories.length === 0;

  // Build current category preview data from path + body values
  const currentCategory = isUpsertCategory
    ? {
        categoryKey: pathValues.categoryKey || '',
        name: bodyValues.name || '',
        description: bodyValues.description || '',
        icon: bodyValues.icon || '',
      }
    : null;

  // Build current product preview data from body values
  const currentProduct = isCreateProduct
    ? {
        productKey: bodyValues.productKey || '',
        name: bodyValues.name || '',
        icon: bodyValues.icon || '',
        categories: bodyValues.categories || [],
        descriptions: bodyValues.descriptions || [],
        features: bodyValues.features || [],
        faqs: bodyValues.faqs || [],
        linkGroups: bodyValues.linkGroups || [],
      }
    : null;

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
                {isUpsertCategory
                  ? 'How categories appear in the app'
                  : 'How the product appears in the app'}
              </span>
            </div>
            {isUpsertCategory
              ? <CategoryPreview currentCategory={currentCategory} />
              : <ProductPreview currentProduct={currentProduct} />}
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
              <FieldRenderer
                fields={endpoint.bodyFields}
                values={bodyValues}
                onChange={setBodyValues}
              />
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

        {noCategoriesWarning && (
          <div className="no-categories-banner">
            <span className="banner-icon">⚠️</span>
            <div className="banner-text">
              <strong>Categories required</strong>
              <p>You need to create at least one category before creating a product. Go to <strong>Upsert Category</strong> in the sidebar, create and save a category first.</p>
            </div>
          </div>
        )}

        <div className="form-body">
          <div className="form-section">
            <h3 className="section-title">Base URL</h3>
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
              <FieldRenderer fields={endpoint.pathParams} values={pathValues} onChange={setPathValues} />
            </div>
          )}

          {endpoint.queryParams.length > 0 && (
            <div className="form-section">
              <h3 className="section-title">Query Parameters</h3>
              <FieldRenderer fields={endpoint.queryParams} values={queryValues} onChange={setQueryValues} />
            </div>
          )}

          {endpoint.bodyFields.length > 0 && (
            <div className="form-section">
              <h3 className="section-title">Request Body</h3>
              <FieldRenderer fields={endpoint.bodyFields} values={bodyValues} onChange={setBodyValues} />
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

          <SavedItems endpointId={endpoint.id} onLoad={handleLoad} refreshKey={savedRefreshKey} />
        </div>
      </>
    );
  }
}
