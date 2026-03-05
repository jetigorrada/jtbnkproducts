import { useState, useCallback } from 'react';

/**
 * Recursively clean an object:
 * - Remove empty strings, null, undefined
 * - For arrays, filter out empty items and if array is empty, remove it (unless preserveEmpty)
 * - For objects, remove empty keys
 * - Keep numbers (including 0) and booleans
 */
function cleanValue(val) {
  if (val === null || val === undefined || val === '') return undefined;
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  if (typeof val === 'string') return val.trim() || undefined;

  if (Array.isArray(val)) {
    const cleaned = val.map(cleanValue).filter((v) => v !== undefined);
    return cleaned.length > 0 ? cleaned : undefined;
  }

  if (typeof val === 'object') {
    const cleaned = {};
    let hasKeys = false;
    for (const [k, v] of Object.entries(val)) {
      const cv = cleanValue(v);
      if (cv !== undefined) {
        cleaned[k] = cv;
        hasKeys = true;
      }
    }
    return hasKeys ? cleaned : undefined;
  }

  return val;
}

/**
 * Build a clean body object guided by the field schema.
 * Only includes keys that exist in the field definitions,
 * so extra data from examples doesn't leak into the output.
 */
export function buildBodyFromSchema(fields, values) {
  if (!fields || !values) return undefined;
  const result = {};
  let hasKeys = false;

  for (const field of fields) {
    const val = values[field.key];
    if (val === undefined || val === null || val === '') continue;

    if (field.type === 'translations' || field.type === 'key-value') {
      // Free-form objects: clean but include as-is
      // Strip internal UI-only keys (prefixed with __)
      let raw = val;
      if (field.type === 'key-value' && typeof val === 'object' && !Array.isArray(val)) {
        raw = {};
        for (const [k, v] of Object.entries(val)) {
          if (!k.startsWith('__')) raw[k] = v;
        }
      }
      const cleaned = cleanValue(raw);
      if (cleaned !== undefined) {
        result[field.key] = cleaned;
        hasKeys = true;
      }
    } else if (field.type === 'array') {
      if (!Array.isArray(val) || val.length === 0) continue;
      if (field.itemType === 'simple') {
        const cleaned = val.map((v) => (typeof v === 'string' ? v.trim() : v)).filter((v) => v !== '' && v !== undefined);
        if (cleaned.length > 0) {
          result[field.key] = cleaned;
          hasKeys = true;
        }
      } else if (field.itemFields) {
        const cleaned = val
          .map((item) => buildBodyFromSchema(field.itemFields, item))
          .filter((v) => v !== undefined);
        if (cleaned.length > 0) {
          result[field.key] = cleaned;
          hasKeys = true;
        }
      }
    } else if (field.type === 'category-picker') {
      // Array of strings (category keys)
      if (Array.isArray(val) && val.length > 0) {
        result[field.key] = val;
        hasKeys = true;
      }
    } else if (field.type === 'hierarchy') {
      const cleaned = cleanValue(val);
      if (cleaned !== undefined) {
        result[field.key] = cleaned;
        hasKeys = true;
      }
    } else {
      // Scalar: text, number, datetime, icon, slider
      const cleaned = cleanValue(val);
      if (cleaned !== undefined) {
        result[field.key] = cleaned;
        hasKeys = true;
      }
    }
  }

  return hasKeys ? result : undefined;
}

export function useFormState(endpoint) {
  const [pathValues, setPathValues] = useState({});
  const [queryValues, setQueryValues] = useState({});
  const [bodyValues, setBodyValues] = useState({});
  const [baseUrl, setBaseUrl] = useState('http://localhost:8080');

  const reset = useCallback(() => {
    setPathValues({});
    setQueryValues({});
    setBodyValues({});
  }, []);

  const buildUrl = useCallback(() => {
    let url = endpoint.path;
    // Replace path params
    for (const p of endpoint.pathParams) {
      const val = pathValues[p.key] || `{${p.key}}`;
      url = url.replace(`{${p.key}}`, encodeURIComponent(val));
    }

    // Add query params
    const qp = new URLSearchParams();
    for (const q of endpoint.queryParams) {
      const val = queryValues[q.key];
      if (val !== undefined && val !== '' && val !== null) {
        qp.set(q.key, val);
      }
    }
    const qs = qp.toString();
    return `${baseUrl}${url}${qs ? '?' + qs : ''}`;
  }, [endpoint, pathValues, queryValues, baseUrl]);

  const buildOutput = useCallback(() => {
    const url = buildUrl();
    const method = endpoint.method;
    const headers = { 'Content-Type': 'application/json' };

    const hasBody = endpoint.bodyFields && endpoint.bodyFields.length > 0 && method !== 'GET' && method !== 'DELETE';
    const body = hasBody ? buildBodyFromSchema(endpoint.bodyFields, bodyValues) || {} : undefined;

    // cuRL command
    let curl = `curl -X ${method} '${url}'`;
    if (hasBody) {
      curl += ` \\\n  -H 'Content-Type: application/json'`;
      curl += ` \\\n  -d '${JSON.stringify(body, null, 2)}'`;
    }

    return {
      method,
      url,
      headers: hasBody ? headers : undefined,
      body,
      curl,
    };
  }, [endpoint, buildUrl, bodyValues]);

  return {
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
  };
}
