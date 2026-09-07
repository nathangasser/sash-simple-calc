// Cut sheet math for jambs and sills, working lengths only (not finish
// lengths — these intentionally run long so the crew can trim/bevel
// during install; see comments on each formula for why).
//
// Formulas current as of the initial build. Sill depth (bevel, nose
// projection) and minimum rough opening are not yet implemented —
// they're planned but need more shop input before they're safe to ship.

export const DEFAULT_WALL_DEPTH = 5.25; // 5-1/4", almost always deep enough; real wall depth is often unknown when milling
export const DEFAULT_CASING = 'western';
export const DEFAULT_COUNTERWEIGHT = 'pulley-rope';
export const DEFAULT_SILL_ALLOWANCE = 14; // sill.length = sash.width + 14" when ear length isn't specified

export const COUNTERWEIGHT_OPTIONS = [
  { value: 'pulley-rope', label: 'Pulley & rope' },
  { value: 'bushing-rope', label: 'Bushing & rope' },
  { value: 'springbox', label: 'Springbox' },
];

// Pulley & rope and bushing & rope both need a pocket, which adds 4"
// to the working length of the head jamb. Springbox does not.
function needsPocket(counterweightSystem) {
  return counterweightSystem === 'pulley-rope' || counterweightSystem === 'bushing-rope';
}

// Accepts plain decimals ("32.5") as well as the mixed-fraction text
// the crew actually measures in ("32 1/2", "32-1/2", "1/2").
export function parseInches(input) {
  if (input === null || input === undefined) return NaN;
  const s = String(input).trim();
  if (s === '') return NaN;

  const mixed = s.match(/^(-?\d+(?:\.\d+)?)[\s-]+(\d+)\/(\d+)$/);
  if (mixed) {
    const whole = parseFloat(mixed[1]);
    const frac = parseFloat(mixed[2]) / parseFloat(mixed[3]);
    return whole < 0 ? whole - frac : whole + frac;
  }

  const fractionOnly = s.match(/^(-?\d+)\/(\d+)$/);
  if (fractionOnly) {
    return parseFloat(fractionOnly[1]) / parseFloat(fractionOnly[2]);
  }

  return parseFloat(s);
}

export function jambLegLength(windowType, sashHeight) {
  if (windowType === 'casement') {
    // sash height + 3/16" + 1/2"
    return sashHeight + 0.1875 + 0.5;
  }
  // double hung: sash height + 2", extra allows for an unknown bevel
  // and trimming to fit during assembly
  return sashHeight + 2;
}

export function jambHeadLength(windowType, sashWidth, counterweightSystem) {
  if (windowType === 'casement') {
    // sash width + 1/8" + 1.5"
    return sashWidth + 0.125 + 1.5;
  }
  // double hung: sash width + 1/8" + 1.5" (+4" if the head needs a pocket)
  const base = sashWidth + 0.125 + 1.5;
  return needsPocket(counterweightSystem) ? base + 4 : base;
}

export function sillLength(sashWidth, earLength) {
  const usedDefault = earLength === null || earLength === undefined || earLength === '';
  const allowance = usedDefault ? DEFAULT_SILL_ALLOWANCE : parseInches(earLength);
  return { value: sashWidth + allowance, assumed: usedDefault };
}

// Jamb width is the rip width of the jamb stock, driven by wall depth.
// It's only worth printing when the wall depth is actually known —
// the default is a "won't be wrong" placeholder, not a real spec.
export function jambWidth(wallDepth) {
  if (wallDepth === null || wallDepth === undefined || wallDepth === '') return null;
  return parseInches(wallDepth);
}

export function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

// Same rounding as the Inches tab (nearest 1/16"), but rendered as
// `41-7/8"` — hyphenated, whole inches only — since cut sheet pieces
// are worked in plain inches at the saw, not feet-and-inches.
export function formatCutLength(value) {
  const whole = Math.floor(value + 1e-9);
  let sixteenths = Math.round((value - whole) * 16);
  let w = whole;
  if (sixteenths >= 16) {
    sixteenths = 0;
    w += 1;
  }
  if (sixteenths === 0) return `${w}"`;
  const g = gcd(sixteenths, 16);
  const num = sixteenths / g;
  const den = 16 / g;
  return w === 0 ? `${num}/${den}"` : `${w}-${num}/${den}"`;
}

