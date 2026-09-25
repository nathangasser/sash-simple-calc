import { useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { parseInches } from '../utils/cutsheet';
import {
  DEFAULT_FRICTION,
  MODELS,
  SINGLE_MAX_WIDTH,
  optionBoxes,
  optionIssues,
  optionTitle,
  optionsText,
  plural,
  springboxOptions,
} from '../utils/springbox';

const MAX_EXACT_SHOWN = 6;
const MAX_CLOSEST_SHOWN = 3;

const emptyForm = {
  width: '',
  height: '',
  upperWeight: '',
  lowerWeight: '',
  install: 'any',
  hand: 'any',
  model: 'any',
  friction: String(DEFAULT_FRICTION * 100),
};

function Seg({ options, value, onChange }) {
  return (
    <div className="seg mb-14">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={value === opt.value ? 'seg-btn seg-btn-active' : 'seg-btn'}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function OptionCard({ option, index, friction }) {
  const issues = optionIssues(option);
  return (
    <div className="entry-card">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="entry-label">
          {optionTitle(option, index)}
          {option.exact ? (
            <span className="solved-flag option-flag">fits</span>
          ) : (
            <span className="assumed-flag">closest</span>
          )}
        </div>
        {optionBoxes(option).map((b) => (
          <div key={b.box}>
            <div className="box-label">{b.box}</div>
            <div className="cut-line">
              <span>Lower sash</span>
              <span className="cut-val">{plural(b.lower)}</span>
            </div>
            <div className="cut-line">
              <span>Upper sash</span>
              <span className="cut-val">{plural(b.upper)}</span>
            </div>
          </div>
        ))}
        {issues.map((text) => (
          <p className="cut-note" key={text}>
            {text}
          </p>
        ))}
        <p className="cut-note">
          Holds through 80% of travel with at least {Math.ceil(option.needed * 100)}% friction
          {option.exact ? '' : ` (you set ${Math.round(friction * 100)}%)`}
        </p>
      </div>
    </div>
  );
}

export default function SpringboxCalculator() {
  const [form, setForm] = useLocalStorage('heartwood.springbox.form', emptyForm);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const width = parseInches(form.width);
  const height = parseInches(form.height);
  const upperWeight = parseFloat(form.upperWeight);
  const lowerWeight = parseFloat(form.lowerWeight);
  const frictionPct = parseFloat(form.friction);
  const friction = Number.isFinite(frictionPct)
    ? Math.min(Math.max(frictionPct, 0), 90) / 100
    : DEFAULT_FRICTION;

  const ready = [width, height, upperWeight, lowerWeight].every((n) => Number.isFinite(n) && n > 0);

  const result = useMemo(() => {
    if (!ready) return null;
    return springboxOptions(
      { width, height, upperWeight, lowerWeight },
      { install: form.install, hand: form.hand, model: form.model },
      friction
    );
  }, [ready, width, height, upperWeight, lowerWeight, form.install, form.hand, form.model, friction]);

  const exact = result ? result.options.filter((o) => o.exact) : [];
  const shown = result
    ? exact.length > 0
      ? exact.slice(0, MAX_EXACT_SHOWN)
      : result.options.slice(0, MAX_CLOSEST_SHOWN)
    : [];

  function handleCopy() {
    if (shown.length === 0) return;
    const text = optionsText(shown);
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
      <div className="field-row">
        <div>
          <label className="field-label" htmlFor="sb-width">
            Window width
          </label>
          <input
            id="sb-width"
            className="field-input"
            inputMode="decimal"
            placeholder="in"
            value={form.width}
            onChange={(e) => setField('width', e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="sb-height">
            Window height
          </label>
          <input
            id="sb-height"
            className="field-input"
            inputMode="decimal"
            placeholder="in"
            value={form.height}
            onChange={(e) => setField('height', e.target.value)}
          />
        </div>
      </div>

      <div className="field-row">
        <div>
          <label className="field-label" htmlFor="sb-upper">
            Upper sash weight
          </label>
          <input
            id="sb-upper"
            className="field-input"
            inputMode="decimal"
            placeholder="lbs"
            value={form.upperWeight}
            onChange={(e) => setField('upperWeight', e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="sb-lower">
            Lower sash weight
          </label>
          <input
            id="sb-lower"
            className="field-input"
            inputMode="decimal"
            placeholder="lbs"
            value={form.lowerWeight}
            onChange={(e) => setField('lowerWeight', e.target.value)}
          />
        </div>
      </div>

      <button type="button" className="details-toggle" onClick={() => setShowDetails((s) => !s)}>
        <span>Details (optional)</span>
        <span className={showDetails ? 'chevron chevron-open' : 'chevron'}>&#9662;</span>
      </button>

      {showDetails && (
        <div className="mb-14">
          <span className="field-label">Install</span>
          <Seg
            value={form.install}
            onChange={(v) => setField('install', v)}
            options={[
              { value: 'any', label: 'Either' },
              { value: 'single', label: 'Single' },
              { value: 'dual', label: 'Dual' },
            ]}
          />

          {form.install !== 'dual' && (
            <>
              <span className="field-label">Single install side</span>
              <Seg
                value={form.hand}
                onChange={(v) => setField('hand', v)}
                options={[
                  { value: 'any', label: 'Either' },
                  { value: 'left', label: 'Left' },
                  { value: 'right', label: 'Right' },
                ]}
              />
            </>
          )}

          <span className="field-label">Model</span>
          <Seg
            value={form.model}
            onChange={(v) => setField('model', v)}
            options={[{ value: 'any', label: 'Any' }, ...MODELS.map((m) => ({ value: m, label: m }))]}
          />

          <label className="field-label" htmlFor="sb-friction">
            Sash friction (% of sash weight)
          </label>
          <input
            id="sb-friction"
            className="field-input"
            inputMode="decimal"
            placeholder="15"
            value={form.friction}
            onChange={(e) => setField('friction', e.target.value)}
          />
        </div>
      )}

      {!ready ? (
        <p className="empty-hint">Enter the window size and both sash weights to see install options.</p>
      ) : (
        <>
          {result.singleBlocked && (
            <p className="empty-hint">
              Single installs skipped: the window is wider than {SINGLE_MAX_WIDTH}&quot;.
            </p>
          )}
          {exact.length === 0 && shown.length > 0 && (
            <p className="empty-hint">
              Nothing holds at {Math.round(friction * 100)}% friction. Closest options:
            </p>
          )}
          {shown.length === 0 ? (
            <p className="empty-hint">
              No install fits those choices. Try a dual install, or check the window height.
            </p>
          ) : (
            <div className="entry-list">
              {shown.map((o, i) => (
                <OptionCard key={`${o.install}-${o.hand}-${o.model}`} option={o} index={i} friction={friction} />
              ))}
            </div>
          )}
        </>
      )}

      <div className="list-footer">
        <span className="count-text">
          {shown.length === 0 ? 'No options yet' : `${shown.length} ${shown.length === 1 ? 'option' : 'options'}`}
        </span>
        <button type="button" className="copy-btn" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy all'}
        </button>
      </div>
      <p className="hint" style={{ marginTop: 12 }}>
        Based on one test unit each of D1, D2 and D4 (D5 not included). Clicks limited to 0 to 3.
      </p>
    </div>
  );
}
