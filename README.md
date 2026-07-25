# Heartwood field calculators

Two tools in one small app, built for use on a phone in direct sunlight:

- **Counterweight** (opens by default) — enter a window's upper and/or
  lower sash weight, tap "Add window" to drop it into a running list
  formatted to match how the crew already pastes results into Slack, then
  "Copy all" grabs the whole batch in one tap.
- **Inches** — the fraction calculator, tucked behind a small tab since
  it's used far less often.

The app remembers which tab you were last on, and the counterweight list
persists in the browser's local storage — closing the tab or locking the
phone won't lose a job's worth of measurements. "Clear" requires a second
tap within 3 seconds to confirm, so it's hard to wipe by accident.

Styling is deliberately high-contrast (heavy black borders and text on a
white background, a single yellow accent for the primary action on each
screen, red only for the destructive "clear") for readability outdoors.

## Run it locally

Requires Node 18+.

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173` and hot-reloads as you edit.

To sanity-check a production build before pushing:

```bash
npm run build
npm run preview
```

## Project layout

```
src/
  logo.png                        — your logo, shown small in the header
  App.jsx                         — tab switcher (persisted)
  App.css                         — all styling (single high-contrast theme)
  hooks/useLocalStorage.js        — generic persisted-state hook
  utils/
    counterweight.js              — counterweight formula + Slack-format text
    fraction.js                   — decimal <-> nearest-1/16 fraction math
  components/
    CounterweightCalculator.jsx   — window list, add/delete/clear/copy
    InchCalculator.jsx            — the four-function fraction calculator
    Display.jsx, FractionRuler.jsx, Keypad.jsx, History.jsx
```

## Home screen icon

Your logo is a wordmark (no standalone mark), and wordmarks don't fit
square icon slots well, so `public/` includes a simple "HR" monogram
generated in your logo's exact brand teal (`#1f576b`, sampled directly
from `final-onlyletters-trans.png`) — that's the icon that shows up on a
phone's home screen after "Add to Home Screen", plus the browser tab
favicon. `site.webmanifest` and the icon `<link>` tags in `index.html`
wire this up, and set the app to open full-screen (no browser address
bar) when launched from the home screen, under the name "Heartwood".

If you commission a proper standalone icon/mark later, just swap the
files in `public/` (`favicon.ico`, `favicon-16x16.png`,
`favicon-32x32.png`, `apple-touch-icon.png`, `icon-192.png`,
`icon-512.png`) — same names, same sizes, nothing else to change.

## The counterweight formula

Cleaned up from the original app (same numbers, clearer names):

```
base = (sash weight / 2) × (0.6 if bushings else 1)
upper sash range: [ base, base + 0.5 ]
lower sash range: [ base - 0.5, base ]
```

Both upper and lower are optional per window — leave one blank for a
single-hung window and only that line appears in the copied text.

## Deploying on AWS Amplify

1. **Push to GitHub** from this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. **Connect the repo in Amplify**: *New app → Host web app → GitHub*,
   pick the repo and `main` branch. The included `amplify.yml` already
   tells Amplify to run `npm ci`, `npm run build`, and serve `dist/`.
3. **Deploy** — Amplify gives you a `*.amplifyapp.com` URL first, good
   for testing before pointing your subdomain at it.
4. **Add your subdomain** in the app's *Domain management* tab.

No environment variables or backend needed for anything in this app.
