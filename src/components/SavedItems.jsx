import { useState, useRef } from 'react';
import { getItems, deleteItem, exportToFile, importFromFile, exportSingleItemToFile, getAllItems } from '../storage';
import { buildBodyFromSchema } from '../hooks/useFormState';

/**
 * Build the full API JSON output for a saved item, same logic as useFormState.buildOutput.
 */
function buildItemOutput(endpoint, itemData) {
  const { pathValues = {}, queryValues = {}, bodyValues = {} } = itemData;

  // Build URL
  let url = endpoint.path;
  for (const p of endpoint.pathParams) {
    const val = pathValues[p.key] || `{${p.key}}`;
    url = url.replace(`{${p.key}}`, encodeURIComponent(val));
  }
  const qp = new URLSearchParams();
  for (const q of endpoint.queryParams) {
    const val = queryValues[q.key];
    if (val !== undefined && val !== '' && val !== null) qp.set(q.key, val);
  }
  const qs = qp.toString();
  const fullUrl = url + (qs ? '?' + qs : '');

  const method = endpoint.method;
  const hasBody = endpoint.bodyFields?.length > 0 && method !== 'GET' && method !== 'DELETE';
  const body = hasBody ? buildBodyFromSchema(endpoint.bodyFields, bodyValues) || {} : undefined;

  return { method, url: fullUrl, body };
}

/**
 * Panel that shows saved items for the current endpoint, with load/delete/export/import.
 */
export default function SavedItems({ endpointId, endpoint, onLoad, refreshKey }) {
  const [items, setItems] = useState(() => getItems(endpointId));
  const [importMsg, setImportMsg] = useState(null);
  const [copyMsg, setCopyMsg] = useState(null);       // { itemId, text }
  const fileInputRef = useRef(null);
  const singleFileInputRef = useRef(null);

  // Refresh items when refreshKey changes (after save)
  const [lastKey, setLastKey] = useState(refreshKey);
  if (refreshKey !== lastKey) {
    setLastKey(refreshKey);
    setItems(getItems(endpointId));
  }

  const handleDelete = (itemId) => {
    deleteItem(endpointId, itemId);
    setItems(getItems(endpointId));
  };

  const handleExport = () => {
    exportToFile();
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importFromFile(file);
      setItems(getItems(endpointId));
      setImportMsg({ type: 'success', text: 'Imported successfully!' });
    } catch (err) {
      setImportMsg({ type: 'error', text: err.message });
    }
    setTimeout(() => setImportMsg(null), 3000);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportSingle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importFromFile(file);
      setItems(getItems(endpointId));
      setImportMsg({ type: 'success', text: 'Item imported successfully!' });
    } catch (err) {
      setImportMsg({ type: 'error', text: err.message });
    }
    setTimeout(() => setImportMsg(null), 3000);
    if (singleFileInputRef.current) singleFileInputRef.current.value = '';
  };

  const handleExportItem = (item) => {
    exportSingleItemToFile(endpointId, item.id);
  };

  const getItemJson = (item) => {
    if (!endpoint) return '{}';
    const output = buildItemOutput(endpoint, item.data);
    return JSON.stringify(output.body ?? {}, null, 2);
  };

  const handleCopyJson = async (item) => {
    const json = getItemJson(item);
    try {
      await navigator.clipboard.writeText(json);
      setCopyMsg({ itemId: item.id, text: 'Copied!' });
    } catch {
      setCopyMsg({ itemId: item.id, text: 'Copy failed' });
    }
    setTimeout(() => setCopyMsg(null), 2000);
  };

  const handleDownloadJson = (item) => {
    const json = getItemJson(item);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Build descriptive filename: type prefix + category context + item name
    const safeName = item.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    let prefix = '';
    if (endpoint) {
      const bv = item.data?.bodyValues || {};
      const pv = item.data?.pathValues || {};
      if (endpoint.id === 'upsertCategory') {
        const catKey = pv.categoryKey || bv.name || '';
        prefix = 'category_' + (catKey ? catKey.replace(/[^a-zA-Z0-9_-]/g, '_') + '_' : '');
      } else if (endpoint.tag === 'Products') {
        const cats = bv.categories;
        const catLabel = Array.isArray(cats) && cats.length > 0 ? cats[0] : '';
        prefix = 'product_' + (catLabel ? 'in_' + catLabel.replace(/[^a-zA-Z0-9_-]/g, '_') + '_' : '');
      }
    }
    a.download = `${prefix}${safeName}.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (ts) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <div className="saved-items">
      <div className="saved-items-header">
        <h3 className="saved-items-title">Saved Items</h3>
        <div className="saved-items-actions">
          <button className="btn-file-action" onClick={handleExport} title="Export all saved items to JSON file">
            ↓ Export
          </button>
          <button className="btn-file-action" onClick={() => fileInputRef.current?.click()} title="Import saved items from JSON file (bulk or single)">
            ↑ Import All
          </button>
          <button className="btn-file-action" onClick={() => singleFileInputRef.current?.click()} title="Import a single saved item from JSON file">
            ↑ Import Item
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <input
            ref={singleFileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportSingle}
          />
        </div>
      </div>

      {importMsg && (
        <div className={`import-msg ${importMsg.type}`}>
          {importMsg.text}
        </div>
      )}

      {items.length === 0 ? (
        <div className="saved-items-empty">
          No saved items yet. Fill in the form and click "Save" to store it.
        </div>
      ) : (
        <div className="saved-items-list">
          {items.map((item) => (
            <div key={item.id} className="saved-item">
              <div className="saved-item-info">
                <span className="saved-item-name">{item.name}</span>
                <span className="saved-item-date">{formatDate(item.timestamp)}</span>
              </div>
              <div className="saved-item-btns">
                <button
                  className="btn-json-action"
                  onClick={() => handleCopyJson(item)}
                  title="Copy API JSON to clipboard"
                >
                  {copyMsg?.itemId === item.id ? copyMsg.text : '📋 Copy JSON'}
                </button>
                <button
                  className="btn-json-action"
                  onClick={() => handleDownloadJson(item)}
                  title="Download API JSON as file"
                >
                  ↓ Download JSON
                </button>
                <button
                  className="btn-json-action"
                  onClick={() => handleExportItem(item)}
                  title="Export this item (re-importable)"
                >
                  ↓ Export
                </button>
                <button
                  className="btn-load"
                  onClick={() => onLoad(item)}
                  title="Load this item into the form"
                >
                  Load
                </button>
                <button
                  className="btn-remove-sm"
                  onClick={() => handleDelete(item.id)}
                  title="Delete this saved item"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
