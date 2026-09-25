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
// A sash "holds" at a position when the spring force stays within friction
// of its weight. We require each sash to hold through the first 80% of its
// travel measured from its closed position (upper: fully raised, lower:
// fully down). Beyond that it may drift: the lower sash may sag, the upper
// sash may bounce back up.

import { SPRINGBOX_DATA } from '../data/springboxTests';

export const MODELS = ['D1', 'D2', 'D4'];
export const MAX_CLICKS = 3;
export const SINGLE_MAX_WIDTH = 36; // single installs only allowed up to this window width
export const DEFAULT_FRICTION = 0.15;

const HOLD_TRAVEL = 0.8;
const SHARE_TOLERANCE = 0.1; // each side must carry 40-60% of a sash's weight
const ENGAGE = 3;
const EPS = 1e-9;

// Linear interpolation between the tested extensions (3", 12", 24"), and
// straight-line extrapolation past 24" using the 12"-24" slope.
export function cableForce(model, spring, clicks, extension) {
  const [f3, f12, f24] = SPRINGBOX_DATA[model][spring][clicks];
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

function candidates(sash, model, install, hand) {
  const list = [];
  const range = Array.from({ length: MAX_CLICKS + 1 }, (_, i) => i);

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

const pct = (p) => `${Math.round(p * 100)}%`;

function describeIssue(sash, failMode, reach) {
  if (sash === 'upper') {
    if (failMode === 'closed-weak') return "won't stay fully raised";
    if (failMode === 'strong') {
      return reach === 0 ? "won't stay lowered (springs back up)" : `bounces back up past ${pct(reach)} lowered`;
    }
    return `sags near ${pct(reach)} lowered`;
  }
  if (failMode === 'closed-strong') return "won't stay fully down";
  if (failMode === 'weak') {
    return reach === 0 ? "won't stay raised (sags down)" : `sags past ${pct(reach)} raised`;
  }
  return `springs up near ${pct(reach)} raised`;
}

function evalSash(sash, cables, weight, geo, friction) {
  const lo = weight * (1 - friction);
  const hi = weight * (1 + friction);
  const extAt = (p) => (sash === 'upper' ? ENGAGE + p * geo.travel : geo.mid - p * geo.travel);
  const forces = (p) => cables.map((c) => cableForce(c.model, c.spring, c.clicks, extAt(p)));
  const total = (p) => forces(p).reduce((s, f) => s + f, 0);

  // Closed position: the upper sash must not fall from fully raised, the
  // lower sash must not pop up from fully down. Too much/too little there
  // is harmless, so this check is one-sided.
  const f0 = total(0);
  const closedOk = sash === 'upper' ? f0 >= lo - EPS : f0 <= hi + EPS;

  let reach = 0;
  let failMode = null;
  if (!closedOk) {
    failMode = sash === 'upper' ? 'closed-weak' : 'closed-strong';
  } else {
    reach = 1;
    for (let i = 1; i <= 100; i += 1) {
      const f = total(i / 100);
      if (f < lo - EPS) {
        reach = (i - 1) / 100;
        failMode = 'weak';
        break;
      }
      if (f > hi + EPS) {
        reach = (i - 1) / 100;
        failMode = 'strong';
        break;
      }
    }
  }

  // The smallest friction (as a fraction of the sash weight) that would let
  // this setting hold through the whole 80% zone.
  let needed = sash === 'upper' ? 1 - f0 / weight : f0 / weight - 1;
  for (let i = 1; i <= 80; i += 1) {
    const ratio = total(i / 100) / weight;
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

  const holdsEnough = needed <= friction + EPS;
  const shareOk = shareDev <= SHARE_TOLERANCE + EPS;
  const issues = [];
  if (!holdsEnough) issues.push(describeIssue(sash, failMode, reach));
  if (!shareOk) {
    issues.push(`uneven side to side (worst ${Math.round((0.5 + shareDev) * 100)}/${Math.round((0.5 - shareDev) * 100)})`);
  }

  return {
    pass: holdsEnough && shareOk,
    reach,
    needed,
    shareDev,
    issues,
    violation: Math.max(0, needed - friction) + Math.max(0, shareDev - SHARE_TOLERANCE),
  };
}

const sumClicks = (clicks) => (clicks.left ?? 0) + (clicks.right ?? 0);

function isBetter(a, b) {
  if (a.pass !== b.pass) return a.pass;
  if (a.pass) {
    if (a.totalClicks !== b.totalClicks) return a.totalClicks < b.totalClicks;
    return a.shareDev < b.shareDev - EPS;
  }
  if (Math.abs(a.violation - b.violation) > EPS) return a.violation < b.violation;
  return a.totalClicks < b.totalClicks;
}

function pickBest(sash, model, install, hand, weight, geo, friction) {
  let best = null;
  for (const cand of candidates(sash, model, install, hand)) {
    const result = { ...cand, ...evalSash(sash, cand.cables, weight, geo, friction) };
    result.totalClicks = sumClicks(cand.clicks);
    if (!best || isBetter(result, best)) best = result;
  }
  return best;
}

// input: { width, height, upperWeight, lowerWeight } as numbers (inches / lbs),
// filters: { install: 'any'|'single'|'dual', hand: 'any'|'left'|'right',
//            model: 'any'|'D1'|'D2'|'D4' }, friction as a fraction.
export function springboxOptions(input, filters = {}, friction = DEFAULT_FRICTION) {
  const { width, height, upperWeight, lowerWeight } = input;
  const { install = 'any', hand = 'any', model = 'any' } = filters;

  const geo = { mid: height / 2, travel: height / 2 - ENGAGE };
  if (!(geo.travel > 0)) return { options: [], singleBlocked: false };

  const singleAllowed = width <= SINGLE_MAX_WIDTH;
  const installs = [];
  if (install !== 'dual' && singleAllowed) {
    for (const h of hand === 'any' ? ['left', 'right'] : [hand]) installs.push({ install: 'single', hand: h });
  }
  if (install !== 'single') installs.push({ install: 'dual', hand: null });

  const models = model === 'any' ? MODELS : [model];
  const options = [];

  for (const { install: kind, hand: h } of installs) {
    for (const m of models) {
      const lower = pickBest('lower', m, kind, h, lowerWeight, geo, friction);
      const upper = pickBest('upper', m, kind, h, upperWeight, geo, friction);
      options.push({
        install: kind,
        hand: h,
        model: m,
        lower,
        upper,
        exact: lower.pass && upper.pass,
        totalClicks: lower.totalClicks + upper.totalClicks,
        needed: Math.max(lower.needed, upper.needed),
        violation: lower.violation + upper.violation,
      });
    }
  }

  options.sort((a, b) => {
    if (a.exact !== b.exact) return a.exact ? -1 : 1;
    if (a.exact) {
      return (
        a.totalClicks - b.totalClicks ||
        MODELS.indexOf(a.model) - MODELS.indexOf(b.model) ||
        (a.install === b.install ? 0 : a.install === 'single' ? -1 : 1)
      );
    }
    return a.violation - b.violation || a.totalClicks - b.totalClicks;
  });

  return { options, singleBlocked: !singleAllowed && install !== 'dual' };
}

export const plural = (n) => `${n} ${n === 1 ? 'click' : 'clicks'}`;

export function optionTitle(option, index) {
  const kind = option.install === 'dual' ? 'Dual' : 'Single';
  const side = option.install === 'single' ? ` · ${option.hand}-hand box` : '';
  return `Option ${index + 1} · ${kind} ${option.model}${side}`;
}

// [{ box: 'Left-hand box', lower: 1, upper: 2 }, ...]
export function optionBoxes(option) {
  const boxes = [];
  const sides = option.install === 'dual' ? ['left', 'right'] : [option.hand];
  for (const side of sides) {
    boxes.push({
      box: `${side === 'left' ? 'Left' : 'Right'}-hand box`,
      lower: option.lower.clicks[side],
      upper: option.upper.clicks[side],
    });
  }
  return boxes;
}

export function optionIssues(option) {
  const issues = [];
  if (option.upper.issues.length) issues.push(`Upper sash ${option.upper.issues.join('; ')}`);
  if (option.lower.issues.length) issues.push(`Lower sash ${option.lower.issues.join('; ')}`);
  return issues;
}

export function optionsText(options) {
  return options
    .map((option, i) => {
      const lines = [optionTitle(option, i)];
      for (const b of optionBoxes(option)) {
        lines.push(`${b.box}: lower ${plural(b.lower)}, upper ${plural(b.upper)}`);
      }
      const issues = optionIssues(option);
      if (issues.length) lines.push(`Closest match: ${issues.join('. ')}`);
      return lines.join('\n');
    })
    .join('\n\n');
}
