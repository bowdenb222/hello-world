/* Crop database — tuned for Georgia, defaults to Middle GA (zone 8a/8b).
 *
 * Planting windows are stored as DAY OFFSETS from a frost date, not fixed
 * calendar dates, so the whole app re-times itself when you change region.
 *   r:'last'  -> days relative to average last SPRING frost
 *   r:'first' -> days relative to average first FALL frost
 * Negative = before that frost, positive = after.
 *
 * m (method): direct | indoor | transplant | set | slip | crown | dormant
 * row = inches between rows | sp = inches between plants in the row
 * dep = seed/planting depth (inches) | ht = mature height (inches, for shade math)
 * dtm = days to maturity from the listed method
 * per = plants per person for a season's worth
 *
 * FAMILY is the rotation key. Never follow a crop with one from the same
 * family — that is what carries disease and root-knot nematodes forward.
 */

const FAMILIES = {
  solanaceae:   { n: 'Nightshade',   warn: 'Heavy nematode + early blight carryover. Wait 3 years before replanting this family in the same ground.' },
  cucurbitaceae:{ n: 'Cucurbit',     warn: 'Downy mildew and vine borer build up in soil and debris. 2–3 year gap.' },
  brassicaceae: { n: 'Brassica',     warn: 'Clubroot and black rot persist for years. 3 year gap.' },
  fabaceae:     { n: 'Legume',       warn: 'Fixes nitrogen — an excellent crop to follow heavy feeders with.' },
  apiaceae:     { n: 'Carrot family',warn: 'Root-knot nematodes damage roots badly. 2 year gap.' },
  amaranthaceae:{ n: 'Beet family',  warn: 'Leaf spot carryover. 2 year gap.' },
  alliaceae:    { n: 'Onion family', warn: 'Low disease pressure. Good rotation filler.' },
  asteraceae:   { n: 'Lettuce family',warn:'Bottom rot in wet ground. 2 year gap.' },
  poaceae:      { n: 'Grass family', warn: 'Heavy nitrogen feeder. Follow with legumes.' },
  malvaceae:    { n: 'Mallow',       warn: 'Very nematode-susceptible in sandy GA soil. 2 year gap.' },
  convolvulaceae:{n: 'Morning glory',warn: 'Nematode-susceptible. 2 year gap.' },
  lamiaceae:    { n: 'Mint family',  warn: 'Mostly perennial herbs. Low rotation concern.' },
  zingiberaceae:{ n: 'Ginger family',warn: 'Grown as annuals here. Low rotation concern.' },
  ericaceae:    { n: 'Heath',        warn: 'Permanent planting. Needs acid soil, pH 4.5–5.5.' },
  rosaceae:     { n: 'Rose family',  warn: 'Permanent planting. Chill hours and pollination partners matter.' },
  vitaceae:     { n: 'Grape family', warn: 'Permanent trellis planting.' },
  moraceae:     { n: 'Mulberry/fig', warn: 'Permanent planting.' },
  juglandaceae: { n: 'Walnut/pecan', warn: 'Juglone from roots kills nightshades. Keep gardens well clear.' },
  polygonaceae: { n: 'Buckwheat',    warn: 'Low rotation concern.' },
  basellaceae:  { n: 'Malabar',      warn: 'Low rotation concern.' }
};

