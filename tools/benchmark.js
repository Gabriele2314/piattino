// Benchmark di PiattinoScan: vedi benchmark.html. Il risultato resta anche in window.BENCH (per leggerlo da uno script).
import { SCAN } from '../scan.js';

const $ = s => document.querySelector(s), status = t => { $('#status').textContent = t; };
const load = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error(src)); im.src = src; });

try {
  const set = await fetch('benchmark-set/manifest.json').then(r => { if (!r.ok) throw new Error('manca tools/benchmark-set/manifest.json: lancia prima node tools/benchmark-fetch.mjs'); return r.json(); });
  await tf.ready();
  const m = await SCAN.load('../model-scan/', () => {});
  const classes = m.spec.classes, rows = [], t0 = performance.now();
  for (const [i, it] of set.entries()) {
    status(`${i + 1} di ${set.length} (${tf.getBackend()})`);
    let img; try { img = await load('benchmark-set/' + it.file); } catch (e) { continue; }
    // come l'app: la foto ridotta a 512 px di lato lungo, due inquadrature, media delle probabilità
    const k = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const pp = tf.tidy(() => tf.softmax(SCAN.forward(m, SCAN.inputs(m, c)).logits).mean(0)), p = await pp.data(); pp.dispose();
    const top = Array.from(p, (v, j) => [classes[j], v]).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const rank = top.findIndex(x => x[0] === it.label);
    rows.push({ ...it, top, rank });
    const f = document.createElement('figure'); f.className = rank === 0 ? 'ok' : rank > 0 ? 'top3' : '';
    f.innerHTML = `<img alt=""><figcaption><b></b><br><span></span></figcaption>`;
    f.querySelector('img').src = 'benchmark-set/' + it.file; f.querySelector('b').textContent = it.label;
    f.querySelector('span').textContent = top.map(x => `${x[0]} ${Math.round(x[1] * 100)}%`).join(', ');
    $('#grid').appendChild(f);
    await new Promise(r => setTimeout(r, 0));
  }
  const labels = [...new Set(rows.map(r => r.label))];
  const acc = (list, k) => list.length ? list.filter(r => r.rank >= 0 && r.rank < k).length / list.length : 0;
  const pct = v => Math.round(v * 100) + '%';
  const per = labels.map(l => { const list = rows.filter(r => r.label === l), wrong = {}; list.filter(r => r.rank !== 0).forEach(r => { wrong[r.top[0][0]] = (wrong[r.top[0][0]] || 0) + 1; });
    return { label: l, n: list.length, top1: acc(list, 1), top3: acc(list, 3), confused: Object.entries(wrong).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ×${v}`).join(', ') }; });
  const total = { n: rows.length, top1: acc(rows, 1), top3: acc(rows, 3), msPerPhoto: Math.round((performance.now() - t0) / Math.max(1, rows.length)), backend: tf.getBackend() };
  const table = document.createElement('table');
  table.innerHTML = '<tr><th>Classe</th><th>Foto</th><th>Prima scelta</th><th>Fra le prime 3</th><th>Scambiata con</th></tr>';
  for (const r of [...per, { label: 'Tutte', ...total, confused: '' }]) { const tr = table.insertRow(); [r.label, r.n, pct(r.top1), pct(r.top3), r.confused].forEach(v => { tr.insertCell().textContent = v; }); }
  $('#tables').appendChild(table);
  status(`Fatto: ${rows.length} foto, ${total.msPerPhoto} ms a foto (${total.backend}).`);
  window.BENCH = { total, per, rows: rows.map(r => ({ file: r.file, label: r.label, rank: r.rank, top: r.top.map(x => [x[0], +x[1].toFixed(3)]) })) };
} catch (e) { status('Errore: ' + e.message); window.BENCH = { error: e.message }; }
