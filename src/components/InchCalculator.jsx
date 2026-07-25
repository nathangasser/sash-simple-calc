import { useEffect, useState } from 'react';
import Display from './Display';
import FractionRuler from './FractionRuler';
import Keypad from './Keypad';
import History from './History';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { compute, formatDecimal, formatFraction, toSixteenths } from '../utils/fraction';

export default function InchCalculator() {
  const [entry, setEntry] = useState('');
  const [accumulator, setAccumulator] = useState(null);
  const [pendingOp, setPendingOp] = useState(null);
  const [trail, setTrail] = useState('');
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [error, setError] = useState(false);
  const [history, setHistory] = useLocalStorage('heartwood.inches.history', []);
  const [showHistory, setShowHistory] = useState(false);

  const currentValue = entry === '' ? (accumulator ?? 0) : parseFloat(entry) || 0;
  const activeSixteenths = entry === '' ? -1 : toSixteenths(currentValue).sixteenths;

  function resetAll() {
    setEntry('');
    setAccumulator(null);
    setPendingOp(null);
    setTrail('');
    setJustEvaluated(false);
    setError(false);
  }

  function handleDigit(d) {
    if (error) {
      resetAll();
      setEntry(d);
      return;
    }
    if (justEvaluated) {
      setEntry(d);
      setJustEvaluated(false);
      setAccumulator(null);
      setPendingOp(null);
      setTrail('');
      return;
    }
    if (entry === '0') {
      setEntry(d);
      return;
    }
    setEntry(entry + d);
  }

  function handleDecimal() {
    if (error) {
      resetAll();
      setEntry('0.');
      return;
    }
    if (justEvaluated) {
      setEntry('0.');
      setJustEvaluated(false);
      setAccumulator(null);
      setPendingOp(null);
      setTrail('');
      return;
    }
    if (entry.includes('.')) return;
    setEntry((entry === '' ? '0' : entry) + '.');
  }

  function handleBackspace() {
    if (error || justEvaluated) return;
    setEntry(entry.slice(0, -1));
  }

  function handleRuler(sixteenths) {
    if (error) resetAll();
    let whole = 0;
    if (!justEvaluated && entry !== '') {
      whole = Math.trunc(parseFloat(entry) || 0);
    }
    const next = whole + sixteenths / 16;
    setEntry(String(next));
    setJustEvaluated(false);
  }

  function handleOperator(op) {
    if (error) return;
    const operand = entry === '' ? accumulator ?? 0 : parseFloat(entry) || 0;
    let newAcc = operand;
    if (accumulator !== null && pendingOp) {
      newAcc = compute(accumulator, operand, pendingOp);
      if (!isFinite(newAcc)) {
        setError(true);
        setEntry('');
        setAccumulator(null);
        setPendingOp(null);
        setTrail('');
        return;
      }
    }
    setAccumulator(newAcc);
    setPendingOp(op);
    setTrail(`${formatFraction(newAcc)} ${op}`);
    setEntry('');
    setJustEvaluated(false);
  }

  function handleEquals() {
    if (error || accumulator === null || pendingOp === null) return;
    const operand = entry === '' ? accumulator : parseFloat(entry) || 0;
    const result = compute(accumulator, operand, pendingOp);
    if (!isFinite(result)) {
      setError(true);
      setEntry('');
      setAccumulator(null);
      setPendingOp(null);
      setTrail('');
      return;
    }
    const exprStr = `${trail} ${formatFraction(operand)} =`;
    setHistory((h) =>
      [
        {
          expr: exprStr,
          resultFraction: formatFraction(result),
          resultDecimal: formatDecimal(result),
          result,
        },
        ...h,
      ].slice(0, 50)
    );
    setAccumulator(null);
    setPendingOp(null);
    setTrail('');
    setEntry(String(result));
    setJustEvaluated(true);
  }

  function handleHistorySelect(value) {
    resetAll();
    setEntry(String(value));
    setShowHistory(false);
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (/^[0-9]$/.test(e.key)) handleDigit(e.key);
      else if (e.key === '.') handleDecimal();
      else if (e.key === '+') handleOperator('+');
      else if (e.key === '-') handleOperator('-');
      else if (e.key === '*') handleOperator('×');
      else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') handleEquals();
      else if (e.key === 'Backspace') handleBackspace();
      else if (e.key === 'Escape') resetAll();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          type="button"
          className="key-small"
          style={{ padding: '6px 12px', fontSize: 12 }}
          onClick={() => setShowHistory((s) => !s)}
        >
          History {history.length > 0 ? `(${history.length})` : ''}
        </button>
      </div>

      {showHistory && (
        <History
          items={history}
          onSelect={handleHistorySelect}
          onClear={() => setHistory([])}
          onClose={() => setShowHistory(false)}
        />
      )}

      <Display
        trail={trail}
        main={error ? 'Error' : formatFraction(currentValue)}
        decimal={formatDecimal(currentValue)}
        error={error}
      />

      <FractionRuler onSelect={handleRuler} activeSixteenths={activeSixteenths} />

      <Keypad
        onDigit={handleDigit}
        onDecimal={handleDecimal}
        onOperator={handleOperator}
        onEquals={handleEquals}
        onClear={resetAll}
        onBackspace={handleBackspace}
      />

      <p className="hint">Tap a mark on the ruler to set the fraction, or type a decimal directly.</p>
    </div>
  );
}
