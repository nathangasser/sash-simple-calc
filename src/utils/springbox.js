// Springbox (Acme Duplex) install suggestions for double hung windows.
//
// Geometry: the bottom of the box (0") sits at the window midline. Cable
// extension is measured down from there.
//   - Upper sash: 3" of extension when fully raised (its lugs reach 3" below
//     the midline), growing as it is lowered.
//   - Lower sash: 3" of extension when fully raised (a stop keeps it there),
//     growing as it is lowered.
//   - Both travel (window height / 2) - 3", so extension runs 3" to H/2.
//
// Which cable serves which sash depends on which side the box is on:
//   box on left  -> right cable (top spring) = upper sash, left cable (bottom spring) = lower sash
//   box on right -> left cable (bottom spring) = upper sash, right cable (top spring) = lower sash
// A dual install therefore gives every sash one top-spring and one
// bottom-spring cable, one from each box.
//
// Fit: springs pull harder the farther the cable is out, so no setting
// matches a sash weight everywhere. For each setting we work out how much
// friction (as a share of the sash weight) the sash would need to stay put
// through the first 60% of its travel from its closed position (upper: fully
// raised, lower: fully down), then label it Good / Fair / Poor / Not
// recommended from that number. Adjust FIT_LEVELS below to recalibrate.
//
// Recommendations always use 3 clicks or fewer per ratchet, even when a
// smaller balance at 4-5 clicks would fit better. Those 4-5 click settings
// are only offered as alternatives, and are extended from the tested 0-3.

import { SPRINGBOX_DATA } from '../data/springboxTests';

export const MODELS = ['D1', 'D2', 'D4'];
export const RECOMMENDED_MAX_CLICKS = 3;
export const SEARCH_MAX_CLICKS = 5;
export const SINGLE_MAX_WIDTH = 36; // single installs never allowed past this window width
export const DUAL_ONLY_RATIO = 0.7; // (height / 2) / width at or below this defaults to dual only

const HOLD_TRAVEL = 0.6;
const SHARE_TOLERANCE = 0.1; // each side must carry 40-60% of a sash's weight
const OVER_BALANCE = 0.1; // springs averaging this far above the sash weight = over balanced
const ENGAGE = 3;
const EPS = 1e-9;

// Friction (as a share of sash weight) each label tolerates, best first.
export const FIT_LEVELS = [
  { max: 0.15, label: 'Good fit', key: 'good' },
  { max: 0.25, label: 'Fair fit', key: 'fair' },
  { max: 0.4, label: 'Poor fit', key: 'poor' },
];
const NOT_RECOMMENDED = { label: 'Not recommended', key: 'nr' };
const OVER_BALANCED = { label: 'Potentially over balanced', key: 'over' };

const tierOf = (needed) => {
  const i = FIT_LEVELS.findIndex((level) => needed <= level.max + EPS);
  return i === -1 ? FIT_LEVELS.length : i;
};

// The bench tests cover 0-3 clicks. Clicks 4 and 5 continue the straight
// line through those four results at each tested extension.
function extendClicks(rows) {
  const out = rows.map((r) => r.slice());
  for (let k = 0; k < 3; k += 1) {
    const ys = rows.map((r) => r[k]);
    const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
    const slope = ys.reduce((s, y, x) => s + (x - 1.5) * (y - mean), 0) / 5;
    for (let c = rows.length; c <= SEARCH_MAX_CLICKS; c += 1) {
      out[c] = out[c] || [];
      out[c][k] = Math.max(0, mean + slope * (c - 1.5));
    }
  }
  return out;
}

const FORCE_DATA = {};
for (const model of MODELS) {
  FORCE_DATA[model] = {
    top: extendClicks(SPRINGBOX_DATA[model].top),
    bottom: extendClicks(SPRINGBOX_DATA[model].bottom),
  };
}

// Linear interpolation between the tested extensions (3", 12", 24"), and
// straight-line extrapolation past 24" using the 12"-24" slope.
export function cableForce(model, spring, clicks, extension) {
  const [f3, f12, f24] = FORCE_DATA[model][spring][clicks];
  const force =
    extension <= 12
      ? f3 + ((f12 - f3) * (extension - 3)) / 9
      : f12 + ((f24 - f12) * (extension - 12)) / 12;
  return Math.max(0, force);
}

