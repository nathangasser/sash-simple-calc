// All measurements are stored internally as plain decimal inches (JS numbers).
// These helpers only handle the *display* side: rounding to the nearest
// 1/16" and rendering that as a reduced fraction.

export function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

// Splits a decimal inch value into a whole number + a sixteenths count (0-15),
// rounding to the nearest 1/16". A small epsilon guards against floating
// point results like 2.9999999999 landing on the wrong whole number.
export function toSixteenths(value) {
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  let whole = Math.floor(abs + 1e-9);
  const frac = abs - whole;
  let sixteenths = Math.round(frac * 16);
  if (sixteenths >= 16) {
    sixteenths = 0;
    whole += 1;
  }
  return { sign, whole, sixteenths };
}

export function simplifyFraction(num, den) {
  if (num === 0) return { num: 0, den: 1 };
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}

// e.g. 3.5 -> `3 1/2"`, 0.75 -> `3/4"`, 4 -> `4"`
export function formatFraction(value) {
  const { sign, whole, sixteenths } = toSixteenths(value);
  const isZero = whole === 0 && sixteenths === 0;
  const signStr = sign < 0 && !isZero ? '-' : '';

  if (sixteenths === 0) {
    return `${signStr}${whole}"`;
  }

  const { num, den } = simplifyFraction(sixteenths, 16);
  if (whole === 0) {
    return `${signStr}${num}/${den}"`;
  }
  return `${signStr}${whole} ${num}/${den}"`;
}

// Plain decimal readout, trimmed of float noise and trailing zeros.
export function formatDecimal(value) {
  const rounded = Math.round(value * 10000) / 10000;
  return rounded.toString();
}

export function compute(a, b, op) {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '\u00D7':
      return a * b;
    case '\u00F7':
      return b === 0 ? NaN : a / b;
    default:
      return b;
  }
}
