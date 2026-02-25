import { useState, useMemo } from 'react';

export default function JsonOutput({ output }) {
  const [tab, setTab] = useState('json');
  const [copied, setCopied] = useState(false);

  const jsonStr = useMemo(() => {
    if (!output) return '';
    const { method, url, headers, body } = output;
    const obj = { method, url };
    if (headers) obj.headers = headers;
    if (body !== undefined) obj.body = body;
    return JSON.stringify(obj, null, 2);
  }, [output]);

  const curlStr = output?.curl || '';

  const displayText = tab === 'json' ? jsonStr : curlStr;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = displayText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!output) {
    return (
      <div className="json-output-empty">
        <div className="empty-icon">{'{ }'}</div>
        <p>Fill in the form and the API call will be generated here</p>
      </div>
    );
  }

  return (
    <div className="json-output">
      <div className="json-output-header">
        <div className="json-tabs">
          <button
            className={`json-tab ${tab === 'json' ? 'active' : ''}`}
            onClick={() => setTab('json')}
          >
            JSON
          </button>
          <button
            className={`json-tab ${tab === 'curl' ? 'active' : ''}`}
            onClick={() => setTab('curl')}
          >
            cURL
          </button>
        </div>
        <button className="copy-btn" onClick={handleCopy}>
          {copied ? '✓ Copied' : '⎘ Copy'}
        </button>
      </div>
      <div className="json-output-body">
        <pre><code>{displayText}</code></pre>
      </div>
    </div>
  );
}
