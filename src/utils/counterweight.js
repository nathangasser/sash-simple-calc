// Counterweight formula, cleaned up from the original app's confusing
// 'top'/'bottom' naming. For a given sash weight, the recommended
// counterweight is a half-pound-wide range straddling half the sash
// weight, shifted up for the upper sash and down for the lower sash:
//
//   upper sash: [ weight/2 , weight/2 + 0.5 ]
//   lower sash: [ weight/2 - 0.5 , weight/2 ]
//
// Bushings reduce the effective weight/2 term by 40% (multiply by 0.6)
// before the fixed 0.5 lb offset is applied.

export function counterweightRange(weight, isUpper, useBushings) {
  const base = (weight / 2) * (useBushings ? 0.6 : 1);
  return isUpper ? [base, base + 0.5] : [base - 0.5, base];
}

export function formatLbs(value) {
  return value.toFixed(2);
}

// Builds the exact plain-text block for one window entry, matching the
// crew's existing Slack format.
export function entryText(entry) {
  const lines = [entry.label];
  if (entry.upper !== null && entry.upper !== '') {
    const upper = parseFloat(entry.upper);
    const [lo, hi] = counterweightRange(upper, true, entry.bushings);
    lines.push(`Upper: ${formatLbs(upper)} (${formatLbs(lo)} - ${formatLbs(hi)})`);
  }
  if (entry.lower !== null && entry.lower !== '') {
    const lower = parseFloat(entry.lower);
    const [lo, hi] = counterweightRange(lower, false, entry.bushings);
    lines.push(`Lower: ${formatLbs(lower)} (${formatLbs(lo)} - ${formatLbs(hi)})`);
  }
  return lines.join('\n');
}

export function allEntriesText(entries) {
  return entries.map(entryText).join('\n\n');
}
