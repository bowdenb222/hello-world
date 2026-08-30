/* Georgia Garden Planner — app logic */
(function () {
'use strict';

/* ── Regions ──────────────────────────────────────────────────────────── */
const REGIONS = {
  north:  { n:'North GA / Blue Ridge', zone:'7a–7b', last:'04-10', first:'10-25' },
  metro:  { n:'Atlanta / Piedmont',    zone:'7b–8a', last:'03-30', first:'11-05' },
  middle: { n:'Middle GA',             zone:'8a–8b', last:'03-22', first:'11-08' },
  south:  { n:'South / Coastal GA',    zone:'8b–9a', last:'03-05', first:'11-25' }
};
const SEASONS = ['Spring','Summer','Fall','Winter'];
const SEASON_NOTE = {
  Spring:'Cool crops go in first, tender crops after the last frost. The window closes fast — most spring greens are finished by early May.',
  Summer:'The hard season. Only heat-lovers set fruit through July and August; use this layout for okra, southern peas, sweet potato and peppers.',
  Fall:'Georgia\'s best growing season. Brassicas, roots and greens all do better now than in spring, and frost improves the flavour of most of them.',
  Winter:'Greens, alliums and roots hold in the ground through a Middle Georgia winter. Garlic and onions are planted now for a May harvest.'
};
/* group aliases used in companion lists */
const ALIAS = { bean:['bush_bean','pole_bean','lima'], squash:['summer_squash','winter_squash'] };

const FAM_COLOR = {
  solanaceae:'#c0562f', cucurbitaceae:'#4f8f4a', brassicaceae:'#5b7fb5', fabaceae:'#7aa03c',
  apiaceae:'#d08a2c', amaranthaceae:'#a24a72', alliaceae:'#8a76bb', asteraceae:'#3f9e8c',
  poaceae:'#b8952f', malvaceae:'#c2703c', convolvulaceae:'#9a5a3c', lamiaceae:'#5f9e5a',
  zingiberaceae:'#c99a2e', ericaceae:'#4a6fa5', rosaceae:'#bd4f6b', vitaceae:'#7b5ba6',
  moraceae:'#6b8f3a', juglandaceae:'#7d6a4a', asparagaceae:'#4f9e7a', adoxaceae:'#5d6fa8',
  basellaceae:'#63a05e', polygonaceae:'#8a8a5a'
};
const byId = {}; CROPS.forEach(c => byId[c.id] = c);
const famColor = c => FAM_COLOR[c.fam] || '#777';

/* ── State ────────────────────────────────────────────────────────────── */
const DEFAULTS = () => ({
  region:'middle', last:REGIONS.middle.last, first:REGIONS.middle.first,
  plotW:20, plotD:30, season:'Spring',
  rows:{ Spring:[], Summer:[], Fall:[], Winter:[] },
  history:[], cat:'all', q:'',
  plans:[], planId:null
});
let S = DEFAULTS();
const KEY = 'ga-garden-v1';

/* Some browsers refuse storage outright: private windows, and Safari's cross-site
   tracking prevention when the page is embedded in an iframe from another origin.
   Losing a garden plan silently is worse than being told, so probe once at startup
   and warn the user if writes will not stick. */
let STORAGE_OK = (function(){
  try {
    localStorage.setItem('__probe__', '1');
    localStorage.removeItem('__probe__');
    return true;
  } catch (e) { return false; }
})();

function load(){
  if (!STORAGE_OK) return;
  try {
    const r = JSON.parse(localStorage.getItem(KEY));
    if (r) S = Object.assign(DEFAULTS(), r);
  } catch(e){/* corrupt entry — start clean rather than dying on load */}
}
function save(){
  if (!STORAGE_OK) return;
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch(e){ STORAGE_OK = false; drawStorageWarning(); }
}
function drawStorageWarning(){
  const host = document.getElementById('storageWarn');
  if (!host) return;
  host.innerHTML = STORAGE_OK ? '' : `<div class="alert bad">
    <b>This browser will not save your work</b>
    Saved data is blocked here, so your plan disappears when you close the tab. Two
    fixes: install this to your home screen and open it from that icon, or use
    <b>Copy my data</b> under Guide to keep a backup you can paste back in.</div>`;
}

/* ── Dates ────────────────────────────────────────────────────────────── */
const MON = ['January','February','March','April','May','June','July','August',
             'September','October','November','December'];
const YEAR = new Date().getFullYear();

function mdDate(md, y){ const [m,d] = md.split('-').map(Number); return new Date(y, m-1, d); }
function addDays(d, n){ const x = new Date(d.getTime()); x.setDate(x.getDate()+n); return x; }
function fmt(d){ return MON[d.getMonth()].slice(0,3) + ' ' + d.getDate(); }

/* Resolve a stored window into real dates for a year. Windows anchored to the
   fall frost can run past New Year (garlic, fruit trees), so the end date is
   allowed to land in the following year. */
function winDates(w, y){
  y = y || YEAR;
  const anchor = w.r === 'last' ? mdDate(S.last, y) : mdDate(S.first, y);
  return { start: addDays(anchor, w.a), end: addDays(anchor, w.b) };
}
function inWindow(w, when){
  const t = when || new Date();
  for (const y of [t.getFullYear()-1, t.getFullYear()]){
    const { start, end } = winDates(w, y);
    if (t >= start && t <= end) return true;
  }
  return false;
}
/* indoor-start window derived from a transplant window, when the crop lists one */
function indoorWin(c){ return (c.sow||[]).filter(w => w.m === 'indoor'); }

const METHOD = { direct:'Direct sow', indoor:'Start indoors', transplant:'Set out transplants',
                 set:'Plant sets', slip:'Plant slips', crown:'Plant crowns', dormant:'Plant dormant stock' };

/* ── Geometry ─────────────────────────────────────────────────────────── */
const ft = inches => inches / 12;

/* Growing a vine vertically changes three numbers at once: the row narrows, the
   in-row spacing tightens, and the plant gets tall — that last one feeds straight
   into the shading check, so a trellised cucumber starts shading its neighbours. */
function geo(c, trellised){ return (trellised && c.trellis) ? c.trellis : c; }

function plantsInRow(g, widthFt){
  return Math.max(1, Math.floor((widthFt * 12) / g.sp));
}
/* Lay rows out from the north edge southward; returns each row's band. */
function layout(){
  const rows = S.rows[S.season] || [];
  let y = 0;
  return rows.map((r, i) => {
    const c = byId[r.cropId];
    const g = geo(c, r.trellis);
    const depth = ft(g.row);
    const band = { i, crop:c, g, trellis:!!(r.trellis && c.trellis), uid:r.uid,
                   top:y, depth, plants:plantsInRow(g, S.plotW) };
    y += depth;
    return band;
  });
}
/* Ground that trellising the vining rows would give back. */
function trellisSaving(bands){
  return bands.reduce((sum, b) =>
    sum + (b.crop.trellis && !b.trellis ? ft(b.crop.row - b.crop.trellis.row) : 0), 0);
}
const usedDepth = bands => bands.reduce((s,b) => s + b.depth, 0);

/* ── Checks ───────────────────────────────────────────────────────────── */
function checks(bands){
  const out = [];
  if (!bands.length) return out;

  /* 1. Does it fit? */
  const used = usedDepth(bands);
  if (used > S.plotD + 0.01){
    const save = trellisSaving(bands);
    out.push({ lvl:'bad', t:'Rows overflow the plot',
      m:`These rows need ${used.toFixed(1)} ft of depth but the plot is only ${S.plotD} ft. `
      + `The last ${bands.filter(b => b.top >= S.plotD).length || 1} row(s) will not fit. `
      + (save > 0.4
          ? `Trellising the vining rows would give back ${save.toFixed(1)} ft — ${
              save >= used - S.plotD ? 'enough to fit everything.' : 'still short, so drop a row as well.'}`
          : `Remove a row, or widen the plot.`) });
  }

  /* 2. Shading. Sun sits in the southern sky, so shadows fall north.
        Rough mid-season shadow reach is about 0.6x plant height. */
  bands.forEach((a, i) => {
    if (a.crop.sun !== 'full') return;
    for (let j = i + 1; j < bands.length; j++){
      const b = bands[j];
      const gap = b.top - (a.top + a.depth);
      const diff = b.g.ht - a.g.ht;
      if (diff >= 24 && gap < ft(b.g.ht) * 0.6){
        out.push({ lvl:'warn', t:'Shading problem',
          m:`${b.crop.n}${b.trellis ? ', trellised to ' + Math.round(ft(b.g.ht)) + ' ft,'
             : ` (${Math.round(ft(b.g.ht))} ft tall)`} sits south of ${a.crop.n} and will `
          + `shade it for much of the day. ${a.crop.n} needs full sun. Move the tall row to the `
          + `north edge of the plot.` });
        break;
      }
    }
  });

  /* 3. Same family touching — shared disease and nematodes. */
  for (let i = 0; i < bands.length - 1; i++){
    const a = bands[i], b = bands[i+1];
    if (a.crop.fam === b.crop.fam && a.crop.id !== b.crop.id){
      out.push({ lvl:'warn', t:'Same plant family side by side',
        m:`${a.crop.n} and ${b.crop.n} are both ${FAMILIES[a.crop.fam].n.toLowerCase()} family. `
        + `Pests and disease move straight between neighbouring rows of the same family. `
        + `Put an unrelated row between them.` });
    }
  }

  /* 4. Repeating last year's family in the same ground. */
  const fams = new Set(bands.map(b => b.crop.fam));
  S.history.forEach(f => {
    if (fams.has(f) && FAMILIES[f]){
      const names = bands.filter(b => b.crop.fam === f).map(b => b.crop.n).join(', ');
      out.push({ lvl:'bad', t:`Rotation conflict — ${FAMILIES[f].n.toLowerCase()} family`,
        m:`You grew this family here last year and ${names} repeats it. ${FAMILIES[f].warn}` });
    }
  });

  /* 5. Traditional antagonists, flagged softly — most of this lore is unproven. */
  const expand = id => ALIAS[id] || [id];
  for (let i = 0; i < bands.length - 1; i++){
    const a = bands[i], b = bands[i+1];
    const aBad = (a.crop.anta||[]).flatMap(expand);
    const bBad = (b.crop.anta||[]).flatMap(expand);
    if (aBad.includes(b.crop.id) || bBad.includes(a.crop.id)){
      const allelo = a.crop.id === 'fennel' || b.crop.id === 'fennel';
      out.push({ lvl:'warn', t:allelo ? 'Fennel stunts its neighbours' : 'Traditionally kept apart',
        m: allelo
          ? `Fennel is genuinely allelopathic — its roots release compounds that stunt ${
              (a.crop.id === 'fennel' ? b.crop.n : a.crop.n)}. Move it to its own corner.`
          : `${a.crop.n} and ${b.crop.n} are traditionally kept apart. The evidence for most `
            + `companion pairings is thin, so treat this as a nudge rather than a rule.` });
    }
  }

  /* 6. Wrong season for the layout you are editing. */
  bands.forEach(b => {
    if (!(b.crop.sow||[]).some(w => w.s === S.season) && !b.crop.perennial){
      const when = [...new Set(b.crop.sow.map(w => w.s))].join(' and ');
      out.push({ lvl:'warn', t:`${b.crop.n} is not a ${S.season.toLowerCase()} crop`,
        m:`In your region it is planted in ${when.toLowerCase()}. It will still occupy this ground `
        + `if it is a long-season crop, but check the calendar before you sow.` });
    }
  });

  /* 7. Perennials sitting in a rotation block. */
  const per = bands.filter(b => b.crop.perennial);
  if (per.length){
    out.push({ lvl:'warn', t:'Permanent plantings in a rotating plot',
      m:`${per.map(b => b.crop.n).join(', ')} ${per.length>1?'are':'is'} perennial and will hold this `
      + `ground for years. Site ${per.length>1?'them':'it'} along an edge that never gets tilled, `
      + `not in a row you plan to rotate.` });
  }

  /* 8. Corn needs a block, not a line. */
  const corn = bands.find(b => b.crop.id === 'corn');
  if (corn && bands.filter(b => b.crop.id === 'corn').length < 4){
    out.push({ lvl:'warn', t:'Sweet corn needs a block',
      m:`Corn is wind-pollinated. A single row gives gap-toothed ears — add at least four short `
      + `rows side by side instead of one long one.` });
  }

  /* 9. Blueberry pH conflict. */
  if (bands.some(b => b.crop.id === 'blueberry') && bands.length > 1){
    out.push({ lvl:'bad', t:'Blueberries need their own ground',
      m:`Blueberries require pH 4.5–5.5. Every other crop here wants 6.0–6.8. You cannot satisfy `
      + `both in one plot — give blueberries a separate acidified bed.` });
  }
  return out;
}

/* ── Saved plans ──────────────────────────────────────────────────────────
   The working layout is autosaved on every change, so reopening the app resumes
   exactly where you were. A named plan is a separate snapshot on top of that, so
   you can keep this year and next, or the front plot and the back. */
function snapshot(){
  return {
    plotW: S.plotW, plotD: S.plotD,
    rows: JSON.parse(JSON.stringify(S.rows)),
    history: S.history.slice()
  };
}
function planSummary(p){
  const n = SEASONS.reduce((a,s) => a + (p.rows[s] ? p.rows[s].length : 0), 0);
  return `${p.plotW}\u00d7${p.plotD} ft \u00b7 ${n} row${n===1?'':'s'} \u00b7 saved ${fmt(new Date(p.savedAt))}`;
}
function savePlan(){
  const box = document.getElementById('planName');
  const name = box.value.trim();
  if (!name){ box.focus(); return; }
  const existing = S.plans.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (existing){
    if (!confirm(`Replace the saved plan "${existing.name}" with what is on screen now?`)) return;
    Object.assign(existing, snapshot(), { savedAt: Date.now() });
    S.planId = existing.id;
  } else {
    const p = Object.assign({ id:'p'+Date.now(), name, savedAt:Date.now() }, snapshot());
    S.plans.push(p);
    S.planId = p.id;
  }
  box.value = '';
  drawPlans(); save();
}
function openPlan(id){
  const p = S.plans.find(x => x.id === id); if (!p) return;
  S.plotW = p.plotW; S.plotD = p.plotD;
  S.rows = JSON.parse(JSON.stringify(p.rows));
  SEASONS.forEach(x => { if (!S.rows[x]) S.rows[x] = []; });
  S.history = (p.history || []).slice();
  S.planId = p.id;
  renderAll();
}
function deletePlan(id){
  const p = S.plans.find(x => x.id === id); if (!p) return;
  if (!confirm(`Delete the saved plan "${p.name}"? This cannot be undone.`)) return;
  S.plans = S.plans.filter(x => x.id !== id);
  if (S.planId === id) S.planId = null;
  drawPlans(); save();
}
/* Clears the layout only — region, frost dates and saved plans all survive. */
function startFresh(){
  const rows = SEASONS.reduce((a,x) => a + S.rows[x].length, 0);
  if (rows && !confirm('Clear the current layout and start with an empty plot? Saved plans are kept.')) return;
  const d = DEFAULTS();
  S.plotW = d.plotW; S.plotD = d.plotD; S.rows = d.rows; S.history = [];
  S.planId = null;
  renderAll();
}
function drawPlans(){
  const host = document.getElementById('planList');
  if (!S.plans.length){
    host.innerHTML = `<p class="empty">No saved plans yet. Lay out a plot below, then
      give it a name and save it.</p>`;
    return;
  }
  host.innerHTML = S.plans.slice().sort((a,b) => b.savedAt - a.savedAt).map(p => `
    <div class="rowitem">
      <span class="sw" style="background:${p.id===S.planId?'var(--green)':'var(--line)'}"></span>
      <div class="meta">
        <b>${p.name}${p.id===S.planId?' <span class="tag now">open</span>':''}</b>
        <span class="desc">${planSummary(p)}</span>
      </div>
      <div class="acts">
        <button class="btn sm" data-open="${p.id}">Open</button>
        <button class="iconbtn" data-delplan="${p.id}" aria-label="Delete plan">\u00d7</button>
      </div>
    </div>`).join('');
}


/* ── Map rendering ────────────────────────────────────────────────────── */
const SVG = 'http://www.w3.org/2000/svg';
function el(tag, attrs, text){
  const n = document.createElementNS(SVG, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (text != null) n.textContent = text;
  return n;
}
function drawPlot(){
  const svg = document.getElementById('plotSvg');
  svg.textContent = '';
  const bands = layout();
  const W = S.plotW, D = S.plotD;
  const overflow = Math.max(0, usedDepth(bands) - D);
  const totalD = D + overflow;

  const PAD = { l:30, r:12, t:26, b:22 };
  const px = Math.max(4, Math.min(360 / W, 520 / totalD));
  const w = W * px, h = totalD * px;
  svg.setAttribute('viewBox', `0 0 ${w + PAD.l + PAD.r} ${h + PAD.t + PAD.b}`);
  const g = el('g', { transform:`translate(${PAD.l},${PAD.t})` });

  /* soil ground */
  g.appendChild(el('rect', { x:0, y:0, width:w, height:D*px, rx:3,
    fill:'var(--green-soft)', stroke:'var(--line)' }));

  /* rows */
  bands.forEach(b => {
    const y = b.top * px, bh = b.depth * px;
    const spill = b.top + b.depth > D + 0.01;
    const col = famColor(b.crop);
    g.appendChild(el('rect', { x:0, y, width:w, height:Math.max(1, bh - 1.5), rx:2,
      fill:col, 'fill-opacity':spill ? .22 : .38, stroke:col,
      'stroke-opacity':spill ? .6 : .9, 'stroke-dasharray':spill ? '4 3' : 'none' }));

    /* individual plants, when there is room to show them honestly */
    const n = b.plants, step = w / n;
    if (n <= 45 && step > 3.5 && bh > 7){
      for (let k = 0; k < n; k++){
        g.appendChild(el('circle', { cx:step*(k+0.5), cy:y + bh/2,
          r:Math.min(3, step/2.6, bh/3.2), fill:col, 'fill-opacity':spill ? .5 : .95 }));
      }
    } else if (bh > 5){
      g.appendChild(el('line', { x1:3, y1:y+bh/2, x2:w-3, y2:y+bh/2,
        stroke:col, 'stroke-width':1.4, 'stroke-dasharray':'3 4', 'stroke-opacity':.8 }));
    }

    /* a trellised row reads as a fence line on its north edge */
    if (b.trellis){
      g.appendChild(el('line', { x1:0, y1:y + 0.9, x2:w, y2:y + 0.9,
        stroke:col, 'stroke-width':1.8, 'stroke-opacity':.95 }));
      const posts = Math.min(14, Math.max(3, Math.round(w / 26)));
      for (let k = 0; k <= posts; k++){
        const px2 = (w / posts) * k;
        g.appendChild(el('line', { x1:px2, y1:y + 0.9, x2:px2, y2:y + Math.min(bh - 1, 6),
          stroke:col, 'stroke-width':1.2, 'stroke-opacity':.8 }));
      }
    }

    if (bh >= 13){
      /* halo the label so it stays readable over the plant dots */
      g.appendChild(el('text', { x:5, y:y + bh/2 + 4, 'font-size':Math.min(11, bh*0.5),
        fill:'var(--ink)', 'font-weight':'600', stroke:'var(--panel)', 'stroke-width':3,
        'paint-order':'stroke fill', 'stroke-linejoin':'round' },
        `${b.crop.n} · ${n}${b.trellis ? ' ▦' : ''}`));
    }
    /* row depth tick on the left margin */
    g.appendChild(el('text', { x:-5, y:y + bh/2 + 3.5, 'font-size':8,
      fill:'var(--muted)', 'text-anchor':'end' }, `${b.depth.toFixed(b.depth<10?1:0)}′`));
  });

  /* plot boundary drawn last so it reads above the rows */
  g.appendChild(el('rect', { x:0, y:0, width:w, height:D*px, rx:3,
    fill:'none', stroke:'var(--ink)', 'stroke-width':1.5, 'stroke-opacity':.55 }));

  if (overflow > 0){
    g.appendChild(el('text', { x:w/2, y:D*px + 12, 'font-size':9,
      fill:'var(--danger)', 'text-anchor':'middle', 'font-weight':'600' },
      `${overflow.toFixed(1)} ft beyond the plot`));
  }

  /* north arrow + sun cue */
  const top = el('g');
  top.appendChild(el('text', { x:0, y:-13, 'font-size':9.5, fill:'var(--muted)',
    'font-weight':'600' }, '↑ N'));
  top.appendChild(el('text', { x:w, y:-13, 'font-size':9.5, fill:'var(--muted)',
    'text-anchor':'end' }, `${W} ft wide`));
  g.appendChild(top);
  g.appendChild(el('text', { x:w/2, y:h + 15, 'font-size':9.5, fill:'var(--accent)',
    'text-anchor':'middle', 'font-weight':'600' }, '☀ sun comes from the south'));
  g.appendChild(el('text', { x:-PAD.l + 8, y:D*px/2, 'font-size':9.5, fill:'var(--muted)',
    'text-anchor':'middle', transform:`rotate(-90 ${-PAD.l+8} ${D*px/2})` }, `${D} ft deep`));

  svg.appendChild(g);

  /* stats */
  const used = usedDepth(bands);
  const totalPlants = bands.reduce((s,b) => s + b.plants, 0);
  document.getElementById('plotStats').innerHTML = [
    ['Rows', bands.length],
    ['Plants', totalPlants],
    ['Depth used', used.toFixed(1) + ' ft'],
    ['Of plot', Math.round(used / D * 100) + '%'],
    ['Sq ft', Math.round(Math.min(used, D) * S.plotW)]
  ].concat(trellisSaving(bands) > 0.4
    ? [['Trellising frees', trellisSaving(bands).toFixed(1) + ' ft']] : []
  ).map(([k,v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('');
}

/* ── Row list ─────────────────────────────────────────────────────────── */
function drawRows(){
  const bands = layout();
  const host = document.getElementById('rowList');
  document.getElementById('rowCount').textContent =
    bands.length ? `— ${bands.length} in ${S.season.toLowerCase()}` : '';

  if (!bands.length){
    host.innerHTML = `<p class="empty">No rows yet. Add a crop below and it will be
      placed at the south edge, drawn to scale with the right spacing.</p>`;
    return;
  }
  host.innerHTML = bands.map(b => {
    const c = b.crop;
    const feeds = c.per > 0 ? Math.floor(b.plants / c.per) : 0;
    const serves = feeds >= 1 ? ` · feeds ~${feeds}` : '';
    const saves = c.trellis ? ft(c.row - c.trellis.row) : 0;

    /* Three states: it can be trellised, it is always trellised anyway, or it
       cannot be — each says something different and useful. */
    let support = '';
    if (c.trellis){
      support = `<button class="btn sm trelbtn" data-trellis="${b.i}"
        aria-pressed="${b.trellis}" title="${b.trellis ? 'Growing on a trellis' : 'Grow on a trellis'}">
        ${b.trellis ? '▦ On trellis' : '▦ Trellis'}</button>`;
    } else if (c.needsSupport){
      support = `<span class="tag" title="${c.needsSupport}">needs support</span>`;
    } else if (c.noTrellis){
      /* answers the obvious question of why this row has no trellis button;
         the full reason sits in the crop's detail sheet */
      support = `<span class="tag muted">needs ground</span>`;
    }
    const extra = b.trellis
      ? ` · ${Math.round(ft(b.g.ht))} ft tall${saves > 0.2 ? ` · saves ${saves.toFixed(1)} ft` : ''}`
      : '';

    return `<div class="rowitem">
      <span class="sw" style="background:${famColor(c)}"></span>
      <div class="meta">
        <b>${c.n}</b>
        <span class="desc">${b.plants} plants · ${b.g.sp}″ apart · ${b.depth.toFixed(1)} ft row${serves}${extra}</span>
        ${support ? `<div class="rowsupport">${support}</div>` : ''}
      </div>
      <div class="acts">
        <button class="iconbtn" data-up="${b.i}" aria-label="Move north">↑</button>
        <button class="iconbtn" data-down="${b.i}" aria-label="Move south">↓</button>
        <button class="iconbtn" data-info="${c.id}" aria-label="Details">i</button>
        <button class="iconbtn" data-del="${b.i}" aria-label="Remove">×</button>
      </div></div>`;
  }).join('');
}

function drawAlerts(){
  const a = checks(layout());
  const host = document.getElementById('alerts');
  if (!a.length){
    host.innerHTML = `<div class="alert ok"><b>No problems found</b>
      Spacing, shading, rotation and season all check out for this layout.</div>`;
    return;
  }
  const seen = new Set();
  host.innerHTML = a.filter(x => {
    const k = x.t + x.m; if (seen.has(k)) return false; seen.add(k); return true;
  }).map(x => `<div class="alert ${x.lvl}"><b>${x.t}</b>${x.m}</div>`).join('');
}

function drawPicker(){
  const sel = document.getElementById('addCrop');
  const season = S.season.toLowerCase();
  const fit = [], other = [];
  CROPS.forEach(c => ((c.sow||[]).some(w => w.s === S.season) ? fit : other).push(c));

  /* Browsers style <optgroup> labels very inconsistently on phones — some render
     them almost invisibly — so the split is signalled three ways: a count in each
     group label, a second label that says what the group IS rather than "other",
     and a disabled divider row that shows up even where group labels do not. */
  const opt = c => `<option value="${c.id}">${c.n}</option>`;
  const sort = a => a.slice().sort((x,y) => x.n.localeCompare(y.n)).map(opt).join('');
  const divider = '<option disabled>' + '─'.repeat(12) + '</option>';

  sel.innerHTML =
      `<optgroup label="▸ Plant in ${season} (${fit.length})">${sort(fit)}</optgroup>`
    + divider
    + `<optgroup label="▸ Not planted in ${season} (${other.length})">${sort(other)}</optgroup>`;
}

function renderMap(){ drawPlot(); drawRows(); drawAlerts(); }

/* ── Calendar ─────────────────────────────────────────────────────────── */
/* Windows anchored to the fall frost can run past New Year — dormant fruit stock
   goes in from mid-November to late February. Such a window has to show up twice:
   once where it starts, and again in January where it carries over. Resolve each
   window against both the previous and current year, then clip to this calendar. */
function tasksForYear(){
  const jan1 = new Date(YEAR, 0, 1);
  const dec31 = new Date(YEAR, 11, 31, 23, 59, 59);
  const out = [];
  CROPS.forEach(c => (c.sow||[]).forEach(w => {
    [YEAR - 1, YEAR].forEach(y => {
      const { start, end } = winDates(w, y);
      if (end < jan1 || start > dec31) return;
      out.push({ c, w, start, end,
        from:    start < jan1 ? jan1 : start,
        to:      end > dec31 ? dec31 : end,
        carried: start < jan1 });
    });
  }));
  return out;
}
function drawCalendar(){
  const now = new Date();
  const all = tasksForYear();

  const live = all.filter(x => inWindow(x.w, now))
                  .sort((a,b) => a.c.n.localeCompare(b.c.n));
  document.getElementById('nowList').innerHTML = live.length
    ? live.map(x => `<button class="cropitem" data-info="${x.c.id}">
        <span class="dot" style="background:${famColor(x.c)}"></span>
        <span class="t"><b>${x.c.n}</b>
          <span class="desc">${METHOD[x.w.m]} · through ${fmt(x.end)}</span></span>
        <span class="tag now">now</span></button>`).join('')
    : `<p class="empty">Nothing is due for planting this week. Check the months below —
        in Georgia the next window is rarely far off.</p>`;

  /* A window shows in every month it actually covers. "What can I still get in
     the ground this month" is the question people open a calendar to answer, so a
     June entry for okra matters even though its window opened in April. */
  const months = Array.from({length:12}, () => []);
  all.forEach(x => {
    for (let m = x.from.getMonth(); m <= x.to.getMonth(); m++){
      months[m].push(Object.assign({}, x, { cont: x.carried || m > x.from.getMonth() }));
    }
  });

  document.getElementById('calList').innerHTML = months.map((list, m) => {
    const cur = m === now.getMonth();
    /* newly opening windows first, then the ones carrying over */
    list.sort((a,b) => (a.cont - b.cont) || (a.from - b.from) || a.c.n.localeCompare(b.c.n));
    const body = list.length
      ? list.map(x => `<div class="task">
          <span class="w">${x.cont ? 'open' : fmt(x.from)}</span>
          <span style="color:${x.w.m==='indoor'?'var(--accent)':'var(--green)'}">●</span>
          <span><b style="font-weight:600">${x.c.n}</b>
            <span class="sub"> — ${METHOD[x.w.m].toLowerCase()}, ${x.cont
              ? 'still open until ' + fmt(x.end)
              : 'until ' + fmt(x.end)}</span></span>
        </div>`).join('')
      : `<p class="empty">Nothing to plant.</p>`;
    return `<div class="mon${cur?' current':''}"><h3>${MON[m]}
      <em>${list.length ? list.filter(x=>!x.cont).length + ' new · '
        + list.length + ' possible' : ''}</em></h3>${body}</div>`;
  }).join('');
}

/* ── Crop browser ─────────────────────────────────────────────────────── */
const CATS = [['all','All'],['veg','Vegetables'],['tuber','Roots & tubers'],
              ['herb','Herbs & spices'],['fruit','Fruit']];
function drawCrops(){
  document.getElementById('catChips').innerHTML = CATS.map(([k,l]) =>
    `<button class="chip" data-cat="${k}" aria-pressed="${S.cat===k}">${l}</button>`).join('');
  const q = S.q.trim().toLowerCase();
  const list = CROPS.filter(c =>
    (S.cat === 'all' || c.cat === S.cat) &&
    (!q || c.n.toLowerCase().includes(q) || FAMILIES[c.fam].n.toLowerCase().includes(q)
        || (c.note||'').toLowerCase().includes(q))
  ).sort((a,b) => a.n.localeCompare(b.n));

  document.getElementById('cropList').innerHTML = list.length ? list.map(c => {
    const now = (c.sow||[]).some(w => inWindow(w));
    return `<button class="cropitem" data-info="${c.id}">
      <span class="dot" style="background:${famColor(c)}"></span>
      <span class="t"><b>${c.n}</b>
        <span class="desc">${FAMILIES[c.fam].n} · ${c.sp}″ apart · rows ${c.row}″</span></span>
      ${now ? '<span class="tag now">plant now</span>'
            : (c.perennial ? '<span class="tag">perennial</span>' : '')}
    </button>`;
  }).join('') : `<p class="empty">No crops match “${S.q}”.</p>`;
}

function openCrop(id){
  const c = byId[id]; if (!c) return;
  const wins = (c.sow||[]).map(w => {
    const d = winDates(w, YEAR);
    const live = inWindow(w);
    return `<div class="task"><span class="w">${w.s}</span>
      <span>${METHOD[w.m]} <b style="font-weight:600">${fmt(d.start)} – ${fmt(d.end)}</b>
      ${live ? '<span class="tag now" style="margin-left:6px">now</span>' : ''}</span></div>`;
  }).join('');

  const nm = ids => [...new Set((ids||[]).flatMap(i => ALIAS[i] || [i]))]
    .map(i => byId[i] ? byId[i].n : i).join(', ');
  const feeds = c.per > 0 ? `${c.per} plant${c.per>1?'s':''} per person` : 'not grown for food';

  document.getElementById('sheetPanel').innerHTML = `
    <div class="grab"></div>
    <h2 style="font-size:19px;font-weight:650">${c.n}</h2>
    <p class="sub" style="margin:3px 0 0">${FAMILIES[c.fam].n} family${c.perennial?' · perennial':''}</p>
    <div style="margin:12px 0">${wins}</div>
    <dl class="dl">
      <dt>In-row spacing</dt><dd>${c.sp}″ between plants</dd>
      <dt>Row spacing</dt><dd>${c.row}″ between rows (${ft(c.row).toFixed(1)} ft)</dd>
      ${c.dep ? `<dt>Planting depth</dt><dd>${c.dep}″</dd>` : ''}
      <dt>Mature height</dt><dd>${c.ht}″ (${ft(c.ht).toFixed(1)} ft)</dd>
      ${c.dtm ? `<dt>Days to harvest</dt><dd>${c.dtm >= 365
        ? (c.dtm/365).toFixed(1) + ' years' : c.dtm + ' days'}</dd>` : ''}
      <dt>Sun</dt><dd>${c.sun === 'full' ? 'Full sun — 6+ hours' : 'Part shade tolerated'}</dd>
      <dt>Yield</dt><dd>${c.yld}</dd>
      <dt>How much to plant</dt><dd>${feeds}</dd>
      ${c.succ ? `<dt>Succession</dt><dd>Re-sow every ${c.succ} days for a steady supply</dd>` : ''}
    </dl>
    ${c.trellis ? `<div class="note"><h4>On a trellis</h4>
      Rows ${c.trellis.row}″ apart instead of ${c.row}″, plants ${c.trellis.sp}″ apart,
      growing to ${ft(c.trellis.ht).toFixed(1)} ft.
      ${c.row > c.trellis.row ? `Gives back ${ft(c.row - c.trellis.row).toFixed(1)} ft of row spacing. ` : ''}
      ${c.trellis.note}</div>` : ''}
    ${c.needsSupport ? `<div class="note"><h4>Support</h4>${c.needsSupport}</div>` : ''}
    ${c.noTrellis ? `<div class="note pest"><h4>Do not trellis</h4>${c.noTrellis}</div>` : ''}
    <div class="note"><h4>Growing it in Georgia</h4>${c.note}</div>
    <div class="note pest"><h4>Pests & problems</h4>${c.pest}</div>
    <div class="note"><h4>Rotation</h4>${FAMILIES[c.fam].warn}</div>
    ${(c.comp||[]).length ? `<div class="note"><h4>Traditionally planted with</h4>
      ${nm(c.comp)}<br><span class="sub">Folk pairings — little hard evidence. The family
      rotation rule matters far more.</span></div>` : ''}
    ${(c.anta||[]).length ? `<div class="note pest"><h4>Keep away from</h4>${nm(c.anta)}</div>` : ''}
    <button class="btn" data-close style="width:100%;margin-top:6px">Close</button>`;
  document.getElementById('sheet').classList.add('on');
}

/* ── Guide tab ────────────────────────────────────────────────────────── */
function drawGuide(){
  document.getElementById('regionSel').innerHTML = Object.entries(REGIONS)
    .map(([k,r]) => `<option value="${k}" ${S.region===k?'selected':''}>${r.n} — zone ${r.zone}</option>`)
    .join('');
  document.getElementById('lastFrost').value = S.last;
  document.getElementById('firstFrost').value = S.first;

  const fams = [...new Set(CROPS.filter(c => !c.perennial).map(c => c.fam))]
    .sort((a,b) => FAMILIES[a].n.localeCompare(FAMILIES[b].n));
  document.getElementById('histChips').innerHTML = fams.map(f =>
    `<button class="chip" data-hist="${f}" aria-pressed="${S.history.includes(f)}">${FAMILIES[f].n}</button>`
  ).join('');
  document.getElementById('histNote').textContent = S.history.length
    ? 'Tap to toggle. The map will flag any row that repeats these.'
    : 'Tap each family you grew in this ground last year.';

  const heat = ['okra','southern_pea','sweetpotato','malabar','eggplant','hotpepper','peanut','lima'];
  document.getElementById('heatCrops').innerHTML = heat.map(id => {
    const c = byId[id];
    return `<button class="cropitem" data-info="${c.id}">
      <span class="dot" style="background:${famColor(c)}"></span>
      <span class="t"><b>${c.n}</b><span class="desc">${c.yld}</span></span></button>`;
  }).join('');
}


/* ── Backup ───────────────────────────────────────────────────────────────
   A plan is worth real effort, and browser storage can vanish — a private
   window, cleared site data, or a browser that blocks it outright. Export is
   plain text so it survives anywhere the user can paste, and it doubles as the
   way to move a garden between a phone and a computer. */
function ioNote(msg, bad){
  const n = document.getElementById('ioNote');
  n.textContent = msg;
  n.style.color = bad ? 'var(--danger)' : 'var(--green)';
}
function exportData(){
  const payload = JSON.stringify({
    app:'ga-garden', v:1, exported:new Date().toISOString(),
    region:S.region, last:S.last, first:S.first,
    plans:S.plans, current:snapshot()
  });
  const box = document.getElementById('ioBox');
  box.value = payload;
  box.select();
  const n = S.plans.length;
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(payload).then(
      () => ioNote(`Copied to the clipboard — ${n} saved plan${n===1?'':'s'} plus your current layout. Paste it somewhere safe.`),
      () => ioNote('Could not reach the clipboard. Select the text above and copy it by hand.', true));
  } else {
    ioNote('Select the text above and copy it — this browser blocks automatic copying.', true);
  }
}
function importData(){
  const box = document.getElementById('ioBox');
  const raw = box.value.trim();
  if (!raw){ ioNote('Paste a backup into the box first, then press this again.', true); return; }
  let d;
  try { d = JSON.parse(raw); }
  catch(e){ ioNote('That is not a valid backup — it looks like part of the text is missing.', true); return; }
  if (!d || d.app !== 'ga-garden' || !Array.isArray(d.plans)){
    ioNote('That text is not a Georgia Garden Planner backup.', true); return;
  }
  if (!confirm(`Import ${d.plans.length} saved plan(s)? This replaces what is on this device.`)) return;

  S.plans  = d.plans;
  S.region = REGIONS[d.region] ? d.region : S.region;
  S.last   = /^\d{2}-\d{2}$/.test(d.last  || '') ? d.last  : S.last;
  S.first  = /^\d{2}-\d{2}$/.test(d.first || '') ? d.first : S.first;
  if (d.current){
    S.plotW = +d.current.plotW || S.plotW;
    S.plotD = +d.current.plotD || S.plotD;
    S.rows  = d.current.rows || S.rows;
    SEASONS.forEach(x => { if (!Array.isArray(S.rows[x])) S.rows[x] = []; });
    S.history = Array.isArray(d.current.history) ? d.current.history : [];
  }
  S.planId = null;
  box.value = '';
  renderAll();
  ioNote(`Imported ${d.plans.length} plan${d.plans.length===1?'':'s'}.`);
}


/* ── Wiring ───────────────────────────────────────────────────────────── */
function renderAll(){
  document.getElementById('regionLabel').textContent =
    `${REGIONS[S.region].n} · last frost ${fmt(mdDate(S.last, YEAR))}`;
  document.getElementById('plotW').value = S.plotW;
  document.getElementById('plotD').value = S.plotD;
  document.getElementById('seasonChips').innerHTML = SEASONS.map(s =>
    `<button class="chip" data-season="${s}" aria-pressed="${S.season===s}">${s}</button>`).join('');
  document.getElementById('seasonNote').textContent = SEASON_NOTE[S.season];
  drawPicker(); renderMap(); drawCalendar(); drawCrops(); drawGuide();
  drawPlans(); drawStorageWarning();
  save();
}

document.addEventListener('click', e => {
  const t = e.target.closest('button, [data-close]');
  if (!t) return;

  if (t.dataset.view){
    document.querySelectorAll('nav.tabs button').forEach(b =>
      b.setAttribute('aria-selected', String(b === t)));
    document.querySelectorAll('.view').forEach(v =>
      v.classList.toggle('on', v.id === 'v-' + t.dataset.view));
    window.scrollTo(0, 0);
    return;
  }
  if (t.dataset.season){ S.season = t.dataset.season; renderAll(); return; }
  if (t.dataset.cat){ S.cat = t.dataset.cat; drawCrops(); save(); return; }
  if (t.dataset.info){ openCrop(t.dataset.info); return; }
  if (t.hasAttribute('data-close')){ document.getElementById('sheet').classList.remove('on'); return; }

  if (t.dataset.open){ openPlan(t.dataset.open); return; }
  if (t.dataset.delplan){ deletePlan(t.dataset.delplan); return; }
  if (t.id === 'savePlanBtn'){ savePlan(); return; }
  if (t.id === 'freshBtn'){ startFresh(); return; }
  if (t.id === 'exportBtn'){ exportData(); return; }
  if (t.id === 'importBtn'){ importData(); return; }

  if (t.dataset.hist){
    const f = t.dataset.hist, i = S.history.indexOf(f);
    i < 0 ? S.history.push(f) : S.history.splice(i, 1);
    drawGuide(); drawAlerts(); save(); return;
  }
  const rows = S.rows[S.season];
  if (t.dataset.trellis != null){
    const r = rows[+t.dataset.trellis];
    r.trellis = !r.trellis;
    renderMap(); save(); return;
  }
  if (t.dataset.del != null){ rows.splice(+t.dataset.del, 1); renderMap(); save(); return; }
  if (t.dataset.up != null){
    const i = +t.dataset.up;
    if (i > 0){ [rows[i-1], rows[i]] = [rows[i], rows[i-1]]; renderMap(); save(); }
    return;
  }
  if (t.dataset.down != null){
    const i = +t.dataset.down;
    if (i < rows.length - 1){ [rows[i], rows[i+1]] = [rows[i+1], rows[i]]; renderMap(); save(); }
    return;
  }
  if (t.id === 'addBtn'){
    rows.push({ uid: Date.now() + Math.random(), cropId: document.getElementById('addCrop').value });
    renderMap(); save(); return;
  }
  if (t.id === 'resetBtn'){
    if (confirm('Erase everything on this device — every saved plan, your region and '
              + 'your rotation history? This cannot be undone.')){
      S = DEFAULTS(); save(); renderAll();
    }
  }
});

/* Escape closes the detail sheet — the scrim is mostly covered by the panel
   on a tall phone, so a keyboard/AT user needs another way out. */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.getElementById('sheet').classList.remove('on');
});

document.getElementById('plotW').addEventListener('input', e => {
  S.plotW = Math.max(2, Math.min(300, +e.target.value || 2)); renderMap(); save();
});
document.getElementById('plotD').addEventListener('input', e => {
  S.plotD = Math.max(2, Math.min(300, +e.target.value || 2)); renderMap(); save();
});
document.getElementById('cropSearch').addEventListener('input', e => {
  S.q = e.target.value; drawCrops(); save();
});
document.getElementById('regionSel').addEventListener('change', e => {
  S.region = e.target.value;
  S.last = REGIONS[S.region].last;
  S.first = REGIONS[S.region].first;
  renderAll();
});
['lastFrost','firstFrost'].forEach(id => {
  document.getElementById(id).addEventListener('change', e => {
    if (!/^\d{2}-\d{2}$/.test(e.target.value)){ e.target.value = id==='lastFrost'?S.last:S.first; return; }
    if (id === 'lastFrost') S.last = e.target.value; else S.first = e.target.value;
    renderAll();
  });
});

load();
renderAll();

if ('serviceWorker' in navigator){
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
