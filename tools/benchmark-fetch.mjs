// Scarica un piccolo insieme di prova per PiattinoScan da Wikimedia Commons: foto a licenza libera che NON sono state usate
// per l'addestramento (quelle di model-scan/crediti-foto.tsv vengono scartate).
// Uso: node tools/benchmark-fetch.mjs [foto per classe, predefinito 8]
// Le foto finiscono in tools/benchmark-set/ (cartella ignorata da git: non fanno parte dell'app), con manifest.json e crediti.tsv.
// Le ricerche su Commons sono rumorose: prima di fidarti dei numeri guarda le foto in tools/benchmark.html e togli dal manifest
// quelle che non mostrano il cibo giusto.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const PER = +process.argv[2] || 8;
const root = new URL('../', import.meta.url), out = new URL('benchmark-set/', import.meta.url);
// classi che il modello confonde più facilmente fra loro: varianti di pasta e di riso, polenta e purè
const CLASSES = {
  pastapom: 'spaghetti al pomodoro', pastapesto: 'pasta al pesto', pastabianco: 'pasta burro parmigiano',
  risobianco: 'steamed white rice bowl', risozaff: 'risotto alla milanese', risopom: 'tomato rice dish',
  polenta: 'polenta piatto', pure: 'mashed potatoes plate',
};
const UA = { 'User-Agent': 'PiattinoBenchmark/1.0 (script di prova locale)' };
const api = async params => (await fetch('https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ format: 'json', origin: '*', ...params }), { headers: UA })).json();
const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);

const used = new Set(readFileSync(new URL('model-scan/crediti-foto.tsv', root), 'utf8').split('\n').slice(1).map(l => l.split('\t')[1]).filter(Boolean));
mkdirSync(out, { recursive: true });
const manifest = [], credits = ['cibo\tfile\tautore\tlicenza\tpagina'];
for (const [label, query] of Object.entries(CLASSES)) {
  const found = await api({ action: 'query', generator: 'search', gsrsearch: `filetype:bitmap ${query}`, gsrnamespace: 6, gsrlimit: 40,
    prop: 'imageinfo', iiprop: 'url|extmetadata|mime', iiurlwidth: 480 });
  const pages = Object.values((found.query || {}).pages || {}).sort((a, b) => a.index - b.index);
  let n = 0;
  for (const p of pages) {
    if (n >= PER) break;
    const name = p.title.replace(/^File:/, ''), ii = (p.imageinfo || [])[0];
    if (!ii || !/^image\/(jpeg|png)$/.test(ii.mime) || used.has(name)) continue;
    const res = await fetch(ii.thumburl, { headers: UA }); if (!res.ok) continue;
    const file = `${label}-${String(n + 1).padStart(2, '0')}.${ii.mime === 'image/png' ? 'png' : 'jpg'}`;
    writeFileSync(new URL(file, out), Buffer.from(await res.arrayBuffer()));
    const m = ii.extmetadata || {};
    manifest.push({ file, label, title: name });
    credits.push([label, name, strip(m.Artist && m.Artist.value), strip(m.LicenseShortName && m.LicenseShortName.value), ii.descriptionurl].join('\t'));
    n++;
    await new Promise(r => setTimeout(r, 400));   // con calma: senza pause il server delle miniature risponde 429
  }
  console.log(`${label}: ${n} foto`);
}
writeFileSync(new URL('manifest.json', out), JSON.stringify(manifest, null, 1));
writeFileSync(new URL('crediti.tsv', out), credits.join('\n') + '\n');
console.log(`${manifest.length} foto in tools/benchmark-set/`);
