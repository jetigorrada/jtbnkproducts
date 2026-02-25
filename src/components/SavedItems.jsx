import { useState, useRef } from 'react';
import { getItems, deleteItem, exportToFile, importFromFile, getAllItems } from '../storage';

/**
 * Panel that shows saved items for the current endpoint, with load/delete/export/import.
 */
export default function SavedItems({ endpointId, onLoad, refreshKey }) {
  const [items, setItems] = useState(() => getItems(endpointId));
  const [importMsg, setImportMsg] = useState(null);
  const fileInputRef = useRef(null);

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
          <button className="btn-file-action" onClick={() => fileInputRef.current?.click()} title="Import saved items from JSON file">
            ↑ Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
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
