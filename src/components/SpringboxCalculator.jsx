import { useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { parseInches } from '../utils/cutsheet';
import {
  MODELS,
  SINGLE_MAX_WIDTH,
  heading,
  optionBoxes,
  optionTitle,
  optionsText,
  pickShown,
  plural,
  springboxOptions,
} from '../utils/springbox';

const emptyForm = {
  width: '',
  height: '',
  upperWeight: '',
  lowerWeight: '',
  install: 'any',
  hand: 'any',
  model: 'any',
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

function FitLabel({ fit, small }) {
  return <span className={`sb-fit sb-fit-${fit.key}${small ? ' sb-fit-small' : ''}`}>{fit.label}</span>;
}

function Recommended({ option }) {
  return (
    <div className="sb-hero">
      <div className="sb-tag">{heading(option)}</div>
      <div className="sb-big">{optionTitle(option)}</div>
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
      <FitLabel fit={option.fit} />
    </div>
  );
}

function OtherOption({ option }) {
  const boxes = optionBoxes(option);
  return (
    <div className="entry-card">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="entry-label" style={{ marginBottom: 2 }}>
          {optionTitle(option)}
        </div>
        {boxes.map((b) => (
          <div className="sb-alt-line" key={b.box}>
            {boxes.length > 1 ? `${b.box.split('-')[0]}: ` : ''}lower {b.lower} &middot; upper {b.upper}
            {boxes.length === 1 ? ' clicks' : ''}
          </div>
        ))}
        {option.extended && <div className="sb-alt-more">More than 3 clicks</div>}
      </div>
      <FitLabel fit={option.fit} small />
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

  const ready = [width, height, upperWeight, lowerWeight].every((n) => Number.isFinite(n) && n > 0);

  const result = useMemo(() => {
    if (!ready) return null;
    return springboxOptions(
      { width, height, upperWeight, lowerWeight },
      { install: form.install, hand: form.hand, model: form.model }
    );
  }, [ready, width, height, upperWeight, lowerWeight, form.install, form.hand, form.model]);

  const shown = result ? pickShown(result.options) : [];

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
        </div>
      )}

      {!ready ? (
        <p className="empty-hint">Enter the window size and both sash weights to see install options.</p>
      ) : (
        <>
          {result.singleNote === 'width' && (
            <p className="empty-hint">
              Single installs skipped: the window is wider than {SINGLE_MAX_WIDTH}&quot;.
            </p>
          )}
          {result.singleNote === 'ratio' && (
            <p className="empty-hint">
              Dual only by default: the sash is wide for its height (half the height is{' '}
              {Math.round(result.ratio * 100)}% of the width). Choose Single under Details to override.
            </p>
          )}
          {shown.length === 0 ? (
            <p className="empty-hint">
              No install fits those choices. Try a dual install, or check the window height.
            </p>
          ) : (
            <>
              <Recommended option={shown[0]} />
              {shown.length > 1 && (
                <>
                  <span className="field-label">Other options</span>
                  <div className="entry-list">
                    {shown.slice(1).map((o) => (
                      <OtherOption key={`${o.install}-${o.hand}-${o.model}-${o.totalClicks}`} option={o} />
                    ))}
                  </div>
                </>
              )}
            </>
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
        Based on one test unit each of D1, D2 and D4 (D5 not included). Recommendations use 3 clicks or fewer.
      </p>
    </div>
  );
}
