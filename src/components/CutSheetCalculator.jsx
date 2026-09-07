import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  COUNTERWEIGHT_OPTIONS,
  DEFAULT_CASING,
  DEFAULT_COUNTERWEIGHT,
  allEntriesText,
  computeEntry,
  computeTotals,
  entryNote,
  entryTitle,
  formatCutLength,
  formatFeetInches,
  maxSashFromRO,
  parseInches,
  roMinimum,
} from '../utils/cutsheet';

const emptyForm = {
  windowType: 'dh',
  solveFor: 'sash',
  sashWidth: '',
  sashHeight: '',
  wallDepth: '',
  casing: DEFAULT_CASING,
  counterweightSystem: DEFAULT_COUNTERWEIGHT,
  earLength: '',
};

function WindowTypeSeg({ value, onChange }) {
  return (
    <div className="seg mb-14">
      <button
        type="button"
        className={value === 'dh' ? 'seg-btn seg-btn-active' : 'seg-btn'}
        onClick={() => onChange('dh')}
      >
        Double hung
      </button>
      <button
        type="button"
        className={value === 'casement' ? 'seg-btn seg-btn-active' : 'seg-btn'}
        onClick={() => onChange('casement')}
      >
        Casement
      </button>
    </div>
  );
}

function SolveForSeg({ value, onChange }) {
  return (
    <div className="seg mb-14">
      <button
        type="button"
        className={value === 'sash' ? 'seg-btn seg-btn-active' : 'seg-btn'}
        onClick={() => onChange('sash')}
      >
        Sash size
      </button>
      <button
        type="button"
        className={value === 'ro' ? 'seg-btn seg-btn-active' : 'seg-btn'}
        onClick={() => onChange('ro')}
      >
        Rough opening
      </button>
    </div>
  );
}

function RoCallout({ label, width, height, solved }) {
  return (
    <div className="ro-callout">
      <span className="ro-callout-label">{label}</span>
      <span className="ro-callout-val">
        {formatCutLength(width)} &times; {formatCutLength(height)}
        {solved && <span className="solved-flag">solved</span>}
      </span>
    </div>
  );
}

