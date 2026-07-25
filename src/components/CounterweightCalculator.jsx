import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { allEntriesText, entryText } from '../utils/counterweight';

export default function CounterweightCalculator() {
  const [entries, setEntries] = useLocalStorage('heartwood.counterweight.entries', []);
  const [label, setLabel] = useState(() => `Window ${entries.length + 1}`);
  const [upper, setUpper] = useState('');
  const [lower, setLower] = useState('');
  const [bushings, setBushings] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [copied, setCopied] = useState(false);
  const clearTimeoutRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(clearTimeoutRef.current);
  }, []);

  function handleAdd() {
    if (upper === '' && lower === '') return;
    const newEntry = {
      id: Date.now(),
      label: label.trim() || `Window ${entries.length + 1}`,
      upper,
      lower,
      bushings,
    };
    setEntries((prev) => [...prev, newEntry]);
    setUpper('');
    setLower('');
    setLabel(`Window ${entries.length + 2}`);
  }

  function handleDelete(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function handleClearClick() {
    if (confirmClear) {
      clearTimeout(clearTimeoutRef.current);
      setEntries([]);
      setConfirmClear(false);
      return;
    }
    setConfirmClear(true);
    clearTimeoutRef.current = setTimeout(() => setConfirmClear(false), 3000);
  }

  function handleCopy() {
    if (entries.length === 0) return;
    const text = allEntriesText(entries);
    const showCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(showCopied).catch(showCopied);
    } else {
      showCopied();
    }
  }

  return (
    <div className="card">
      <label className="field-label" htmlFor="cw-label">
        Window label
      </label>
      <input
        id="cw-label"
        className="field-input mb-14"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />

      <div className="field-row">
        <div>
          <label className="field-label" htmlFor="cw-upper">
            Upper sash weight
          </label>
          <input
            id="cw-upper"
            className="field-input"
            inputMode="decimal"
            placeholder="lbs"
            value={upper}
            onChange={(e) => setUpper(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="cw-lower">
            Lower sash weight
          </label>
          <input
            id="cw-lower"
            className="field-input"
            inputMode="decimal"
            placeholder="lbs"
            value={lower}
            onChange={(e) => setLower(e.target.value)}
          />
        </div>
      </div>

      <label className="toggle-row mb-14">
        <input type="checkbox" checked={bushings} onChange={(e) => setBushings(e.target.checked)} />
        <span>Bushings 60%</span>
      </label>

      <button type="button" className="btn btn-dark mb-16" onClick={handleAdd}>
        + Add window
      </button>

      {entries.length === 0 ? (
        <p className="empty-hint">No windows added yet.</p>
      ) : (
        <div className="entry-list">
          {entries.map((e) => (
            <div className="entry-card" key={e.id}>
              <div>
                <div className="entry-label">{e.label}</div>
                <pre className="entry-text">{entryText(e)}</pre>
              </div>
              <button
                type="button"
                className="entry-delete"
                aria-label={`Remove ${e.label}`}
                onClick={() => handleDelete(e.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="list-footer">
        <span className="count-text">
          {entries.length === 0
            ? 'No windows yet'
            : `${entries.length} ${entries.length === 1 ? 'window' : 'windows'} ready`}
        </span>
        <button
          type="button"
          className={confirmClear ? 'clear-btn clear-btn-confirm' : 'clear-btn'}
          onClick={handleClearClick}
        >
          {confirmClear ? 'Sure? tap again' : 'Clear'}
        </button>
        <button type="button" className="copy-btn" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy all'}
        </button>
      </div>
    </div>
  );
}
