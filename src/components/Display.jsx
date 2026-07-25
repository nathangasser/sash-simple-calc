export default function Display({ trail, main, decimal, error }) {
  return (
    <div className={`display${error ? ' display-error' : ''}`}>
      <div className="display-trail">{trail || '\u00A0'}</div>
      <div className="display-main">{main}</div>
      <div className="display-decimal">{error ? '\u00A0' : decimal}</div>
    </div>
  );
}