function springFor(sash, hand) {
  const upperGetsTop = hand === 'left';
  if (sash === 'upper') return upperGetsTop ? 'top' : 'bottom';
  return upperGetsTop ? 'bottom' : 'top';
}

function candidates(sash, model, install, hand, maxClicks) {
  const list = [];
  const range = Array.from({ length: maxClicks + 1 }, (_, i) => i);

  if (install === 'single') {
    const spring = springFor(sash, hand);
    for (const c of range) {
      list.push({
        clicks: { left: hand === 'left' ? c : null, right: hand === 'right' ? c : null },
        cables: [{ model, spring, clicks: c }],
      });
    }
    return list;
  }

  const leftSpring = springFor(sash, 'left');
  const rightSpring = springFor(sash, 'right');
  for (const a of range) {
    for (const b of range) {
      list.push({
        clicks: { left: a, right: b },
        cables: [
          { model, spring: leftSpring, clicks: a },
          { model, spring: rightSpring, clicks: b },
        ],
      });
    }
  }
  return list;
}

function evalSash(sash, cables, weight, geo) {
  const extAt = (p) => (sash === 'upper' ? ENGAGE + p * geo.travel : geo.mid - p * geo.travel);
  const forces = (p) => cables.map((c) => cableForce(c.model, c.spring, c.clicks, extAt(p)));
  const total = (p) => forces(p).reduce((s, f) => s + f, 0);

  // The smallest friction (as a fraction of the sash weight) that would let
  // this setting hold through the hold zone. The closed position (upper
  // fully raised, lower fully down) only matters in one direction: too
  // little pull drops the upper sash, too much pops up the lower sash.
  const f0 = total(0);
  let needed = sash === 'upper' ? 1 - f0 / weight : f0 / weight - 1;
  let ratioSum = f0 / weight;
  const steps = Math.round(HOLD_TRAVEL * 100);
  for (let i = 1; i <= steps; i += 1) {
    const ratio = total(i / 100) / weight;
    ratioSum += ratio;
    needed = Math.max(needed, ratio - 1, 1 - ratio);
  }
  needed = Math.max(0, needed);

  // Side-to-side split for dual installs, across the hold zone.
  let shareDev = 0;
  if (cables.length === 2) {
    for (let i = 0; i <= 16; i += 1) {
      const [a, b] = forces((i / 16) * HOLD_TRAVEL);
      const sum = a + b;
      if (sum > 0) shareDev = Math.max(shareDev, Math.abs(a / sum - 0.5));
    }
  }

  return {
    needed,
    tier: tierOf(needed),
    average: ratioSum / (steps + 1) - 1,
    shareDev,
  };
}

const sumClicks = (clicks) => (clicks.left ?? 0) + (clicks.right ?? 0);

// Best tier first, then fewest clicks, then the closest match.
function isBetter(a, b) {
  if (!b) return true;
  if (a.tier !== b.tier) return a.tier < b.tier;
  if (a.totalClicks !== b.totalClicks) return a.totalClicks < b.totalClicks;
  return a.needed < b.needed - EPS;
}

// Settings that split a sash's load worse than 60/40 between the two sides
// are never offered.
function pickBest(sash, model, install, hand, weight, geo, maxClicks) {
  let best = null;
  for (const cand of candidates(sash, model, install, hand, maxClicks)) {
    const result = { ...cand, ...evalSash(sash, cand.cables, weight, geo) };
    if (result.shareDev > SHARE_TOLERANCE + EPS) continue;
    result.totalClicks = sumClicks(cand.clicks);
    if (isBetter(result, best)) best = result;
  }
  return best;
}

