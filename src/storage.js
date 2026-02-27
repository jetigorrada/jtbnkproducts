/**
 * File-based + localStorage persistence for saved products, categories, and hierarchies.
 * 
 * Storage structure in localStorage:
 *   "pd-saved-items" -> { products: [...], categories: [...], hierarchies: [...] }
 * 
 * Each saved item: { id, name, endpointId, timestamp, data: { pathValues, queryValues, bodyValues } }
 */

const STORAGE_KEY = 'pd-saved-items';

function getAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { products: [], categories: [], hierarchies: [] };
    return JSON.parse(raw);
  } catch {
    return { products: [], categories: [], hierarchies: [] };
  }
}

function saveAll(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/**
 * Map endpointId -> storage bucket
 */
function bucketFor(endpointId) {
  if (endpointId.toLowerCase().includes('product')) return 'products';
  if (endpointId.toLowerCase().includes('category')) return 'categories';
  if (endpointId.toLowerCase().includes('hierarchy')) return 'hierarchies';
  return 'products';
}

/**
 * Save a form entry
 */
export function saveItem(endpointId, name, formData) {
  const items = getAll();
  const bucket = bucketFor(endpointId);
  const entry = {
    id: crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2),
    name,
    endpointId,
    timestamp: new Date().toISOString(),
    data: formData, // { pathValues, queryValues, bodyValues }
  };
  items[bucket].push(entry);
  saveAll(items);
  return entry;
}

/**
 * Update an existing saved item
 */
export function updateItem(itemId, endpointId, name, formData) {
  const items = getAll();
  const bucket = bucketFor(endpointId);
  const idx = items[bucket].findIndex((i) => i.id === itemId);
  if (idx !== -1) {
    items[bucket][idx] = {
      ...items[bucket][idx],
      name,
      data: formData,
      timestamp: new Date().toISOString(),
    };
    saveAll(items);
  }
}

/**
 * Delete a saved item
 */
export function deleteItem(endpointId, itemId) {
  const items = getAll();
  const bucket = bucketFor(endpointId);
  items[bucket] = items[bucket].filter((i) => i.id !== itemId);
  saveAll(items);
}

/**
 * Get saved items for an endpoint (or all in a bucket)
 */
export function getItems(endpointId) {
  const items = getAll();
  const bucket = bucketFor(endpointId);
  if (!endpointId) return items[bucket];
  return items[bucket].filter((i) => i.endpointId === endpointId);
}

/**
 * Get ALL saved items across all buckets
 */
export function getAllItems() {
  return getAll();
}

/**
 * Export all saved items as a JSON file download
 */
export function exportToFile() {
  const items = getAll();
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `product-directory-saved-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import saved items from a JSON file (merges with existing)
 */
export function importFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        const current = getAll();

        // Merge: add imported items that don't already exist (by id)
        for (const bucket of ['products', 'categories', 'hierarchies']) {
          if (imported[bucket] && Array.isArray(imported[bucket])) {
            const existingIds = new Set(current[bucket].map((i) => i.id));
            for (const item of imported[bucket]) {
              if (!existingIds.has(item.id)) {
                current[bucket].push(item);
              }
            }
          }
        }

        saveAll(current);
        resolve(current);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Get all saved category keys with their names.
 * Extracts categoryKey from pathValues of saved upsertCategory items.
 * Returns array of { key, name, externalId }
 */
export function getSavedCategories() {
  const items = getAll();
  return items.categories.map((item) => {
    const pv = item.data?.pathValues || {};
    const bv = item.data?.bodyValues || {};
    return {
      key: pv.categoryKey || item.name,
      categoryKey: pv.categoryKey || '',
      name: bv.name || item.name,
      description: bv.description || '',
      icon: bv.icon || '',
      externalId: bv.externalCategoryId || '',
      savedName: item.name,
    };
  });
}

/**
 * Clear all saved items
 */
export function clearAll() {
  saveAll({ products: [], categories: [], hierarchies: [] });
}

/**
 * Get all saved products with their categories.
 * Returns array of { productKey, name, description, icon, categories: [categoryKey, ...] }
 */
export function getSavedProducts() {
  const items = getAll();
  return items.products.map((item) => {
    const bv = item.data?.bodyValues || {};
    return {
      productKey: bv.productKey || item.name,
      name: bv.name || item.name,
      icon: bv.icon || '',
      categories: bv.categories || [],
      descriptions: bv.descriptions || [],
      features: bv.features || [],
      faqs: bv.faqs || [],
      linkGroups: bv.linkGroups || [],
    };
  });
}
