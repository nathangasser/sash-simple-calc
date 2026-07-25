export default function History({ items, onSelect, onClear, onClose }) {
  return (
    <div className="entry-card" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span className="entry-label" style={{ marginBottom: 0 }}>History</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="key-small" style={{ padding: '6px 10px', fontSize: 12 }} onClick={onClear}>
            Clear
          </button>
          <button type="button" className="key-small" style={{ padding: '6px 10px', fontSize: 12 }} onClick={onClose} aria-label="Close history">
            ✕
          </button>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="empty-hint" style={{ margin: 0 }}>No calculations yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, i) => (
            <button
              type="button"
              key={i}
              onClick={() => onSelect(item.result)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                border: '3px solid var(--ink)',
                borderRadius: 8,
                padding: '8px 10px',
                background: '#ffffff',
                cursor: 'pointer',
                fontFamily: "'Courier New', monospace",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--ink-soft)' }}>{item.expr}</span>
              <span>{item.resultFraction}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