// input: { width, height, upperWeight, lowerWeight } as numbers (inches / lbs),
// filters: { install: 'any'|'single'|'dual', hand: 'any'|'left'|'right',
//            model: 'any'|'D1'|'D2'|'D4' }.
//
// Single installs default off for wide, short windows (half the height is
// 70% of the width or less) because those sashes rack; choosing Single
// explicitly overrides that. Past 36" wide, single is never offered.
export function springboxOptions(input, filters = {}) {
  const { width, height, upperWeight, lowerWeight } = input;
  const { install = 'any', hand = 'any', model = 'any' } = filters;

  const geo = { mid: height / 2, travel: height / 2 - ENGAGE };
  if (!(geo.travel > 0)) return { options: [], singleNote: null, ratio: 0 };

  const ratio = height / 2 / width;
  const tooWide = width > SINGLE_MAX_WIDTH;
  const dualByDefault = ratio <= DUAL_ONLY_RATIO;
  const allowSingle = install !== 'dual' && !tooWide && (install === 'single' || !dualByDefault);

  let singleNote = null;
  if (install !== 'dual' && tooWide) singleNote = 'width';
  else if (install === 'any' && dualByDefault) singleNote = 'ratio';

  const installs = [];
  if (allowSingle) {
    for (const h of hand === 'any' ? ['left', 'right'] : [hand]) installs.push({ install: 'single', hand: h });
  }
  if (install !== 'single') installs.push({ install: 'dual', hand: null });

  const models = model === 'any' ? MODELS : [model];
  const options = [];
  const seen = new Set();

  for (const { install: kind, hand: h } of installs) {
    for (const m of models) {
      // One search capped at the 3-click sweet spot, one allowed up to 5.
      for (const maxClicks of [RECOMMENDED_MAX_CLICKS, SEARCH_MAX_CLICKS]) {
        const lower = pickBest('lower', m, kind, h, lowerWeight, geo, maxClicks);
        const upper = pickBest('upper', m, kind, h, upperWeight, geo, maxClicks);
        if (!lower || !upper) continue;

        const key = [kind, h, m, JSON.stringify(upper.clicks), JSON.stringify(lower.clicks)].join('|');
        if (seen.has(key)) continue;
        seen.add(key);

        const needed = Math.max(lower.needed, upper.needed);
        const tier = tierOf(needed);
        const over = Math.max(lower.average, upper.average) > OVER_BALANCE;
        const highest = Math.max(
          upper.clicks.left ?? 0,
          upper.clicks.right ?? 0,
          lower.clicks.left ?? 0,
          lower.clicks.right ?? 0
        );

        options.push({
          install: kind,
          hand: h,
          model: m,
          lower,
          upper,
          needed,
          tier,
          over,
          fit: tier >= FIT_LEVELS.length ? NOT_RECOMMENDED : over ? OVER_BALANCED : FIT_LEVELS[tier],
          totalClicks: lower.totalClicks + upper.totalClicks,
          extended: highest > RECOMMENDED_MAX_CLICKS,
        });
      }
    }
  }

  options.sort(
    (a, b) =>
      Number(a.extended) - Number(b.extended) ||
      a.tier - b.tier ||
      a.totalClicks - b.totalClicks ||
      a.needed - b.needed
  );

  return { options, singleNote, ratio };
}

// The recommendation, one more option, and either a better-fitting option
// that needs more than 3 clicks or a third option.
export function pickShown(options) {
  if (options.length === 0) return [];
  const [top, ...rest] = options;
  const alt = rest.find((o) => o.extended && (o.tier < top.tier || (o.over && o.tier < FIT_LEVELS.length)));
  const others = rest.filter((o) => o !== alt).slice(0, alt ? 1 : 2);
  return alt ? [top, ...others, alt] : [top, ...others];
}

export const plural = (n) => `${n} ${n === 1 ? 'click' : 'clicks'}`;

export function optionTitle(option) {
  return option.install === 'dual'
    ? `Dual ${option.model}`
    : `Single ${option.model} · ${option.hand}-hand box`;
}

// [{ box: 'Left-hand box', lower: 1, upper: 2 }, ...]
export function optionBoxes(option) {
  const sides = option.install === 'dual' ? ['left', 'right'] : [option.hand];
  return sides.map((side) => ({
    box: `${side === 'left' ? 'Left' : 'Right'}-hand box`,
    lower: option.lower.clicks[side],
    upper: option.upper.clicks[side],
  }));
}

export const heading = (option) => (option.fit.key === 'nr' ? 'Closest option' : 'Recommended');

export function optionsText(shown) {
  return shown
    .map((option, i) => {
      const lines = [`${i === 0 ? `${heading(option)}: ` : ''}${optionTitle(option)} (${option.fit.label})`];
      for (const b of optionBoxes(option)) {
        lines.push(`${b.box}: lower ${plural(b.lower)}, upper ${plural(b.upper)}`);
      }
      if (option.extended) lines.push('More than 3 clicks');
      return lines.join('\n');
    })
    .join('\n\n');
}
