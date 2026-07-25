const DIGIT_ROWS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
];

export default function Keypad({
  onDigit,
  onDecimal,
  onOperator,
  onEquals,
  onClear,
  onBackspace,
}) {
  return (
    <div>
      <div className="keypad-utility">
        <button type="button" className="key-small" onClick={onClear}>
          C
        </button>
        <button type="button" className="key-small" onClick={onBackspace} aria-label="Backspace">
          ⌫
        </button>
      </div>

      <div className="keypad-numbers">
        {DIGIT_ROWS.flat().map((d) => (
          <button type="button" className="key" key={d} onClick={() => onDigit(d)}>
            {d}
          </button>
        ))}
        <button type="button" className="key key-zero" onClick={() => onDigit('0')}>
          0
        </button>
        <button type="button" className="key" onClick={onDecimal}>
          .
        </button>
      </div>

      <div className="keypad-operators">
        <button type="button" className="key-op" onClick={() => onOperator('÷')}>
          ÷
        </button>
        <button type="button" className="key-op" onClick={() => onOperator('×')}>
          ×
        </button>
        <button type="button" className="key-op" onClick={() => onOperator('-')}>
          −
        </button>
        <button type="button" className="key-op" onClick={() => onOperator('+')}>
          +
        </button>
      </div>

      <button type="button" className="key-equals" onClick={onEquals}>
        =
      </button>
    </div>
  );
}
