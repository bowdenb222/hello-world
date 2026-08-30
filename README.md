# Georgia Garden Planner

An offline-capable planting planner for Georgia row gardens. Set your plot size,
lay out rows to scale, and get checked on spacing, shading, crop rotation and
planting dates — all timed to your own frost dates rather than a generic
national chart.

Built as an installable web app (PWA). No account, no server; everything you
enter stays on your phone.

## What it does

**Garden map** — Enter your plot's width and depth in feet. Add crops and each
one becomes a row drawn to scale, stacked from the north edge south, with the
correct row spacing and plant count worked out for you. Reorder rows to see how
the layout changes.

**Checks** — Every layout is validated against:

| Check | What it catches |
|---|---|
| Fit | Rows needing more depth than the plot has |
| Shading | A tall crop placed south of something that needs full sun |
| Family adjacency | Related crops side by side sharing pests and disease |
| Rotation | A plant family repeating in ground it grew in last year |
| Season | A crop scheduled into a season it isn't planted in |
| Perennials | Permanent plantings sitting in a bed you plan to till |
| Corn block | Sweet corn in a single row, which pollinates badly |
| Blueberry pH | Blueberries sharing ground with crops that need neutral soil |

**Calendar** — What to plant this week, plus every month of the year showing
both newly opening windows and ones still open. All dates are computed from your
last and first frost dates, so changing region re-times the whole calendar.

**Saved plans** — The current layout is autosaved on every change, so closing
the app and reopening resumes exactly where you left off. Save it under a name to
keep several plans side by side — this year and next, or the front plot and the
back. *Start from scratch* clears the layout while keeping your saved plans,
region and frost dates.

**Backup** — *Copy my data* under Guide puts everything on the clipboard as
plain text; *Paste data in* restores it. Use it to move a garden between a phone
and a computer, or to keep plans safe in a browser that blocks storage.

**Crop guide** — 65 crops: vegetables, roots and tubers, herbs and spices, and
perennial fruit. Each entry carries spacing, depth, mature height, days to
maturity, yield, how much to plant per person, Georgia-specific growing notes
and the pests that actually show up here.

## Regions

Georgia spans three USDA zones, and planting dates differ by up to six weeks
between the mountains and the coast. Pick your region under **Guide**, or type
in your own frost dates if you know your yard runs early or late.

| Region | Zone | Last frost | First frost |
|---|---|---|---|
| North GA / Blue Ridge | 7a–7b | Apr 10 | Oct 25 |
| Atlanta / Piedmont | 7b–8a | Mar 30 | Nov 5 |
| Middle GA | 8a–8b | Mar 22 | Nov 8 |
| South / Coastal GA | 8b–9a | Mar 5 | Nov 25 |

## Getting it on your phone

Publish the repo with GitHub Pages, then install from the browser:

1. Repo **Settings → Pages**
2. Source: **Deploy from a branch** → branch `main` (or this feature branch), folder `/ (root)`
3. Wait a minute, then open the URL it gives you on your phone
4. **iPhone** — Share → *Add to Home Screen*. **Android** — menu → *Install app*

It then launches like a native app and works offline in the garden, which
matters once you are out past the shed with no signal.

## Where your data lives

Everything is kept in `localStorage` on the device — no account, no server, and
nothing leaves the phone.

One caveat worth knowing: some browsers refuse storage entirely. Private windows
do, and so does Safari with *Prevent Cross-Site Tracking* (on by default) when
the page is embedded in an iframe from another origin — which is how preview
links render it. The app probes storage at startup and shows a banner when writes
will not stick, rather than losing a plan silently.

Installing to the home screen from your own GitHub Pages URL makes the app a
first-party origin, where storage persists normally. That is the setup to use for
a garden you actually care about; *Copy my data* is the backstop.

## Running it locally

No build step and no dependencies to run it:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

`node build.js` regenerates `dist/app.html`, a single self-contained file with
the CSS, JavaScript and crop data inlined — handy for emailing to yourself or
opening straight off a phone's downloads.

## Project layout

```
index.html            app shell and views
css/app.css           styles, light and dark
js/crops.js           the crop database — edit this to add crops
js/app.js             layout maths, checks, calendar, rendering
sw.js                 service worker for offline use
manifest.webmanifest  PWA metadata
build.js              produces dist/app.html
```

### Adding a crop

Append an entry to `CROPS` in `js/crops.js`. Planting windows are stored as day
offsets from a frost date, never as fixed calendar dates — that is what lets the
app re-time itself for any region:

```js
{ id:'okra', n:'Okra', cat:'veg', fam:'malvaceae',
  row:42, sp:15, dep:1, ht:72, dtm:55, per:4, sun:'full',
  yld:'2–4 lb per plant',
  // 29 to 101 days after the average last spring frost
  sow:[{ s:'Summer', m:'direct', r:'last', a:29, b:101 }],
  succ:0, comp:['southern_pea'], anta:[],
  note:'…', pest:'…' }
```

`r:'last'` anchors to the last spring frost, `r:'first'` to the first fall
frost. Bump `CACHE` in `sw.js` after changing anything, or phones keep serving
the cached copy.

## Notes on the data

Planting windows follow UGA Extension guidance for Georgia. They are averages —
check the actual forecast before setting out tender transplants.

Two deliberate choices about what the app treats as authoritative:

- **Crop rotation is enforced as a hard rule.** Soil-borne disease and root-knot
  nematodes attack whole plant families, and nematode pressure is severe in
  Georgia's sandy soils. This is the check worth obeying.
- **Companion planting is presented as folklore.** Most "these two grow well
  together" pairings have no evidence behind them and are labelled as
  traditional. The exceptions with real support are called out where they apply:
  French marigold suppressing nematodes when grown as a full cover crop, and
  fennel's genuine allelopathy.

Get a soil test through your county UGA Extension office before your first
season. Georgia red clay is typically acidic and low in phosphorus, and guessing
at lime and fertiliser costs more than the test does.