const CROPS = [
/* ── NIGHTSHADES ──────────────────────────────────────────────────────── */
{ id:'tomato', n:'Tomato', cat:'veg', fam:'solanaceae', row:48, sp:24, dep:0.25, ht:60, dtm:75, per:3, sun:'full',
  yld:'8–15 lb per plant',
  sow:[{s:'Spring', m:'indoor', r:'last', a:-56, b:-42}, {s:'Spring', m:'transplant', r:'last', a:8, b:44}, {s:'Fall', m:'transplant', r:'first', a:-130, b:-106}],
  succ:0, comp:['basil','marigold','onion','carrot'], anta:['potato','corn','fennel'],
  trellis:{ row:36, sp:18, ht:84, note:'Florida weave or single-string training instead of cages. Prune to one or two leaders and tie up weekly. Tighter spacing, easier picking, and far better airflow — which is the real argument for it in Georgia, where early blight and septoria travel through crowded foliage.' },
  note:'Stops setting fruit above ~92°F, so the spring crop stalls in July. A second transplant set out in early July fruits again in September. Cage or stake — sprawling vines rot on GA ground. Determinate types ripen all at once for canning; indeterminate keep going.',
  pest:'Early blight, bacterial wilt, hornworms, stink bugs. Mulch heavily to stop soil splash — that is how blight starts.' },

{ id:'pepper', n:'Bell Pepper', cat:'veg', fam:'solanaceae', row:36, sp:18, dep:0.25, ht:30, dtm:75, per:3, sun:'full',
  yld:'6–10 peppers per plant',
  sow:[{s:'Spring', m:'indoor', r:'last', a:-70, b:-56}, {s:'Spring', m:'transplant', r:'last', a:24, b:59}],
  succ:0, comp:['basil','onion','carrot'], anta:['fennel'],
  note:'Wants warmer soil than tomatoes — do not rush it out. Drops blossoms above 90°F then resumes in September, so the best harvest is usually fall. Peppers sunscald when exposed; leave the canopy alone.',
  pest:'Blossom-end rot from uneven watering. Pepper maggot, aphids.' },

{ id:'hotpepper', n:'Hot Pepper', cat:'veg', fam:'solanaceae', row:36, sp:18, dep:0.25, ht:36, dtm:80, per:1, sun:'full',
  yld:'30–100 pods per plant',
  sow:[{s:'Spring', m:'indoor', r:'last', a:-70, b:-56}, {s:'Spring', m:'transplant', r:'last', a:24, b:59}],
  succ:0, comp:['basil','onion'], anta:['fennel'],
  note:'Far more heat- and pest-tolerant than bells and productive right through a GA summer. Cayenne, jalapeño and tabasco all do well. One or two plants supplies a family for a year if you dry them.',
  pest:'Almost nothing bothers them. Aphids occasionally.' },

{ id:'eggplant', n:'Eggplant', cat:'veg', fam:'solanaceae', row:36, sp:24, dep:0.25, ht:36, dtm:80, per:1, sun:'full',
  yld:'8–12 fruit per plant',
  sow:[{s:'Spring', m:'indoor', r:'last', a:-63, b:-49}, {s:'Spring', m:'transplant', r:'last', a:24, b:59}],
  succ:0, comp:['bean','marigold'], anta:['fennel'],
  note:'One of the few crops that genuinely enjoys a Middle Georgia August. Keeps producing until frost. Ichiban and other long Asian types set fruit more reliably in heat than the big globe types.',
  pest:'Flea beetles shred young leaves — cover the first three weeks. Colorado potato beetle.' },

{ id:'potato', n:'Irish Potato', cat:'tuber', fam:'solanaceae', row:36, sp:12, dep:4, ht:24, dtm:100, per:10, sun:'full',
  yld:'2–4 lb per plant',
  sow:[{s:'Spring', m:'set', r:'last', a:-40, b:-7}, {s:'Fall', m:'set', r:'first', a:-99, b:-80}],
  succ:0, comp:['bean','corn','cabbage'], anta:['tomato','pepper','eggplant','pumpkin'],
  note:'Plant seed potatoes around Valentine\'s Day here. Hill soil up the stems twice as they grow — tubers form above the seed piece, and any tuber that sees sunlight turns green and toxic. Harvest when tops die back in June, before the ground cooks them.',
  pest:'Colorado potato beetle, wireworms, scab in alkaline soil. Never plant grocery-store potatoes — use certified seed.' },

/* ── ROOTS & TUBERS ───────────────────────────────────────────────────── */
{ id:'sweetpotato', n:'Sweet Potato', cat:'tuber', fam:'convolvulaceae', row:42, sp:15, dep:4, ht:12, dtm:100, per:8, sun:'full',
  yld:'3–5 lb per plant',
  sow:[{s:'Summer', m:'slip', r:'last', a:40, b:85}],
  succ:0, comp:['bean','okra'], anta:[],
  noTrellis:'Grown for the roots, not the vines. Let them run — the sprawl smothers weeds, which is half the reason the crop is so easy here.',
  note:'The most reliable heavy crop in Georgia — thrives on heat, drought and poor sandy soil, which is exactly what August delivers. Grown from slips, not seed. Vines sprawl 6+ feet, so it smothers weeds. Cure at 80°F for 10 days after digging or it will not keep or sweeten.',
  pest:'Root-knot nematodes and wireworms. Choose nematode-resistant varieties like Beauregard.' },

{ id:'peanut', n:'Peanut', cat:'veg', fam:'fabaceae', row:36, sp:6, dep:2, ht:18, dtm:130, per:10, sun:'full',
  yld:'0.5 lb per plant',
  sow:[{s:'Summer', m:'direct', r:'last', a:40, b:80}],
  succ:0, comp:['corn'], anta:[],
  note:'A classic Georgia crop and a genuine soil-builder — it fixes nitrogen and needs loose, sandy ground so the pegs can push down. Needs calcium; gypsum at flowering fills out the pods. Dig when inner hulls show dark veining.',
  pest:'Leaf spot late in the season. Low pest pressure overall.' },

{ id:'carrot', n:'Carrot', cat:'veg', fam:'apiaceae', row:18, sp:2, dep:0.25, ht:12, dtm:75, per:30, sun:'full',
  yld:'1 root per plant',
  sow:[{s:'Spring', m:'direct', r:'last', a:-49, b:0}, {s:'Fall', m:'direct', r:'first', a:-85, b:-44}],
  succ:14, comp:['onion','lettuce','tomato'], anta:['dill'],
  note:'Georgia clay forks and stunts carrots — either work in deep sand and compost or grow short varieties like Danvers or Chantenay. The fall crop is far sweeter; frost converts starch to sugar. Seed is tiny and slow, so keep the top inch damp for two full weeks.',
  pest:'Root-knot nematodes are the main limit. Rotate hard.' },

{ id:'beet', n:'Beet', cat:'veg', fam:'amaranthaceae', row:18, sp:3, dep:0.5, ht:12, dtm:55, per:15, sun:'full',
  yld:'1 root + greens per plant',
  sow:[{s:'Spring', m:'direct', r:'last', a:-49, b:3}, {s:'Fall', m:'direct', r:'first', a:-80, b:-38}],
  succ:14, comp:['onion','cabbage','lettuce'], anta:['pole_bean'],
  note:'Each beet "seed" is a cluster of several — thin ruthlessly to one plant or you get nothing but tangled roots. Greens are as good as the root. Tolerates light frost and holds in the ground through a Middle GA winter.',
  pest:'Leaf miner, cercospora leaf spot.' },

{ id:'turnip', n:'Turnip', cat:'veg', fam:'brassicaceae', row:18, sp:4, dep:0.5, ht:14, dtm:50, per:12, sun:'full',
  yld:'1 root + greens per plant',
  sow:[{s:'Spring', m:'direct', r:'last', a:-49, b:-7}, {s:'Fall', m:'direct', r:'first', a:-85, b:-29}],
  succ:14, comp:['pea'], anta:['potato'],
  note:'A Southern staple that basically grows itself in fall. Plant thickly for greens, thin to 4 inches for roots. Sweeter after the first frost. Seven Top is grown for greens only; Purple Top for both.',
  pest:'Aphids, flea beetles, cabbage worms.' },

{ id:'radish', n:'Radish', cat:'veg', fam:'brassicaceae', row:12, sp:2, dep:0.5, ht:8, dtm:28, per:20, sun:'full',
  yld:'1 root per plant',
  sow:[{s:'Spring', m:'direct', r:'last', a:-49, b:10}, {s:'Fall', m:'direct', r:'first', a:-68, b:-14}],
  succ:10, comp:['carrot','lettuce','cucumber'], anta:[],
  note:'Fastest thing in the garden — four weeks from seed to plate. Good for marking slow rows like carrots. Turns woody and hot the moment weather warms, so it is a cool-season crop only here.',
  pest:'Flea beetles, root maggots.' },

{ id:'onion', n:'Onion (bulbing)', cat:'veg', fam:'alliaceae', row:15, sp:4, dep:1, ht:18, dtm:110, per:25, sun:'full',
  yld:'1 bulb per plant',
  sow:[{s:'Fall', m:'transplant', r:'first', a:-24, b:37}],
  succ:0, comp:['carrot','beet','lettuce','tomato'], anta:['bean','pea','asparagus'],
  note:'CRITICAL: Georgia needs SHORT-DAY varieties — Vidalia, Granex, Texas Grano. Long-day types sold in northern catalogs will never bulb here, they just make tops. Set out transplants in late fall and harvest in May. Do not mound soil over the bulb.',
  pest:'Thrips, onion maggot, pink root.' },

{ id:'garlic', n:'Garlic', cat:'veg', fam:'alliaceae', row:15, sp:5, dep:2, ht:18, dtm:240, per:15, sun:'full',
  yld:'1 head per clove',
  sow:[{s:'Fall', m:'set', r:'first', a:-24, b:22}],
  succ:0, comp:['tomato','carrot','beet'], anta:['bean','pea'],
  note:'Plant cloves pointy end up in late October, harvest the following May–June. Softneck types store best and suit the mild Middle GA winter — hardneck varieties want more cold than we get. Stop watering once the lower leaves brown.',
  pest:'Very few. White rot in wet ground.' },

{ id:'leek', n:'Leek', cat:'veg', fam:'alliaceae', row:18, sp:6, dep:1, ht:24, dtm:120, per:8, sun:'full',
  yld:'1 stalk per plant',
  sow:[{s:'Fall', m:'transplant', r:'first', a:-68, b:-24}],
  succ:0, comp:['carrot','onion'], anta:['bean','pea'],
  note:'Plant deep in a trench and backfill as they grow — that blanched white shaft is the part worth eating. Extremely cold-hardy; stands in the garden all winter here and gets harvested as needed.',
  pest:'Thrips.' },

/* ── BRASSICAS (mostly fall crops in Georgia) ─────────────────────────── */
{ id:'collards', n:'Collards', cat:'veg', fam:'brassicaceae', row:30, sp:18, dep:0.5, ht:30, dtm:65, per:3, sun:'full',
  yld:'2–4 lb leaves per plant',
  sow:[{s:'Spring', m:'transplant', r:'last', a:-21, b:19}, {s:'Fall', m:'transplant', r:'first', a:-99, b:-49}],
  succ:0, comp:['onion','potato','dill'], anta:['tomato','pole_bean','strawberry'],
  note:'The most forgiving vegetable in Georgia — heat-tolerant enough for summer and hardy well below 20°F. Pick lower leaves and the plant keeps producing for months. Flavor improves dramatically after frost. Georgia Southern and Champion are the classic varieties.',
  pest:'Cabbage worms and loopers are constant. Bt spray weekly handles them. Aphids in cool weather.' },

{ id:'kale', n:'Kale', cat:'veg', fam:'brassicaceae', row:24, sp:12, dep:0.5, ht:24, dtm:55, per:3, sun:'full',
  yld:'1–2 lb leaves per plant',
  sow:[{s:'Spring', m:'direct', r:'last', a:-35, b:-2}, {s:'Fall', m:'direct', r:'first', a:-85, b:-38}],
  succ:0, comp:['onion','beet','potato'], anta:['tomato','strawberry'],
  note:'Best fall through spring here — summer heat makes it bitter and tough. Survives hard freezes and sweetens with them. Cut outer leaves and it regrows all winter for a steady supply.',
  pest:'Cabbage worms, aphids, harlequin bugs.' },

{ id:'cabbage', n:'Cabbage', cat:'veg', fam:'brassicaceae', row:30, sp:15, dep:0.5, ht:15, dtm:75, per:4, sun:'full',
  yld:'1 head, 2–5 lb',
  sow:[{s:'Spring', m:'transplant', r:'last', a:-49, b:-12}, {s:'Fall', m:'transplant', r:'first', a:-85, b:-49}],
  succ:0, comp:['onion','potato','beet','dill'], anta:['tomato','strawberry','pole_bean'],
  note:'The fall crop is far more reliable — spring cabbage often bolts when a warm spell hits. Heads split if they get a sudden soak after dry weather; harvest as soon as they feel solid.',
  pest:'Cabbage worms, loopers, aphids. Clubroot persists in soil for years — rotate hard.' },

{ id:'broccoli', n:'Broccoli', cat:'veg', fam:'brassicaceae', row:30, sp:18, dep:0.5, ht:24, dtm:70, per:4, sun:'full',
  yld:'1 main head + side shoots',
  sow:[{s:'Spring', m:'transplant', r:'last', a:-35, b:-7}, {s:'Fall', m:'transplant', r:'first', a:-80, b:-49}],
  succ:0, comp:['onion','beet','potato'], anta:['tomato','strawberry','pole_bean'],
  note:'FALL IS THE REAL SEASON HERE. Spring broccoli usually buttons into tiny useless heads when temperatures spike in May. Set fall transplants out late August under shade cloth. Keep cutting side shoots after the main head for weeks of extra harvest.',
  pest:'Cabbage worms are guaranteed. Harlequin bugs in warm weather.' },

{ id:'cauliflower', n:'Cauliflower', cat:'veg', fam:'brassicaceae', row:30, sp:18, dep:0.5, ht:24, dtm:75, per:3, sun:'full',
  yld:'1 head',
  sow:[{s:'Fall', m:'transplant', r:'first', a:-80, b:-54}],
  succ:0, comp:['onion','beet'], anta:['tomato','strawberry'],
  note:'The fussiest brassica for Georgia — any heat or drought stress and it never forms a head. Fall only, and give it steady water. Tie outer leaves over the head to keep it white unless you grow a self-blanching type.',
  pest:'Cabbage worms, aphids.' },

{ id:'brussels', n:'Brussels Sprouts', cat:'veg', fam:'brassicaceae', row:30, sp:18, dep:0.5, ht:30, dtm:100, per:2, sun:'full',
  yld:'50–100 sprouts per plant',
  sow:[{s:'Fall', m:'transplant', r:'first', a:-106, b:-80}],
  succ:0, comp:['onion','potato'], anta:['tomato','strawberry'],
  note:'Marginal in Middle Georgia — needs a long cool stretch we barely get. Set out by early August so sprouts fill during the November–December cold. Topping the plant in October pushes the sprouts to size up together.',
  pest:'Aphids get down inside the sprouts. Cabbage worms.' },

{ id:'mustard', n:'Mustard Greens', cat:'veg', fam:'brassicaceae', row:18, sp:6, dep:0.5, ht:18, dtm:40, per:5, sun:'full',
  yld:'1 lb leaves per plant',
  sow:[{s:'Spring', m:'direct', r:'last', a:-35, b:3}, {s:'Fall', m:'direct', r:'first', a:-75, b:-24}],
  succ:14, comp:['pea'], anta:[],
  note:'Fast, peppery and nearly foolproof in fall. Ready in six weeks. Southern Giant Curled is the traditional Georgia variety. Bolts quickly once spring warms, so treat it as a cool-season crop.',
  pest:'Flea beetles, aphids, cabbage worms.' },

{ id:'arugula', n:'Arugula', cat:'veg', fam:'brassicaceae', row:12, sp:4, dep:0.25, ht:10, dtm:40, per:6, sun:'part',
  yld:'cut-and-come-again',
  sow:[{s:'Spring', m:'direct', r:'last', a:-35, b:3}, {s:'Fall', m:'direct', r:'first', a:-68, b:-14}],
  succ:14, comp:['lettuce','carrot'], anta:[],
  note:'Cut leaves an inch above the crown and it regrows three or four times. Gets aggressively hot-flavored in warm weather — grow it October through April here.',
  pest:'Flea beetles pepper the leaves with holes. Row cover fixes it.' },

{ id:'bokchoy', n:'Bok Choy', cat:'veg', fam:'brassicaceae', row:18, sp:8, dep:0.5, ht:14, dtm:50, per:5, sun:'part',
  yld:'1 head per plant',
  sow:[{s:'Spring', m:'direct', r:'last', a:-35, b:-7}, {s:'Fall', m:'direct', r:'first', a:-75, b:-38}],
  succ:14, comp:['onion','beet'], anta:['strawberry'],
  note:'Quick and productive in cool weather. Bolts fast in spring warmth, so the fall planting is the dependable one. Baby types at 6 inches apart mature in a month.',
  pest:'Flea beetles, slugs, cabbage worms.' },

/* ── GREENS ───────────────────────────────────────────────────────────── */
{ id:'lettuce', n:'Lettuce', cat:'veg', fam:'asteraceae', row:18, sp:8, dep:0.25, ht:10, dtm:50, per:10, sun:'part',
  yld:'1 head or repeated cuttings',
  sow:[{s:'Spring', m:'direct', r:'last', a:-49, b:3}, {s:'Fall', m:'direct', r:'first', a:-68, b:-19}],
  succ:14, comp:['carrot','radish','onion','strawberry'], anta:[],
  note:'Bolts bitter the moment days hit the mid-80s, which in Middle Georgia means the spring window slams shut in early May. Loose-leaf types are far more heat-tolerant than head lettuce. Afternoon shade from a taller row buys you two extra weeks.',
  pest:'Slugs, aphids, rabbits. Bottom rot in soggy ground.' },

{ id:'spinach', n:'Spinach', cat:'veg', fam:'amaranthaceae', row:18, sp:4, dep:0.5, ht:8, dtm:45, per:10, sun:'part',
  yld:'cut-and-come-again',
  sow:[{s:'Fall', m:'direct', r:'first', a:-54, b:-7}, {s:'Spring', m:'direct', r:'last', a:-49, b:-21}],
  succ:14, comp:['strawberry','radish','onion'], anta:[],
  note:'A true cold crop — germinates poorly above 75°F, so fall sowing is the reliable one. Overwinters easily in Middle Georgia and produces from November into April. For summer greens, grow Malabar spinach instead; it is unrelated but fills the same role.',
  pest:'Leaf miners, downy mildew in wet weather.' },

{ id:'chard', n:'Swiss Chard', cat:'veg', fam:'amaranthaceae', row:18, sp:8, dep:0.5, ht:20, dtm:55, per:3, sun:'part',
  yld:'cut-and-come-again all season',
  sow:[{s:'Spring', m:'direct', r:'last', a:-21, b:24}, {s:'Fall', m:'direct', r:'first', a:-85, b:-49}],
  succ:0, comp:['onion','bean','lettuce'], anta:[],
  note:'The workhorse green — one spring planting handles heat far better than spinach and produces from May until hard frost. Cut outer stalks and the center keeps pushing new growth. A single row feeds a family all year.',
  pest:'Leaf miners, slugs.' },

{ id:'malabar', n:'Malabar Spinach', cat:'veg', fam:'basellaceae', row:24, sp:12, dep:0.5, ht:72, dtm:70, per:2, sun:'full',
  yld:'continuous through summer',
  sow:[{s:'Summer', m:'transplant', r:'last', a:40, b:85}],
  succ:0, comp:[], anta:[],
  needsSupport:'A true climbing vine that needs a 6–8 ft trellis. The spacing here already assumes one.',
  note:'The answer to the Georgia summer greens gap. A vining tropical that thrives in the July heat that kills lettuce and spinach. Needs a trellis and climbs 8 feet. Leaves are thick and slightly mucilaginous — best cooked.',
  pest:'Almost none. Deer occasionally.' },

/* ── LEGUMES ──────────────────────────────────────────────────────────── */
{ id:'bush_bean', n:'Bush Snap Bean', cat:'veg', fam:'fabaceae', row:30, sp:3, dep:1, ht:20, dtm:55, per:15, sun:'full',
  yld:'0.5 lb per plant',
  sow:[{s:'Spring', m:'direct', r:'last', a:10, b:54}, {s:'Fall', m:'direct', r:'first', a:-99, b:-75}],
  succ:14, comp:['corn','cucumber','potato','strawberry'], anta:['onion','garlic','fennel'],
  note:'One planting gives you roughly two weeks of picking, then quits — sow a new short row every two weeks for a continuous supply. Blossoms drop above 90°F, so bridge the midsummer gap with southern peas instead. Fixes nitrogen for whatever follows.',
  pest:'Mexican bean beetle, stink bugs. Never work among wet plants — it spreads rust and bacterial blight.' },

{ id:'pole_bean', n:'Pole Bean', cat:'veg', fam:'fabaceae', row:36, sp:6, dep:1, ht:84, dtm:65, per:8, sun:'full',
  yld:'1–2 lb per plant',
  sow:[{s:'Spring', m:'direct', r:'last', a:14, b:59}],
  succ:0, comp:['corn','cucumber','radish'], anta:['onion','garlic','beet'],
  needsSupport:'Always grown on support — the row spacing here already assumes a 7 ft trellis.',
  note:'Produces two to three times as long as bush beans in the same footprint — worth the trellis. Needs a sturdy 7-foot support. Rattlesnake and Kentucky Wonder are proven Southern varieties. Being 7 feet tall, it belongs on the north edge or it shades the whole garden.',
  pest:'Mexican bean beetle, stink bugs.' },

{ id:'southern_pea', n:'Southern Pea (Crowder/Field Pea)', cat:'veg', fam:'fabaceae', row:36, sp:4, dep:1, ht:24, dtm:70, per:20, sun:'full',
  yld:'0.5 lb dry per plant',
  sow:[{s:'Summer', m:'direct', r:'last', a:40, b:115}],
  succ:21, comp:['corn','okra','sweetpotato'], anta:['onion','garlic'],
  note:'THE crop for the Georgia summer dead zone. Thrives in heat and drought that kill snap beans, fixes nitrogen, and suppresses root-knot nematodes if you grow a resistant variety like Mississippi Silver. Pink Eye Purple Hull and Zipper Cream are the Southern standards. Pick green for fresh shelling or let them dry on the vine.',
  pest:'Cowpea curculio is the main one. Stink bugs.' },

{ id:'lima', n:'Lima Bean (Butterbean)', cat:'veg', fam:'fabaceae', row:36, sp:4, dep:1.5, ht:24, dtm:75, per:15, sun:'full',
  yld:'0.5 lb per plant',
  sow:[{s:'Summer', m:'direct', r:'last', a:29, b:90}],
  succ:0, comp:['corn','cucumber'], anta:['onion','garlic'],
  trellis:{ row:36, sp:6, ht:84, note:'Pole lima varieties such as Christmas or King of the Garden climb 7 ft and crop far longer than bush types in the same ground. Needs a sturdy frame — a loaded pole lima is heavy in an August thunderstorm.' },
  note:'Handles Georgia heat far better than snap beans and is a Southern table staple. Needs warm soil — sowing into cold ground rots the seed. Pole types like Christmas produce much longer than bush types.',
  pest:'Stink bugs cause pitted, off-flavor seeds. Mexican bean beetle.' },

{ id:'pea', n:'English/Snap Pea', cat:'veg', fam:'fabaceae', row:30, sp:2, dep:1, ht:36, dtm:60, per:20, sun:'full',
  yld:'0.25 lb per plant',
  sow:[{s:'Spring', m:'direct', r:'last', a:-61, b:-25}, {s:'Fall', m:'direct', r:'first', a:-80, b:-59}],
  succ:0, comp:['carrot','radish','turnip','cucumber'], anta:['onion','garlic'],
  needsSupport:'Even bush types crop better on support. The spacing here assumes a short trellis or netting.',
  note:'Plant in late January here — they need to mature before the heat arrives, and a late sowing produces nothing. Tolerates frost easily. Even bush types climb better with a short trellis. Fixes nitrogen.',
  pest:'Powdery mildew as it warms. Aphids.' },

/* ── CUCURBITS ────────────────────────────────────────────────────────── */
{ id:'cucumber', n:'Cucumber', cat:'veg', fam:'cucurbitaceae', row:48, sp:12, dep:1, ht:15, dtm:55, per:3, sun:'full',
  yld:'10–20 fruit per plant',
  sow:[{s:'Spring', m:'direct', r:'last', a:10, b:70}, {s:'Fall', m:'direct', r:'first', a:-99, b:-75}],
  succ:21, comp:['corn','bean','radish','sunflower'], anta:['potato','sage'],
  trellis:{ row:24, sp:8, ht:72, note:'The clearest win in the garden. Vertical cucumbers take a quarter of the ground, dry off faster after dew — which matters enormously against downy mildew in Georgia humidity — and hang straight instead of curling on the soil. A 6 ft cattle panel or nylon netting is plenty.' },
  note:'Trellising is worth it — straighter fruit, far less disease, and it drops the row footprint from 4 feet to about 18 inches. Pick every day once they start; one oversized cuke tells the plant to stop making more. A second sowing in early August beats the disease that takes out the spring planting.',
  pest:'Cucumber beetles spread bacterial wilt, which kills a plant in days. Downy mildew arrives every Georgia July like clockwork.' },

{ id:'summer_squash', n:'Summer Squash / Zucchini', cat:'veg', fam:'cucurbitaceae', row:48, sp:24, dep:1, ht:30, dtm:50, per:2, sun:'full',
  yld:'6–10 lb per plant',
  sow:[{s:'Spring', m:'direct', r:'last', a:10, b:70}, {s:'Fall', m:'direct', r:'first', a:-99, b:-68}],
  succ:21, comp:['corn','bean','radish'], anta:['potato'],
  trellis:{ row:30, sp:18, ht:48, note:'Squash does not climb, but it can be staked upright — tie the main stem to a stake and strip the lower leaves as it grows. Saves a foot of row and, more usefully, puts the lower stem in plain sight so you can catch vine borer eggs before they get in.' },
  note:'SQUASH VINE BORER DICTATES THE SCHEDULE. Moths lay eggs May through July, and they will kill a mature plant overnight. Plant early to get a harvest before they build up, then plant again in early August to fruit after the flight ends. Two plants is genuinely enough for most families.',
  pest:'Vine borer, squash bugs, pickleworm. Wrap the lower stem in foil, and check for orange eggs on stems twice a week.' },

{ id:'winter_squash', n:'Winter Squash', cat:'veg', fam:'cucurbitaceae', row:72, sp:36, dep:1, ht:18, dtm:100, per:3, sun:'full',
  yld:'3–5 fruit per plant',
  sow:[{s:'Summer', m:'direct', r:'last', a:40, b:90}],
  succ:0, comp:['corn','bean'], anta:['potato'],
  trellis:{ row:36, sp:18, ht:84, note:'Only for small-fruited types — acorn, delicata, small butternut. Anything over about 8 lb needs a sling per fruit and a genuinely strong frame. Halves the ground taken, and the airflow cuts powdery mildew noticeably.' },
  note:'Butternut and other C. moschata types resist vine borer far better than other squashes — a real advantage in Georgia. Vines run 10+ feet, so give them the garden edge to sprawl into. Cure in a warm room for 10 days and they keep until spring.',
  pest:'Squash bugs, pickleworm. Less borer damage with moschata types.' },

{ id:'pumpkin', n:'Pumpkin', cat:'veg', fam:'cucurbitaceae', row:96, sp:48, dep:1, ht:18, dtm:110, per:2, sun:'full',
  yld:'2–4 fruit per plant',
  sow:[{s:'Summer', m:'direct', r:'last', a:85, b:110}],
  succ:0, comp:['corn','bean'], anta:['potato'],
  noTrellis:'Fruit is far too heavy to hang. Pumpkins need ground to run across — allow the full 8 ft.',
  note:'Count backwards from Halloween: sow late June to early July in Middle Georgia. Sowing in May means rotten pumpkins by September. The biggest space hog in the garden — one hill takes 50 square feet.',
  pest:'Vine borer, squash bugs, powdery mildew.' },

{ id:'watermelon', n:'Watermelon', cat:'veg', fam:'cucurbitaceae', row:72, sp:36, dep:1, ht:18, dtm:85, per:2, sun:'full',
  yld:'2–4 melons per plant',
  sow:[{s:'Summer', m:'direct', r:'last', a:24, b:80}],
  succ:0, comp:['corn','radish'], anta:['potato'],
  noTrellis:'Full-size melons will tear themselves off any trellis. Only icebox types under about 8 lb are practical vertically, and each still needs its own sling.',
  note:'Georgia grows some of the best watermelons in the country — hot days and sandy soil are exactly right. Ripe when the curly tendril nearest the fruit dries brown and the ground spot turns creamy yellow. Thumping is unreliable.',
  pest:'Cucumber beetles, anthracnose, root-knot nematodes.' },

{ id:'cantaloupe', n:'Cantaloupe', cat:'veg', fam:'cucurbitaceae', row:60, sp:24, dep:1, ht:18, dtm:80, per:3, sun:'full',
  yld:'3–5 melons per plant',
  sow:[{s:'Summer', m:'direct', r:'last', a:24, b:80}],
  succ:0, comp:['corn','radish'], anta:['potato'],
  trellis:{ row:30, sp:12, ht:72, note:'Workable, but each melon needs its own sling once it reaches tennis-ball size — old t-shirt or netting tied to the frame. Without slings the fruit tears loose at the stem. Halves the ground taken and keeps the fruit off wet soil.' },
  note:'Ready when the stem slips from the fruit with gentle thumb pressure — "full slip." Cut too early and it never sweetens. Mulch under the fruit to stop ground rot in humid weather.',
  pest:'Downy mildew, cucumber beetles, pickleworm.' },

/* ── OTHER SUMMER CROPS ───────────────────────────────────────────────── */
{ id:'okra', n:'Okra', cat:'veg', fam:'malvaceae', row:42, sp:15, dep:1, ht:72, dtm:55, per:4, sun:'full',
  yld:'2–4 lb per plant',
  sow:[{s:'Summer', m:'direct', r:'last', a:29, b:101}],
  succ:0, comp:['southern_pea','pepper','sweetpotato'], anta:[],
  note:'The one crop that gets better the hotter it gets — dependable when everything else in a Georgia August has quit. Grows 6 feet tall, so keep it on the north edge or it shades the whole garden. Pick pods at 3 inches every single day; a pod left two days turns woody and shuts the plant down. Clemson Spineless is the standard.',
  pest:'Very few. Stink bugs, aphids on tips, root-knot nematodes.' },

{ id:'corn', n:'Sweet Corn', cat:'veg', fam:'poaceae', row:36, sp:10, dep:1.5, ht:84, dtm:80, per:20, sun:'full',
  yld:'1–2 ears per plant',
  sow:[{s:'Spring', m:'direct', r:'last', a:3, b:71}],
  succ:14, comp:['bean','cucumber','squash','pea'], anta:['tomato'],
  note:'MUST be planted in a block of at least four short rows, never one long row — corn is wind-pollinated and a single row gives you gap-toothed ears. Extremely heavy nitrogen feeder; follow it with legumes. At 7 feet tall it belongs on the north edge of the garden.',
  pest:'Corn earworm is near-universal in Georgia — a few drops of mineral oil on the silk once it browns helps. Raccoons and deer will take a whole planting the night before you would have picked it.' },

/* ── HERBS & SPICES ───────────────────────────────────────────────────── */
{ id:'basil', n:'Basil', cat:'herb', fam:'lamiaceae', row:18, sp:12, dep:0.25, ht:24, dtm:60, per:2, sun:'full',
  yld:'continuous cutting',
  sow:[{s:'Summer', m:'transplant', r:'last', a:24, b:101}],
  succ:0, comp:['tomato','pepper'], anta:[],
  note:'Loves Georgia summers. Pinch the growing tips constantly and never let it flower — once it sets seed the leaves turn bitter and the plant is done. Frost-tender, so it dies with the first cold snap. Cut and freeze in oil in October.',
  pest:'Downy mildew is now widespread; choose resistant varieties like Prospera. Japanese beetles.' },

{ id:'cilantro', n:'Cilantro / Coriander', cat:'herb', fam:'apiaceae', row:12, sp:4, dep:0.5, ht:20, dtm:45, per:4, sun:'part',
  yld:'leaves, then seed',
  sow:[{s:'Spring', m:'direct', r:'last', a:-35, b:-2}, {s:'Fall', m:'direct', r:'first', a:-68, b:-14}],
  succ:14, comp:['tomato','pepper'], anta:['fennel'],
  note:'A cool-season crop here, not a summer one — it bolts within weeks of warm weather no matter what you do. Sow every two weeks October through March for a steady supply. Let the bolted plants finish and you harvest coriander seed, so the "failure" is the spice crop.',
  pest:'Very few. Aphids on flower heads.' },

{ id:'dill', n:'Dill', cat:'herb', fam:'apiaceae', row:18, sp:8, dep:0.25, ht:36, dtm:55, per:2, sun:'full',
  yld:'leaves and seed heads',
  sow:[{s:'Spring', m:'direct', r:'last', a:-21, b:29}, {s:'Fall', m:'direct', r:'first', a:-68, b:-38}],
  succ:21, comp:['cabbage','onion','lettuce'], anta:['carrot'],
  note:'Time it to be ready with your cucumbers if you plan on pickles. Self-seeds readily once established. Keep it away from carrots — they are close relatives and will cross. Also the host plant for swallowtail caterpillars, which is worth tolerating.',
  pest:'Aphids. Swallowtail larvae, which you should leave alone.' },

{ id:'parsley', n:'Parsley', cat:'herb', fam:'apiaceae', row:18, sp:8, dep:0.25, ht:14, dtm:75, per:2, sun:'part',
  yld:'continuous cutting',
  sow:[{s:'Spring', m:'transplant', r:'last', a:-35, b:10}, {s:'Fall', m:'transplant', r:'first', a:-68, b:-29}],
  succ:0, comp:['tomato','carrot','onion'], anta:[],
  note:'A biennial — it produces leaves the first year, then bolts and dies the second spring. Overwinters easily in Middle Georgia and gives you fresh leaves all winter. Seed is notoriously slow, taking three weeks to germinate.',
  pest:'Swallowtail larvae. Aphids.' },

{ id:'rosemary', n:'Rosemary', cat:'herb', fam:'lamiaceae', row:36, sp:36, dep:0, ht:48, dtm:0, per:1, sun:'full', perennial:true,
  yld:'harvest year-round',
  sow:[{s:'Spring', m:'transplant', r:'last', a:-21, b:40}, {s:'Fall', m:'transplant', r:'first', a:-68, b:-24}],
  succ:0, comp:['cabbage','bean','carrot'], anta:[],
  note:'A permanent shrub that reaches 4 feet across — put it at the garden edge, not in a rotation row. Hardy in Middle Georgia and evergreen, so you harvest all winter. The one thing that kills it is wet feet; plant high and never water once established.',
  pest:'Essentially none. Root rot in heavy clay is the only real risk.' },

{ id:'thyme', n:'Thyme', cat:'herb', fam:'lamiaceae', row:18, sp:12, dep:0, ht:12, dtm:0, per:1, sun:'full', perennial:true,
  yld:'harvest year-round',
  sow:[{s:'Spring', m:'transplant', r:'last', a:-21, b:40}],
  succ:0, comp:['cabbage','strawberry'], anta:[],
  note:'Low evergreen perennial that comes back for years. Needs sharp drainage — it rots in wet Georgia clay, so plant on a mound or in gravel-amended soil. Shear it back by a third each spring to stop it going woody.',
  pest:'None to speak of.' },

{ id:'oregano', n:'Oregano', cat:'herb', fam:'lamiaceae', row:18, sp:12, dep:0, ht:18, dtm:0, per:1, sun:'full', perennial:true,
  yld:'harvest spring through fall',
  sow:[{s:'Spring', m:'transplant', r:'last', a:-21, b:40}],
  succ:0, comp:['cabbage','bean'], anta:[],
  note:'Perennial and spreading — give it a permanent spot at the edge. Flavor is strongest just before it flowers, which is the moment to cut and dry it. Greek oregano has far more flavor than the generic garden type.',
  pest:'Spider mites in drought.' },

{ id:'sage', n:'Sage', cat:'herb', fam:'lamiaceae', row:24, sp:18, dep:0, ht:24, dtm:0, per:1, sun:'full', perennial:true,
  yld:'harvest year-round',
  sow:[{s:'Spring', m:'transplant', r:'last', a:-21, b:40}],
  succ:0, comp:['cabbage','carrot','rosemary'], anta:['cucumber'],
  note:'Perennial, though Georgia humidity tends to shorten its life to three or four years. Needs excellent drainage and good airflow. Prune in spring, never in fall.',
  pest:'Root rot in wet ground. Spider mites.' },

{ id:'mint', n:'Mint', cat:'herb', fam:'lamiaceae', row:24, sp:18, dep:0, ht:24, dtm:0, per:1, sun:'part', perennial:true,
  yld:'aggressive and continuous',
  sow:[{s:'Spring', m:'transplant', r:'last', a:-21, b:40}],
  succ:0, comp:['cabbage','tomato'], anta:[],
  note:'WILL TAKE OVER YOUR GARDEN. Plant it in a sunken bucket or a container, never loose in a bed — the runners travel underground and are almost impossible to remove once established. Tolerates shade and wet spots that nothing else wants.',
  pest:'Rust. Spider mites.' },

{ id:'chives', n:'Chives', cat:'herb', fam:'alliaceae', row:15, sp:8, dep:0.25, ht:14, dtm:0, per:1, sun:'full', perennial:true,
  yld:'continuous cutting',
  sow:[{s:'Spring', m:'transplant', r:'last', a:-35, b:24}],
  succ:0, comp:['carrot','tomato'], anta:['bean','pea'],
  note:'Perennial clump that returns every year and slowly expands. Cut to 2 inches and it regrows in two weeks. Purple flowers are edible. Divide every three years to keep it vigorous.',
  pest:'Essentially none.' },

{ id:'ginger', n:'Ginger', cat:'herb', fam:'zingiberaceae', row:24, sp:8, dep:2, ht:36, dtm:240, per:2, sun:'part',
  yld:'1–2 lb per plant',
  sow:[{s:'Spring', m:'set', r:'last', a:-7, b:40}],
  succ:0, comp:['turmeric'], anta:[],
  note:'A genuinely good Georgia crop that most people never try. Grown as an annual — plant rhizome pieces in spring, harvest in October before frost. Wants part shade and rich, constantly moist soil. Start pieces indoors in February for a head start on the long season.',
  pest:'Root rot in poorly drained soil.' },

{ id:'turmeric', n:'Turmeric', cat:'herb', fam:'zingiberaceae', row:24, sp:10, dep:2, ht:36, dtm:240, per:2, sun:'part',
  yld:'1–2 lb per plant',
  sow:[{s:'Spring', m:'set', r:'last', a:-7, b:40}],
  succ:0, comp:['ginger'], anta:[],
  note:'Grows like ginger and needs the same long warm season, which Middle Georgia has. Dig after the leaves yellow in late October. The rhizomes stain everything they touch a permanent orange.',
  pest:'Root rot in wet ground.' },

{ id:'fennel', n:'Fennel', cat:'herb', fam:'apiaceae', row:24, sp:10, dep:0.25, ht:48, dtm:80, per:2, sun:'full',
  yld:'1 bulb + fronds and seed',
  sow:[{s:'Fall', m:'direct', r:'first', a:-85, b:-49}],
  succ:0, comp:[], anta:['tomato','bean','pepper','cilantro','dill'],
  note:'ALLELOPATHIC — this one is real, not folklore. Fennel roots release compounds that stunt most nearby vegetables. Give it an isolated corner or a container. Grow bulbing (Florence) types in fall; spring plantings bolt without forming a bulb.',
  pest:'Aphids. Swallowtail larvae.' },

/* ── PERENNIAL VEGETABLES ─────────────────────────────────────────────── */
{ id:'asparagus', n:'Asparagus', cat:'veg', fam:'asparagaceae', row:48, sp:18, dep:6, ht:60, dtm:730, per:10, sun:'full', perennial:true,
  yld:'0.5 lb per plant per year',
  sow:[{s:'Spring', m:'crown', r:'last', a:-49, b:-7}],
  succ:0, comp:['tomato','parsley'], anta:['onion','garlic'],
  note:'A 15-to-20-year permanent bed — site it once, at the garden edge, where it will never be tilled. Do not cut any spears the first two years; let the ferns feed the crowns. Full harvest starts in year three. Georgia heat shortens the cutting season, so stop in mid-May and let it fern out.',
  pest:'Asparagus beetle. Fusarium crown rot in poorly drained ground.' },

/* ── FRUIT (permanent plantings — outside the rotation) ───────────────── */
{ id:'blueberry', n:'Blueberry (Rabbiteye)', cat:'fruit', fam:'ericaceae', row:120, sp:72, dep:0, ht:96, dtm:1095, per:2, sun:'full', perennial:true,
  yld:'5–15 lb per mature bush',
  sow:[{s:'Winter', m:'dormant', r:'first', a:7, b:112}],
  succ:0, comp:[], anta:[],
  note:'THE Georgia fruit — rabbiteye types are native to the Southeast and thrive here with almost no care. Two non-negotiables: soil pH must be 4.5–5.5 (test first, and amend with elemental sulfur months ahead), and you must plant at least TWO different varieties for cross-pollination or you get almost no fruit. Pair an early type like Climax with a late one like Powderblue to stretch harvest from June into August. First real crop in year three.',
  pest:'Birds will take the entire crop — netting is essential. Very few insect problems.' },

{ id:'fig', n:'Fig', cat:'fruit', fam:'moraceae', row:180, sp:180, dep:0, ht:144, dtm:730, per:1, sun:'full', perennial:true,
  yld:'20–50 lb per mature tree',
  sow:[{s:'Winter', m:'dormant', r:'first', a:7, b:112}],
  succ:0, comp:[], anta:[],
  note:'Nearly foolproof in Middle Georgia and productive within two or three years. Celeste and Brown Turkey are the proven varieties — critically, both have a closed eye, which keeps out the dried fruit beetle that ruins open-eye types in our humidity. Needs 12–15 feet of room. Roots are shallow, so mulch and never cultivate underneath.',
  pest:'Birds. Root-knot nematodes in sandy soil.' },

{ id:'muscadine', n:'Muscadine Grape', cat:'fruit', fam:'vitaceae', row:120, sp:240, dep:0, ht:84, dtm:1095, per:1, sun:'full', perennial:true,
  yld:'20–60 lb per mature vine',
  sow:[{s:'Winter', m:'dormant', r:'first', a:7, b:112}],
  succ:0, comp:[], anta:[],
  note:'Native to the Southeast and immune to the diseases that destroy bunch grapes in Georgia humidity. Needs a serious two-wire trellis and 20 feet per vine. Check whether your variety is self-fertile or female — female varieties like Fry need a self-fertile vine nearby to set fruit. Prune hard every February; it fruits on new wood.',
  pest:'Very few. Japanese beetles on young growth.' },

{ id:'blackberry', n:'Blackberry (Thornless)', cat:'fruit', fam:'rosaceae', row:120, sp:48, dep:0, ht:72, dtm:730, per:3, sun:'full', perennial:true,
  yld:'8–15 lb per plant',
  sow:[{s:'Winter', m:'dormant', r:'first', a:7, b:112}],
  succ:0, comp:[], anta:[],
  note:'Erect thornless varieties like Ouachita and Navaho are made for the Southeast and need no trellis. Canes are biennial: they grow one year, fruit the next, then die — cut spent canes to the ground right after harvest. Tip the new canes at 40 inches in summer to force branching and double the crop.',
  pest:'Spotted wing drosophila lays eggs in ripening fruit — pick every day and refrigerate immediately. Japanese beetles.' },

{ id:'strawberry', n:'Strawberry', cat:'fruit', fam:'rosaceae', row:42, sp:12, dep:0, ht:10, dtm:210, per:25, sun:'full',
  yld:'1–2 lb per plant',
  sow:[{s:'Fall', m:'transplant', r:'first', a:-38, b:-8}],
  succ:0, comp:['lettuce','spinach','bean','thyme'], anta:['cabbage','broccoli','kale'],
  note:'Georgia grows strawberries as an ANNUAL, not a perennial — set plants out in October on black plastic mulch, harvest April into May, then pull them out. Trying to carry plants through a Georgia summer gives you disease and almost no fruit the second year. Chandler and Camarosa are the varieties used here.',
  pest:'Slugs, birds, gray mold in wet spring weather. Spotted wing drosophila.' },

{ id:'peach', n:'Peach', cat:'fruit', fam:'rosaceae', row:240, sp:216, dep:0, ht:180, dtm:1460, per:1, sun:'full', perennial:true,
  yld:'50–150 lb per mature tree',
  sow:[{s:'Winter', m:'dormant', r:'first', a:7, b:97}],
  succ:0, comp:[], anta:[],
  note:'Middle Georgia gets roughly 700–850 chill hours, so match the variety to that — too-low-chill types bloom in a February warm spell and lose the crop to a March freeze. Elberta, Redhaven and Contender are safe local choices. Self-fertile, so one tree works. Be honest with yourself: peaches need a real spray schedule in Georgia humidity, plus annual pruning to an open center.',
  pest:'Peach tree borer, plum curculio, brown rot. The highest-maintenance fruit on this list.' },

{ id:'pear', n:'Pear (Fire-Blight Resistant)', cat:'fruit', fam:'rosaceae', row:240, sp:216, dep:0, ht:180, dtm:1460, per:1, sun:'full', perennial:true,
  yld:'50–200 lb per mature tree',
  sow:[{s:'Winter', m:'dormant', r:'first', a:7, b:97}],
  succ:0, comp:[], anta:[],
  note:'Far easier than peaches in Georgia — but only fire-blight-resistant varieties like Kieffer, Orient or Moonglow. Bartlett will die of blight here. Plant two varieties for reliable pollination. Kieffer is a hard cooking pear, excellent canned or preserved.',
  pest:'Fire blight is the killer — never fertilize heavily, which pushes the soft growth it infects.' },

{ id:'pecan', n:'Pecan', cat:'fruit', fam:'juglandaceae', row:480, sp:480, dep:0, ht:600, dtm:2555, per:1, sun:'full', perennial:true,
  yld:'50–100 lb per mature tree',
  sow:[{s:'Winter', m:'dormant', r:'first', a:7, b:97}],
  succ:0, comp:[], anta:[],
  note:'Georgia\'s signature tree nut, but understand the commitment: 40 feet of spacing, 8–10 years to a real crop, and 60 feet of eventual shade that will end vegetable growing anywhere near it. Needs two varieties for pollination. Scab-resistant types like Elliott and Sumner are worth the extra effort to find.',
  pest:'Pecan scab in humid years, aphids, squirrels. Large trees are impractical to spray.' },

{ id:'elderberry', n:'Elderberry', cat:'fruit', fam:'adoxaceae', row:120, sp:72, dep:0, ht:120, dtm:730, per:2, sun:'part', perennial:true,
  yld:'10–15 lb per mature bush',
  sow:[{s:'Winter', m:'dormant', r:'first', a:7, b:112}],
  succ:0, comp:[], anta:[],
  note:'Native, tough, and happy in the low wet corner where nothing else will grow. Plant two varieties for good fruit set. Berries must be cooked — raw berries and all other parts of the plant are mildly toxic. Fast: a real crop by year two.',
  pest:'Birds. Spotted wing drosophila.' },
/* ── COMPANION / UTILITY PLANTS ───────────────────────────────────────── */
{ id:'marigold', n:'French Marigold', cat:'herb', fam:'asteraceae', row:18, sp:10, dep:0.25, ht:12, dtm:50, per:0, sun:'full',
  yld:'not edible — grown for nematode control',
  sow:[{s:'Spring', m:'direct', r:'last', a:0, b:70}],
  succ:0, comp:['tomato','eggplant','okra','cucumber'], anta:[],
  note:'The one companion plant with hard science behind it. French marigold (Tagetes patula) roots release alpha-terthienyl, which genuinely suppresses root-knot nematodes — a serious problem in Georgia sandy soil. Important caveat: it works as a dense COVER CROP grown for a full season on infested ground, not as a few flowers scattered among vegetables. Plant a whole row or block where you plan to grow tomatoes or okra next year.',
  pest:'Spider mites in drought. Slugs on seedlings.' },

{ id:'sunflower', n:'Sunflower', cat:'herb', fam:'asteraceae', row:30, sp:12, dep:1, ht:96, dtm:80, per:2, sun:'full',
  yld:'1 large head of seed per plant',
  sow:[{s:'Spring', m:'direct', r:'last', a:0, b:70}],
  succ:14, comp:['cucumber','corn'], anta:['potato','pole_bean'],
  note:'Doubles as a living trellis for pole beans and cucumbers, and draws pollinators to the whole garden. At 8 feet it is the tallest thing you will grow — it belongs on the north edge or it shades everything. Mildly allelopathic, so keep the hulls out of beds. Cut heads when the back turns yellow-brown and cure them under cover away from birds.',
  pest:'Birds and squirrels take the seed. Cover ripening heads with mesh bags.' }
];

FAMILIES.asparagaceae = { n: 'Asparagus family', warn: 'Permanent bed — keep out of the rotation entirely.' };
FAMILIES.adoxaceae   = { n: 'Elderberry family', warn: 'Permanent planting.' };

if (typeof module !== 'undefined') { module.exports = { CROPS, FAMILIES }; }