function DetailsFields({ form, setField }) {
  return (
    <>
      <label className="field-label" htmlFor="cs-wall-depth">
        Wall depth
      </label>
      <input
        id="cs-wall-depth"
        className="field-input mb-14"
        inputMode="decimal"
        placeholder='default 5 1/4"'
        value={form.wallDepth}
        onChange={(e) => setField('wallDepth', e.target.value)}
      />

      <label className="field-label" htmlFor="cs-ear-length">
        Ear length
      </label>
      <input
        id="cs-ear-length"
        className="field-input mb-14"
        inputMode="decimal"
        placeholder='default adds 14" to sash width'
        value={form.earLength}
        onChange={(e) => setField('earLength', e.target.value)}
      />

      {form.windowType === 'dh' && (
        <>
          <span className="field-label">Casing orientation</span>
          <div className="seg mb-14">
            <button
              type="button"
              className={form.casing === 'eastern' ? 'seg-btn seg-btn-active' : 'seg-btn'}
              onClick={() => setField('casing', 'eastern')}
            >
              Eastern
            </button>
            <button
              type="button"
              className={form.casing === 'western' ? 'seg-btn seg-btn-active' : 'seg-btn'}
              onClick={() => setField('casing', 'western')}
            >
              Western
            </button>
          </div>

          <span className="field-label">Counterweight system</span>
          <div className="seg mb-14">
            {COUNTERWEIGHT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={form.counterweightSystem === opt.value ? 'seg-btn seg-btn-active seg-btn-small' : 'seg-btn seg-btn-small'}
                onClick={() => setField('counterweightSystem', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function EntryLines({ entry, showRoMin }) {
  const c = computeEntry(entry);
  const note = entryNote(entry);
  const width = parseInches(entry.sashWidth);
  const height = parseInches(entry.sashHeight);
  return (
    <>
      {entry.solvedFromRO && (
        <RoCallout label="Max sash size" width={width} height={height} solved />
      )}
      {!entry.solvedFromRO && showRoMin && (
        <RoCallout
          label="Rough opening (min)"
          width={roMinimum(width, height).width}
          height={roMinimum(width, height).height}
        />
      )}
      <div className="cut-line">
        <span>Jamb legs</span>
        <span className="cut-val">
          {formatCutLength(c.legLength)}
          <span className="qty-pill">&times;2</span>
        </span>
      </div>
      <div className="cut-line">
        <span>Jamb head</span>
        <span className="cut-val">{formatCutLength(c.headLength)}</span>
      </div>
      {c.jambWidth !== null && (
        <div className="cut-line">
          <span>Jamb width</span>
          <span className="cut-val">{formatCutLength(c.jambWidth)}</span>
        </div>
      )}
      <div className="cut-line">
        <span>
          Sill
          {c.sillAssumed && <span className="assumed-flag">assumed</span>}
        </span>
        <span className="cut-val">{formatCutLength(c.sillLength)}</span>
      </div>
      {note && <p className="cut-note">{note}</p>}
    </>
  );
}

function EditModal({ entry, onSave, onCancel }) {
  const [form, setForm] = useState({ ...entry });
  const isRO = !!form.solvedFromRO;

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setDimW(value) {
    setField(isRO ? 'roWidthInput' : 'sashWidth', value);
  }

  function setDimH(value) {
    setField(isRO ? 'roHeightInput' : 'sashHeight', value);
  }

  function handleSave() {
    if (isRO) {
      const roW = parseInches(form.roWidthInput);
      const roH = parseInches(form.roHeightInput);
      if (isNaN(roW) || isNaN(roH)) return;
      const solved = maxSashFromRO(roW, roH);
      onSave({ ...form, sashWidth: solved.width, sashHeight: solved.height });
      return;
    }
    if (form.sashWidth === '' || form.sashHeight === '') return;
    onSave(form);
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="field-label" style={{ marginBottom: 0 }}>
            Edit window
          </span>
          <button type="button" className="modal-close" aria-label="Close" onClick={onCancel}>
            &times;
          </button>
        </div>

        <label className="field-label" htmlFor="cs-edit-label">
          Window label
        </label>
        <input
          id="cs-edit-label"
          className="field-input mb-14"
          value={form.label}
          onChange={(e) => setField('label', e.target.value)}
        />

        <span className="field-label">Window type</span>
        <WindowTypeSeg value={form.windowType} onChange={(v) => setField('windowType', v)} />

        <div className="field-row">
          <div>
            <label className="field-label" htmlFor="cs-edit-width">
              {isRO ? 'RO width' : 'Sash width'}
            </label>
            <input
              id="cs-edit-width"
              className="field-input"
              inputMode="decimal"
              placeholder="in"
              value={isRO ? form.roWidthInput : form.sashWidth}
              onChange={(e) => setDimW(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="cs-edit-height">
              {isRO ? 'RO height' : 'Sash height'}
            </label>
            <input
              id="cs-edit-height"
              className="field-input"
              inputMode="decimal"
              placeholder="in"
              value={isRO ? form.roHeightInput : form.sashHeight}
              onChange={(e) => setDimH(e.target.value)}
            />
          </div>
        </div>

        <DetailsFields form={form} setField={setField} />

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-dark" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CutSheetCalculator() {
  const [entries, setEntries] = useLocalStorage('heartwood.cutsheet.entries', []);
  const [showRoMin, setShowRoMin] = useLocalStorage('heartwood.cutsheet.showRoMin', false);
  const [form, setForm] = useState(emptyForm);
  const [showDetails, setShowDetails] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [copied, setCopied] = useState(false);
  const clearTimeoutRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(clearTimeoutRef.current);
  }, []);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleAdd() {
    if (form.sashWidth === '' || form.sashHeight === '') return;
    let newEntry;
    if (form.solveFor === 'ro') {
      const roW = parseInches(form.sashWidth);
      const roH = parseInches(form.sashHeight);
      if (isNaN(roW) || isNaN(roH)) return;
      const solved = maxSashFromRO(roW, roH);
      newEntry = {
        ...form,
        id: Date.now(),
        label: `Window ${entries.length + 1}`,
        solvedFromRO: true,
        roWidthInput: form.sashWidth,
        roHeightInput: form.sashHeight,
        sashWidth: solved.width,
        sashHeight: solved.height,
      };
    } else {
      newEntry = {
        ...form,
        id: Date.now(),
        label: `Window ${entries.length + 1}`,
        solvedFromRO: false,
      };
    }
    setEntries((prev) => [...prev, newEntry]);
    setForm(emptyForm);
    setShowDetails(false);
  }

  function handleDelete(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function handleSaveEdit(updated) {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setEditingId(null);
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
    const text = allEntriesText(entries, { showRoMin });
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

  const editingEntry = entries.find((e) => e.id === editingId) || null;
  const totals = entries.length > 0 ? computeTotals(entries) : null;

  return (
    <div className="card">
      <span className="field-label">Window type</span>
      <WindowTypeSeg value={form.windowType} onChange={(v) => setField('windowType', v)} />

      <div className="field-row">
        <div>
          <label className="field-label" htmlFor="cs-width">
            {form.solveFor === 'ro' ? 'RO width' : 'Sash width'}
          </label>
          <input
            id="cs-width"
            className="field-input"
            inputMode="decimal"
            placeholder="in"
            value={form.sashWidth}
            onChange={(e) => setField('sashWidth', e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="cs-height">
            {form.solveFor === 'ro' ? 'RO height' : 'Sash height'}
          </label>
          <input
            id="cs-height"
            className="field-input"
            inputMode="decimal"
            placeholder="in"
            value={form.sashHeight}
            onChange={(e) => setField('sashHeight', e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        className="details-toggle"
        onClick={() => setShowDetails((s) => !s)}
      >
        <span>Details (optional)</span>
        <span className={showDetails ? 'chevron chevron-open' : 'chevron'}>&#9662;</span>
      </button>

      {showDetails && (
        <div className="mb-14">
          <span className="field-label">Solve for</span>
          <SolveForSeg
            value={form.solveFor}
            onChange={(v) => {
              setField('solveFor', v);
              setField('sashWidth', '');
              setField('sashHeight', '');
            }}
          />

          <label className="toggle-row mb-14">
            <input
              type="checkbox"
              checked={showRoMin}
              onChange={(e) => setShowRoMin(e.target.checked)}
            />
            <span>Show rough opening minimum</span>
          </label>

          <hr className="details-divider" />

          <DetailsFields form={form} setField={setField} />
        </div>
      )}

      <button type="button" className="btn btn-dark mb-16" onClick={handleAdd}>
        + Add window
      </button>

      {entries.length === 0 ? (
        <p className="empty-hint">No windows added yet.</p>
      ) : (
        <div className="entry-list">
          {entries.map((e) => (
            <div
              className="entry-card entry-card-clickable"
              key={e.id}
              onClick={() => setEditingId(e.id)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="entry-label">{entryTitle(e)}</div>
                <EntryLines entry={e} showRoMin={showRoMin} />
              </div>
              <button
                type="button"
                className="entry-delete"
                aria-label={`Remove ${e.label}`}
                onClick={(ev) => {
                  ev.stopPropagation();
                  handleDelete(e.id);
                }}
              >
                &#10005;
              </button>
            </div>
          ))}
        </div>
      )}

      {totals && (
        <div className="totals-card">
          <div className="totals-title">
            Materials needed &middot; {entries.length} {entries.length === 1 ? 'window' : 'windows'}
          </div>
          <div className="total-row">
            <span>1x6 VG Doug Fir</span>
            <span>{formatFeetInches(totals.jambInches)}</span>
          </div>
          <p className="total-sub">jamb legs &amp; heads, all windows</p>
          <div className="total-row">
            <span>2x8 Redwood</span>
            <span>{formatFeetInches(totals.sillInches)}</span>
          </div>
          <p className="total-sub" style={{ marginBottom: 0 }}>
            sills, all windows
          </p>
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

      {editingEntry && (
        <EditModal entry={editingEntry} onSave={handleSaveEdit} onCancel={() => setEditingId(null)} />
      )}
    </div>
  );
}
