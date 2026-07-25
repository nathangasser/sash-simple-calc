import { simplifyFraction } from '../utils/fraction';

const SIXTEENTHS = Array.from({ length: 15 }, (_, i) => i + 1); // 1..15

function tickSize(n) {
  if (n === 8) return 'major'; // 1/2
  if (n === 4 || n === 12) return 'quarter'; // 1/4, 3/4
  if (n % 2 === 0) return 'eighth'; // 1/8 marks
  return 'sixteenth';
}

export default function FractionRuler({ onSelect, activeSixteenths }) {
  return (
    <div className="ruler" role="group" aria-label="Fraction picker, in sixteenths of an inch">
      <button
        type="button"
        className={`tick tick-whole${activeSixteenths === 0 ? ' tick-active' : ''}`}
        onClick={() => onSelect(0)}
        title="Whole inch, no fraction"
      >
        <span className="tick-mark" />
        <span>0</span>
      </button>
      {SIXTEENTHS.map((n) => {
        const { num, den } = simplifyFraction(n, 16);
        const size = tickSize(n);
        const showLabel = size !== 'sixteenth';
        return (
          <button
            key={n}
            type="button"
            className={`tick tick-${size}${activeSixteenths === n ? ' tick-active' : ''}`}
            onClick={() => onSelect(n)}
            title={`${num}/${den}"`}
          >
            <span className="tick-mark" />
            {showLabel && <span>{num}/{den}</span>}
          </button>
        );
      })}
    </div>
  );
}