// Totals are rendered in feet-and-inches since lumber is bought by
// the foot, unlike individual working lengths above.
export function formatFeetInches(totalInches) {
  const whole = Math.floor(totalInches + 1e-9);
  let sixteenths = Math.round((totalInches - whole) * 16);
  let w = whole;
  if (sixteenths >= 16) {
    sixteenths = 0;
    w += 1;
  }
  const feet = Math.floor(w / 12);
  const inches = w % 12;
  const inchPart =
    sixteenths === 0
      ? `${inches}"`
      : `${inches}-${sixteenths / gcd(sixteenths, 16)}/${16 / gcd(sixteenths, 16)}"`;
  return feet > 0 ? `${feet}' ${inchPart}` : inchPart;
}

export function computeEntry(input) {
  const { windowType, sashWidth, sashHeight, wallDepth, counterweightSystem, earLength } = input;
  const width = parseInches(sashWidth);
  const height = parseInches(sashHeight);

  const legLength = jambLegLength(windowType, height);
  const headLength = jambHeadLength(windowType, width, counterweightSystem);
  const ripWidth = jambWidth(wallDepth);
  const sill = sillLength(width, earLength);

  return {
    legLength,
    headLength,
    jambWidth: ripWidth,
    sillLength: sill.value,
    sillAssumed: sill.assumed,
  };
}

// Sums linear inches of jamb stock (2 legs + 1 head per window) and
// sill stock (1 per window) across every queued entry.
export function computeTotals(entries) {
  let jambInches = 0;
  let sillInches = 0;
  for (const e of entries) {
    const c = computeEntry(e);
    jambInches += c.legLength * 2 + c.headLength;
    sillInches += c.sillLength;
  }
  return { jambInches, sillInches };
}

export function windowTypeLabel(windowType) {
  return windowType === 'casement' ? 'Casement' : 'Double hung';
}

export function counterweightLabel(value) {
  const found = COUNTERWEIGHT_OPTIONS.find((o) => o.value === value);
  return found ? found.label : value;
}

// Casing/counterweight only affect the double hung note line for now —
// see the module comment: they don't change any number yet.
export function entryNote(entry) {
  if (entry.windowType !== 'dh') return '';
  const casingNote =
    entry.casing === 'eastern'
      ? 'Eastern casing (no blind stop)'
      : 'Western casing (3/4" blind stop)';
  return `${casingNote} · ${counterweightLabel(entry.counterweightSystem)}`;
}

export function entryTitle(entry) {
  return `${entry.label} · ${windowTypeLabel(entry.windowType)} (${entry.sashWidth}x${entry.sashHeight})`;
}

// Plain-text block for one window entry, used by "Copy all".
export function entryText(entry) {
  const c = computeEntry(entry);
  const lines = [entryTitle(entry)];
  lines.push(`Jamb legs: ${formatCutLength(c.legLength)} x2`);
  lines.push(`Jamb head: ${formatCutLength(c.headLength)}`);
  if (c.jambWidth !== null) {
    lines.push(`Jamb width: ${formatCutLength(c.jambWidth)}`);
  }
  lines.push(`Sill: ${formatCutLength(c.sillLength)}${c.sillAssumed ? ' (assumed)' : ''}`);
  const note = entryNote(entry);
  if (note) lines.push(note);
  return lines.join('\n');
}

export function totalsText(entries) {
  const { jambInches, sillInches } = computeTotals(entries);
  return [
    `Materials needed · ${entries.length} ${entries.length === 1 ? 'window' : 'windows'}`,
    `1x6 VG Doug Fir (jambs): ${formatFeetInches(jambInches)}`,
    `2x8 Redwood (sill): ${formatFeetInches(sillInches)}`,
  ].join('\n');
}

export function allEntriesText(entries) {
  return [...entries.map(entryText), totalsText(entries)].join('\n\n');
}
