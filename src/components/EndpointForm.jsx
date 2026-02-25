import { useState } from 'react';
import { useFormState } from '../hooks/useFormState';
import FieldRenderer from './FieldRenderer';
import JsonOutput from './JsonOutput';
import SavedItems from './SavedItems';
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

  // Check if this is Create Product and there are no saved categories
  const isCreateProduct = endpoint.id === 'createProduct';
  const savedCategories = isCreateProduct ? getSavedCategories() : [];
  const noCategoriesWarning = isCreateProduct && savedCategories.length === 0;

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
      <div className="output-panel">
        <div className="output-header">
          <h3>Generated API Call</h3>
        </div>
        <JsonOutput output={output} />
      </div>
    </div>
  );
}
