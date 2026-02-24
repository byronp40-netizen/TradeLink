// src/components/jobs/AIJobAssistant.tsx
import React, { useState } from 'react';

export default function AIJobAssistant({ onCreated }: { onCreated?: (job:any) => void }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string|null>(null);

  async function handleParse(writeToDb = false) {
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch('/api/ai/parse-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, writeToDb })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || JSON.stringify(data));
      setResult(data);
      if (writeToDb && onCreated && data.inserted) onCreated(data.inserted);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3>AI Assistant — create job from text</h3>
      <textarea
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe the job in natural language..."
        style={{ width: '100%' }}
      />
      <div style={{ marginTop: 8 }}>
        <button onClick={() => handleParse(false)} disabled={loading || !text}>Preview</button>
        <button onClick={() => handleParse(true)} disabled={loading || !text} style={{ marginLeft: 8 }}>
          Create job (insert into DB)
        </button>
      </div>

      {loading && <p>Working…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 12, whiteSpace: 'pre-wrap', background: '#f6f6f6', padding: 10 }}>
          <strong>Parsed:</strong>
          <pre>{JSON.stringify(result.parsed, null, 2)}</pre>
          <strong>Raw AI output:</strong>
          <pre>{result.raw}</pre>
          {result.inserted && <div>Inserted ID: {result.inserted.id}</div>}
        </div>
      )}
    </div>
  );
}