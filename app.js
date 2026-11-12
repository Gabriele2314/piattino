import { CONFIG } from './config.js';
import { clamp, dkey, parseKey, addDays, todayKey, ageOf, tierOf, targets, normSex, minHealthyKg, bmiOf, checkBody, maxRate, rateOptions, defaultRate,
  addWeight, weightJump, weightTrend as trendOf, goalReview, coachData, riskSignals, journeyText } from './targets.js';
import { migrate, readBackup, toBackup } from './migrate.js';
import { FOODS } from './foods.js';
import { estimateFromPixels } from './portion.js';
import { SCAN, SCAN_URL } from './scan.js';

(() => {
'use strict';

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => Math.round(Number(n) || 0).toLocaleString('it-IT');
const fmt2 = n => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('it-IT');
const fmt1 = n => (Math.round((Number(n) || 0) * 10) / 10).toLocaleString('it-IT');
const rid = () => crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 12) : Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const longDate = k => parseKey(k).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDay = k => parseKey(k).toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', '');
const withTimeout = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r(null), ms))]);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const APP_VERSION = '4.2.0';

const I = {
  // icone delle tab: le parti .f si riempiono e le .cut si ritagliano quando la tab è selezionata
  rings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle class="f" cx="12" cy="12" r="4.5"/></svg>',
  plan:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect class="f" x="4" y="4.5" width="16" height="16" rx="3.5"/><path d="M8.5 2.5v4M15.5 2.5v4"/><path class="cut" d="M8 11.5h8M8 15.5h5"/></svg>',
  scan:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5V6.5a2.5 2.5 0 0 1 2.5-2.5h2M15.5 4h2A2.5 2.5 0 0 1 20 6.5v2M20 15.5v2a2.5 2.5 0 0 1-2.5 2.5h-2M8.5 20h-2A2.5 2.5 0 0 1 4 17.5v-2"/><circle cx="12" cy="12" r="3.6"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect class="f" x="3.5" y="11" width="4.5" height="9.5" rx="1.2"/><rect class="f" x="9.75" y="3.5" width="4.5" height="17" rx="1.2"/><rect class="f" x="16" y="14" width="4.5" height="6.5" rx="1.2"/></svg>',
  person:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle class="f" cx="12" cy="8" r="4"/><path class="f" d="M4.5 21a7.5 7.5 0 0 1 15 0z"/></svg>',
  scale:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M7 20h10M5 8h14M5 8l-2.5 6a2.5 2.5 0 0 0 5 0zM19 8l-2.5 6a2.5 2.5 0 0 0 5 0z"/></svg>',
  share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M8 10H6.5A1.5 1.5 0 0 0 5 11.5v8A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1.5-1.5H16"/></svg>',
  addsq:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="3.5"/><rect x="7.5" y="6.5" width="3.5" height="3.5" rx="1"/><rect x="13" y="6.5" width="3.5" height="3.5" rx="1"/><rect x="7.5" y="12" width="3.5" height="3.5" rx="1"/></svg>',
  dots:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5.5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="18.5" r="1.8"/></svg>',
  compass:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
  globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/></svg>',
  up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  plusc:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M12 6.5v11M6.5 12h11" fill="none" style="stroke:var(--on-prominent)" stroke-width="2.4" stroke-linecap="round"/></svg>',
  left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  right:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>',
  spark:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.2 6.3 6.3 2.2-6.3 2.2L12 19.5l-2.2-6.3L3.5 11l6.3-2.2z"/></svg>',
  sunrise:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 18h18M6.5 14.5a5.5 5.5 0 0 1 11 0M12 3.5v4M5 8l1.5 1.5M19 8l-1.5 1.5"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6z"/></svg>',
  leaf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19.5C5 11 10 5 20 4.5c0 10-6 15-14 15"/><path d="M5 19.5l7.5-7.5"/></svg>',
  flip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.5-2h4.4l1.5 2h1.8A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z"/><path d="M9 12.5a3 3 0 0 1 5.2-2M15 13.5a3 3 0 0 1-5.2 2"/><path d="M14.5 8.8v1.9h-1.9M9.5 17.2v-1.9h1.9"/></svg>',
  photos:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-8.5 8.5"/></svg>',
  camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.5-2h4.4l1.5 2h1.8A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.6"/></svg>',
};

/* ---------- elenco degli alimenti (per 100 g): i dati stanno in foods.js ---------- */
const FOOD = Object.fromEntries(FOODS.map(f => [f.key, f]));
// peso di un pezzo, per frasi come «2 uova» o «una mela»
const PIECE = { uova:60, mela:150, banana:120, arancia:150, kiwi:80, pera:150, pesca:150, fette:10, biscotti:10, cornetto:60, burger:200, hotdog:150, bagel:90, yogurt:125, greco:150, pizza:300, limone:50, caffe:30, ghiacciolo:70, pane:50, paneint:50, arancini:170, piadina:110, polpette:40, cotoletta:150, focaccia:100,
  mandarino:80,albicocche:40,prugne:50,cachi:150,papaya:150,melaverde:150,datteri:8,uvetta:20,grissini:5,taralli:10,panecassetta:30,tramezzino:100,toast:150,panettone:80,pandoro:80,cannolo:90,brioche:60,merendina:35,barretta:25,caramelle:5,torta:80,nuggets:20,bastoncini:30,wurstel:50,kebab:250,sushi:30,falafel:20,gnocchi:200,mortadella:20,olive:4,castagne:10,nocciole:2,pistacchi:1,anacardi:3,cioccolatte:20,budino:125,nutella:15,ciambellone:70 };
const fvFor = (isFv, g) => isFv ? Math.max(1, Math.round(g / 130)) : 0;
// altri nomi con cui si cercano i cibi (elenco e frasi)
const SYN = {
  cannolo:['cannolo','cannoli'], cocco:['cocco'],
  mandarino:['mandarini','clementina','clementine'], albicocche:['albicocca'], prugne:['prugna','susina','susine'], lamponi:['lampone'],
  cachi:['caco','kaki'], mirtilli:['mirtillo'], datteri:['dattero'], finocchi:['finocchio'],
  piselli:['pisello'], asparagi:['asparago'], ravanelli:['ravanello'], cavolini:['cavolino','cavoletti'],
  olive:['oliva'], couscous:['cous cous','couscous'], gnocchi:['gnocchi','gnocco'], grissini:['grissino'],
  taralli:['tarallo','taralli pugliesi'], cornflakes:['corn flakes','cereali','fiocchi di mais'], pastaragu:['ragù','ragu','pasta alla bolognese','tagliatelle al ragù'], insalatariso:['riso freddo'],
  sushi:['nigiri','maki','sashimi'], kebab:['kebap','doner'], toast:['toast','tost'], tacchino:['tacchino','fesa di tacchino'],
  maiale:['maiale','lonza','arista','braciola di maiale'], wurstel:['wurstel','würstel','frankfurter'], nuggets:['nuggets','crocchette di pollo'],
  fiocchilatte:['fiocchi di latte','cottage'], torta:['torta','torta della nonna','torta al cioccolato','plumcake'], tiramisu:['tiramisù'], nutella:['nutella','crema alla nocciola','crema di nocciole'],
  merendina:['merendine','snack','kinder'], barretta:['barrette','barretta ai cereali'], patatinebusta:['patatine','chips','patatine in busta'], cioccolatte:['cioccolato','cioccolatino'],
  nocciole:['nocciola'], pistacchi:['pistacchio'], anacardi:['anacardo'], castagne:['castagna','caldarroste'],
  calamari:['calamaro','totano','seppie'], cozze:['cozza'], vongole:['vongola'], sardine:['sardina','alici','acciughe'],
  orata:['spigola'], stracchino:['crescenza'], pancake:['pancakes'], ciambellone:['ciambella'],
  brioche:['croissant'], pescespada:['pescespada'], acqua:['acqua','acqua naturale','acqua liscia','acqua minerale'], acquafrizz:['acqua frizzante','acqua gassata','acqua con gas','acqua con le bolle'],
  acquasapore:['acqua aromatizzata','acqua e limone','acqua al limone','acqua alla menta'], te:['tè','thè','the','tè caldo','tè nero','tè verde'], tefreddo:['tè freddo','te freddo','the freddo','ice tea','estathé','tè al limone','tè alla pesca','tè pesca','tè limone'], tefreddozero:['tè freddo zero','tè freddo senza zucchero','tè freddo light'],
  tisana:['tisana','tisane','camomilla','infuso','infusi'], caffelungo:['caffè lungo','caffe lungo','caffè americano','americano'], caffeorzo:["caffè d'orzo","caffe d'orzo",'orzo','orzo solubile'], cappuccino:['cappuccino','capuccino','cappuccini'],
  caffellatte:['caffellatte','caffelatte','caffè latte','caffe latte','latte e caffè'], lattemacch:['latte macchiato','macchiato'], lattescrem:['latte scremato','latte magro'], lattecacao:['latte al cacao','latte al cioccolato','latte e cacao','latte cioccolato'],
  avenabev:["bevanda d'avena",'bevanda di avena',"latte d'avena",'latte di avena'], mandorlabev:['bevanda di mandorla','bevanda alla mandorla','latte di mandorla','latte di mandorle'], risobev:['bevanda di riso','latte di riso'], kefir:['kefir'],
  yogurtbere:['yogurt da bere','yogurt liquido','yogurt bevibile','actimel'], spremuta:['spremuta',"spremuta d'arancia",'spremuta di arancia','spremuta di arance'], ace:['succo ace','succo a c e','ace'], centrifugato:['centrifugato','centrifuga','estratto di frutta','estratto di verdura'],
  frullato:['frullato','frullato di frutta','frullati'], smoothie:['smoothie','smoothies'], milkshake:['frappè','frappe','milkshake','milk shake'], cola:['cola','coca cola','coca','pepsi'],
  colazero:['cola zero','coca zero','coca cola zero','cola light','coca light','coca cola light','diet coke'], aranciata:['aranciata','fanta'], limonata:['limonata','lemonsoda','sprite'], gassosa:['gassosa'],
  chinotto:['chinotto'], tonica:['acqua tonica','tonica','schweppes'], sportdrink:['sport drink','gatorade','powerade','bevanda isotonica','isotonica','integratore salino'],
};
// bevande: non si scalano con il piatto e valgono al massimo una porzione di frutta e verdura (centrifugati e frullati perdono parte delle fibre)
const DRINKS = new Set(['acqua','acquafrizz','acquasapore','te','tefreddo','tefreddozero','tisana','caffelungo','caffeorzo','cappuccino','caffellatte','lattemacch','lattescrem','lattecacao','avenabev','mandorlabev','risobev','kefir','yogurtbere','spremuta','ace','centrifugato','frullato','smoothie','milkshake','cola','colazero','aranciata','limonata','gassosa','chinotto','tonica','sportdrink']);
DRINKS.forEach(k => { FOOD[k].drink = true; });
// l'acqua scritta o scelta dall'elenco va nel contatore dei bicchieri, non nel diario
FOOD.acqua.water = FOOD.acquafrizz.water = true;
// ricerca senza accenti e senza maiuscole: «wurstel» trova «Würstel», «tiramisu» trova «Tiramisù»
const fold = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/* ---------- icone 3D (icons/kit-*.js): nessuna emoji a schermo ---------- */
// ripiego neutro se i kit non si sono caricati (rete assente al primo avvio)
const ICO_FALLBACK = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="32" cy="57" rx="16" ry="3.5" fill="#000" opacity=".12"/><circle cx="32" cy="32" r="24" fill="#E5E5EA"/><circle cx="32" cy="32" r="16" fill="#F7F7F9"/><ellipse cx="25" cy="22" rx="7" ry="4" fill="#fff" opacity=".6"/></svg>';
// chiave dell'icona di un cibo o di una voce: prima «icon», poi la vecchia «emoji» (voci salvate e backup), poi il piatto
// solo chiavi proprie: un backup con icon «constructor» non deve pescare dal prototipo
const own = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
const icoKey = x => {
  const K = self.PIATTINO_ICONS || {}, A = self.PIATTINO_ICON_ALIAS || {};
  if (typeof x === 'string') x = { icon:x };
  if (x && own(K, x.icon)) return x.icon;
  const e = x && typeof x.emoji === 'string' ? x.emoji : '', a = own(A, e) ? A[e] : own(A, e.replace(/\uFE0F/g, '')) ? A[e.replace(/\uFE0F/g, '')] : '';
  return own(K, a) ? a : 'piatto';
};
// ogni icona diventa un <img> con un data URI preparato una volta sola per chiave:
// l'elenco resta leggero (niente SVG con gradienti ripetuti) e gli id pk-* non si duplicano nel DOM
const ICO_IMG = new Map();
const foodIco = x => {
  const k = icoKey(x);
  let h = ICO_IMG.get(k);
  if (!h) {
    const K = self.PIATTINO_ICONS || {}, svg = own(K, k) ? K[k] : ICO_FALLBACK;
    h = `<img class="fi" alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}">`;
    if (own(K, k)) ICO_IMG.set(k, h);
  }
  return h;
};

/* A "source" is anything that can become a diary entry: values per gram */
const srcFromDb = f => ({ name:f.name, icon:f.icon, thumb:null, grams:f.portion, kg:f.kcal/100, pg:f.p/100, cg:f.c/100, fg:f.f/100, fvDb:!!f.fv, fvg:0, drink:!!f.drink, water:!!f.water });
const srcFromSaved = f => { const g = Math.max(1, f.grams||100); return { name:f.name, icon:icoKey(f), thumb:f.thumb||null, grams:g, kg:f.kcal/g, pg:f.p/g, cg:f.c/g, fg:f.f/g, fvDb:false, fvg:(f.fv||0)/g }; };
const entryFrom = (s, grams) => ({
  id: rid(), name: s.name, icon: s.icon, thumb: s.thumb || null, grams: Math.round(grams),
  kcal: Math.round(s.kg*grams), p: Math.round(s.pg*grams*10)/10, c: Math.round(s.cg*grams*10)/10, f: Math.round(s.fg*grams*10)/10,
  fv: s.fvDb ? (s.drink ? 1 : fvFor(true, grams)) : Math.round(s.fvg*grams*2)/2,
});

/* ---------- meals, plan templates, copy ---------- */
const MEALS = [
  { k:'colazione', l:'Colazione', icon:'sunrise', color:'var(--system-orange)' },
  { k:'pranzo', l:'Pranzo', icon:'sun', color:'var(--system-mint)' },
  { k:'cena', l:'Cena', icon:'moon', color:'var(--system-indigo)' },
  { k:'spuntini', l:'Spuntini', icon:'leaf', color:'var(--system-purple)' },
];
const mealByK = k => MEALS.find(m => m.k === k) || MEALS[0];
const autoMeal = () => { const h = new Date().getHours() + new Date().getMinutes()/60; return h < 10.5 ? 'colazione' : h < 15 ? 'pranzo' : h < 18.5 ? 'spuntini' : 'cena'; };

const SLOTS = [
  { s:'colazione', l:'Colazione', meal:'colazione', share:.22 },
  { s:'spuntino', l:'Spuntino', meal:'spuntini', share:.08 },
  { s:'pranzo', l:'Pranzo', meal:'pranzo', share:.33 },
  { s:'merenda', l:'Merenda', meal:'spuntini', share:.10 },
  { s:'cena', l:'Cena', meal:'cena', share:.27 },
];
const PLAN = {
  colazione: [[['latte',200],['avena',40],['banana',100]], [['greco',150],['muesli',30],['bosco',80],['miele',10]], [['latte',200],['paneint',50],['marmellata',20],['kiwi',100]]],
  spuntino: [[['mela',150],['mandorle',15]], [['yogurt',125],['fragole',100]], [['crackers',25],['parmigiano',15]]],
  pranzo: [[['pastaint',80],['passata',100],['parmigiano',10],['insalata',100],['olio',10]], [['riso',70],['pollo',120],['zucchine',150],['olio',10]], [['pasta',60],['ceci',150],['carote',100],['olio',10]]],
  merenda: [[['arancia',150],['noci',15]], [['paneint',40],['fondente',10]], [['yogurt',125],['pesca',150]]],
  cena: [[['salmone',130],['patate',200],['spinaci',150],['olio',10]], [['uova',120],['paneint',50],['insalata',150],['olio',10]], [['minestrone',300],['mozzarella',60],['pane',40]], [['lenticchie',150],['riso',50],['broccoli',150],['olio',10]]],
};

const PLAN_MUSCLE = {
  colazione: [[['latte',250],['avena',50],['banana',100],['arachidi',15]], [['greco',200],['muesli',40],['bosco',80],['miele',10]], [['uova',120],['paneint',60],['kiwi',100],['latte',200]]],
  spuntino: [[['greco',170],['bosco',80],['noci',15]], [['bresaola',50],['paneint',40]], [['ricotta',120],['miele',10],['fette',20]]],
  merenda: [[['latte',250],['banana',120]], [['tonno',80],['crackers',30]], [['greco',170],['mela',150],['mandorle',15]]],
};
const QUOTES = {
  kid: ['Ogni frutto è un superpotere colorato!','Il tuo corpo cresce forte con i cibi giusti.','Assaggiare una verdura nuova è da veri esploratori.','L\'acqua è il carburante dei campioni.','Una buona colazione accende tutta la giornata.','Mangia l\'arcobaleno: più colori nel piatto, più energia!','Ascoltare la tua pancia è una cosa da grandi.','Anche i supereroi fanno merenda con la frutta.'],
  teen: ['Il cibo è energia per sport, studio e amici.','Nessun cibo è perfetto: conta l\'equilibrio.','La costanza batte la perfezione, ogni giorno.','Il tuo corpo sta costruendo il tuo futuro: dagli buoni mattoni.','Un pasto non decide la giornata. La scelta dopo sì.','Idratato e nutrito: così rendi al massimo.','Sei tu che scegli, e oggi stai scegliendo bene.'],
  adult: ['I piccoli passi di ogni giorno fanno i grandi risultati.','Non serve la perfezione, serve la costanza.','Oggi è un buon giorno per prenderti cura di te.','Ogni pasto è una nuova occasione.','La salute è l\'investimento che rende di più.','Progresso, non perfezione.','Hai già fatto la parte difficile: hai cominciato.','Il tuo futuro ti ringrazierà per la scelta di oggi.'],
  senior: ['Mangiare con gusto è il primo passo del benessere.','Idratazione e proteine: i tuoi alleati di ogni giorno.','Il sapore dei cibi semplici è una ricchezza.','Un po\' di movimento e un buon piatto: la ricetta perfetta.','Ogni giorno è l\'occasione giusta per stare bene.','Le buone abitudini non hanno età.'],
};
const CHEERS = ['Registrato! Ottimo lavoro.','Fatto! Un passo in più.','Aggiunto. Continua così!','Perfetto, il diario è aggiornato.','La costanza paga!'];
const RULES = {
  kid: ['Fai sempre colazione: è il pieno di energia per la scuola.','Cinque porzioni al giorno tra frutta e verdura, di tanti colori.','Bevi acqua invece delle bibite zuccherate.','Mangia seduto a tavola, con calma e senza schermi.','Muoviti e gioca all\'aperto ogni giorno.'],
  teen: ['Tre pasti e due spuntini tengono stabile l\'energia.','Proteine a ogni pasto aiutano muscoli e concentrazione.','Porta una borraccia: l\'acqua aiuta studio e sport.','Nessun cibo è vietato: conta l\'equilibrio della settimana.','Dormi bene: il sonno regola anche la fame.'],
  adult: ['Riempi metà del piatto con verdure.','Scegli cereali integrali quando puoi.','Legumi almeno tre volte a settimana.','Olio extravergine a crudo, con misura.','Pesce due o tre volte a settimana.'],
  senior: ['Proteine a ogni pasto per mantenere i muscoli.','Bevi anche senza sete: 6-8 bicchieri al giorno.','Latticini e verdure verdi per ossa forti.','Pasti regolari e porzioni moderate.','Una passeggiata dopo pranzo aiuta la digestione.'],
};

const RULES_MUSCLE = {
  kid: ['Gioca e fai sport ogni giorno: corsa, nuoto, calcio, arrampicata.','Esercizi a corpo libero: piegamenti, squat, plank e salti.','Proteine a ogni pasto: latte, yogurt, uova, legumi, pesce o carne.','Dormi 9-11 ore: mentre dormi il corpo cresce.','Niente pesi pesanti e niente integratori: basta il cibo vero.'],
  teen: ['Proteine a ogni pasto: carne, pesce, uova, legumi o latticini.','Dopo l\'allenamento: uno spuntino con latte, yogurt o un panino al prosciutto.','Allenati con un istruttore e aumenta i carichi un po\' alla volta.','Dormi almeno 8 ore: i muscoli crescono mentre riposi.','Niente integratori senza il parere del medico: basta il cibo vero.'],
  adult: ['20-40 g di proteine a ogni pasto, distribuite nella giornata.','Uno spuntino proteico entro 2 ore dall\'allenamento aiuta il recupero.','Carboidrati integrali prima dell\'allenamento per avere energia.','Allenamento di forza 3-4 volte a settimana, con carichi progressivi.','Dormi 7-9 ore: il recupero fa parte dell\'allenamento.'],
};
const QUOTES_MUSCLE = ['I muscoli si costruiscono in palestra e si finiscono in cucina.','Ogni ripetizione conta, e anche ogni pasto.','Forza è costanza: oggi un mattone in più.','Il recupero fa parte dell\'allenamento.','Più forte di ieri, un giorno alla volta.'];

/* ---------- obiettivi: il calcolo sta in targets.js, numeri e soglie in config.js ---------- */

/* ---------- storage: on this device ---------- */
const LKEY = 'piattino-v1';
const Store = {
  // i dati salvati da una versione precedente vengono portati al formato di oggi (migrate.js), senza perdere niente
  load(){
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(LKEY) || 'null'); } catch (e) {}
    const st = migrate(raw);
    st.migrated = !!raw && +raw.v !== CONFIG.schema;
    return st;
  },
  saveNow(){
    clearTimeout(this._t);
    try { localStorage.setItem(LKEY, JSON.stringify({ v:CONFIG.schema, profile:S.profile, days:S.days, foods:S.foods, weights:S.weights, chat:S.chat.slice(-40), meta:S.meta })); return true; }
    catch (e) { toast('Memoria piena: esporta un backup e rimuovi qualche cibo memorizzato.', true); return false; }
  },
  put(){ clearTimeout(this._t); this._t = setTimeout(() => this.saveNow(), 150); },
  del(){ this.put(); },
};
window.addEventListener('pagehide', () => Store.saveNow());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') { Store.saveNow(); stopCamera(); }
  else if ($('#scanner').classList.contains('show') && SC.state === 'camera') startCamera();
});
const isStandalone = () => !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches));

/* ---------- angoli dello schermo ---------- */
// Il sito non può leggere il raggio degli angoli del display: lo si ricava dal modello di iPhone, riconosciuto dalla misura
// dello schermo in punti (lato corto x lato lungo) e, dove serve, dalla densità. Valori di _displayCornerRadius (iOS).
const SCREEN_RADIUS = {
  '375x812':41,      // X, XS, 11 Pro (39) e 12 mini, 13 mini (44): stessa misura, si prende la via di mezzo
  '414x896@2':41.5,  // XR, 11
  '414x896@3':39,    // XS Max, 11 Pro Max
  '390x844':47.33,   // 12, 12 Pro, 13, 13 Pro, 14, 16e
  '428x926':53.33,   // 12 Pro Max, 13 Pro Max, 14 Plus
  '393x852':55,      // 14 Pro, 15, 15 Pro, 16
  '430x932':55,      // 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  '402x874':62,      // 16 Pro, 17, 17 Pro
  '420x912':62,      // Air
  '440x956':62,      // 16 Pro Max, 17 Pro Max
};
// Vale solo nell'app installata, dove la pagina arriva fino agli angoli; nel browser in fondo c'è la barra di Safari.
// Gli iPhone con tasto Home (schermo 16:9, angoli dritti) restano a 0. Un modello nuovo non ancora in tabella
// prende il raggio dei modelli più recenti della sua larghezza.
function screenRadius(){
  if (!/iPhone|iPod/.test(navigator.userAgent) || !isStandalone()) return 0;
  const w = Math.min(screen.width, screen.height), h = Math.max(screen.width, screen.height);
  if (!w || h / w < 2) return 0;
  const k = `${w}x${h}`, dpr = Math.round(window.devicePixelRatio || 1);
  return SCREEN_RADIUS[`${k}@${dpr}`] || SCREEN_RADIUS[k] || (w >= 400 ? 62 : 47.33);
}
(() => {
  const r = screenRadius(), root = document.documentElement;
  root.style.setProperty('--screen-r', r + 'px');
  root.classList.toggle('screen-r', r > 0);
})();

/* ---------- state ---------- */
const S = { profile:null, days:{}, foods:[], weights:[], chat:[], meta:{ riskSeen:{}, askedBody:false }, view:'today', date:todayKey(), planShift:0, quoteIdx:-1, ringPrev:{} };
const blankDay = () => ({ meals:{ colazione:[], pranzo:[], cena:[], spuntini:[] }, water:0 });
const getDay = k => S.days[k] || blankDay();
const ensureDay = k => (S.days[k] = S.days[k] || blankDay());
const saveDay = k => Store.put('day-' + k, S.days[k]);
const saveProfile = () => Store.put('profile', { profile:S.profile });
const T = () => targets(S.profile);
function totals(day){
  const t = { kcal:0, p:0, c:0, f:0, fv:0, n:0 };
  MEALS.forEach(m => (day.meals[m.k] || []).forEach(e => { t.kcal += +e.kcal||0; t.p += +e.p||0; t.c += +e.c||0; t.f += +e.f||0; t.fv += +e.fv||0; t.n++; }));
  return t;
}
function pickQuote(){
  const base = QUOTES[S.profile ? tierOf(ageOf(S.profile)) : 'adult'];
  const list = S.profile && S.profile.goal === 'muscle' ? [...base, ...QUOTES_MUSCLE] : base;
  let i; do { i = Math.floor(Math.random() * list.length); } while (list.length > 1 && i === S.quoteIdx);
  S.quoteIdx = i; return list[i];
}
function saveFoodMemo(item){
  const existing = S.foods.find(f => f.name.toLowerCase() === item.name.toLowerCase());
  const food = { id: existing ? existing.id : rid(), name:item.name, icon:icoKey(item), grams:item.grams, kcal:item.kcal, p:item.p, c:item.c, f:item.f, fv:item.fv||0, thumb:item.thumb||null, saved:Date.now() };
  S.foods = [food, ...S.foods.filter(f => f.id !== food.id)];
  Store.put('food-' + food.id, food);
}

/* ---------- toast ---------- */
let toastT;
function toast(msg, warn){
  const el = $('#toast');
  el.innerHTML = `<span class="ic" style="background:${warn ? 'var(--system-orange)' : 'var(--system-green)'}">${warn ? '!' : I.check}</span><span>${esc(msg)}</span>`;
  el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------- movimento ---------- */
const reduceMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const words = (s, from = 0) => esc(s).split(' ').map((w, i) => `<span class="w" style="--i:${i + from}">${w}</span>`).join(' ');
// barre e liquidi ripartono dal valore di prima e arrivano al nuovo con una molla (data-fill = chiave, data-p = 0…1)
const fillPrev = {};
function fillsFrom(root){
  const els = [...root.querySelectorAll('[data-fill]')]; if (!els.length) return;
  els.forEach(el => { const k = el.dataset.fill; el.style.setProperty('--p', reduceMotion() ? el.dataset.p : (fillPrev[k] ?? 0)); fillPrev[k] = +el.dataset.p; });
  requestAnimationFrame(() => requestAnimationFrame(() => els.forEach(el => el.style.setProperty('--p', el.dataset.p))));
}
// i numeri contano fino al nuovo valore, seguendo una molla smorzata (data-num = chiave, data-v = valore, data-f = formato)
const numPrev = {};
const numFmt = (v, f) => f === '1' ? fmt1(v) : f === 'L' ? v.toLocaleString('it-IT', { maximumFractionDigits:2 }) : fmt(v);
function countUp(root){
  root.querySelectorAll('[data-num]').forEach(el => {
    const k = el.dataset.num, to = +el.dataset.v, f = el.dataset.f, from = numPrev[k] ?? 0; numPrev[k] = to;
    if (from === to || reduceMotion()) { el.textContent = numFmt(to, f); return; }
    const w = 2 * Math.PI / .5, t0 = performance.now();
    el.textContent = numFmt(from, f);
    const step = now => {
      const t = (now - t0) / 1000, x = 1 - (1 + w * t) * Math.exp(-w * t);
      el.textContent = numFmt(from + (to - from) * x, f);
      if (t < .9 && el.isConnected) requestAnimationFrame(step); else el.textContent = numFmt(to, f);
    };
    requestAnimationFrame(step);
  });
}
// cambio di sezione (cls 'enter') o di giorno ('from-left' / 'from-right')
function enterView(cls = 'enter'){
  if (reduceMotion()) return;
  [...app.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 8)));
  app.classList.remove('enter', 'from-left', 'from-right'); void app.offsetWidth; app.classList.add(cls);
  clearTimeout(enterView.t); enterView.t = setTimeout(() => app.classList.remove(cls), 1000);
}
function swapText(el, text){
  if (!el) return; el.textContent = text;
  if (reduceMotion()) return;
  el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap');
}

/* ---------- rendering ---------- */
const app = $('#app');
function render(){
  if (!S.profile) { $('#tabbar').hidden = true; $('#coachFab').hidden = true; renderWelcome(); return; }
  $('#tabbar').hidden = false; $('#coachFab').hidden = false; renderTabbar();
  if (S.view === 'today') renderToday();
  else if (S.view === 'plan') renderPlan();
  else if (S.view === 'diary') renderDiary();
  else renderProfile();
}
function renderTabbar(){
  const bar = $('#tabbar');
  if (!bar.querySelector('.tabs')) {
    const t = (v, ic, l) => `<button class="tab" role="tab" aria-selected="false" data-a="tab" data-v="${v}">${I[ic]}<span>${l}</span></button>`;
    bar.innerHTML = `<div class="tabbar-in"><div class="tabs ios-glass no-anim" role="tablist" aria-label="Sezioni"><span class="tab-ind" aria-hidden="true"></span>${t('today','rings','Oggi')}${t('plan','plan','Piano')}${t('diary','chart','Diario')}${t('profile','person','Profilo')}</div></div>`;
  }
  bar.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.v === S.view));
  moveTabInd();
}
function moveTabInd(){
  const tabs = $('#tabbar .tabs'); if (!tabs) return;
  const on = tabs.querySelector('[aria-selected=true]'), ind = tabs.querySelector('.tab-ind');
  if (!on) return;
  // 4 tab uguali: la posizione dipende solo dall'indice (calcolata in CSS), senza misure che possano sbagliare
  const i = [...tabs.querySelectorAll('.tab')].indexOf(on);
  if (ind._i != null && ind._i !== i && !tabs.classList.contains('no-anim') && !reduceMotion()) { ind.classList.remove('moving'); ind.classList.toggle('back', i < ind._i); void ind.offsetWidth; ind.classList.add('moving'); }
  ind._i = i; tabs.style.setProperty('--i', i);
  requestAnimationFrame(() => tabs.classList.remove('no-anim'));
}
window.addEventListener('resize', () => { const t = $('#tabbar .tabs'); if (t) { t.classList.add('no-anim'); moveTabInd(); } });
function header(eyebrow, title){
  const initial = esc((S.profile.name || '?').trim().charAt(0).toUpperCase() || '?');
  return `<header class="nav"><div><div class="eyebrow">${esc(eyebrow)}</div><h1 class="large-title">${esc(title)}</h1></div><button class="avatar" data-a="tab" data-v="profile" aria-label="Profilo">${initial}</button></header>`;
}
function ringsSvg(vals){
  const w = 15, gap = 3;
  return `<svg viewBox="0 0 150 150" class="rings" aria-hidden="true">` + vals.map((v, i) => {
    const r = 75 - w/2 - 1 - i*(w + gap), C = 2*Math.PI*r, off = C*(1 - clamp(v.pct, 0, 1));
    const prev = S.ringPrev[i] ?? C; S.ringPrev[i] = off;
    return `<circle cx="75" cy="75" r="${r}" fill="none" style="stroke:${v.color}" stroke-opacity=".22" stroke-width="${w}"/><circle class="ring-arc" cx="75" cy="75" r="${r}" fill="none" style="stroke:${v.color};stroke-dashoffset:${prev.toFixed(2)}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${C.toFixed(2)}" data-off="${off.toFixed(2)}" transform="rotate(-90 75 75)"/>`;
  }).join('') + `</svg>`;
}
function animateRings(){ requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll('.ring-arc').forEach(c => c.style.strokeDashoffset = c.dataset.off))); }
const thumbHtml = e => e.thumb ? `<span class="thumb"><img src="${esc(e.thumb)}" alt=""></span>` : `<span class="thumb ico">${foodIco(e)}</span>`;

/* ---------- avvisi: profilo da completare, obiettivo da rivedere, inviti a parlarne con qualcuno ---------- */
const GOAL_NAME = { lose:'Dimagrire', maintain:'Mantenere', gain:'Aumentare di peso', muscle:'Fare muscoli', healthy:'Mangiare sano', sport:'Energia per lo sport' };
// all: anche i segnali a cui si è già risposto «Ho capito» (servono al coach, che con un segnale presente non abbassa le calorie)
const riskNow = all => S.profile ? riskSignals({ profile:S.profile, days:S.days, weights:S.weights, seen: all ? {} : S.meta.riskSeen }) : [];
const noticeCard = (title, text, btns) => `<section class="card pad notice" aria-label="${esc(title)}"><div class="meal-name">${esc(title)}</div><p>${text}</p><div class="notice-acts">${btns.map(([l, a, k, main]) => `<button class="chip-btn${main ? ' accent' : ''}" data-a="${a}"${k ? ` data-k="${k}"` : ''}>${l}</button>`).join('')}</div></section>`;
function reviewCard(){
  const p = S.profile, r = goalReview(p); if (!r) return '';
  if (r.kind === 'reached') return noticeCard('Obiettivo raggiunto', `Sei a ${fmt1(p.weight)} kg: hai raggiunto il peso che avevi scelto. Per ora il piano è di mantenimento. Vuoi passare a «Mantenere» o scegliere un nuovo obiettivo?`,
    [['Passa a Mantenere', 'review-maintain', '', 1], ['Nuovo obiettivo', 'review-open'], ['Più tardi', 'review-keep', 'reached']]);
  if (r.kind === 'low') return noticeCard('Rivediamo l\'obiettivo', 'Con il tuo peso di oggi dimagrire non è consigliato, quindi il piano è di mantenimento. Vuoi cambiare obiettivo? Se hai dubbi, parlane con il medico o con un dietista.',
    [['Passa a Mantenere', 'review-maintain', '', 1], ['Più tardi', 'review-keep', 'low']]);
  return noticeCard('Il tuo peso è cambiato', `Da quando hai scelto l'obiettivo «${esc(GOAL_NAME[p.goal] || 'Mangiare sano')}» il tuo peso è ${r.delta > 0 ? 'salito' : 'sceso'} di ${fmt1(Math.abs(r.delta))} kg. Calorie, proteine e acqua sono già ricalcolate sul peso di oggi; l'obiettivo invece resta quello che hai scelto tu. Vuoi rivederlo?`,
    [['Rivedi l\'obiettivo', 'review-open', '', 1], ['Va bene così', 'review-keep', 'changed']]);
}
const RISK_TEXT = {
  lowIntake: m => `Negli ultimi giorni il diario segna molto meno di quello che serve al corpo per stare bene. Se è solo il diario incompleto, nessun problema. Se invece stai mangiando così poco, ${m ? 'parlane con un genitore o con il pediatra' : 'parlarne con il medico o con un dietista ti aiuta a farlo in sicurezza'}.`,
  fastLoss: m => `Nelle ultime settimane il peso è sceso più in fretta di quanto è prudente. Può capitare, ma vale la pena ${m ? 'parlarne con un genitore o con il pediatra' : 'parlarne con il medico o con un dietista: un ritmo più tranquillo protegge muscoli ed energia'}.`,
  manyLogs: m => `In questi giorni stai registrando peso e pasti molto spesso. I numeri servono a te, non il contrario: per il peso basta una volta a settimana. Se pensare al cibo o al peso ti pesa, ${m ? 'parlane con un genitore o con il pediatra' : 'parlarne con il medico o con un dietista può fare bene'}.`,
};
function riskCard(){
  const k = riskNow()[0]; if (!k) return '';
  return noticeCard('Come stai?', RISK_TEXT[k](ageOf(S.profile) < 18), [['Ho capito', 'risk-ok', k]]);
}
function bodyCard(){
  const g = T(); if (!g.generic) return '';
  const what = g.missing.map(k => ({ weight:'il peso', height:'l\'altezza', birth:'la data di nascita' }[k])).join(' e ');
  return noticeCard('Completa il profilo', `${g.missing.length > 1 ? 'Mancano' : 'Manca'} ${what}: per ora gli obiettivi sono valori di riferimento generici. Con i tuoi dati li calcolo su misura. Puoi farlo anche dopo.`, [['Completa il profilo', 'edit-profile', '', 1]]);
}
// un avviso alla volta, dal più importante: prima i dati che mancano, poi come stai, poi l'obiettivo
const notices = () => bodyCard() || riskCard() || reviewCard();
function renderToday(){
  const k = S.date, day = getDay(k), t = totals(day), g = T(), isToday = k === todayKey();
  const young = g.tier === 'kid';
  const q = S.currentQuote || (S.currentQuote = pickQuote());
  const name = (S.profile.name || '').trim();
  app.innerHTML = `
  ${header(isToday ? longDate(k) : 'Diario', isToday ? (name ? 'Ciao, ' + name : 'Oggi') : 'Giorno passato')}
  <div class="datebar">
    <button class="chip-btn" data-a="day" data-d="-1" aria-label="Giorno precedente">${I.left}</button>
    <span class="label">${isToday ? 'Oggi' : esc(longDate(k))}</span>
    ${isToday ? '' : '<button class="chip-btn accent" data-a="day" data-d="0">Oggi</button>'}
    <button class="chip-btn" data-a="day" data-d="1" aria-label="Giorno successivo" ${isToday ? 'disabled' : ''}>${I.right}</button>
  </div>
  <button class="btn primary add-meal" data-a="add-open">${I.plus} Aggiungi pasto</button>
  ${isToday ? notices() : ''}
  <section class="rings-card" aria-label="Riepilogo della giornata">
    ${ringsSvg([{pct:t.kcal/g.kcal,color:'var(--system-red)'},{pct:t.p/g.protein,color:'var(--system-blue)'},{pct:t.fv/g.fv,color:'var(--system-green)'}])}
    <div class="legend">
      <div><div class="k"><i class="key" style="background:var(--system-red)"></i>${young ? 'Energia' : 'Calorie'}</div><div class="v num"><span data-num="kcal" data-v="${Math.round(t.kcal)}">${fmt(t.kcal)}</span><small>/${fmt(g.kcal)} kcal</small></div></div>
      <div><div class="k"><i class="key" style="background:var(--system-blue)"></i>Proteine</div><div class="v num"><span data-num="prot" data-v="${Math.round(t.p)}">${fmt(t.p)}</span><small>/${fmt(g.protein)} g</small></div></div>
      <div><div class="k"><i class="key" style="background:var(--system-green)"></i>Frutta e verdura</div><div class="v num"><span data-num="fv" data-v="${Math.round(t.fv * 10) / 10}" data-f="1">${fmt1(t.fv)}</span><small>/5 porzioni</small></div></div>
    </div>
    <div class="macro-bars">
      <div class="mbar"><div class="t"><span>Carboidrati</span><b class="num">${fmt(t.c)} / ${fmt(g.carbs)} g</b></div><div class="track" role="progressbar" aria-label="Carboidrati" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(clamp(t.c/g.carbs*100,0,100))}"><i data-fill="carbs" data-p="${clamp(t.c/g.carbs,0,1)}" style="background:var(--system-yellow)"></i></div></div>
      <div class="mbar"><div class="t"><span>Grassi</span><b class="num">${fmt(t.f)} / ${fmt(g.fat)} g</b></div><div class="track" role="progressbar" aria-label="Grassi" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(clamp(t.f/g.fat*100,0,100))}"><i data-fill="fat" data-p="${clamp(t.f/g.fat,0,1)}" style="background:var(--system-brown)"></i></div></div>
    </div>
  </section>
  <div class="quote" data-a="quote" role="button" tabindex="0"><span class="spark">${I.spark}</span><div><div class="q" aria-live="polite">${esc(q)}</div><div class="h">Tocca per un'altra frase</div></div></div>
  <h2 class="section-title">Acqua</h2>
  <div id="waterBox">${waterCard(day, g)}</div>
  <h2 class="section-title">Pasti <small class="num">${t.n} ${t.n === 1 ? 'alimento' : 'alimenti'}</small></h2>
  <div class="stack">${MEALS.map(m => mealCard(m, day)).join('')}</div>
  <p class="foot">Tocca «Aggiungi pasto» per fotografare un piatto, che riconosco da solo, o per cercarlo nell'elenco.</p>`;
  animateRings(); fillsFrom(app); countUp(app);
}
const litri = n => (n * .25).toLocaleString('it-IT', { maximumFractionDigits: 2 });
function waterCard(day, g){
  const n = day.water || 0, pct = clamp(n / g.water, 0, 1), done = n >= g.water;
  return `<div class="card water-card ${done ? 'done' : ''}">
    <button class="bottle" data-a="water-add" data-n="1" aria-label="Aggiungi un bicchiere d'acqua">
      <span class="cap"></span><span class="glassb"><span class="liquid" data-fill="water" data-p="${Math.max(pct, n ? .08 : 0)}"></span>${[.25, .5, .75].map(t => `<i class="tick" style="bottom:${t * 100}%"></i>`).join('')}</span>
    </button>
    <div class="water-info">
      <div class="water-l num"><b><span data-num="water" data-v="${n * .25}" data-f="L">${litri(n)}</span> L</b><span> di ${litri(g.water)} L</span></div>
      <div class="small muted num">${done ? 'Obiettivo raggiunto, ottimo lavoro!' : `${n} ${n === 1 ? 'bicchiere' : 'bicchieri'} · ne mancano ${g.water - n}`}</div>
    </div>
    <div class="water-btns">
      <button data-a="water-add" data-n="1"><b>+ Bicchiere</b><span>250 ml</span></button>
      <button data-a="water-add" data-n="2"><b>+ Bottiglia</b><span>500 ml</span></button>
      <button class="undo" data-a="water-add" data-n="-1" aria-label="Togli un bicchiere" ${n ? '' : 'disabled'}>−</button>
    </div>
  </div>`;
}
function mealCard(m, day){
  const list = day.meals[m.k] || [];
  const kc = list.reduce((a, e) => a + (+e.kcal || 0), 0);
  return `<div class="card meal">
    <div class="meal-head"><span class="meal-ico" style="background:${m.color}">${I[m.icon]}</span><div class="grow"><div class="meal-name">${m.l}</div><div class="meal-kcal num">${list.length ? fmt(kc) + ' kcal' : 'Niente ancora'}</div></div>
    <button class="add-btn" data-a="add-open" data-m="${m.k}" aria-label="Aggiungi a ${m.l}">${I.plusc}</button></div>
    ${list.map(e => `<button class="entry" data-a="entry" data-m="${m.k}" data-id="${esc(e.id)}">${thumbHtml(e)}<div class="grow"><div class="n">${esc(e.name)}</div><div class="g num">${fmt(e.grams)} g · P ${fmt(e.p)} · C ${fmt(e.c)} · G ${fmt(e.f)}</div></div><span class="k">${fmt(e.kcal)} kcal</span></button>`).join('')}
  </div>`;
}

/* ---- plan ---- */
function buildPlan(k){
  const g = T(); const base = Math.floor(parseKey(k).getTime() / 864e5) + S.planShift;
  return SLOTS.map((sl, si) => {
    const opts = (S.profile.goal === 'muscle' && PLAN_MUSCLE[sl.s]) || PLAN[sl.s]; const opt = opts[((base + si) % opts.length + opts.length) % opts.length];
    const rawK = opt.reduce((a, [key, gr]) => a + FOOD[key].kcal * gr / 100, 0);
    const factor = clamp(g.kcal * sl.share / rawK, .6, 2.2);
    const items = opt.map(([key, gr]) => entryFrom(srcFromDb(FOOD[key]), Math.max(5, Math.round(gr * factor / 5) * 5)));
    return { label: sl.l, meal: sl.meal, items };
  });
}
function goalCard(){
  const p = S.profile, minor = ageOf(p) < 18, t = p.target;
  if (minor) return `<button class="card pad goal-card" data-a="goal" style="margin-top:14px"><div class="grow"><div class="meal-name">Come cresci</div><div class="small muted">Segna il tuo peso e guarda il tuo andamento</div></div>${I.right.replace('<svg', '<svg class="chev"')}</button>`;
  if (!t) return `<button class="card pad goal-card" data-a="goal" style="margin-top:14px"><div class="grow"><div class="meal-name">Obiettivo di peso</div><div class="small muted">Scegli quanti chili vuoi perdere o mettere su</div></div><span class="chip-btn accent">Imposta</span></button>`;
  const left = Math.round((t.kg - p.weight) * 10) / 10;
  const prog = validKg(+t.startKg) && Math.abs(t.kg - t.startKg) > .2 ? clamp((t.startKg - p.weight) / (t.startKg - t.kg), 0, 1) : 1;
  return `<button class="card pad goal-card" data-a="goal" style="margin-top:14px"><div class="grow"><div class="row" style="justify-content:space-between"><span class="meal-name">Obiettivo ${fmt1(t.kg)} kg</span><b class="pct num">${Math.round(prog * 100)}%</b></div>
    <div class="track light"><i data-fill="goal" data-p="${prog}"></i></div><div class="small muted num" style="margin-top:6px">${Math.abs(left) <= .2 ? 'Obiettivo raggiunto!' : `Ora ${fmt1(p.weight)} kg · ${left < 0 ? 'mancano ' + fmt1(-left) + ' kg da perdere' : 'mancano ' + fmt1(left) + ' kg da mettere su'}`}</div></div></button>`;
}
function renderPlan(){
  const g = T(), day = getDay(S.date), minor = ageOf(S.profile) < 18;
  const custom = day.plan && Array.isArray(day.plan.meals) ? day.plan : null;
  const meals = custom ? custom.meals : buildPlan(S.date);
  const goalTxt = { lose:'Dimagrire con gradualità', maintain:'Mantenere il peso', gain:'Aumentare di peso', muscle:'Fare muscoli', healthy:'Mangiare sano', sport:'Energia per lo sport' }[S.profile.goal] || 'Mangiare sano';
  app.innerHTML = `
  ${header(S.date === todayKey() ? 'Menu di oggi' : longDate(S.date), 'Piano')}
  ${goalCard()}
  <section class="card pad" style="margin-top:12px">
    <div class="row" style="justify-content:space-between;margin-bottom:12px"><div><div class="meal-name">${esc(goalTxt)}</div><div class="small muted">Obiettivo giornaliero calcolato sul tuo profilo</div></div></div>
    <div class="target-grid num"><div><b>${fmt(g.kcal)}</b><span>kcal</span></div><div><b>${g.protein}</b><span>Proteine g</span></div><div><b>${g.carbs}</b><span>Carboidr. g</span></div><div><b>${g.fat}</b><span>Grassi g</span></div></div>
    ${g.note ? `<p class="note" style="margin:12px 0 0">${esc(g.note)}</p>` : ''}
    ${minor ? `<p class="note" style="margin:10px 0 0">Prepara questi pasti insieme a un genitore. Per dubbi su crescita e alimentazione, chiedi al pediatra.</p>` : ''}
  </section>
  <h2 class="section-title">${custom ? 'Menu personalizzato' : 'Menu mediterraneo'} <small class="num">${fmt(meals.reduce((a, m) => a + m.items.reduce((b, e) => b + (+e.kcal||0), 0), 0))} kcal</small></h2>
  <div class="stack">${meals.map((m, i) => { const mm = mealByK(m.meal); const kc = m.items.reduce((a, e) => a + (+e.kcal||0), 0); return `
    <div class="card pad">
      <div class="row"><span class="meal-ico" style="background:${mm.color}">${I[mm.icon]}</span><div class="grow"><div class="meal-name">${esc(m.label)}</div><div class="meal-kcal num">${fmt(kc)} kcal</div></div>
      <button class="chip-btn accent" data-a="plan-add" data-i="${i}">Aggiungi</button></div>
      <div style="margin-top:8px">${m.items.map(e => `<div class="plan-item"><span class="e">${foodIco(e)}</span><span class="grow">${esc(e.name)} <span class="muted num">${fmt(e.grams)} g</span></span><span class="k">${fmt(e.kcal)} kcal</span></div>`).join('')}</div>
    </div>`; }).join('')}</div>
  <div class="stack" style="margin-top:14px">
    ${custom ? `<button class="btn tinted" data-a="plan-reset">Torna al menu mediterraneo</button>` : `<button class="btn tinted" data-a="plan-shuffle">Cambia menu</button>`}
  </div>
  <h2 class="section-title">Regole d'oro</h2>
  <ul class="card rules">${(S.profile.goal === 'muscle' ? RULES_MUSCLE[g.tier === 'kid' ? 'kid' : g.tier === 'teen' ? 'teen' : 'adult'] : RULES[g.tier]).map(r => `<li><span class="dot">${I.check}</span><span>${esc(r)}</span></li>`).join('')}</ul>
  <p class="foot">Valori nutrizionali indicativi. Piattino non sostituisce il parere di un medico o di un dietista.</p>`;
  fillsFrom(app);
}

/* ---- diary ---- */
function journeyCard(){
  const p = S.profile, minor = ageOf(p) < 18;
  return `<div class="card pad">${S.weights.length > 1 ? weightChart(!minor && p.target ? p.target.kg : null) : ''}<p class="journey">${esc(journeyText({ weights:S.weights, goal:p.goal, minor }))}</p><button class="btn tinted" data-a="weight" style="margin-top:12px">Aggiorna il peso</button></div>`;
}
function renderDiary(){
  const g = T(), today = todayKey();
  const week = Array.from({length:7}, (_, i) => addDays(today, i - 6)).map(k => ({ k, t: totals(getDay(k)) }));
  const logged = week.filter(d => d.t.n);
  const avg = logged.length ? logged.reduce((a, d) => a + d.t.kcal, 0) / logged.length : 0;
  const avgFv = logged.length ? logged.reduce((a, d) => a + d.t.fv, 0) / logged.length : 0;
  const W = 340, H = 170, top = 16, bottom = 26, left = 6, right = 6;
  const maxV = Math.max(g.kcal * 1.25, ...week.map(d => d.t.kcal));
  const y = v => top + (H - top - bottom) * (1 - v / maxV);
  const bw = (W - left - right) / 7;
  const bars = week.map((d, i) => {
    const x = left + i * bw + bw * .22, w = bw * .56, yy = y(d.t.kcal), h = Math.max(0, H - bottom - yy);
    return `<rect x="${x.toFixed(1)}" y="${(d.t.kcal ? yy : H - bottom - 3).toFixed(1)}" width="${w.toFixed(1)}" height="${(d.t.kcal ? h : 3).toFixed(1)}" rx="${Math.min(6, w/2).toFixed(1)}" style="fill:${d.t.kcal ? 'var(--system-red)' : 'var(--system-gray-5)'}" ${d.k === today ? '' : 'fill-opacity=".75"'}/>` +
      `<text x="${(left + i*bw + bw/2).toFixed(1)}" y="${H - 8}" text-anchor="middle" ${d.k === today ? 'style="fill:var(--label);font-weight:600"' : ''}>${esc(shortDay(d.k))}</text>`;
  }).join('');
  const ty = y(g.kcal);
  const chart = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Calorie degli ultimi sette giorni rispetto all'obiettivo di ${fmt(g.kcal)} kcal">
    <line x1="${left}" x2="${W-right}" y1="${H-bottom}" y2="${H-bottom}" style="stroke:var(--separator-opaque)"/>
    ${bars}
    <line x1="${left}" x2="${W-right}" y1="${ty.toFixed(1)}" y2="${ty.toFixed(1)}" style="stroke:var(--label-muted)" stroke-dasharray="4 4"/>
    <text x="${W-right}" y="${(ty - 5).toFixed(1)}" text-anchor="end">obiettivo ${fmt(g.kcal)}</text></svg>`;
  const hist = Array.from({length:14}, (_, i) => addDays(today, -i)).map(k => ({ k, t: totals(getDay(k)) })).filter(d => d.t.n);
  app.innerHTML = `
  ${header('Ultimi 7 giorni', 'Diario')}
  <div class="stats" style="margin-top:14px">
    <div class="card stat"><div class="k">Registrati</div><div class="v"><span data-num="logged" data-v="${logged.length}">${logged.length}</span><small> su 7 giorni</small></div></div>
    <div class="card stat"><div class="k">Media</div><div class="v"><span data-num="avg" data-v="${Math.round(avg)}">${fmt(avg)}</span><small> kcal</small></div></div>
    <div class="card stat"><div class="k">Frutta e verd.</div><div class="v"><span data-num="avgfv" data-v="${Math.round(avgFv * 10) / 10}" data-f="1">${fmt1(avgFv)}</span><small> /giorno</small></div></div>
  </div>
  <div class="card pad" style="margin-top:12px">${chart}</div>
  <h2 class="section-title">${ageOf(S.profile) < 18 ? 'Come cresci' : 'Il tuo percorso'}</h2>
  ${journeyCard()}
  <h2 class="section-title">I miei cibi <small>${S.foods.length}</small></h2>
  ${S.foods.length ? `<div class="food-grid">${S.foods.map(f => `<button class="food-tile" data-a="food" data-id="${esc(f.id)}"><span class="ph${f.thumb ? '' : ' ico'}">${f.thumb ? `<img src="${esc(f.thumb)}" alt="">` : foodIco(f)}</span><span class="n">${esc(f.name)}</span><span class="k num">${fmt(f.kcal)} kcal · ${fmt(f.grams)} g</span></button>`).join('')}</div>`
    : `<div class="card pad muted">Quando scansioni un piatto puoi memorizzarlo qui, per riaggiungerlo con un tocco.</div>`}
  <h2 class="section-title">Giorni registrati</h2>
  ${hist.length ? `<div class="card">${hist.map(d => `<button class="hist" data-a="goto" data-k="${d.k}"><span class="d">${esc(d.k === today ? 'Oggi' : longDate(d.k))}</span><span class="minibar"><i data-fill="day-${d.k}" data-p="${clamp(d.t.kcal/g.kcal,0,1)}"></i></span><span class="muted num" style="min-width:74px;text-align:right">${fmt(d.t.kcal)} kcal</span></button>`).join('')}</div>`
    : `<div class="card pad muted">Nessun giorno registrato nelle ultime due settimane.</div>`}`;
  fillsFrom(app); countUp(app);
}

/* ---- profile ---- */
async function modelCached(){
  try { return !!(await caches.match(SCAN_URL + 'weights.bin')) || (!!(await caches.match(MODELS.food.url)) && !!(await caches.match(MODELS.mobile.url))); } catch (e) { return false; }
}
async function refreshDlCard(){
  const t = $('#dlTitle'); if (!t) return;
  const ok = modelP ? await modelP.then(() => true, () => false) : await modelCached();
  if (!$('#dlTitle')) return;
  $('#dlTitle').textContent = ok ? 'Pronto, funziona anche offline' : 'Da scaricare';
  $('#dlBtn').hidden = ok;
}
function preloadModel(){
  const btn = $('#dlBtn'); if (btn) btn.hidden = true;
  $('#dlBarBox').hidden = false;
  ensureModel(f => {
    const pct = Math.round(f * 100);
    const bar = $('#dlBar'); if (bar) bar.style.width = pct + '%';
    const t = $('#dlTitle'); if (t) t.textContent = pct < 100 ? `Scarico… ${pct}%` : 'Pronto, funziona anche offline';
    const sub = $('#dlSub'); if (sub && pct < 100) sub.textContent = `${fmt1(f * MODEL.mb)} di ${MODEL.mb} MB`;
  }).then(() => { const b = $('#dlBarBox'); if (b) setTimeout(() => b.hidden = true, 600); toast('Riconoscimento pronto'); },
          () => { const t = $('#dlTitle'); if (t) t.textContent = 'Download non riuscito'; const b = $('#dlBtn'); if (b) { b.hidden = false; b.textContent = 'Riprova'; } });
}
function renderProfile(){
  const p = S.profile, g = T();
  const act = ['Poco attivo','Leggermente attivo','Attivo','Molto attivo'][+p.activity || 0];
  S.installTab = S.installTab || guessBrowser();
  app.innerHTML = `
  ${header('Il tuo profilo', p.name || 'Profilo')}
  <div class="group" style="margin-top:14px">
    <div class="field"><label>Nato il</label><span class="grow" style="text-align:right">${p.birth ? esc(parseKey(p.birth).toLocaleDateString('it-IT', { day:'numeric', month:'long', year:'numeric' })) + ' · ' : ''}${ageOf(p)} anni</span></div>
    <div class="field"><label>Altezza</label><span class="grow num" style="text-align:right">${g.missing.includes('height') ? 'Da aggiungere' : esc(p.height) + ' cm'}</span></div>
    <div class="field"><label>Peso</label><span class="grow num" style="text-align:right">${g.missing.includes('weight') ? 'Da aggiungere' : fmt1(p.weight) + ' kg'}</span><button class="link" data-a="weight" aria-label="Aggiorna il peso">Aggiorna</button></div>
    <div class="field"><label>Sesso</label><span class="grow" style="text-align:right">${{ F:'Femmina', M:'Maschio' }[p.sex] || 'Preferisco non dire'}</span></div>
    <div class="field"><label>Attività</label><span class="grow" style="text-align:right">${act}</span></div>
    <div class="field"><label>Metabolismo</label><span class="grow num" style="text-align:right">${g.generic ? 'Da calcolare' : fmt(g.bmr) + ' kcal a riposo'}</span></div>
  </div>
  <div class="stack" style="margin-top:12px"><button class="btn tinted" data-a="edit-profile">Modifica profilo</button><button class="btn tinted" data-a="goal">${ageOf(p) < 18 ? 'Come cresci' : 'Obiettivo di peso'}</button></div>
  <h2 class="section-title">Dati</h2>
  <div class="card pad"><div class="meal-name">Salvati su questo dispositivo</div><div class="small muted" style="margin-top:4px">Profilo, diario e foto restano solo qui: nessun account, nessun server. Esporta un backup ogni tanto, oppure per passare a un altro telefono.</div></div>
  <h2 class="section-title">Riconoscimento delle foto</h2>
  <div class="card pad" id="dlCard"><div class="row"><div class="grow"><div class="meal-name" id="dlTitle">Controllo…</div><div class="small muted" id="dlSub">PiattinoScan, il riconoscimento dei cibi creato per Piattino, gira sul telefono: ${fmt1(MODEL.mb)} MB da scaricare una volta sola. Impara anche dalle tue correzioni.</div></div><button class="chip-btn accent" data-a="preload" id="dlBtn" hidden>Scarica</button></div><div class="dl-bar" id="dlBarBox" hidden><i id="dlBar"></i></div></div>
  <div class="stack" style="margin-top:12px" id="backupBox"><button class="btn tinted" data-a="export">Esporta backup</button><button class="btn tinted" data-a="import">Importa backup</button></div>
  ${isStandalone() ? '' : `<h2 class="section-title">Aggiungi alla schermata Home</h2>${installTabs()}<div id="installSteps">${installSteps(S.installTab)}</div>`}
  <h2 class="section-title">Informazioni</h2>
  <p class="note">Piattino versione ${APP_VERSION}</p>
  <p class="note">Piattino è pensato per chi ha almeno 9 anni. Per bambini e ragazzi non propone diete dimagranti, ma pasti equilibrati per crescere. Il riconoscimento delle foto avviene sul telefono e conosce i cibi più comuni: controlla sempre il risultato. I valori sono stime: per esigenze di salute rivolgiti al medico, al pediatra o a un dietista.</p>
  <div style="margin-top:12px"><button class="btn tinted" data-a="whats-new">Cosa c'è di nuovo</button></div>
  <div style="margin-top:18px" id="resetBox"><button class="btn danger" data-a="reset-ask">Cancella tutti i dati</button></div>`;
  refreshDlCard();
}

/* ---- welcome / onboarding ---- */
function profileForm(p){
  p = p || { name:'', birth:'', sex:'', height:'', weight:'', activity:1, goal:'healthy' };
  const L = CONFIG.limits, sex = p.sex ? normSex(p.sex) : '';
  return `<form id="pform" novalidate>
  <div class="form-label">Chi sei</div>
  <div class="group">
    <div class="field"><label for="f-name">Nome</label><input id="f-name" name="name" autocomplete="given-name" placeholder="Il tuo nome" value="${esc(p.name)}" maxlength="30"></div>
    <div class="field"><label for="f-birth">Nato il</label><input id="f-birth" name="birth" type="date" min="${maxBirth(110)}" max="${maxBirth(9)}" value="${esc(p.birth || '')}"></div>
    <div class="field"><label for="f-h">Altezza</label><input id="f-h" name="height" type="number" inputmode="numeric" min="${L.height[0]}" max="${L.height[1]}" placeholder="150" value="${esc(p.height || '')}"><span class="unit">cm</span></div>
    <div class="field"><label for="f-w">Peso</label><input id="f-w" name="weight" type="number" inputmode="decimal" min="${L.weight[0]}" max="${L.weight[1]}" step="0.1" placeholder="45" value="${esc(p.weight || '')}"><span class="unit">kg</span></div>
  </div>
  <div class="form-label" id="sexLabel">Sesso</div>
  <div class="seg" role="radiogroup" aria-labelledby="sexLabel">${[['F', 'Femmina'], ['M', 'Maschio'], ['X', 'Preferisco non dire']].map(([v, l]) => `<input type="radio" name="sex" id="sx-${v}" value="${v}" ${sex === v ? 'checked' : ''}><label for="sx-${v}">${l}</label>`).join('')}</div>
  <p class="foot">Serve solo a stimare il fabbisogno di energia. Se preferisci non dirlo, Piattino usa una via di mezzo e resta sui limiti più prudenti.</p>
  <div class="form-label">Quanto ti muovi</div>
  <div class="seg">${['Poco','Un po\'','Abbastanza','Tanto'].map((l, i) => `<input type="radio" name="activity" id="ac-${i}" value="${i}" ${+p.activity === i ? 'checked' : ''}><label for="ac-${i}">${l}</label>`).join('')}</div>
  <div class="form-label">Obiettivo</div>
  <div class="goal-grid" id="goalSeg">${goalOptions(p.birth ? ageOf(p) : 0, p.goal)}</div>
  <p class="note" id="minorNote" style="margin-top:12px" ${!p.birth || ageOf(p) >= 18 ? 'hidden' : ''}>Hai meno di 18 anni: compila il profilo insieme a un genitore. Piattino ti aiuta a mangiare in modo vario ed equilibrato, senza diete.</p>
  <div class="err" id="ferr" role="alert"></div>
  <button class="btn primary" type="submit">${S.profile ? 'Salva' : 'Inizia'}</button>
  </form>`;
}
function maxBirth(years){ const d = new Date(); d.setFullYear(d.getFullYear() - years); return dkey(d); }
function goalOptions(age, cur){
  const opts = age && age < 14 ? [['healthy','Mangiare sano','Pasti vari per crescere'],['sport','Energia per lo sport','Per chi si muove tanto'],['muscle','Forza e muscoli','Giochi, sport e proteine']]
    : age && age < 18 ? [['healthy','Mangiare sano','Pasti vari per crescere'],['sport','Energia per lo sport','Per chi si muove tanto'],['muscle','Muscoli e forza','Più proteine, niente diete']]
    : [['lose','Dimagrire','Calorie −15%'],['maintain','Mantenere','Peso stabile'],['muscle','Fare muscoli','Proteine 1,8 g/kg'],['gain','Aumentare di peso','Calorie +10%'],['healthy','Mangiare sano','Senza obiettivi di peso']];
  if (!opts.some(o => o[0] === cur)) cur = 'healthy';
  return opts.map(([v, l, d], i) => `<input type="radio" name="goal" id="gl-${v}" value="${v}" ${v === cur ? 'checked' : ''}><label for="gl-${v}" class="${opts.length % 2 && i === opts.length - 1 ? 'wide' : ''}"><b>${l}</b><span>${d}</span></label>`).join('');
}
/* ---------- guida: aggiungi l'app alla schermata Home ---------- */
const UA = navigator.userAgent;
const IS_ANDROID = /Android/i.test(UA);
const guessBrowser = () => IS_ANDROID ? 'android' : /CriOS/.test(UA) ? 'chrome' : 'safari';
const installSkipped = () => { try { return sessionStorage.getItem('piattino-install') === 'skip'; } catch (e) { return !!S.installSkip; } };
const ico = k => `<span class="step-ico">${I[k]}</span>`;
function installSteps(kind){
  const steps = {
    safari: [
      `${ico('share')} Tocca <b>Condividi</b>, il quadrato con la freccia in su. Di solito è nella barra in basso: se non lo vedi, tocca prima <b>•••</b>.`,
      `${ico('addsq')} Scorri il menu e tocca <b>Aggiungi alla schermata Home</b>. Se non c'è, tocca <b>Mostra altro</b> in fondo alla lista.`,
      `${ico('check')} Lascia attivo <b>Apri come app web</b>, se compare, e tocca <b>Aggiungi</b> in alto a destra.`,
      `${ico('home')} Chiudi Safari e apri Piattino dalla nuova icona sulla schermata Home.`,
    ],
    chrome: [
      `${ico('share')} Tocca <b>Condividi</b> in alto a destra, nella barra dell'indirizzo. Se non lo vedi, tocca <b>•••</b> e poi <b>Condividi</b>.`,
      `${ico('addsq')} Scorri e tocca <b>Aggiungi alla schermata Home</b>.`,
      `${ico('check')} Tocca <b>Aggiungi</b> in alto a destra.`,
      `${ico('home')} Chiudi Chrome e apri Piattino dalla nuova icona sulla schermata Home.`,
    ],
    android: [
      `${ico('dots')} Tocca i tre puntini <b>⋮</b> in alto a destra.`,
      `${ico('addsq')} Tocca <b>Installa app</b> oppure <b>Aggiungi a schermata Home</b>.`,
      `${ico('check')} Conferma con <b>Installa</b>.`,
      `${ico('home')} Apri Piattino dalla nuova icona.`,
    ],
  }[kind];
  return `<ol class="card steps">${steps.map((t, i) => `<li><span class="dot">${i + 1}</span><span class="grow">${t}</span></li>`).join('')}</ol>
    ${kind === 'chrome' ? '<p class="foot">In Chrome serve iOS 16.4 o più recente. Se non trovi l\'opzione, apri questo indirizzo in Safari.</p>' : ''}`;
}
function installTabs(){
  const tabs = IS_ANDROID ? [['android', 'Android']] : [['safari', 'Safari'], ['chrome', 'Chrome']];
  if (tabs.length < 2) return '';
  return `<div class="seg" style="margin:4px 0 12px">${tabs.map(([k, l]) => `<button class="${S.installTab === k ? 'on' : ''}" data-a="install-tab" data-k="${k}">${I[k === 'safari' ? 'compass' : 'globe']} ${l}</button>`).join('')}</div>`;
}
function renderInstall(){
  S.installTab = S.installTab || guessBrowser();
  app.innerHTML = `<div class="welcome install ${reduceMotion() ? '' : 'intro'}">
    <div class="home-preview"><img src="icons/apple-touch-icon.png" alt=""><span>Piattino</span></div>
    <h1 class="install-title">${words('Prima mettila sulla schermata Home')}</h1>
    <p class="tag">${words('Così Piattino si apre a tutto schermo come un\'app vera, anche senza internet. Ci vuole un minuto.', 6)}</p>
    <div style="margin-top:20px">${installTabs()}<div id="installSteps">${installSteps(S.installTab)}</div></div>
    <p class="note" style="margin-top:12px">Configura Piattino <b>dall'icona sulla schermata Home</b>: l'app lì ha una memoria sua, e i dati inseriti qui nel browser non passerebbero.</p>
    <div class="stack" style="margin-top:16px">
      <button class="btn primary" data-a="install-done">L'ho aggiunta</button>
      <button class="btn tinted" data-a="install-skip">Continua nel browser</button>
    </div>
  </div>`;
}

function renderWelcome(){
  if (!isStandalone() && !installSkipped()) return renderInstall();
  app.innerHTML = `<div class="welcome ${reduceMotion() ? '' : 'intro'}">
    <img class="app-icon" src="icons/apple-touch-icon.png" alt="" style="margin-top:40px">
    <h1>${words('Piattino')}</h1>
    <p class="tag">${words('Fotografa quello che mangi, segui il tuo piano e trova ogni giorno una spinta in più. Per tutte le età, dai 9 anni in su.', 1)}</p>
    ${profileForm(null)}
    <p class="foot" style="text-align:center">I tuoi dati restano privati su questo dispositivo.</p>
  </div>`;
  bindProfileForm(app);
}
function bindProfileForm(root){
  const form = $('#pform', root); if (!form) return;
  const birth = $('#f-birth', form);
  const onBirth = () => {
    const a = birth.value ? ageOf({ birth:birth.value }) : 0; const cur = (form.querySelector('input[name=goal]:checked') || {}).value;
    $('#goalSeg', form).innerHTML = goalOptions(a, cur);
    $('#minorNote', form).hidden = !(a && a < 18);
  };
  birth.addEventListener('input', onBirth); birth.addEventListener('change', onBirth);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(form); const v = k => String(fd.get(k) || '').trim();
    const bd = v('birth');
    const p = { name:v('name'), birth:/^\d{4}-\d{2}-\d{2}$/.test(bd) ? bd : '', sex:normSex(v('sex')), height:+v('height'), weight:Math.round(+String(v('weight')).replace(',', '.') * 10) / 10, activity:+v('activity') || 0, goal:v('goal') || 'healthy' };
    const err = $('#ferr', form), L = CONFIG.limits;
    if (!p.birth) return err.textContent = 'Inserisci la tua data di nascita.';
    const age = ageOf(p);
    if (age < L.age[0]) return err.textContent = `Piattino è pensato per chi ha almeno ${L.age[0]} anni.`;
    if (age > L.age[1]) return err.textContent = 'Controlla la data di nascita.';
    p.age = age;
    const bad = checkBody(p.weight, p.height);
    if (bad === 'height') return err.textContent = `Inserisci un'altezza tra ${L.height[0]} e ${L.height[1]} cm.`;
    if (bad === 'weight') return err.textContent = `Inserisci un peso tra ${L.weight[0]} e ${L.weight[1]} kg.`;
    if (bad === 'bmi') return err.textContent = 'Peso e altezza insieme non sembrano plausibili: controlla di averli scritti in kg e in cm.';
    if (age < 18 && !['healthy','sport','muscle'].includes(p.goal)) p.goal = 'healthy';
    const first = !S.profile;
    const prev = S.profile || {};
    S.profile = { ...prev, ...p };
    if (age < 18) { delete S.profile.target; delete S.profile.kcalAdj; }
    // obiettivo cambiato: il peso da raggiungere e le correzioni del coach valevano per quello di prima
    if (!first && prev.goal !== p.goal) { delete S.profile.target; delete S.profile.kcalAdj; delete S.profile.reviewSeen; }
    if (first || prev.goal !== p.goal || !S.profile.goalRef) S.profile.goalRef = { kg:p.weight, d:todayKey() };
    if (first || +prev.weight !== p.weight) logWeight(p.weight);
    saveProfile(); S.currentQuote = null;
    closeSheet(); S.view = 'today'; render(); window.scrollTo(0, 0);
    toast(first ? 'Ti diamo il benvenuto su Piattino!' : 'Profilo aggiornato');
    if (age >= 18 && ['lose','gain','muscle'].includes(p.goal) && !S.profile.target) setTimeout(openGoal, 700);
  });
}

/* ---------- peso: storico, andamento, obiettivo di peso ---------- */
function logWeight(kg, d = todayKey()){ S.weights = addWeight(S.weights, kg, d); Store.put(); }
const weightTrend = () => trendOf(S.weights, todayKey());
const validKg = kg => kg >= CONFIG.limits.weight[0] && kg <= CONFIG.limits.weight[1];
const dayMonth = k => parseKey(k).toLocaleDateString('it-IT', { day:'numeric', month:'long' });
const DISCLAIMER = 'I valori sono stime e non sostituiscono il parere di medico o dietista.';
const G = {};
function openGoal(){
  const p = S.profile;
  if (T().generic) return actions['edit-profile']();
  const t = p.target || {};
  G.mode = 'goal'; G.wErr = ''; G.jumpOk = null;
  G.cur = +p.weight; G.kg = t.kg || (p.goal === 'lose' ? Math.max(minHealthyKg(+p.height), Math.round(p.weight - 5)) : p.goal === 'maintain' || p.goal === 'healthy' ? +p.weight : Math.round(p.weight + 3));
  G.rate = t.rate || 0; G.err = '';
  openSheet(`<div id="goalRoot" style="display:flex;flex-direction:column;min-height:0;flex:1"></div>`, true);
  renderGoal();
}
// «Il tuo peso»: aggiornare il peso in qualsiasi momento, con lo storico e l'andamento
function openWeight(){
  if (T().generic) return actions['edit-profile']();
  G.mode = 'weight'; G.wErr = ''; G.jumpOk = null; G.cur = +S.profile.weight;
  openSheet(`<div id="goalRoot" style="display:flex;flex-direction:column;min-height:0;flex:1"></div>`, true);
  renderGoal();
}
function weightChart(target){
  const pts = S.weights.slice(-60); if (pts.length < 2) return '';
  const W = 340, H = 150, L = 34, R = 10, T = 12, B = 22;
  const vals = pts.map(x => x.kg).concat(target ? [target] : []);
  const lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1);
  const t0 = parseKey(pts[0].d), t1 = parseKey(pts[pts.length - 1].d), span = Math.max(1, (t1 - t0) / 864e5);
  const x = d => L + (W - L - R) * ((parseKey(d) - t0) / 864e5) / span, y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const line = pts.map(q => `${x(q.d).toFixed(1)},${y(q.kg).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  // la stessa cosa a parole, per VoiceOver
  const say = `Andamento del peso: ${fmt1(pts[0].kg)} kg il ${dayMonth(pts[0].d)}, ${fmt1(last.kg)} kg il ${dayMonth(last.d)}${target ? `. Obiettivo ${fmt1(target)} kg` : ''}`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(say)}">
    ${[lo, (lo + hi) / 2, hi].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" style="stroke:var(--separator-opaque)"/><text x="${L - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${fmt1(v)}</text>`).join('')}
    ${target ? `<line x1="${L}" x2="${W - R}" y1="${y(target).toFixed(1)}" y2="${y(target).toFixed(1)}" style="stroke:var(--system-green)" stroke-dasharray="5 4"/><text x="${W - R}" y="${(y(target) - 5).toFixed(1)}" text-anchor="end">obiettivo ${fmt1(target)}</text>` : ''}
    <polyline points="${line}" fill="none" style="stroke:var(--system-blue)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${x(last.d).toFixed(1)}" cy="${y(last.kg).toFixed(1)}" r="4.5" style="fill:var(--system-blue);stroke:var(--bg-grouped-secondary)" stroke-width="2"/>
    <text x="${L}" y="${H - 6}">${esc(parseKey(pts[0].d).toLocaleDateString('it-IT', { day:'numeric', month:'short' }))}</text>
    <text x="${W - R}" y="${H - 6}" text-anchor="end">${esc(parseKey(last.d).toLocaleDateString('it-IT', { day:'numeric', month:'short' }))}</text></svg>`;
}
// il campo del peso di oggi, uguale in «Il tuo peso», «Obiettivo di peso» e «Come cresci»
function weightCard(){
  const [lo, hi] = CONFIG.limits.weight;
  return `<div class="card pad"><div class="stepper" style="justify-content:flex-start;margin:0"><button data-a="gw-step" data-d="-0.1" aria-label="Meno un etto">−</button><input id="gwIn" type="number" inputmode="decimal" step="0.1" min="${lo}" max="${hi}" value="${String(G.cur)}" aria-label="Peso di oggi in kg"><button data-a="gw-step" data-d="0.1" aria-label="Più un etto">+</button><span class="muted">kg</span></div>
    <p class="err" id="gwErr" role="alert" style="margin:${G.wErr ? '10px 0 0' : '0'};min-height:0">${esc(G.wErr)}</p>
    <button class="btn tinted" data-a="gw-save" style="margin-top:10px">${G.jumpOk != null ? 'Sì, registra questo peso' : 'Registra il peso di oggi'}</button></div>`;
}
function journeyBlock(target){
  const p = S.profile, minor = ageOf(p) < 18;
  return `<h2 class="section-title">${minor ? 'Il tuo andamento' : 'Il tuo percorso'}</h2><div class="card pad">${S.weights.length > 1 ? weightChart(target) : ''}<p class="journey">${esc(journeyText({ weights:S.weights, goal:p.goal, minor }))}</p></div>`;
}
function goalSummary(){
  const p = S.profile, diff = Math.round((G.kg - G.cur) * 10) / 10, lo = minHealthyKg(+p.height);
  const goal = diff < -.2 ? 'lose' : diff > .2 ? (p.goal === 'muscle' ? 'muscle' : 'gain') : 'maintain';
  const tg = targets({ ...p, kcalAdj:0, weight:G.cur, target:{ kg:G.kg, rate:G.rate }, goal });
  // data e durata si calcolano sul ritmo vero, dopo i limiti di sicurezza, non su quello chiesto
  const pace = Math.abs(tg.pace), weeks = goal !== 'maintain' && pace >= .03 ? Math.ceil(Math.abs(diff) / pace) : 0;
  return { diff, lo, tg, pace, weeks, when: weeks ? addDays(todayKey(), weeks * 7) : null, goal };
}
function renderGoal(){
  const root = $('#goalRoot'); if (!root) return;
  const p = S.profile, age = ageOf(p);
  if (G.mode === 'weight') {
    const recent = S.weights.slice(-8).reverse();
    root.innerHTML = `${sheetHead('Il tuo peso', 'Chiudi')}
    <div class="sheet-body">
      <div class="form-label">Oggi pesi</div>
      ${weightCard()}
      <p class="foot">Basta una pesata a settimana, al mattino. A ogni cambio di peso Piattino ricalcola calorie, proteine e acqua.</p>
      ${reviewCard()}
      ${journeyBlock(age >= 18 && p.target ? p.target.kg : null)}
      ${recent.length ? `<h2 class="section-title">Ultime pesate</h2><div class="group">${recent.map(x => `<div class="field"><span class="grow">${esc(dayMonth(x.d))}</span><span class="num">${fmt1(x.kg)} kg</span><button class="link" data-a="w-del" data-d="${x.d}" aria-label="Togli la pesata del ${esc(dayMonth(x.d))}" ${S.weights.length < 2 ? 'disabled' : ''}>Togli</button></div>`).join('')}</div>` : ''}
      ${age >= 18 ? `<div style="margin-top:14px"><button class="btn tinted" data-a="goal">Obiettivo di peso</button></div>` : ''}
      <p class="foot">${DISCLAIMER}</p>
    </div>`;
    bindGoalInputs(); return;
  }
  if (age < 18) {
    root.innerHTML = `${sheetHead('Come cresci', 'Chiudi')}
    <div class="sheet-body">
      <p class="note" style="margin:6px 0 14px">Mentre cresci il peso aumenta in modo naturale, insieme all'altezza. Per questo Piattino non ti fa scegliere un peso da raggiungere o da perdere: conta mangiare vario, muoversi e dormire bene. Se hai dubbi, parlane con un genitore o con il pediatra.</p>
      <div class="form-label">Oggi pesi</div>
      ${weightCard()}
      ${S.weights.length > 1 ? journeyBlock(null) : ''}
    </div>`;
    bindGoalInputs(); return;
  }
  const diff0 = G.kg - G.cur, dir = diff0 < -.2 ? 'lose' : 'gain', bmi = bmiOf(G.cur, +p.height);
  const rates = rateOptions(dir, G.cur, bmi);
  if (!rates.some(([r]) => r === G.rate)) G.rate = defaultRate(dir, G.cur, bmi);
  const sm = goalSummary(), t = p.target, lim = sm.tg.limited;
  const tooLow = G.kg < sm.lo, dirTxt = sm.diff < -.2 ? `Vuoi perdere <b>${fmt1(-sm.diff)} kg</b>` : sm.diff > .2 ? `Vuoi mettere su <b>${fmt1(sm.diff)} kg</b>` : 'Vuoi mantenere il peso';
  const prog = t && validKg(+t.startKg) && Math.abs(t.kg - t.startKg) > .2 ? clamp((t.startKg - G.cur) / (t.startKg - t.kg), 0, 1) : null;
  const moving = Math.abs(sm.diff) > .2, blocked = sm.goal === 'lose' && bmi < CONFIG.safety.minBmi;
  const article = d => [8, 11].includes(parseKey(d).getDate()) ? 'l\'' : 'il ';
  const when = blocked ? `<div class="meal-name">Piano di mantenimento</div><div class="small muted">${esc(sm.tg.note)}</div>`
    : !moving ? `<div class="meal-name">Mantieni il tuo peso</div>`
    : !sm.weeks ? `<div class="meal-name">Calorie già al minimo prudente</div><div class="small muted">Con questi limiti il peso scende molto piano: conta di più il movimento.</div>`
    : sm.weeks > 104 ? `<div class="meal-name">Un percorso lungo</div><div class="small muted">Con un ritmo prudente servono più di due anni: scegli una tappa più vicina, poi la sposti.</div>`
    : `<div class="meal-name">Arrivi a ${fmt1(G.kg)} kg verso ${article(sm.when)}${esc(dayMonth(sm.when))}</div><div class="small muted">circa ${sm.weeks} ${sm.weeks === 1 ? 'settimana' : 'settimane'}, a ${fmt2(sm.pace)} kg a settimana</div>`;
  const limNote = blocked || !moving ? '' : sm.goal === 'lose' && (lim.includes('floor') || lim.includes('deficit'))
      ? `Per restare nei limiti prudenti le calorie non scendono sotto ${fmt(sm.tg.kcal)} kcal (mai sotto il metabolismo a riposo, né oltre il ${Math.round(CONFIG.safety.maxDeficitFrac * 100)}% in meno del fabbisogno): per questo il ritmo reale è ${fmt2(sm.pace)} kg a settimana.`
    : lim.includes('surplus') ? `Per restare nei limiti prudenti le calorie non salgono oltre ${fmt(sm.tg.kcal)} kcal: il ritmo reale è ${fmt2(sm.pace)} kg a settimana.` : '';
  root.innerHTML = `${sheetHead('Obiettivo di peso', 'Chiudi', `<button class="link" data-a="goal-save" style="font-weight:600" ${tooLow ? 'disabled' : ''}>Salva</button>`)}
  <div class="sheet-body">
    ${prog != null ? `<div class="card pad" style="margin-top:6px"><div class="row" style="justify-content:space-between"><span class="meal-name">Progresso</span><b class="pct num" style="font-size:20px">${Math.round(prog * 100)}%</b></div>
      <div class="track light"><i data-fill="goal-sheet" data-p="${prog}"></i></div><div class="small muted num" style="margin-top:6px">Partenza ${fmt1(t.startKg)} kg · ora ${fmt1(G.cur)} kg · obiettivo ${fmt1(t.kg)} kg</div></div>` : ''}
    <div class="form-label">Oggi pesi</div>
    ${weightCard()}
    <div class="form-label">Dove vuoi arrivare</div>
    <div class="card pad" style="text-align:center">
      <div class="stepper"><button data-a="gk-step" data-d="-0.5" aria-label="Meno mezzo chilo">−</button><input id="gkIn" type="number" inputmode="decimal" step="0.5" value="${String(G.kg)}" aria-label="Peso obiettivo in kg"><button data-a="gk-step" data-d="0.5" aria-label="Più mezzo chilo">+</button></div>
      <div class="muted small">kg</div>
      <p style="margin:10px 0 2px;font-size:17px">${dirTxt}</p>
      ${tooLow ? `<p class="err" role="alert" style="margin-top:8px;text-align:left">Per la tua altezza Piattino non imposta obiettivi sotto ${sm.lo} kg. Se pensi di averne bisogno, parlane con il medico o con un dietista.</p>` : ''}
    </div>
    ${moving && !blocked ? `<div class="form-label" id="rateLabel">Quanto veloce</div>
    <div class="seg" role="group" aria-labelledby="rateLabel">${rates.map(([r, l]) => `<button class="${G.rate === r ? 'on' : ''}" data-a="g-rate" data-r="${r}" aria-pressed="${G.rate === r}">${l}<br><span class="small muted">${r.toLocaleString('it-IT')} kg/sett.</span></button>`).join('')}</div>
    <p class="foot">Per te il massimo prudente è ${fmt2(maxRate(dir, G.cur, bmi))} kg a settimana: ritmi più veloci non sono disponibili.</p>` : ''}
    <div class="card pad" style="margin-top:14px">
      ${when}
      <div class="target-grid num" style="margin-top:12px"><div><b>${fmt(sm.tg.kcal)}</b><span>kcal</span></div><div><b>${sm.tg.protein}</b><span>Prot. g</span></div><div><b>${sm.tg.kcal - sm.tg.tdee > 0 ? '+' : sm.tg.kcal - sm.tg.tdee < 0 ? '−' : ''}${fmt(Math.abs(sm.tg.kcal - sm.tg.tdee))}</b><span>vs fabbisogno</span></div><div><b>${sm.goal === 'lose' ? '−' : sm.goal === 'maintain' ? '=' : '+'}</b><span>${sm.goal === 'lose' ? 'Dimagrire' : sm.goal === 'maintain' ? 'Mantenere' : sm.goal === 'muscle' ? 'Muscoli' : 'Aumentare'}</span></div></div>
      ${limNote ? `<p class="small muted" style="margin:10px 0 0">${limNote}</p>` : ''}
    </div>
    ${journeyBlock(t && t.kg)}
    ${G.err ? `<p class="err" role="alert">${esc(G.err)}</p>` : ''}
    <div style="margin-top:14px"><button class="btn primary" data-a="goal-save" ${tooLow ? 'disabled' : ''}>Salva l'obiettivo</button></div>
    ${t ? `<div style="margin-top:10px"><button class="btn danger" data-a="goal-clear">Togli l'obiettivo di peso</button></div>` : ''}
    <p class="foot">${DISCLAIMER}</p>
  </div>`;
  bindGoalInputs(); fillsFrom(root);
}
// Dopo aver scritto un numero si tocca di solito subito un pulsante: ridisegnare all'istante sostituirebbe il pulsante sotto il dito
// e il tocco andrebbe perso. Il numero si legge subito, la schermata si aggiorna un attimo dopo.
function bindGoalInputs(){
  const [lo, hi] = CONFIG.limits.weight, later = () => { clearTimeout(G.t); G.t = setTimeout(renderGoal, 350); };
  const read = el => +String(el.value).replace(',', '.');
  const gw = $('#gwIn'); if (gw) gw.addEventListener('change', () => { const v = Math.round(read(gw) * 10) / 10; if (v >= lo && v <= hi) { G.cur = v; G.jumpOk = null; if (G.mode === 'goal') later(); } });
  const gk = $('#gkIn'); if (gk) gk.addEventListener('change', () => { G.kg = clamp(Math.round(read(gk) * 2) / 2 || G.kg, lo, hi); later(); });
}

/* ---------- coach «Cosa faccio ora?»: consigli calcolati dai tuoi dati, sul telefono ---------- */
const CHIPS = ['Cosa faccio ora?', 'Il piano non funziona', 'Cosa mangio adesso?', 'Ho fame', 'Ho sgarrato', 'Come va la settimana?', 'Muscoli', 'Obiettivo di peso', 'Acqua'];
const pastKeys = (n, withToday) => Array.from({ length:n }, (_, i) => addDays(todayKey(), withToday ? -i : -(i + 1)));
function analyze(){
  const g = T(), age = ageOf(S.profile), minor = age < 18, goal = S.profile.goal;
  const prev = pastKeys(7, false).map(k => ({ k, d:getDay(k), t:totals(getDay(k)) }));
  const logged = prev.filter(x => x.t.n >= 2);
  const avg = f => logged.length ? logged.reduce((a, x) => a + f(x), 0) / logged.length : 0;
  const foods = {}; let sweet = 0, treats = 0;
  const two = pastKeys(14, true).map(k => ({ k, d:getDay(k), t:totals(getDay(k)) }));
  two.forEach(({ d }) => MEALS.forEach(m => (d.meals[m.k] || []).forEach(e => {
    const f = foods[e.name] || (foods[e.name] = { name:e.name, kcal:0, n:0 }); f.kcal += +e.kcal || 0; f.n++;
    const n = e.name.toLowerCase();
    if (/bibita|cola|aranciata|succo|tè freddo/.test(n)) sweet++;
    if (/dolce|gelato|biscott|cornetto|cioccolat|patatine|fritt|burger|hot dog|merendin|torta|crema/.test(n)) treats++;
  })));
  const wk = two.filter(x => x.t.n >= 2), isWe = k => [0, 6].includes(parseKey(k).getDay());
  const we = wk.filter(x => isWe(x.k)), wd = wk.filter(x => !isWe(x.k));
  const mean = arr => arr.length ? arr.reduce((a, x) => a + x.t.kcal, 0) / arr.length : 0;
  const today = getDay(todayKey());
  return { g, age, minor, goal, logged:logged.length, prev, avgK:avg(x => x.t.kcal), avgP:avg(x => x.t.p), avgFv:avg(x => x.t.fv), avgW:avg(x => x.d.water || 0),
    breakfast: logged.length ? logged.filter(x => (x.d.meals.colazione || []).length).length / logged.length : 1,
    top:Object.values(foods).sort((a, b) => b.kcal - a.kcal).slice(0, 3), sweet, treats,
    weekendExtra: we.length && wd.length ? mean(we) - mean(wd) : 0, today, tt:totals(today), trend:weightTrend(), data:coachData({ profile:S.profile, days:S.days }), risk:riskNow(true) };
}
function nextSlot(){
  const h = new Date().getHours() + new Date().getMinutes() / 60, d = getDay(todayKey()).meals;
  if (h < 10.5 && !(d.colazione || []).length) return 'Colazione';
  if (h < 12) return 'Spuntino';
  if (h < 15 && !(d.pranzo || []).length) return 'Pranzo';
  if (h < 18.5) return 'Merenda';
  if (!(d.cena || []).length) return 'Cena';
  return 'Merenda';
}
// plain: solo i cibi, senza grammi e calorie (quando il coach non ha dati abbastanza solidi per dare numeri)
function mealIdea(label, plain){
  const plan = buildPlan(todayKey()); const i = plan.findIndex(m => m.label === label); const m = plan[i];
  if (!m) return { t:'', acts:[] };
  const short = e => e.name.replace(/\s*\(.*?\)/, '').toLowerCase();
  if (plain) return { t:`**${label}**: ${m.items.map(short).join(', ')}.`, acts:[] };
  const kc = m.items.reduce((a, e) => a + e.kcal, 0), pr = m.items.reduce((a, e) => a + e.p, 0);
  return { t:`**${label}** da circa ${fmt(kc)} kcal e ${fmt(pr)} g di proteine: ${m.items.map(e => `${short(e)} ${fmt(e.grams)} g`).join(', ')}.`,
    acts:[{ l:`Aggiungi ${label.toLowerCase()} al diario`, a:'plan:' + i }] };
}
// Consigli sull'andamento del peso. Le correzioni delle calorie passano dagli stessi limiti di targets.js: il coach le propone
// solo se resta margine, e mai per abbassare quando c'è un segnale di rischio.
function trendAdvice(a){
  const t = S.profile.target, tr = a.trend, out = { tips:[], acts:[] };
  if (a.minor || !t) return out;
  if (!tr) { out.tips.push(`Non ho abbastanza pesate per capire se il piano funziona. **Pesati una volta a settimana**, al mattino, sempre nello stesso giorno.`); out.acts.push({ l:'Registra il peso', a:'open:weight' }); return out; }
  if (!tr.coherent) { out.tips.push(`Tra le ultime pesate c'è un salto insolito, forse un errore di battitura: finché non è corretto non traggo conclusioni dal peso.`); out.acts.push({ l:'Controlla le pesate', a:'open:weight' }); return out; }
  const step = CONFIG.safety.coachStepKcal, adj = +S.profile.kcalAdj || 0, w = +S.profile.weight;
  const withAdj = d => targets({ ...S.profile, kcalAdj:adj + d }).kcal;
  const canLower = !a.risk.includes('lowIntake') && !a.risk.includes('fastLoss') && Math.abs(adj - step) <= CONFIG.safety.coachAdjMaxKcal && withAdj(-step) < a.g.kcal;
  const canRaise = Math.abs(adj + step) <= CONFIG.safety.coachAdjMaxKcal && withAdj(step) > a.g.kcal;
  const pw = tr.perWeek, fmtR = v => `${v > 0 ? '+' : ''}${fmt1(v)} kg a settimana`;
  const still = `(${fmt1(tr.first)} → ${fmt1(tr.last)} kg in ${Math.round(tr.span)} giorni)`;
  const atMin = `Le calorie sono già al minimo prudente per te, quindi non le abbasso. Punta sul movimento, per esempio 30 minuti di camminata al giorno, e sulla precisione del diario. Se il peso resta fermo a lungo, parlane con un dietista.`;
  if (a.goal === 'lose') {
    if (pw < -w * CONFIG.risk.fastLossFracWeek) { out.tips.push(`Stai perdendo ${fmtR(pw)}: è **più veloce di quanto è prudente** e rischi di perdere muscoli.${canRaise ? ` Ti propongo di aggiungere ${step} kcal al giorno.` : ''}`); if (canRaise) out.acts.push({ l:`Aggiungi ${step} kcal`, a:'kcal:' + step }); }
    else if (pw > -.1 && tr.span >= 13) {
      if (a.logged >= 5 && a.avgK && a.avgK < a.g.kcal * .95) { out.tips.push(`Il peso è fermo ${still}, ma registri in media **${fmt(a.avgK)} kcal**, meno del tuo obiettivo. Probabilmente qualcosa sfugge: olio, bevande, assaggi o porzioni più grandi di quelle segnate. **Per una settimana pesa gli alimenti** con una bilancia da cucina.${canLower ? ` Se il peso resta fermo, si può abbassare l'obiettivo di ${step} kcal.` : ''}`); if (canLower) out.acts.push({ l:`Abbassa comunque di ${step} kcal`, a:'kcal:-' + step }); }
      else if (a.logged >= 5 && canLower) { out.tips.push(`Il peso è fermo ${still} anche se registri con costanza. Ti propongo di **abbassare l'obiettivo di ${step} kcal** al giorno.`); out.acts.push({ l:`Abbassa di ${step} kcal`, a:'kcal:-' + step }); }
      else if (a.logged >= 5) out.tips.push(`Il peso è fermo ${still} anche se registri con costanza. ${atMin}`);
      else out.tips.push(`Il peso è fermo, ma hai registrato solo ${a.logged} giorni su 7. Prima di cambiare il piano, **segna tutto per una settimana**: spesso le calorie in più si nascondono in olio, bevande e assaggi.`);
    }
    else if (pw <= -.1) out.tips.push(`Il piano funziona: stai scendendo di ${fmt1(-pw)} kg a settimana. Non cambiare niente!`);
  } else if (a.goal === 'gain' || a.goal === 'muscle') {
    if (pw < .05 && tr.span >= 13) { out.tips.push(`Il peso non sale ${still}.${canRaise ? ` Ti propongo di **aggiungere ${step} kcal** al giorno, per esempio uno yogurt greco con muesli.` : ' Le calorie sono già al massimo prudente: prova a distribuirle in più spuntini e a non saltare i pasti.'}`); if (canRaise) out.acts.push({ l:`Aggiungi ${step} kcal`, a:'kcal:' + step }); }
    else if (pw > .5) { out.tips.push(`Stai salendo di ${fmtR(pw)}: più veloce del necessario${a.goal === 'muscle' ? ', e l\'eccesso diventa grasso invece che muscolo' : ''}. Possiamo togliere ${step} kcal.`); out.acts.push({ l:`Togli ${step} kcal`, a:'kcal:-' + step }); }
    else if (pw >= .05) out.tips.push(`Il piano funziona: stai salendo di ${fmt1(pw)} kg a settimana. Continua così.`);
  }
  return out;
}
// Con pochi dati, o con dati che non tornano, il coach non dà numeri: dice cosa manca e resta sulle basi.
const COACH_NUMERIC = new Set(['plateau', 'gain', 'muscle', 'hungry', 'meal', 'week', 'weight', 'now']);
function coachPlain(intent, a){
  const d = a.data, idea = mealIdea(nextSlot(), true);
  const why = d.why === 'profile' ? { t:`Nel profilo mancano peso o altezza, quindi gli obiettivi che vedi sono valori di riferimento generici. Finché non li aggiungi preferisco non darti numeri.`, acts:[{ l:'Completa il profilo', a:'open:profile' }] }
    : d.why === 'incoherent' ? { t:`I numeri del diario degli ultimi giorni non tornano: le calorie registrate sono molto lontane da quelle che un corpo usa in un giorno. Di solito manca qualche pasto o c'è una porzione sbagliata. Finché non tornano preferisco non darti numeri.`, acts:[{ l:'Apri il diario', a:'open:diary' }] }
    : { t:`${d.logged ? `Negli ultimi 7 giorni ${d.logged === 1 ? 'c\'è **1 giorno registrato** per intero' : `ci sono **${d.logged} giorni registrati** per intero`}` : 'Negli ultimi 7 giorni non ci sono ancora giorni registrati per intero'}: troppo poco per darti numeri affidabili, e non voglio tirare a indovinare. Registra i pasti per almeno ${CONFIG.coach.minLoggedDays} giorni e ti dico con precisione cosa cambiare.`, acts:[{ l:'Registra un pasto', a:'open:scan' }] };
  const basics = intent === 'hungry' ? (a.minor ? 'Intanto, se hai fame, **mangia**: il tuo corpo sta crescendo. Scegli qualcosa che sazia, come frutta, yogurt, pane integrale o un bicchiere di latte.' : 'Intanto, se hai fame, scegli qualcosa che sazia: frutta, yogurt, verdure crude o pane integrale, e un bicchiere d\'acqua.')
    : intent === 'muscle' ? 'Intanto valgono le basi: allenamento regolare, una fonte di proteine a ogni pasto e un buon sonno.'
    : intent === 'weight' && a.minor ? 'Mentre cresci non scegliamo un peso da raggiungere: conta come stai e cosa mangi.'
    : 'Intanto valgono le basi: pasti regolari, una verdura a pranzo e a cena, un frutto a merenda e acqua a portata di mano.';
  return { t:`${why.t}\n\n${basics}${idea.t ? `\n\n**Un'idea per adesso:** ${idea.t}` : ''}`, acts:why.acts };
}
function habitTips(a){
  const g = a.g, tips = [], acts = [];
  if (a.logged < 4) tips.push(`Negli ultimi 7 giorni hai registrato bene solo **${a.logged} ${a.logged === 1 ? 'giorno' : 'giorni'}**. Senza dati completi non posso capire cosa non va: segna tutto per i prossimi 5 giorni, anche condimenti e bevande.`);
  if (a.logged && a.avgP < g.protein * .8) tips.push(`Proteine: in media **${fmt(a.avgP)} g** al giorno, l'obiettivo è ${g.protein} g. Aggiungi una fonte a ogni pasto: yogurt greco, uova, legumi, pollo, pesce o ricotta.`);
  if (a.logged && a.avgFv < 3) tips.push(`Frutta e verdura: **${porz(a.avgFv)}** al giorno, l'obiettivo è 5. Metti una verdura a pranzo e a cena e un frutto a merenda.`);
  if (a.logged >= 3 && a.breakfast < .6) tips.push(`Salti spesso la colazione (${Math.round((1 - a.breakfast) * 100)}% dei giorni). ${a.minor ? 'Per la scuola serve energia:' : 'Una colazione con proteine riduce la fame del pomeriggio:'} latte o yogurt, pane o fiocchi d'avena e un frutto.`);
  if (a.logged >= 3 && !a.minor) {
    if (a.goal === 'lose' && a.avgK > g.kcal * 1.08) tips.push(`Calorie: in media **${fmt(a.avgK)} kcal**, ${fmt(a.avgK - g.kcal)} oltre l'obiettivo di ${fmt(g.kcal)}.${a.top[0] ? ` Il cibo che pesa di più nelle ultime due settimane è **${a.top[0].name.toLowerCase()}** (${fmt(a.top[0].kcal)} kcal in ${a.top[0].n} ${a.top[0].n === 1 ? 'volta' : 'volte'}): riduci la porzione o sostituiscilo qualche volta.` : ''}`);
    if ((a.goal === 'gain' || a.goal === 'muscle') && a.avgK < g.kcal * .92) tips.push(`Calorie: in media **${fmt(a.avgK)} kcal**, ${fmt(g.kcal - a.avgK)} sotto l'obiettivo. Aggiungi uno spuntino: yogurt greco con muesli, oppure pane con burro di arachidi.`);
  }
  if (a.minor && a.logged >= 3 && a.avgK < g.kcal * .7) tips.push(`Stai mangiando meno di quello che serve a chi cresce. Non saltare i pasti e parlane con un genitore.`);
  if (!a.minor && a.weekendExtra > 300) tips.push(`Nel fine settimana mangi in media **${fmt(a.weekendExtra)} kcal in più** degli altri giorni. Il sabato e la domenica contano: prova a organizzare prima almeno un pasto.`);
  if (a.sweet >= 4) tips.push(`Bibite e succhi: **${a.sweet} volte** in due settimane. Sostituiscili con acqua, anche frizzante, o acqua e limone.`);
  const h = new Date().getHours();
  if ((a.today.water || 0) < g.water / 2 && h >= 13) { tips.push(`Acqua: oggi sei a **${a.today.water || 0} su ${g.water} bicchieri**. Bevine uno adesso.`); acts.push({ l:'Ho bevuto un bicchiere', a:'water' }); }
  return { tips, acts };
}
const porz = v => `${fmt1(v)} ${Math.round(v * 10) === 10 ? 'porzione' : 'porzioni'}`;
const numbered = tips => tips.map((x, i) => `${i + 1}. ${x}`).join('\n\n');
const coachIntents = [
  ['safety', /(non (voglio )?mangi(o|are) (più|niente|nulla)|digiun|vomit|anoress|bulimi|lassativ|odio il mio corpo|mi faccio schifo|saltare tutti i pasti|mangiare niente)/],
  ['plateau', /(non funzion|non dimagri|non perdo|non scend|stallo|fermo|ingrass|non cala|non va|non cambia niente)/],
  ['gain', /(non (ingrasso|metto su|prendo peso|cresco)|troppo magr)/],
  ['muscle', /(muscol|massa|palestra|forza|allenament|pesi|addominali)/],
  ['hungry', /(fame|affamat|voglia di mangiare)/],
  ['cheat', /(sgarr|esagerat|abbuff|troppo ieri|ho mangiato troppo|sfizio|strappo)/],
  ['meal', /(cosa mangio|che mangio|colazione|pranzo|cena|spuntino|merenda|ricett|cucino)/],
  ['week', /(settiman|come (sto|va|vado)|resoconto|riepilogo|andamento|progress)/],
  ['water', /(acqua|bere|sete|bicchier)/],
  ['motivation', /(motivaz|mollare|stanc|non ce la faccio|voglia|triste|scoraggi)/],
  ['weight', /(peso|obiettivo|chili|kg|bilancia)/],
  ['now', /(cosa faccio|che faccio|aiut|consigli|non so|cosa devo|ciao|salve|buongiorno|ehi)/],
];
// con un segnale di rischio presente la risposta comincia dall'invito gentile, qualunque sia la domanda sui numeri
function coachReply(text){
  const r = coachAnswer(text), risk = riskNow(true)[0];
  if (risk && r.numeric) r.t = `${RISK_TEXT[risk](ageOf(S.profile) < 18)}\n\n${r.t}`;
  return r;
}
function coachAnswer(text){
  const r = coachCore(text);
  r.numeric = COACH_NUMERIC.has((coachIntents.find(([, re]) => re.test((text || '').toLowerCase())) || ['fallback'])[0]);
  return r;
}
function coachCore(text){
  const q = (text || '').toLowerCase();
  const intent = (coachIntents.find(([, re]) => re.test(q)) || ['fallback'])[0];
  const a = analyze(), g = a.g, acts = [];
  if (!a.data.ok && COACH_NUMERIC.has(intent)) return coachPlain(intent, a);
  switch (intent) {
    case 'safety':
      return { t:`Quello che scrivi è importante e merita attenzione. **Parlane con una persona di cui ti fidi**: un genitore, il medico${a.minor ? ', il pediatra' : ''} o un insegnante.\n\nIn Italia puoi chiamare gratis il **Numero Verde SOS Disturbi Alimentari 800 180 969**.\n\nPiattino è un'app: può darti idee per mangiare bene, ma non sostituisce l'aiuto di una persona.` };
    case 'plateau': {
      if (a.minor) {
        const h = habitTips(a);
        return { t:`A ${a.age} anni il corpo cambia ogni mese, quindi il peso da solo non dice se stai andando bene. Guardiamo le abitudini:\n\n${h.tips.length ? numbered(h.tips.slice(0, 3)) : 'Le tue abitudini sono buone: pasti regolari, frutta, verdura e proteine. Continua così!'}\n\nSe qualcosa ti preoccupa, parlane con un genitore o con il pediatra.`, acts:h.acts };
      }
      const tr = trendAdvice(a), h = habitTips(a);
      const tips = [...tr.tips, ...h.tips].slice(0, 4);
      return { t:`Ho guardato gli ultimi 14 giorni. ${tips.length ? 'Ecco cosa ho trovato:\n\n' + numbered(tips) : 'Dai dati il piano sembra funzionare: calorie, proteine e abitudini sono in linea. I risultati si vedono sulle settimane, non sui giorni.'}${!S.profile.target ? '\n\nImposta un obiettivo di peso: così posso controllare se il piano funziona davvero.' : ''}`, acts:[...tr.acts, ...h.acts, ...(!S.profile.target ? [{ l:'Imposta l\'obiettivo', a:'open:goal' }] : [])] };
    }
    case 'gain': {
      if (a.minor) return { t:`Ognuno cresce con i suoi tempi. Per crescere bene: **tre pasti e due spuntini**, proteine a ogni pasto e tanto movimento. Se ti preoccupa il tuo peso, parlane con un genitore o con il pediatra.` };
      const tr = trendAdvice(a);
      return { t:`Per mettere su peso serve mangiare un po' più di quello che consumi, con costanza.\n\n${numbered([`In media mangi **${fmt(a.avgK)} kcal**, il tuo obiettivo è ${fmt(g.kcal)}.`, ...tr.tips, 'Aggiungi spuntini ricchi: yogurt greco e muesli, pane e burro di arachidi, frutta secca, latte.', 'Bevi l\'acqua lontano dai pasti, così non ti riempi troppo.'])}`, acts:tr.acts };
    }
    case 'muscle': {
      if (a.age < 14) return { t:`Alla tua età i muscoli crescono **giocando e muovendoti**:\n\n1. Sport o gioco all'aperto ogni giorno: corsa, nuoto, calcio, arrampicata.\n2. Esercizi a corpo libero: piegamenti, squat, plank, salti.\n3. Proteine a ogni pasto: latte, yogurt, uova, legumi, pesce o carne. In media ne mangi **${fmt(a.avgP)} g**, l'obiettivo è ${g.protein} g.\n4. Dormi 9-11 ore.\n\nNiente pesi pesanti e niente integratori: basta il cibo vero.` };
      const bp = a.prev.filter(x => x.t.n >= 2).map(x => (x.d.meals.colazione || []).reduce((s, e) => s + (+e.p || 0), 0));
      const avgBp = bp.length ? bp.reduce((s, v) => s + v, 0) / bp.length : 0;
      const tr = trendAdvice(a);
      const tips = [
        `Proteine: in media **${fmt(a.avgP)} g** al giorno, obiettivo ${g.protein} g${a.avgP < g.protein * .9 ? '. Sei sotto: aggiungi 20-30 g a pranzo e a cena (100 g di pollo, 150 g di yogurt greco, 2 uova)' : ': ottimo'}.`,
        avgBp < 15 && bp.length ? `A colazione mangi solo ${fmt(avgBp)} g di proteine: aggiungi yogurt greco, latte o uova, i muscoli le usano meglio se distribuite.` : null,
        a.goal === 'muscle' && a.avgK && a.avgK < g.kcal * .92 ? `Calorie sotto l'obiettivo (${fmt(a.avgK)} su ${fmt(g.kcal)}): senza un piccolo surplus il muscolo cresce poco.` : null,
        ...tr.tips,
        a.age < 18 ? 'Allenati con un istruttore, aumenta i carichi un po\' alla volta e dormi almeno 8 ore. Niente integratori senza il medico.' : 'Allenamento di forza 3-4 volte a settimana, aumentando i carichi un po\' alla volta, e 7-9 ore di sonno.',
      ].filter(Boolean);
      return { t:`Per i muscoli contano tre cose: **allenamento, proteine e recupero**.\n\n${numbered(tips.slice(0, 4))}`, acts:tr.acts };
    }
    case 'hungry': {
      const left = g.kcal - a.tt.kcal, slot = nextSlot(), idea = mealIdea(slot);
      if (a.minor) return { t:`Se hai fame, **mangia**: il tuo corpo sta crescendo. Scegli qualcosa che sazia: frutta, yogurt, pane integrale, frutta secca o un bicchiere di latte.\n\n${idea.t}`, acts:idea.acts };
      return { t:`${left > 200 ? `Oggi hai ancora circa **${fmt(left)} kcal** a disposizione: mangia pure.\n\n${idea.t}` : `Oggi sei quasi al tuo obiettivo (${fmt(a.tt.kcal)} su ${fmt(g.kcal)} kcal). Scegli cibi che saziano con poche calorie:\n\n1. Verdure crude: carote, finocchi, pomodori, cetrioli.\n2. Un frutto o uno yogurt greco.\n3. Un bicchiere d'acqua o una tisana: a volte la sete sembra fame.`}\n\nPer avere meno fame domani: proteine e verdure a ogni pasto e niente pasti saltati.`, acts:left > 200 ? idea.acts : [] };
    }
    case 'cheat':
      return { t:`Nessun problema: **un pasto non rovina niente**. Conta la media della settimana${a.data.ok && !a.minor ? `, che per ora è ${fmt(a.avgK)} kcal al giorno` : ''}.\n\n1. Al prossimo pasto torna alla normalità: niente digiuni per compensare.\n2. Bevi acqua e, se puoi, fai una passeggiata.\n3. Registra comunque quello che hai mangiato: serve per capire, non per giudicarti.`, acts:[{ l:'Registra un pasto', a:'open:scan' }] };
    case 'meal': {
      const map = { colazione:'Colazione', pranzo:'Pranzo', cena:'Cena', spuntino:'Spuntino', merenda:'Merenda' };
      const k = Object.keys(map).find(x => q.includes(x)); const slot = k ? map[k] : nextSlot();
      const idea = mealIdea(slot), left = g.kcal - a.tt.kcal, pleft = g.protein - a.tt.p;
      return { t:`${idea.t}${!a.minor && a.tt.n ? `\n\nOggi ti restano circa ${fmt(Math.max(0, left))} kcal e ${fmt(Math.max(0, pleft))} g di proteine.` : ''}\n\nNon ti piace? Nel Piano puoi toccare «Cambia menu».`, acts:[...idea.acts, { l:'Apri il piano', a:'open:plan' }] };
    }
    case 'week': {
      if (!a.logged) return { t:`Questa settimana non ci sono ancora giorni registrati bene. Comincia da oggi: fotografa i tuoi pasti e tra qualche giorno ti faccio un resoconto completo.`, acts:[{ l:'Fotografa un piatto', a:'open:scan' }] };
      const best = a.prev.filter(x => x.t.n >= 2).sort((x, y) => Math.abs(x.t.kcal - g.kcal) - Math.abs(y.t.kcal - g.kcal))[0];
      const lines = [
        `Giorni registrati: **${a.logged} su 7**.`,
        a.minor ? null : `Calorie medie: **${fmt(a.avgK)}** su ${fmt(g.kcal)} kcal.`,
        `Proteine medie: **${fmt(a.avgP)} g** su ${g.protein} g.`,
        `Frutta e verdura: **${porz(a.avgFv)}** al giorno su 5.`,
        `Acqua: **${fmt1(a.avgW)}** bicchieri al giorno su ${g.water}.`,
        best && !a.minor ? `Il giorno più in linea: ${esc(longDate(best.k))}.` : null,
        a.trend && !a.minor ? `Peso: ${a.trend.perWeek > 0 ? '+' : ''}${fmt1(a.trend.perWeek)} kg a settimana.` : null,
      ].filter(Boolean);
      const h = habitTips(a);
      return { t:`Ecco la tua settimana:\n\n${lines.map(l => '• ' + l).join('\n')}${h.tips.length ? `\n\nDa migliorare: ${h.tips[0]}` : '\n\nOttima settimana, continua così!'}`, acts:h.acts };
    }
    case 'water':
      return { t:`Oggi hai bevuto **${a.today.water || 0} bicchieri su ${g.water}**. ${(a.today.water || 0) >= g.water ? 'Obiettivo raggiunto, ottimo lavoro!' : 'Tieni una borraccia sempre vicino e bevi un bicchiere a ogni pasto.'}`, acts:(a.today.water || 0) < g.water ? [{ l:'Ho bevuto un bicchiere', a:'water' }] : [] };
    case 'motivation':
      return { t:`${pickQuote()}\n\n${a.logged ? `Negli ultimi 7 giorni ne hai registrati **${a.logged}**: è già un bel pezzo di strada.` : 'Ogni giorno va bene per ricominciare, anche oggi.'} Non serve fare tutto: scegli **una sola cosa** per oggi, per esempio un bicchiere d'acqua in più o una verdura a cena.` };
    case 'weight': {
      if (a.minor) return { t:`Mentre cresci non scegliamo un peso da raggiungere: conta come stai e cosa mangi. Puoi segnare il tuo peso in «Come cresci» insieme a un genitore.`, acts:[{ l:'Come cresci', a:'open:goal' }] };
      const t = S.profile.target;
      if (!t) return { t:`Non hai ancora un obiettivo di peso. Impostalo: ti dico quando ci arrivi e quante calorie ti servono al giorno.`, acts:[{ l:'Imposta l\'obiettivo', a:'open:goal' }] };
      const left = Math.round((t.kg - S.profile.weight) * 10) / 10, tr = trendAdvice(a);
      return { t:`Obiettivo: **${fmt1(t.kg)} kg**. Ora pesi ${fmt1(S.profile.weight)} kg: ${Math.abs(left) <= .2 ? 'obiettivo raggiunto, complimenti!' : `mancano **${fmt1(Math.abs(left))} kg**.`}${tr.tips.length ? '\n\n' + tr.tips.join('\n\n') : ''}`, acts:[...tr.acts, { l:'Aggiorna il peso', a:'open:weight' }] };
    }
    case 'now': case 'fallback': default: {
      if (intent === 'fallback' && q.trim()) return { t:`Non sono sicuro di aver capito. Posso aiutarti con queste cose: tocca una delle domande qui sotto.` };
      if (!a.logged && !a.tt.n) { const idea = mealIdea(nextSlot()); return { t:`Partiamo dalle basi: **registra quello che mangi oggi**. Tocca il pulsante verde e fotografa il piatto, oppure descrivilo a parole. Dopo qualche giorno ti dirò con precisione cosa cambiare.\n\n**Adesso:** ${idea.t}`, acts:[{ l:'Fotografa un piatto', a:'open:scan' }, ...idea.acts] }; }
      const tr = trendAdvice(a), h = habitTips(a), tips = [...tr.tips.filter(x => !/funziona/.test(x)), ...h.tips].slice(0, 3);
      const idea = mealIdea(nextSlot());
      return { t:`${tips.length ? `Ecco cosa ti consiglio, in ordine di importanza:\n\n${numbered(tips)}` : 'Stai andando bene: calorie, proteine, frutta e verdura sono in linea. Continua così!'}\n\n**Adesso:** ${idea.t}`, acts:[...tr.acts, ...h.acts, ...idea.acts] };
    }
  }
}
const md = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
function openCoach(){
  openSheet(`<div class="chat">${sheetHead('Coach', 'Chiudi')}
    <p class="chat-sub">Consigli calcolati dai tuoi dati, direttamente sul telefono</p>
    <div class="chat-log" id="chatLog" aria-live="polite"></div>
    <div class="chips" id="chatChips">${CHIPS.map(c => `<button data-a="coach-ask" data-q="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <form class="chat-input" id="chatForm"><textarea id="chatIn" rows="1" placeholder="Scrivi una domanda…" aria-label="Scrivi al coach"></textarea><button class="send" type="submit" aria-label="Invia">${I.up}</button></form>
  </div>`, true);
  S.chat.forEach(m => chatSeen.add(m)); renderChat(false, true);
  const f = $('#chatForm'), inp = $('#chatIn');
  f.addEventListener('submit', e => { e.preventDefault(); const v = inp.value.trim(); if (!v) return; inp.value = ''; coachAsk(v); });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); f.requestSubmit(); } });
  const last = S.chat[S.chat.length - 1];
  if (!last || last.day !== todayKey()) coachAsk('Cosa faccio ora?', true);
}
const chatSeen = new WeakSet();   // i fumetti già mostrati non rientrano di nuovo
function renderChat(typing, instant){
  const log = $('#chatLog'); if (!log) return;
  log.innerHTML = S.chat.slice(-40).map((m, i, arr) => `<div class="msg ${m.r}${chatSeen.has(m) ? '' : ' pop'}">${md(m.t)}${m.acts && m.acts.length && i === arr.length - 1 ? `<div class="acts">${m.acts.map(x => `<button data-a="coach-act" data-k="${esc(x.a)}">${esc(x.l)}</button>`).join('')}</div>` : ''}</div>`).join('') + (typing ? '<div class="typing" aria-label="Il coach sta scrivendo"><i></i><i></i><i></i></div>' : '');
  S.chat.forEach(m => chatSeen.add(m));
  log.scrollTo({ top: log.scrollHeight, behavior: instant || reduceMotion() ? 'auto' : 'smooth' });
}
async function coachAsk(q, silent){
  if (!silent) S.chat.push({ r:'me', t:q, day:todayKey() });
  renderChat(true);
  await sleep(650 + Math.random() * 500);
  let rep;
  try { rep = coachReply(q); } catch (e) { console.error(e); rep = { t:'Non sono riuscito a leggere i tuoi dati. Riprova tra poco.' }; }
  S.chat.push({ r:'bot', t:rep.t, acts:(rep.acts || []).slice(0, 4), day:todayKey() });
  S.chat = S.chat.slice(-40); Store.put();
  renderChat();
}
function coachAct(k){
  if (k.startsWith('kcal:')) {
    if (ageOf(S.profile) < 18) return;
    const before = T().kcal, d = +k.slice(5), max = CONFIG.safety.coachAdjMaxKcal;
    // un segnale di rischio blocca ogni riduzione, anche da un pulsante rimasto in una risposta vecchia
    const stop = d < 0 && riskNow(true).some(x => x === 'lowIntake' || x === 'fastLoss');
    if (!stop) { S.profile.kcalAdj = clamp((+S.profile.kcalAdj || 0) + d, -max, max); saveProfile(); }
    const after = T().kcal;
    S.chat.push({ r:'bot', t:after !== before ? `Fatto: il tuo obiettivo passa da ${fmt(before)} a **${fmt(after)} kcal** al giorno. Riparliamone tra due settimane, dopo altre due pesate.`
      : d < 0 ? `Non scendo oltre: ${fmt(after)} kcal è già il minimo prudente per te. Meglio puntare sul movimento, per esempio 30 minuti di camminata al giorno; se hai dubbi, parlane con il medico o con un dietista.`
      : `Non salgo oltre: ${fmt(after)} kcal è già il massimo prudente per te.`, day:todayKey() });
    Store.put(); renderChat(); render(); return;
  }
  if (k === 'water') { const d = ensureDay(todayKey()); d.water = Math.min(20, (d.water || 0) + 1); saveDay(todayKey()); S.chat.push({ r:'bot', t:`Segnato! Oggi sei a **${d.water} bicchieri**.`, day:todayKey() }); Store.put(); renderChat(); if (S.view === 'today') renderToday(); return; }
  if (k.startsWith('plan:')) { const m = buildPlan(todayKey())[+k.slice(5)]; if (!m) return; const keep = S.date; S.date = todayKey(); addEntries(m.meal, m.items.map(e => ({ ...e, id:rid() })), true); S.date = keep; S.chat.push({ r:'bot', t:`Aggiunto al diario: ${m.label.toLowerCase()} da ${fmt(m.items.reduce((a, e) => a + e.kcal, 0))} kcal.`, day:todayKey() }); Store.put(); renderChat(); render(); return; }
  if (k === 'open:goal') { closeSheet(true); openGoal(); return; }
  if (k === 'open:weight') { closeSheet(true); openWeight(); return; }
  if (k === 'open:profile') { closeSheet(true); actions['edit-profile'](); return; }
  if (k === 'open:diary') { closeSheet(); S.view = 'diary'; render(); window.scrollTo(0, 0); return; }
  if (k === 'open:plan') { closeSheet(); S.view = 'plan'; render(); window.scrollTo(0, 0); return; }
  if (k === 'open:scan') { closeSheet(true); openScanner(); }
}

/* ---------- sheets ---------- */
let sheetEl = null;
function openSheet(html, tall){
  closeSheet(true);
  const w = document.createElement('div'); w.className = 'sheet-wrap';
  w.innerHTML = `<div class="sheet${tall ? ' tall' : ''}" role="dialog" aria-modal="true"><div class="grabber"></div>${html}</div>`;
  w.addEventListener('click', e => { if (e.target === w) closeSheet(); });
  document.body.appendChild(w); document.body.classList.add('locked'); sheetEl = w; dragToDismiss(w);
  requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add('show')));
  return w;
}
function closeSheet(instant){
  if (!sheetEl) return; const w = sheetEl; sheetEl = null;
  if (!$('#scanner').classList.contains('show')) document.body.classList.remove('locked');
  if (instant) return w.remove();
  w.style.pointerEvents = 'none'; w.classList.remove('show'); setTimeout(() => w.remove(), 500);
}
// trascina lo sheet dalla maniglia o dalla barra: segue il dito, oltre metà corsa o con uno scatto veloce si chiude
function dragToDismiss(w){
  const sh = w.querySelector('.sheet'); let d = null;
  sh.addEventListener('pointerdown', e => {
    if (!e.target.closest('.grabber,.sheet-head,.chat-sub') || e.target.closest('button,a,input,textarea,select')) return;
    d = { id:e.pointerId, y0:e.clientY, dy:0, pts:[[e.timeStamp, e.clientY]] };
    try { sh.setPointerCapture(e.pointerId); } catch (x) {}
    sh.classList.add('dragging');
  });
  sh.addEventListener('pointermove', e => {
    if (!d || e.pointerId !== d.id) return;
    d.dy = e.clientY - d.y0; d.pts.push([e.timeStamp, e.clientY]); if (d.pts.length > 6) d.pts.shift();
    const y = d.dy > 0 ? d.dy : -Math.sqrt(-d.dy) * 2;                 // verso l'alto resiste, come un elastico
    sh.style.transform = `translateY(${y}px)`;
    w.style.background = `rgba(0,0,0,${(.4 * (1 - clamp(d.dy / sh.offsetHeight, 0, 1))).toFixed(3)})`;
  });
  const end = e => {
    if (!d || e.pointerId !== d.id) return;
    const [ta, ya] = d.pts[0], [tb, yb] = d.pts[d.pts.length - 1], v = (yb - ya) / Math.max(16, tb - ta);   // px/ms
    const close = d.dy > sh.offsetHeight * .35 || (v > .5 && d.dy > 20);
    d = null; sh.classList.remove('dragging'); sh.style.transform = ''; w.style.background = '';
    if (close) { if ($('#addRoot')) A.fromOutside = false; closeSheet(); }
  };
  sh.addEventListener('pointerup', end); sh.addEventListener('pointercancel', end);
}
// Chiudi è un pulsante solo con simbolo; Annulla resta a parole, a sinistra
const sheetHead = (title, left = 'Annulla', right = '') => `<div class="sheet-head">${left === 'Chiudi' ? `<button class="close-btn" data-a="sheet-close" aria-label="Chiudi">${I.x}</button>` : `<button class="link l" data-a="sheet-close">${left}</button>`}<h3>${esc(title)}</h3><span class="r">${right}</span></div>`;

/* ---- add food sheet ---- */
const A = { meal:'pranzo', tab:'db', q:'', src:null, grams:100 };
function openAdd(meal, src){
  A.pendingThumb = null; A.pendingEmb = null; A.memSk = null; A.fromOutside = false; A.meal = meal || autoMeal(); A.tab = S.foods.length && !src ? A.tab : 'db'; A.q = ''; A.src = src || null; A.grams = src ? src.grams : 100;
  openSheet(`<div id="addRoot" style="display:flex;flex-direction:column;min-height:0;flex:1"></div>`);
  renderAdd();
}
function renderAdd(){
  const root = $('#addRoot'); if (!root) return;
  if (A.src) {
    const s = A.src, e = entryFrom(s, A.grams);
    root.innerHTML = `${sheetHead('Aggiungi', 'Indietro')}
    <div class="sheet-body">
      <div class="big-food">${thumbHtml(s)}<h2>${esc(s.name)}</h2></div>
      <div class="stepper"><button data-a="g-step" data-d="-10" aria-label="Meno 10 grammi">−</button><input id="gramsIn" type="number" inputmode="numeric" value="${Math.round(A.grams)}" aria-label="Grammi"><button data-a="g-step" data-d="10" aria-label="Più 10 grammi">+</button></div>
      <p class="small muted" style="text-align:center;margin:0">grammi</p>
      <div class="nutri num" id="nutriBox">${nutriHtml(e)}</div>
      <div class="form-label" style="margin-left:4px">Pasto</div>
      <div class="seg">${MEALS.map(m => `<button class="${A.meal === m.k ? 'on' : ''}" data-a="add-meal" data-m="${m.k}">${m.l}</button>`).join('')}</div>
      <div style="margin-top:18px"><button class="btn primary" data-a="add-confirm">Aggiungi a ${esc(mealByK(A.meal).l)}</button></div>
    </div>`;
    const gi = $('#gramsIn'); gi.addEventListener('input', () => { A.grams = clamp(+gi.value || 0, 0, 5000); $('#nutriBox').innerHTML = nutriHtml(entryFrom(A.src, A.grams)); });
    return;
  }
  root.innerHTML = `${sheetHead('Aggiungi a ' + mealByK(A.meal).l)}
  <div class="sheet-body">
    <button class="btn primary" data-a="add-photo" style="margin-top:12px">${I.camera} Fotografa il piatto</button>
    <p class="or-line">oppure cercalo nell'elenco</p>
    <div class="seg">${[['db','Alimenti'],['my','I miei cibi'],['manual','A mano']].map(([t, l]) => `<button class="${A.tab === t ? 'on' : ''}" data-a="add-tab" data-t="${t}">${l}</button>`).join('')}</div>
    ${A.tab === 'manual' ? manualForm() : `<label class="search">${I.search}<input id="addSearch" type="search" placeholder="Cerca un alimento" value="${esc(A.q)}" autocomplete="off"></label><div class="group" id="addList"></div>`}
  </div>`;
  if (A.tab === 'manual') bindManual();
  else { const si = $('#addSearch'); si.addEventListener('input', () => { A.q = si.value; renderAddList(); }); renderAddList(); }
}
const nutriHtml = e => `<div><b>${fmt(e.kcal)}</b><span>kcal</span></div><div><b>${fmt1(e.p)}</b><span>Prot. g</span></div><div><b>${fmt1(e.c)}</b><span>Carb. g</span></div><div><b>${fmt1(e.f)}</b><span>Grassi g</span></div>`;
function renderAddList(){
  const box = $('#addList'); if (!box) return;
  const q = A.q.trim().toLowerCase();
  if (A.tab === 'my') {
    const list = S.foods.filter(f => !q || f.name.toLowerCase().includes(q));
    box.innerHTML = list.length ? list.map(f => `<button class="list-item" data-a="add-pick-my" data-id="${esc(f.id)}">${thumbHtml(f)}<div class="grow"><div>${esc(f.name)}</div><div class="small muted num">${fmt(f.kcal)} kcal · ${fmt(f.grams)} g</div></div>${I.right.replace('<svg', '<svg class="chev"')}</button>`).join('')
      : `<div class="pad muted">${S.foods.length ? 'Nessun risultato.' : 'Scansiona un piatto e memorizzalo: lo ritroverai qui.'}</div>`;
    return;
  }
  const fq = fold(q), list = FOODS.filter(f => !fq || (f.find || (f.find = fold([f.name, ...(SYN[f.key] || []), ...(KW[f.key] || [])].join('|')))).includes(fq));
  box.innerHTML = list.length ? list.map(f => `<button class="list-item" data-a="add-pick-db" data-k="${f.key}">${thumbHtml(f)}<div class="grow"><div>${esc(f.name)}</div><div class="small muted num">${fmt(f.kcal*f.portion/100)} kcal · ${f.portion} g</div></div>${I.right.replace('<svg', '<svg class="chev"')}</button>`).join('')
    : `<div class="pad muted">Nessun alimento trovato. Prova «A mano» per inserirlo tu.</div>`;
}
function manualForm(){
  return `<form id="mform" novalidate style="margin-top:12px">
  <div class="group">
    <div class="field"><label for="m-name">Nome</label><input id="m-name" name="name" placeholder="Es. Torta della nonna" maxlength="40"></div>
    <div class="field"><label for="m-g">Quantità</label><input id="m-g" name="grams" type="number" inputmode="numeric" placeholder="100"><span class="unit">g</span></div>
    <div class="field"><label for="m-k">Calorie</label><input id="m-k" name="kcal" type="number" inputmode="numeric" placeholder="0"><span class="unit">kcal</span></div>
    <div class="field"><label for="m-p">Proteine</label><input id="m-p" name="p" type="number" inputmode="decimal" placeholder="0"><span class="unit">g</span></div>
    <div class="field"><label for="m-c">Carboidrati</label><input id="m-c" name="c" type="number" inputmode="decimal" placeholder="0"><span class="unit">g</span></div>
    <div class="field"><label for="m-f">Grassi</label><input id="m-f" name="f" type="number" inputmode="decimal" placeholder="0"><span class="unit">g</span></div>
    <div class="field"><label for="m-fv" style="width:auto;flex:1">È frutta o verdura</label><span class="toggle"><input id="m-fv" name="fv" type="checkbox"><span></span></span></div>
  </div>
  <div class="err" id="merr" role="alert"></div>
  <button class="btn primary" type="submit">Aggiungi a ${esc(mealByK(A.meal).l)}</button></form>`;
}
function bindManual(){
  const f = $('#mform');
  f.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(f), n = k => Math.max(0, +String(fd.get(k) || '0').replace(',', '.') || 0);
    const name = String(fd.get('name') || '').trim();
    if (!name) return $('#merr').textContent = 'Scrivi il nome dell\'alimento.';
    const grams = n('grams') || 100;
    addEntries(A.meal, [{ id:rid(), name, icon:'piatto', thumb:null, grams, kcal:Math.round(n('kcal')), p:n('p'), c:n('c'), f:n('f'), fv:fd.get('fv') ? fvFor(true, grams) : 0 }]);
    closeSheet();
  });
}
function addEntries(meal, entries, silent){
  const k = S.date, d = ensureDay(k);
  d.meals[meal] = [...(d.meals[meal] || []), ...entries];
  saveDay(k);
  if (!silent) toast(`${CHEERS[Math.floor(Math.random()*CHEERS.length)]} ${fmt(entries.reduce((a, e) => a + e.kcal, 0))} kcal`);
  if (S.view === 'today') renderToday();
}

/* ---- entry detail ---- */
function openEntry(meal, id){
  const e = (getDay(S.date).meals[meal] || []).find(x => x.id === id); if (!e) return;
  openSheet(`${sheetHead(mealByK(meal).l, 'Chiudi')}
  <div class="sheet-body">
    <div class="big-food">${thumbHtml(e)}<h2>${esc(e.name)}</h2><div class="muted num">${fmt(e.grams)} g${e.fv ? ` · ${fmt1(e.fv)} porz. frutta e verdura` : ''}</div></div>
    <div class="nutri num">${nutriHtml(e)}</div>
    <div class="stack" style="margin-top:14px">
      <button class="btn tinted" data-a="entry-memo" data-m="${meal}" data-id="${esc(id)}">Memorizza nei miei cibi</button>
      <button class="btn danger" data-a="entry-del" data-m="${meal}" data-id="${esc(id)}">Elimina dal diario</button>
    </div>
  </div>`);
}
function openSavedFood(id){
  const f = S.foods.find(x => x.id === id); if (!f) return;
  openSheet(`${sheetHead('I miei cibi', 'Chiudi')}
  <div class="sheet-body">
    <div class="big-food">${thumbHtml(f)}<h2>${esc(f.name)}</h2><div class="muted num">${fmt(f.grams)} g · ${fmt(f.kcal)} kcal</div></div>
    <div class="nutri num">${nutriHtml(f)}</div>
    <div class="stack" style="margin-top:14px">
      <button class="btn primary" data-a="food-add" data-id="${esc(id)}">Aggiungi al diario</button>
      <button class="btn danger" data-a="food-del" data-id="${esc(id)}">Rimuovi dai miei cibi</button>
    </div>
  </div>`);
}

/* ---------- scanner ---------- */
const SC = { state:'idle', img:null, blob:null, thumb:null, desc:'', code:'', items:[], tip:'', memo:true, meal:'pranzo', ctl:null, err:'' };
const scanner = $('#scanner');
const canCamera = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && !SC.camOff;
function openScanner(meal, rect){
  Object.assign(SC, { img:null, square:null, thumb:null, desc:'', items:[], tip:'', err:'', zoom:1 });
  SC.meal = meal || (S.date === todayKey() ? autoMeal() : 'pranzo');
  SC.state = canCamera() ? 'camera' : 'idle';
  scanOrigin(rect); scanner.classList.add('show'); scanner.setAttribute('aria-hidden', 'false'); document.body.classList.add('locked');
  // finita l'apertura il bordo diventa esattamente quello dello schermo (raggio 0, gli angoli li ritaglia il display)
  clearTimeout(SC.flatT); SC.flatT = setTimeout(() => scanner.classList.add('flat'), 650);
  renderScanner(); if (SC.state === 'camera') startCamera();
}
// lo scanner cresce dal pulsante che lo apre e, chiudendosi, rientra in «Aggiungi pasto» (se è in vista)
function scanOrigin(rect){
  let r = rect;
  if (!r) { const b = $('.add-meal'), q = b && b.getBoundingClientRect(); if (q && q.width && q.bottom > 0 && q.top < innerHeight) r = q; }
  scanner.style.setProperty('--ox', (r ? r.left + r.width / 2 : innerWidth / 2) + 'px');
  scanner.style.setProperty('--oy', (r ? r.top + r.height / 2 : innerHeight * .8) + 'px');
}
function closeScanner(){
  SC.run = (SC.run || 0) + 1; SC.state = 'idle'; attesaStop(true); stopCamera();
  clearTimeout(SC.flatT); scanOrigin(); scanner.classList.remove('show', 'flat'); scanner.setAttribute('aria-hidden', 'true');
  if (!sheetEl) document.body.classList.remove('locked');
  if (SC.img) { try { URL.revokeObjectURL(SC.img); } catch (e) {} }
}
async function startCamera(){
  if (SC.stream || !canCamera()) { if (SC.stream) attachCamera(); return; }
  // ogni avvio ha il suo numero: se nel frattempo ne parte un altro (o la fotocamera si ferma) questo stream si chiude subito
  const run = SC.camRun = (SC.camRun || 0) + 1;
  const live = () => run === SC.camRun && scanner.classList.contains('show') && SC.state === 'camera';
  // 0,5× senza zoom hardware: si apre direttamente la fotocamera ultra grandangolare
  const uw = (SC.zoom || 1) < 1 && SC.facing !== 'user' && !SC.hw && SC.uwId;
  const video = { width:{ ideal:1920 }, height:{ ideal:1920 } };
  if (uw) video.deviceId = { exact:uw }; else video.facingMode = { ideal:SC.facing || 'environment' };
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ video, audio:false }); }
  catch (e) {
    if (run !== SC.camRun) return;
    if (uw) { camUltraFail(); return startCamera(); }   // l'ultra grandangolo non si apre: si torna a 1× senza errori
    SC.camOff = true; if (SC.state === 'camera') { SC.state = 'idle'; renderScanner(); }
    return;
  }
  const end = () => stream.getTracks().forEach(t => t.stop());
  if (!live()) return end();
  const t = stream.getVideoTracks()[0];
  SC.onUw = !!uw;
  if (!uw) await camLenses(t);
  if (!live()) return end();
  if ((SC.zoom || 1) < 1 && !uw) {
    if (SC.hw) { try { await t.applyConstraints({ advanced:[{ zoom:SC.hw.ultra }] }); } catch (e) { camUltraFail(); } }
    else SC.zoom = 1;
    if (!live()) return end();
  }
  SC.stream = stream; attachCamera(); camZoomPaint();
}
function stopCamera(){ SC.camRun = (SC.camRun || 0) + 1; if (SC.stream) { SC.stream.getTracks().forEach(t => t.stop()); SC.stream = null; } }
function attachCamera(){
  const v = $('#camVideo'); if (!v || !SC.stream) return;
  v.srcObject = SC.stream; v.play().catch(() => {});
  v.classList.toggle('mirror', SC.facing === 'user'); v.classList.remove('busy');
  const w = $('#camWait'); if (w) w.hidden = true;
}
/* obiettivi: SC.zoom è lo zoom scelto nella pillola (0,5 · 1 · 2). Sotto 1 serve l'ultra grandangolo vero, mai un ritaglio:
   - zoom hardware: sugli iPhone con Dual Wide o Triple Camera Safari apre il dispositivo virtuale e WebKit espone
     zoom.min 0,5 (1 = grandangolo normale), quindi basta applyConstraints({ zoom:0.5 }) sullo stesso stream;
   - altrimenti la fotocamera posteriore «ultra grandangolare» separata (riconosciuta dal nome, che c'è solo dopo il permesso).
   Il 2× resta lo zoom digitale (video ingrandito + ritaglio nello scatto). Lo zoom si azzera a ogni apertura dello scanner. */
const ULTRA_RE = /ultra|超广角|超廣角|超広角|초광각/i, FRONT_RE = /front|anterior|frontal|avant|vorder|前|전면/i;
const camDigital = () => Math.max(1, SC.zoom || 1);   // con l'ultra grandangolo lo zoom digitale è 1
const camZoomTxt = z => String(+z.toFixed(1)).replace('.', ',') + '×';
async function camLenses(t){
  SC.hw = null;
  if (!t || SC.facing === 'user') return;
  const caps = t.getCapabilities ? t.getCapabilities() : {}, set = t.getSettings ? t.getSettings() : {};
  const base = set.zoom || 1;
  if (caps.zoom && caps.zoom.min < base - .05) { SC.hw = { base, ultra:Math.max(caps.zoom.min, base / 2) }; return; }
  if (SC.uwId !== undefined) return;   // la ricerca per nome si fa una volta sola per sessione
  try {
    const devs = await navigator.mediaDevices.enumerateDevices();
    const d = devs.find(x => x.kind === 'videoinput' && x.deviceId && x.deviceId !== set.deviceId && ULTRA_RE.test(x.label) && !FRONT_RE.test(x.label));
    SC.uwId = d ? d.deviceId : null;
  } catch (e) { SC.uwId = null; }
}
function camZooms(){
  const u = SC.facing === 'user' ? 0 : SC.hw ? SC.hw.ultra / SC.hw.base : SC.uwId ? .5 : 0;
  return u ? [u, 1, 2] : [1, 2];
}
function camZoomPill(){
  return camZooms().map(z => {
    const on = Math.abs(z - (SC.zoom || 1)) < .01, t = camZoomTxt(z);
    return `<button class="${on ? 'on' : ''}" data-a="cam-zoom" data-z="${z}" aria-pressed="${on}" aria-label="${z < 1 ? 'Grandangolo' : 'Zoom'} ${t}">${t}</button>`;
  }).join('');
}
function camZoomPaint(){
  const p = $('#camZoom'), v = $('#camVideo');
  if (v) v.style.setProperty('--z', camDigital());
  if (!p) return;
  const k = camZooms().join();
  if (p.dataset.k !== k) { p.dataset.k = k; p.innerHTML = camZoomPill(); return; }
  p.querySelectorAll('button').forEach(b => { const on = Math.abs(+b.dataset.z - (SC.zoom || 1)) < .01; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
}
function camWaitShow(txt){
  const w = $('#camWait'), v = $('#camVideo');
  if (w) { w.textContent = txt; w.hidden = false; }
  if (v) v.classList.add('busy');
}
function camUltraFail(){
  SC.hw = null; SC.uwId = null; SC.onUw = false; SC.zoom = 1; camZoomPaint();
  toast('Grandangolo non disponibile: torno a 1×', true);
}
async function camSetZoom(z){
  const was = SC.zoom || 1; if (!z || Math.abs(z - was) < .01) return;
  SC.zoom = z; camZoomPaint();
  if (SC.facing === 'user' || (was < 1) === (z < 1)) return;   // 1× ↔ 2× è solo digitale
  const t = SC.stream && SC.stream.getVideoTracks()[0];
  if (SC.hw && !SC.onUw) {
    if (!t) return;   // lo stream sta partendo: lo zoom scelto lo applica startCamera
    try { await t.applyConstraints({ advanced:[{ zoom:z < 1 ? SC.hw.ultra : SC.hw.base }] }); }
    catch (e) { if (z < 1) camUltraFail(); }
    return;
  }
  // obiettivo separato: si chiude lo stream di prima e si apre l'altro (mai due fotocamere accese insieme)
  camWaitShow('Cambio obiettivo…'); stopCamera(); startCamera();
}
async function snapCamera(){
  // durante «Cambio obiettivo…» (o senza stream) niente scatto: si catturerebbe un fotogramma vecchio o nero
  const v = $('#camVideo'); if (!v || !v.videoWidth || !SC.stream || v.classList.contains('busy')) return;
  const f = $('#camFlash'); if (f) { f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
  // ritaglia esattamente ciò che vedi nel mirino (object-fit: cover + zoom digitale; l'ultra grandangolo è già nel video)
  const vw = v.videoWidth, vh = v.videoHeight, ew = v.clientWidth, eh = v.clientHeight;
  const sc = Math.max(ew / vw, eh / vh), z = camDigital();
  const cw = ew / sc / z, ch = eh / sc / z;
  const c = document.createElement('canvas'); c.width = Math.round(cw); c.height = Math.round(ch);
  c.getContext('2d').drawImage(v, (vw - cw) / 2, (vh - ch) / 2, cw, ch, 0, 0, c.width, c.height);
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .92));
  await sleep(180);
  stopCamera();
  if (blob) handlePhoto(blob);
}
function renderCamera(){
  const last = (S.foods.find(f => f.thumb) || {}).thumb;
  scanner.innerHTML = `<div class="cam">
    <div class="cam-top"><button class="close-btn" data-a="scan-close" aria-label="Chiudi">${I.x}</button><span class="pill">${esc(mealByK(SC.meal).l)}</span><span></span></div>
    <div class="cam-view">
      <video id="camVideo" playsinline muted autoplay style="--z:${camDigital()}"></video>
      <div class="cam-wait" id="camWait" ${SC.stream ? 'hidden' : ''}>Avvio la fotocamera…</div>
      <div class="cam-guide"><i></i><i></i><i></i><i></i></div>
      <div class="cam-hint ios-glass">Inquadra tutto il piatto dall'alto</div>
      <div class="cam-zoom ios-glass" id="camZoom" role="group" aria-label="Zoom" data-k="${camZooms().join()}">${camZoomPill()}</div>
      <div class="cam-flash" id="camFlash"></div>
    </div>
    <div class="cam-bottom">
      <div class="cam-modes"><button data-a="scan-describe">DESCRIVI</button><button class="on" aria-current="true">FOTO</button></div>
      <div class="cam-controls">
        <button class="cam-lib" data-a="pick-photo" aria-label="Scegli dalla libreria">${last ? `<img src="${esc(last)}" alt="">` : I.photos}</button>
        <button class="shutter" data-a="cam-shot" aria-label="Scatta"><span></span></button>
        <button class="cam-flip" data-a="cam-flip" aria-label="Cambia fotocamera">${I.flip}</button>
      </div>
    </div>
  </div>`;
  attachCamera();
}
function renderScanner(){
  if (SC.state === 'camera') return renderCamera();
  const st = SC.state;
  const cls = st === 'scanning' ? 'scanning' : (st === 'idle' || st === 'describe') ? 'idle-mode' : 'done';
  const status = { idle: 'Fotografa il tuo piatto', describe:'Descrivi il tuo piatto', scanning:`<span class="dots">${SC.desc ? 'Leggo la descrizione' : 'Analizzo la foto'}</span>`, error:'Non ci sono riuscito', result:'Ecco cosa ho trovato' }[st];
  const sub = st === 'idle' ? 'Il riconoscimento avviene sul tuo telefono: le foto non escono dal dispositivo.' : st === 'error' ? esc(SC.err) : st === 'scanning' ? esc(SC.sub || 'Riconosco forme, colori e ingredienti') : st === 'describe' ? 'Scrivi cosa hai mangiato, anche con le quantità: «2 uova, 50 g di pane e un\'insalata».' : '';
  scanner.innerHTML = `
  <div class="scan-top"><button class="close-btn" data-a="scan-close" aria-label="Chiudi">${I.x}</button><span class="scan-title">Scansiona il piatto</span><span></span></div>
  <div class="scan-main ${cls}">
    <div class="stage"><div class="rig">
      <div class="plate">${SC.img ? `<img src="${SC.img}" alt="La tua foto">` : `<div class="idle ico">${foodIco('piatto')}</div>`}</div>
      <div class="beam"></div>
      <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
      <div id="tags"></div>
    </div></div>
    <div class="status" id="scanStatus">${status}</div>
    <div class="status-sub" id="scanSub">${sub}</div>
    ${st === 'scanning' ? `<div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" id="scanProg"><div class="prog-pct" id="scanPct">${Math.round(SC.pctShown || 0)}%</div><div class="prog-bar"><i id="scanBar" style="width:${SC.pctShown || 0}%"></i></div></div><p class="scan-wait ${attesaClass()}" id="scanWait" role="status" aria-live="polite">${attesaText()}</p>` : ''}
    <div class="scan-actions">
      ${st === 'idle' ? `<button class="btn primary" data-a="pick-photo">${I.camera} Scatta o scegli una foto</button><button class="btn tinted" data-a="scan-describe">Descrivi a parole</button>` : ''}
      ${st === 'describe' ? `<textarea id="scanDesc" class="scan-desc" rows="3" maxlength="400" placeholder="Es. un piatto di pasta al pomodoro, una mela e un bicchiere di latte">${esc(SC.desc || '')}</textarea><button class="btn primary" data-a="scan-desc-go">${I.spark} Analizza</button>${canCamera() ? `<button class="btn tinted" data-a="scan-again">Torna alla fotocamera</button>` : ''}` : ''}
      ${st === 'scanning' ? `<button class="btn primary scan-wait-btn" id="scanWaitBtn" data-a="scan-wait-describe" ${SC.waitLvl >= 2 ? '' : 'hidden'}>Descrivi a parole</button><button class="btn tinted" data-a="scan-stop">Annulla</button>` : ''}
      ${st === 'error' ? `<button class="btn primary" data-a="scan-again">${I.camera} Riprova</button><button class="btn tinted" data-a="scan-describe">Descrivi a parole</button><button class="btn tinted" data-a="scan-manual">Cerca nell'elenco</button>` : ''}
    </div>
  </div>
  <div class="result" id="scanResult"></div>`;
  if (st === 'describe') setTimeout(() => $('#scanDesc')?.focus(), 350);
  if (st !== 'scanning') attesaStop();
}
const STATUS_STEPS = ['Analizzo forme e colori', 'Riconosco gli ingredienti', 'Stimo le porzioni', 'Calcolo i nutrienti'];
async function prepImage(file){
  const url = URL.createObjectURL(file);
  let img;
  try { img = await createImageBitmap(file); }
  catch (e) { img = new Image(); img.src = url; await img.decode(); }
  const W = img.width || img.naturalWidth, H = img.height || img.naturalHeight, side = Math.min(W, H);
  const t = document.createElement('canvas'); t.width = t.height = 112;
  t.getContext('2d').drawImage(img, (W - side)/2, (H - side)/2, side, side, 0, 0, 112, 112);
  const sq = document.createElement('canvas'); sq.width = sq.height = 320;   // ritaglio centrale per il riconoscimento
  sq.getContext('2d').drawImage(img, (W - side)/2, (H - side)/2, side, side, 0, 0, 320, 320);
  return { url, square: sq, thumb: t.toDataURL('image/jpeg', .7) };
}

/* on-device recognition: two models working together
   - MobileNet (ImageNet): frutta, verdura e cibi semplici
   - AIY Food V1 (Google): 2.024 piatti da tutto il mondo, convertito in TensorFlow.js float16 */
const MODELS = {
  mobile: { url:'model/model.json', mb:14 },
  food: { url:'model-food/model.json', labels:'model-food/labels.json', mb:10 },
};
// MB da scaricare: PiattinoScan; se non si carica, i due modelli di Google
const MODEL = { mb: 4.5, google: MODELS.mobile.mb + MODELS.food.mb };
// Il modello generico (MobileNet, ImageNet) è affidabile solo per i cibi «da soli»: un frutto, una verdura, un panino, un gelato.
const SIMPLE = {
  'banana':'banana','granny smith':'mela','strawberry':'fragole','orange':'arancia','lemon':'limone','fig':'fichi','pineapple':'ananas','ananas':'ananas',
  'pomegranate':'melagrana','custard apple':'frutta','jackfruit':'frutta','broccoli':'broccoli','cauliflower':'cavolfiore','zucchini':'zucchine','courgette':'zucchine',
  'cucumber':'cetrioli','cuke':'cetrioli','bell pepper':'peperoni','mushroom':'funghi','corn':'mais','ear':'mais','head cabbage':'cavolo','artichoke':'carciofi',
  'globe artichoke':'carciofi','butternut squash':'zucca','acorn squash':'zucca','guacamole':'guacamole','pizza':'pizza','pizza pie':'pizza','cheeseburger':'burger',
  'hotdog':'hotdog','hot dog':'hotdog','red hot':'hotdog','burrito':'burrito','espresso':'caffe','ice cream':'gelato','icecream':'gelato','ice lolly':'ghiacciolo',
  'lolly':'ghiacciolo','popsicle':'ghiacciolo','bagel':'bagel','beigel':'bagel','pretzel':'pretzel','french loaf':'pane',
};
// queste classi scattano anche su tanti piatti gialli o misti: da sole valgono meno
const SHAKY = new Set(['mais','zucca','guacamole','caffe','funghi','burrito','pane','cavolo']);
// classi «da piatto» del modello generico: non diventano una voce, sostengono solo la categoria vista dal modello dei piatti
const MN_VOTE = { 'carbonara':'pasta','consomme':'soup','soup bowl':'soup','hot pot':'curry','hotpot':'curry','mashed potato':'potato','potpie':'meat','meat loaf':'meat','meatloaf':'meat','trifle':'dessert','chocolate sauce':'dessert','chocolate syrup':'dessert' };
const DISH_HINTS = ['plate','soup bowl','mixing bowl','tray','wok','frying pan','dining table','restaurant','bakery','grocery store','ladle','spatula','coffee mug','cup','spaghetti squash'];
// categorie per i 2.024 piatti del secondo modello: nome, icona, kcal, proteine, carboidrati, grassi (per 100 g), porzione, frutta/verdura
const CATS = {
  pasta:['Primo di pasta','pasta',160,6,25,4.5,300,0], rice:['Piatto di riso','riso',150,4,26,3.5,300,0], noodle:['Noodles','noodles',170,6,27,4,300,0],
  soup:['Zuppa','zuppa',55,3,6,2,350,1], salad:['Insalata condita','insalata',90,2.5,6,6.5,200,1], dessert:['Dolce','torta',330,5,45,15,100,0],
  sandwich:['Panino','panino',250,11,28,10,200,0], meat:['Secondo di carne','bistecca',210,24,3,12,180,0], chicken:['Pollo','pollo',200,25,4,9,180,0],
  fish:['Pesce','pesce',150,20,3,6,180,0], seafood:['Frutti di mare','gamberi',110,17,4,3,180,0], egg:['Uova','uovo-padella',155,11,2,11.5,150,0],
  fried:['Fritto','fritto',280,10,25,16,150,0], bread:['Pane e lievitati','baguette',290,9,50,6,80,0], pancake:['Frittelle','pancake',230,6,30,9,150,0],
  veg:['Verdure cucinate','broccolo',80,2.5,8,4.5,200,1], legumes:['Legumi','fagioli',140,8,20,3,250,0], curry:['Spezzatino o curry','curry',130,9,8,7,300,0],
  dumpling:['Ravioli e fagottini','ravioli',220,9,28,8,200,0], cheese:['Formaggio','formaggio',350,24,2,28,60,0], dish:['Piatto misto','piatto',170,8,18,7,250,0],
  potato:['Piatto di patate','patata',130,2.5,18,5.5,200,0], porridge:['Polenta o purea','cereali',95,2.5,18,1.5,250,0], salumi:['Salumi','salame',300,22,1,24,50,0],
  sausage:['Salsiccia','salsiccia',300,17,1,25,120,0],
};
// le etichette che le parole chiave qui sotto non riconoscono, raggruppate per categoria
const CAT_LABELS = {
  soup:"miyan kuka|minestra di ceci|sciusceddu|suimono|chueo-tang|sop saudara|acquacotta|maccu|ginestrata|garmugia|caldo de queso|dashi|tom kha kai|miyeok-guk|imoni|haejang-guk|soto|magiritsa|avgolemono|bouillabaisse|sundubu-jjigae|sinseollo|gulyásleves|shchi|pozole|ribollita|rassolnik|jeongol|menudo|wodzionka|guk|czernina|ash reshteh|kharcho|hulatang|galbi-tang|mandu-guk|ori-tang|butajiru|solyanka|cullen skink|harira|caldo de siete mares|tarator|zōni|tteokguk|vichyssoise|okroshka|booyah|sinigang|khash|samgye-tang|seolleongtang|caldillo de perro|sopa de gato|bob chorba|hochzeitssuppe|maeun-tang|tarhana|ciorbă|chorba|caldeirada|ajoblanco|zosui|tourin|dovga|caldo tlalpeño|caldo gallego|zuppa toscana|salmorejo|gazpachuelo|pappa al pomodoro|cawl|tom yum|ukha|chikhirtma|oden|soto ayam|soto mie|bak kut teh|piti|kaeng som|sayur asem|sayur lodeh|empal gentong|ciorbă de perișoare|keledoş|mykyrokka|garbure|escudella i carn d'olla|doenjang-jjigae|budae jjigae|jjigae|gamja-tang|fugu chiri|harihari-nabe|motsunabe|hot pot|thai suki|buddha jumps over the wall|caldo de pollo|açorda|bakso|tekwan|konro|lablabi|sambar|bagnun|matelote|shabu-shabu|sukiyaki|mu kratha|lapskaus|mulukhiyah|stracciatella|kadhi|solkadhi|majjige huli|pachi pulusu|porra antequerana|shimotsukare|nimono|ohaw|geng|lung fung soup",
  rice:"riso patate e cozze|chahan|sartù|saleeg|nasi tumpang|arroz chaufa|omo tuo|jambalaya|oyakodon|tekkadon|nasi lemak|kedgeree|kateh|chitranna|majboos|sekihan|ketupat|lontong|zongzi|gyūdon|bibimbap|xôi|gimbap|arroz a la cubana|tamago kake gohan|thieboudienne|kushari|loco moco|arròs negre|spam musubi|hoppin' john|arroz con pollo|lo mai gai|nasi liwet|maqluba|nasi bogana|galinhada|ogok-bap|cơm tấm|puliyogare|mandi|takikomi gohan|kamameshi|khichdi|vangibath|spanakorizo|chazuke|nasi timbel|tahri|waakye|nasi campur|nasi dagang|quzi|cifantuan|kiritanpo|lemang|couscous|bento|sadhya|pakhala|lontong cap go meh|cabidela|sabudana khichadi|attiéké|tabbouleh|shab deg|teochew porridge",
  pasta:"malloreddus|pizokel|pansotti|pisarei e faśö|passatelli|garganelli|pizzoccheri|johnny marzetti|american chop suey|tetrazzini|pastitsio|giouvetsi|fusi|mlinci|halušky|bryndzové halušky|strapačky|spätzle|schupfnudel|túrós csusza|fideuà|kopytka|hotdish|sulu köfte",
  noodle:"yi mein|lai fun|kal-guksu|youmian|cumian|mixian|hiyashi chūka|janchi-guksu|char kway teow|naengmyeon|zhajiangmian|misua|liangpi|champon|japchae|shahe fen|mee pok|mee siam|banmian|mak-guksu|lamian|bánh canh|bún bò huế|khao soi|ohn no khao swè|khauk swè thoke|phat si-io|rat na|nan gyi thohk|meeshay|mi krop|mie kocok|mie kangkung|hōtō|bún riêu|ants climbing a tree|bún ốc|thukpa|kesme|yaka mein|zhaliang|bánh cuốn|idiyappam|liangfen|laping|nam ngiao|naryn|kottu|erkuai",
  curry:"efo riro|calulu|thịt kho tàu|dimlama|gulai|rendang|gumbo|rogan josh|mapo doufu|kaldereta|kare-kare|tajine|carbonade flamande|hachee|ghormeh sabzi|philippine adobo|nihari|birria|ropa vieja|xacuti|sarapatel|pasanda|burgoo|étouffée|nikujaga|galbi-jjim|maafe|moambe|fesenjān|gheimeh|saltah|fahsa|haleem|wat|chakhchoukha|mrouzia|tochitură|ostropel|mućkalica|pichelsteiner|baeckeoffe|cozido à portuguesa|cocido lebaniego|cocido montañés|cocido madrileño|olla podrida|potée|chanakhi|tongseng|amok trey|kaeng pa|kaeng khae|kaeng tai pla|shahi paneer|palak paneer|paneer tikka|ema datshi|chakapuli|machher jhol|asam pedas|yahni|tharid|ndolé|caruru|balchão|woku|daheen|kuurdak|bò 7 món|yuxiang|shuizhu|guaiwei|ladob|cachupa|sarson da saag|minchee|picadillo|qeema|gopchang-jeongol|dak-bokkeum-tang|agwi-jjim",
  legumes:"cassoulet|feijoada|chana masala|rajma|chole bhature|misal|usal|ghugni|shiro|ful medames|fasolada|gigandes plaki|lobio|tavče gravče|pasulj|frijoles charros|fabes con almejas|fasole cu cârnați|frejon|revithia|caparrones|umngqusho|moin moin|shahan ful|baghali ghatogh|feijão de óleo de palma|nattō|burmese tofu|hiyayakko|agedashi dōfu|stinky tofu|tahu goreng|tahu sumedang|tahu tek-tek|fabada asturiana|brenebon|jókai bean soup|ekuru|chakalaka|succotash",
  meat:"carne a la tampiqueña|bruckfleisch|köttbullar|bò lúc lắc|bulgogi|shashlik|souvlaki|satay|churrasco|carne asada|london broil|bistek|bife a cavalo|schweinshaxe|flæskesteg|pinnekjøtt|lechazo|suckling pig|méchoui|siu yuk|char siu|babi panggang|bossam|jokbal|kakuni|tonkatsu|kotlet schabowy|karađorđeva šnicla|escalope|saltimbocca|vitello tonnato|cordon bleu|wallenbergare|frikadeller|frikkadel|ćevapi|pljeskavica|mititei|kofta|kibbeh|sheftalia|arrosticini|espetada|frigărui|sosatie|suya|chislic|spiedie|pincho|jingisukan|yakiniku|horumonyaki|liver and onions|rostbrätel|vanillerostbraten|sautéed reindeer|rinflajš|bull roast|burnt ends|al pastor|nuea phat phrik|jing jiang rou si|nam tok|larb|kitfo|gored gored|choila|seswaa|zrazy|gołąbki|sarma|dolma|punjena paprika|moussaka|tepsi baytinijan|mixiote|bò nướng lá lốt|mince and tatties|millionbøf|slavink|balkenbrij|scrapple|goetta|leberkäse|pölsa|tripe|dobradinha|tripes à la mode de caen|fuqi feipian|baodu|mala mogodu|kuchmachi|foie gras|pâté|liver pâté|aspic|pihtije|surf and turf|zürcher geschnetzeltes|svíčková|sauerbraten|tafelspitz|cochinita pibil|barbacoa|carnitas|machaca|beshbarmak|gepuk|poc chuc|carne de porco à alentejana|carne de vinha d'alhos|grillades|chilorio|afelia|smalahove|fårikål|æbleflæsk|makchang|dak-galbi|bakkwa|kilishi|pemmican|kokoretsi|skilpadjies|hornazo|bedfordshire clanger|bridie|pieds paquets|lawar|koi|leberknödel|pringá",
  salumi:"prosciutto di norcia|salami|bratwurst|kielbasa|andouille|chorizo|fuet|isterband|ciauscolo|loukaniko|falukorv|debrecener|boerewors|prosciutto|mortadella|jamón|jamón serrano|jamón ibérico|merguez|chistorra|medisterpølse|fläskkorv|prinskorv|boudin|botifarra|landjäger|mustamakkara|moronga|andouillette|skilandis|lebanon bologna|chả lụa|caltaboș|cudighi|rullepølse|qazı|sai ua|naem|salo|cecina|ciccioli|jambon persillé|frikandel",
  chicken:"ayam masak merah|har cheong gai|ayam goreng|murgh musallam|coq au vin|yakitori|kai yang|swiss wing|buffalo wing|jujeh kabab|shish taouk|galinha à portuguesa|galinha à africana|laziji|musakhan|ayam bakar|satsivi|kombdi vade|kedjenou|yassa|flying jacob|squab|cornish game hen",
  fish:"baccalà alla lucana|pecel lele|finnan haddie|masgouf|bacalhau|bacalhau à zé do pipo|bacalhau com natas|bacalhau à gomes de sá|bacalhau à brás|bacalhau com todos|brandade|gravlax|lutefisk|rakfisk|rollmops|arbroath smokie|fesikh|cabbie claw|crappit heid|unagi|huachinango a la veracruzana|sambal stingray|ikan goreng|hinava|poke|yusheng|hoe|paling in 't groen|nanbanzuke|karasumi|pollock roe|tarama|ankimo|coulibiac|kalakukko|quenelle|buridda",
  seafood:"aguachile|scampi|moules-frites|san-nakji|shiokara|cincalok|escargot|cappon magro",
  egg:"yam khai dao|gyeran-ppang|huevos motuleños|huevos rancheros|huevos divorciados|hangtown fry|menemen|shakshouka|çılbır|gyeran-jjim|chawanmushi|khai yat sai|oeufs en meurette|kerak telor|quiche|soufflé",
  salad:"vinegret|fattoush|kachumbari|kosambari|salată de boeuf|gado-gado|ketoprak|urap|lalab|ulam|asinan|namul|chwinamul|celery victor|raita|cacık|dakos|pico de gallo|curtido|nam khao|namasu|meze|pkhali",
  veg:"utica greens|zaalouk|carciofi alla giudia|nopalito|baba ghanoush|skordalia|matbukha|makdous|santula|escalivada|pisto|sataraš|lecsó|piperade|ajapsandali|karnıyarık|stuffed squash|chile relleno|rajas con crema|romeritos|creamed corn|elote|corn relish|mashed pumpkin|zarangollo|buddha's delight|gundruk|tsukemono|pao cai|murături|dongchimi|umeboshi|podvarak|torta pasqualina|erbazzone",
  potato:"papet vaudois|gratin dauphinois|stoemp|rösti|pyttipanna|home fries|truffade|aligot|boxty|colcannon|champ|stamppot|janssons frestelse|patatnik|brændende kærlighed|rössypottu|tatws pum munud|kroppkaka|knedle|pâté aux pommes de terre|trinxat",
  porridge:"bazin|tuwo shinkafa|funge|pirao|mămăligă|tuwo masara|kokonte|akple|tuo zaafi|polenta|žganci|asida|fufu|gachas|ugali|kačamak|nshima/nsima|pap|amala|eba|garri|gari|dhindo|konkonte|kenkey|ogi|ga'at|koozh|ragi mudde|upma|grits|øllebrød|khichu|kondowole|ambuyat|gofio|frangollo|harees|keşkek",
  sandwich:"pastrami on rye|pigs in a blanket|jibarito|po' boy|patty melt|french dip|mitraillette|sloppy joe|muffuletta|francesinha|francesinha poveira|hot brown|maxwell street polish|hamdog|double down|smørrebrød|dyrlægens natmad|smörgåstårta|runza|cemita|pambazo|torta|blt|half-smoke|hot wiener|tantuni|gringas|sincronizada|fluffernutter|fool's gold loaf|tlayuda|huarache|sope|gordita|chalupa|tostada|panucho|salbute|memela|tlacoyo|molote|enchilada|entomatada|chilaquiles|nachos|fajita|chimichanga|taquito|tamale|corunda|pastel azteca|mollete|pan bagnat|welsh rarebit|murtabak",
  fried:"carrozza|gnocco fritto|chả giò|popiah|takoyaki|korokke|kushikatsu|onion ring|mozzarella sticks|hushpuppy|acarajé|panelle|bhaji|bakwan|punugulu|kachori|briouat|youtiao|lángos|vetkoek|sgabeo|dodo ikire|alloco|kuli-kuli|milho frito|cuchifritos|smažený sýr|kaassoufflé|bamischijf|mücver|lekor|ngo hiang",
  dumpling:"jiaozi|shumai|har gow|baozi|nikuman|manti|khinkali|chuchvara|kalduny|maultasche|knödel|fun guo|suanla chaoshou|dim sum|bánh bột lọc|gỏi cuốn",
  cheese:"queijo do pico|ġbejna|obatzda|frico|tirokafteri|urnebes|kartoffelkäse|queso flameado|gougère",
  bread:"ka'ak|casatiello|kalach|schiacciata|crescentina modenese|kisra|yufka|pampushka|fouée|wotou|injera|mughlai paratha|bakarkhani|sel roti|cottage loaf|himbasha|kitcha|thalipeeth|manchet|pogača|cong you bing|blaa|farl|mantou|boortsog|coca|challah|potbrood|bhakri|puri|luchi|khubz|jolada rotti|obi non|pane carasau|pane di altamura|zopf|bolillo|lahoh|broa|bolo do caco|bing|laobing|shaobing|pathiri|khakhra|dhebra|roti jala|fougasse|taralli|tortas de aceite|bolani|qutab|khachapuri|lobiani|kibinai|banitsa|börek|zelnik|plăcintă|sarburma|manakish|flammekueche|pa amb tomàquet|borlengo|popara|panada|torricado|idli|puttu|dhokla|sanna|pistolette|karelian pasty|pirog|pirozhki|rönttönen|korovai|rusk|popover|folar|yin si juan",
  pancake:"jianbing|pannenkoek|okonomiyaki|pajeon|palatschinke|bánh xèo|baghrir|ploye|chataamari|fläskpannkaka",
  dessert:"bambalouni|ghoriba|boeber|khanom tan|spongata|mattentaart|cartellate|khanom mo kaeng|roccocò|bint al-sahn|puran poli|chapssal-tteok|bibikkan|bundevara|makowiec|kutsinta|sirop de liège|muhallebi|koba|pitsi-pitsî|kuih|chongos zamoranos|candied almonds|couque de dinant|thapthim krop|sutarfeni|kwareżimal|dango|mochi|uirō|hong dou tang|kakigōri|bolo de arroz|croquembouche|s'more|beignet|pączki|amanattō|lokma|turrón|kladdkaka|cherries jubilee|churma|dobos torte|kissel|churchkhela|annin tofu|tanghulu|ma'amoul|taiyaki|syrniki|anpan|semla|castella|hanabiramochi|dampfnudel|koulourakia|imagawayaki|capirotada|jian dui|calisson|lo mai chi|kulolo|pantua|qubani-ka-meetha|boondi|gugelhupf|sachima|malpua|chhena gaja|kalamay|puto|sheer khurma|profiterole|dulce de leche|shaved ice|hotteok|kalakand|ghevar|khira sagara|coconut bar|rosca de reyes|soan papdi|café liégeois|chè|pootharekulu|torta tre monti|ghari|makroudh|slatko|qatayef|kulfi|krówki|sachertorte|palitaw|panjiri|quarkkäulchen|snickerdoodle|calas|basbousa|watalappam|higashi|gulab jamun|chomchom|kürtőskalács|sfenj|gujia|panocha|sklandrausis|gozinaki|lazarakia|puff puff|speculaas|brandy snaps|trdelník|kringle|cranachan|mille-feuille|thekua|blondie|poffertjes|pain au chocolat|cobbler|kouign-amann|bananas foster|kozhukkatta|kūčiukai|kutia|buchteln|patoleo|rigó jancsi|madeleine|namagashi|struffoli|frozen banana|mekitsa|balushahi|jalebi|sopaipilla|knickerbocker glory|bara brith|double ka meetha|moustalevria|parfait|berliner|apple crisp|babka|pastiera|diples|kompot|torta caprese|black forest gateau|bündner nusstorte|ais kacang|rabri|sapin-sapin|coyotas|stroopwafel|khaja|polkagris|kokis|chhena jalebi|chhena kheeri|kifli|havregrynskugle|tompouce|risalamande|kheer|sfouf|mysore pak|bear claw|rasgulla|angel wings|halo-halo|salt water taffy|linzer torte|shrikhand|rødgrød|bienenstich|fios de ovos|modak|kolach|eton mess|kaju katli|ruske kape|grass jelly|tong sui|buttermilk koldskål|melonpan|haupia|galaktoboureko|tilkut|barfi|crème caramel|chhena jhili|krumkake|nian gao|tulumba|kanafeh|petit gâteau|cocada amarela|gyūhi|clafoutis|ostkaka|guilinggao|spettekaka|sfogliatella|vatrushka|mustacciuoli|szaloncukor|panettone|floating island|zeeuwse bolus|smulpaj|tangyuan|túró rudi|flummery|assidat zgougou|shekerbura|teurgoule|rum baba|strawberry delight|seri muka|cocada|anarsa|šakotis|jam roly-poly|mucenici|bougatsa|germknödel|yule log|kansar|barmbrack|pastel de nata|shave ice|tsoureki|tufahije|bavarian cream|ambrosia|gibassier|paska|runeberg torte|sultsina|kabuni|kulich|panellets|manjū|chikki|champorado|cozonac|enduri pitha|kakara pitha|mazurek|carac|vispipuuro|canjica|paskha|ras malai|bungeo-ppang|gosh-e fil|oliebol|yaksik|rijstevlaai|vlaai|sandesh|finikia|bibingka|imarti|krofne|uštipci|rožata|kroštule|fritule|protein bar|chhena poda|poornalu|esterházy torte|magenbrot|fuling jiabing|sukhdi|arisa pitha|bolo de mel|clootie|scotcheroos|schuxen|caramel|zwetschgenkuchen|amandine|azerbaijani pakhlava|melomakarono|cornulețe|doodhpak|međimurska gibanica|khanom chan|žemlovka|tinginys|sunnundallu|kalu dodol|modjeska|pan dulce|cronut|bionico|racuchy|thong yip|thiakry|basundi|brown betty|khabees|mämmi|spotted dick|douhua|jiuniang|sago|pan de muerto|suman|tortell|lakhamari|pustakari",
};
const LABEL_CAT = {}; for (const [cat, list] of Object.entries(CAT_LABELS)) list.split('|').forEach(n => LABEL_CAT[n] = cat);
// etichette che corrispondono a un cibo preciso dell'elenco, e la categoria a cui quel cibo appartiene
const DB_LABEL = { 'risotto':'risotto','white rice':'risobianco','polenta':'polenta','croissant':'cornetto','fruit salad':'frutta','prosciutto':'crudo','minestrone':'minestrone','ribollita':'minestrone',
  'meatloaf':'polpettone','spanish rice':'risopom','mashed potato':'pure',
  // salsicce fresche o cotte: un piatto, non un affettato
  'sausage':'salsiccia','bratwurst':'salsiccia','kielbasa':'salsiccia','breakfast sausage':'salsiccia','loukaniko':'salsiccia','falukorv':'salsiccia','boerewors':'salsiccia','merguez':'salsiccia','chistorra':'salsiccia','sai ua':'salsiccia','botifarra':'salsiccia','cudighi':'salsiccia','andouille':'salsiccia','prinskorv':'salsiccia','fläskkorv':'salsiccia','medisterpølse':'salsiccia','debrecener':'salsiccia','isterband':'salsiccia' };
const DB_CAT = { salsiccia:'sausage', polpettone:'meat', risopom:'rice', lasagne:'pasta', carbonara:'pasta', minestrone:'soup', burger:'sandwich', hotdog:'sandwich', pure:'potato', patatine:'potato', hummus:'legumes', guacamole:'veg', gelato:'dessert', risotto:'rice', risobianco:'rice', polenta:'porridge', cornetto:'bread', crudo:'salumi' };
const FOOD_RULES = [
  [/lasagn/, 'db:lasagne'], [/carbonara/, 'db:carbonara'], [/minestrone/, 'db:minestrone'], [/cheeseburger|hamburger/, 'db:burger'], [/hot dog|corn dog|dodger dog|texas tommy/, 'db:hotdog'],
  [/mashed potato/, 'db:pure'], [/^hummus$/, 'db:hummus'], [/guacamole/, 'db:guacamole'], [/muesli/, 'db:muesli'], [/pizza|sardenara/, 'db:pizza'],
  [/ice cream|gelato|frozen yogurt|sorbet|sundae|banana split|affogato/, 'db:gelato'], [/french fries|fries$|chips$/, 'db:patatine'], [/pancake|waffle|crêpe|crepe|french toast/, 'pancake'],
  [/omelet|frittata|scrambled|egg(s)?\b|shakshuka/, 'egg'], [/curry|stew|chili|tagine|goulash|ragout|casserole/, 'curry'],
  [/rice pudding|rice krispies|glorified rice/, 'dessert'],
  [/risotto|arancini|paella|rice|biryani|pilaf|pilau|jollof|sushi|onigiri|congee/, 'rice'],
  [/spaghetti|pasta|macaroni|penne|fettuccine|linguine|tagliatelle|rigatoni|ravioli|tortellini|gnocchi|cannelloni|orecchiette/, 'pasta'],
  [/noodle|ramen|\bpho\b|pad thai|lo mein|chow mein|udon|soba|laksa/, 'noodle'], [/soup|broth|chowder|bisque|borscht|gazpacho|consomm|zuppa|minestra/, 'soup'], [/salad|slaw/, 'salad'],
  [/pot pie|meat pie|pork pie|shepherd|cottage pie/, 'meat'],
  [/cake|\bpie\b|tart|pudding|cookie|biscuit|brownie|muffin|donut|doughnut|pastry|strudel|baklava|macaron|mousse|brûlée|brulee|panna cotta|tiramis|cupcake|meringue|trifle|fudge|candy|chocolate|cannoli|churro|éclair|eclair|flan|custard|halva|dessert|sweet|torte|jelly/, 'dessert'],
  [/sandwich|burger|wrap|kebab|shawarma|gyro|taco|burrito|quesadilla|panini|piadina|\bsub\b|toast|bruschetta/, 'sandwich'],
  [/chicken|duck|turkey|goose|poultry/, 'chicken'], [/salmon|tuna|cod\b|fish|trout|herring|sardine|anchov|mackerel|kipper|halibut|ceviche/, 'fish'],
  [/shrimp|prawn|lobster|crab|clam|mussel|oyster|scallop|squid|calamari|octopus|seafood/, 'seafood'],
  [/sausage|salami|ham\b|bacon/, 'salumi'],
  [/beef|steak|pork|lamb|veal|mutton|meatball|meat|ribs|brisket|schnitzel|cutlet|pizzaiola/, 'meat'],
  [/dumpling|gyoza|pierogi|momo|wonton|samosa|empanada|bao\b/, 'dumpling'], [/bean|lentil|chickpea|\bdal\b|dhal|falafel|tofu/, 'legumes'],
  [/bread|\bbun\b|\broll\b|bagel|focaccia|pretzel|baguette|naan|pita|flatbread|croissant|brioche/, 'bread'],
  [/fried|tempura|fritter|croquette|nugget|pakora/, 'fried'], [/cheese|fondue|raclette/, 'cheese'], [/potato|gratin/, 'potato'],
  [/eggplant|aubergine|vegetable|zucchini|spinach|cabbage|mushroom|pepper|tomato|parmigiana|ratatouille|cucumber|pickle|gobi|aloo|cauliflower|broccoli|carrot|okra|kimchi|sauerkraut|caponata|asparagus|artichoke|beet/, 'veg'],
];
function foodTarget(label){
  const l = label.toLowerCase();
  if (DB_LABEL[l]) return 'db:' + DB_LABEL[l];
  if (LABEL_CAT[l]) return LABEL_CAT[l];
  for (const [re, t] of FOOD_RULES) if (re.test(l)) return t;
  return 'dish';
}
// nomi italiani dei piatti più comuni; gli altri prendono il nome della categoria
const IT = {
  'fried rice':'Riso saltato','thai fried rice':'Riso saltato','yangzhou fried rice':'Riso saltato','pilaf':'Riso pilaf','paella':'Paella','hyderabadi biryani':'Riso biryani','sushi':'Sushi','couscous':'Couscous','arroz con pollo':'Riso con pollo','jambalaya':'Riso con carne e verdure','bibimbap':'Riso con verdure e uovo',
  'spaghetti':'Spaghetti','spaghetti aglio e olio':'Spaghetti aglio e olio','spaghetti alle vongole':'Spaghetti alle vongole','pasta salad':'Insalata di pasta','macaroni salad':'Insalata di pasta','macaroni and cheese':'Pasta al formaggio','gnocchi':'Gnocchi','ravioli':'Ravioli','tortellini':'Tortellini','cannelloni':'Cannelloni','pizzoccheri':'Pizzoccheri','spätzle':'Spätzle',
  'french onion soup':'Zuppa di cipolle','miso soup':'Zuppa di miso','pea soup':'Zuppa di piselli','cabbage soup':'Zuppa di cavolo','leek soup':'Zuppa di porri','caldo de pollo':'Zuppa di pollo','consommé':'Brodo','chowder':'Zuppa cremosa','gazpacho':'Gazpacho','pappa al pomodoro':'Pappa al pomodoro','bouillabaisse':'Zuppa di pesce','zuppa toscana':'Zuppa toscana','minestra di ceci':'Minestra di ceci','goulash':'Gulasch','ramen':'Ramen','udon':'Udon','pho':'Pho','macaroni soup':'Minestra con pasta','egg drop soup':'Zuppa con uovo','tomato and egg soup':'Zuppa di pomodoro e uovo',
  'omelette':'Frittata','frittata':'Frittata','scrambled eggs':'Uova strapazzate','fried egg':'Uovo al tegamino','shakshouka':'Uova al pomodoro','quiche':'Torta salata',
  'caesar salad':'Insalata Caesar','greek salad':'Insalata greca','caprese salad':'Caprese','coleslaw':'Insalata di cavolo','potato salad':'Insalata di patate','tabbouleh':'Tabbouleh',
  'falafel':'Falafel','kebab':'Kebab','nachos':'Nachos','quesadilla':'Quesadilla','taco':'Tacos','enchilada':'Enchilada','fajita':'Fajita','club sandwich':'Club sandwich','blt':'Panino con bacon','bruschetta':'Bruschetta','toast':'Toast',
  'meatball':'Polpette','schnitzel':'Cotoletta','steak':'Bistecca','roast chicken':'Pollo arrosto','fried chicken':'Pollo fritto','chicken curry':'Pollo al curry','ragout':'Ragù','saltimbocca':'Saltimbocca','vitello tonnato':'Vitello tonnato','mortadella':'Mortadella','salami':'Salame','chorizo':'Salame piccante','bratwurst':'Salsiccia','arrosticini':'Arrosticini','souvlaki':'Spiedini di carne','satay':'Spiedini di carne','tonkatsu':'Cotoletta di maiale','köttbullar':'Polpette',
  'parmigiana':'Parmigiana di melanzane','ratatouille':'Ratatouille','pisto':'Verdure in padella','moussaka':'Moussaka','carciofi alla giudia':'Carciofi alla giudia','erbazzone':'Erbazzone','torta pasqualina':'Torta pasqualina',
  'focaccia':'Focaccia','schiacciata':'Schiacciata','taralli':'Taralli','pane carasau':'Pane carasau','gnocco fritto':'Gnocco fritto','panelle':'Panelle','carrozza':'Mozzarella in carrozza','mozzarella sticks':'Mozzarella fritta','onion ring':'Anelli di cipolla',
  'gratin dauphinois':'Gratin di patate','rösti':'Rösti di patate','home fries':'Patate in padella',
  'scampi':'Scampi','bacalhau':'Baccalà','baccalà alla lucana':'Baccalà','gravlax':'Salmone marinato','poke':'Poke','sashimi':'Sashimi','tempura':'Tempura','fish and chips':'Pesce fritto con patate','moules-frites':'Cozze con patate fritte',
  'gyoza':'Ravioli al vapore','jiaozi':'Ravioli al vapore','baozi':'Panini al vapore','dim sum':'Dim sum','spring roll':'Involtini primavera','pad thai':'Pad thai','chow mein':'Noodles saltati','japchae':'Noodles saltati',
  'tiramisu':'Tiramisù','panna cotta':'Panna cotta','cheesecake':'Cheesecake','apple pie':'Torta di mele','brownie':'Brownie','pancake':'Pancake','waffle':'Waffle','crêpe':'Crêpe','french toast':'French toast','muffin':'Muffin','doughnut':'Ciambella','cannoli':'Cannoli','panettone':'Panettone','pastiera':'Pastiera','sfogliatella':'Sfogliatella','profiterole':'Profiterole','crème caramel':'Crème caramel','sachertorte':'Torta Sacher','torta caprese':'Torta caprese','struffoli':'Struffoli','madeleine':'Madeleine','parfait':'Semifreddo','rice pudding':'Budino di riso','mochi':'Mochi',
  'bologna sausage':'Mortadella','pepperoni':'Salame piccante','salo':'Lardo','sausage sandwich':'Panino con salsiccia','sausage stroganoff':'Salsiccia in umido',
  'roast beef':'Roast beef','veal':'Vitello','steak tartare':'Tartare di manzo','escalope':'Scaloppina','cordon bleu':'Cordon bleu','liver and onions':'Fegato alla veneziana','carne pizzaiola':'Carne alla pizzaiola','stuffed peppers':'Peperoni ripieni','cabbage roll':'Involtini di verza','salisbury steak':'Svizzera di manzo','beef bourguignon':'Manzo stufato al vino','oxtail stew':'Coda alla vaccinara','tripe':'Trippa','tripe soup':'Trippa in brodo','suckling pig':'Maialino arrosto','kofta':'Polpette speziate','smyrna meatballs':'Polpette al sugo','chili con carne':'Chili con carne','steak sandwich':'Panino con bistecca','swiss steak':'Bistecca in umido','delmonico steak':'Bistecca','london broil':'Bistecca alla griglia','sweet and sour pork':'Maiale in agrodolce','pork and beans':'Fagioli con maiale','meatcake':'Polpettone',
  'chicken nugget':'Crocchette di pollo','chicken fingers':'Bastoncini di pollo','buffalo wing':'Alette di pollo','tandoori chicken':'Pollo tandoori','butter chicken':'Pollo al curry e burro','peking duck':'Anatra laccata','crispy fried chicken':'Pollo fritto','chicken sandwich':'Panino con pollo','orange chicken':"Pollo all'arancia",'sesame chicken':'Pollo al sesamo','coq au vin':'Pollo al vino','chicken paprikash':'Pollo alla paprika','yakitori':'Spiedini di pollo',
  'fried fish':'Pesce fritto','fried shrimp':'Gamberi fritti','octopus':'Polpo','squid':'Calamari','crab cake':'Polpette di granchio','steamed clams':'Vongole','clam chowder':'Zuppa di vongole','ceviche':'Ceviche','fish ball':'Polpette di pesce','kipper':'Aringa affumicata','escargot':'Lumache','garlic butter shrimp':'Gamberi al burro e aglio','tuna fish sandwich':'Panino al tonno','lobster roll':"Panino all'astice",'unagi':'Anguilla','brandade':'Baccalà mantecato','tuna casserole':'Pasta al tonno gratinata',
  'caponata':'Caponata','fried eggplant':'Melanzane fritte','garden salad':'Insalata mista','waldorf salad':'Insalata Waldorf','cobb salad':'Insalata Cobb','pickled cucumber':'Cetriolini sottaceto','baked potato':'Patata al forno','potato wedges':'Patate a spicchi','potato skins':'Bucce di patate ripiene','salt potatoes':'Patate lesse','fried green tomatoes':'Pomodori verdi fritti','stuffed squash':'Zucchine ripiene','fried plantain':'Platano fritto','creamed corn':'Mais alla crema','spanakopita':'Torta salata agli spinaci','tiropita':'Torta salata al formaggio','kimchi':'Kimchi','green bean casserole':'Fagiolini gratinati','tartiflette':'Patate gratinate al formaggio',
  'sandwich':'Panino','cheese sandwich':'Panino al formaggio','ham and cheese sandwich':'Toast prosciutto e formaggio','piadina':'Piadina','wrap':'Piadina arrotolata','submarine sandwich':'Panino lungo','rye bread':'Pane di segale','cornbread':'Pane di mais','challah':'Pane dolce intrecciato','pain au chocolat':'Saccottino al cioccolato','cinnamon roll':'Girella alla cannella','pastry':'Pasticcino','croquette':'Crocchette','arancini':'Arancini','stromboli':'Calzone arrotolato','shawarma':'Kebab','gyro':'Gyros','empanada':'Empanada','samosa':'Samosa','dumpling':'Ravioli al vapore','wonton':'Ravioli cinesi','pierogi':'Ravioli polacchi','xiaolongbao':'Ravioli al vapore','har gow':'Ravioli di gamberi','chips and dip':'Patatine e salsa','deviled egg':'Uova ripiene','century egg':'Uovo centenario','pizza bagel':'Pizzetta',
  'tart':'Crostata','cupcake':'Cupcake','chocolate brownie':'Brownie','chocolate chip cookie':'Biscotto con gocce di cioccolato','butter cookie':'Biscotto al burro','meringue':'Meringa','macaron':'Macaron','churro':'Churros','baklava':'Baklava','strudel':'Strudel','apple strudel':'Strudel di mele','apple cake':'Torta di mele','pound cake':'Plumcake','swiss roll':'Rotolo dolce','sundae':'Coppa gelato','ice cream cake':'Torta gelato','chocolate pudding':'Budino al cioccolato','tapioca pudding':'Budino','mango pudding':'Budino al mango','flan':'Crème caramel','pecan pie':'Torta di noci','pumpkin pie':'Torta di zucca','cherry pie':'Crostata di ciliegie','blueberry pie':'Crostata di mirtilli','mince pie':'Tortina di frutta secca','shortcake':'Torta con panna e fragole','red velvet cake':'Torta red velvet','coconut cake':'Torta al cocco','angel food cake':'Torta soffice','tres leches cake':'Torta al latte','german chocolate cake':'Torta al cioccolato','fudge':'Caramelle mou','halva':'Halva','pastel de nata':'Pastel de nata','rum baba':'Babà','mooncake':'Dolce della luna','berliner':'Bombolone','beignet':'Bombolone','funnel cake':'Frittella','fried dough':'Frittella','honey cake':'Torta al miele','banana pudding':'Budino alla banana',
  'coconut rice':'Riso al cocco','duck rice':'Riso con anatra','onigiri':'Polpetta di riso','congee':'Zuppa di riso','kimchi fried rice':'Riso saltato','american fried rice':'Riso saltato','hokkien fried rice':'Riso saltato','omurice':'Frittata di riso','hainanese chicken rice':'Riso con pollo','claypot chicken rice':'Riso con pollo','red beans and rice':'Riso e fagioli','jollof rice':'Riso al pomodoro speziato','dirty rice':'Riso con carne','mango sticky rice':'Riso dolce al mango','rice and gravy':'Riso con sugo di carne',
  'lo mein':'Noodles saltati','yakisoba':'Noodles saltati','chinese noodles':'Noodles','wonton noodles':'Noodles con ravioli','beef noodle soup':'Zuppa di noodles e manzo','dandan noodles':'Noodles piccanti','drunken noodles':'Noodles saltati','yaki udon':'Udon saltati',
  'borscht':'Zuppa di barbabietole','oxtail soup':'Zuppa di coda','bisque':'Crema di crostacei','corn chowder':'Zuppa di mais','sweet potato soup':'Vellutata di patate dolci','bread soup':'Zuppa di pane','scotch broth':"Zuppa d'orzo",'hot pot':'Bollito orientale','avgolemono':'Zuppa al limone','lettuce soup':'Zuppa di lattuga','cucumber soup':'Zuppa fredda di cetrioli',
  'grits':'Polenta bianca','mămăligă':'Polenta','cassoulet':'Fagioli con carne','feijoada':'Fagioli con carne','chana masala':'Ceci al curry','ful medames':'Fave stufate','fasolada':'Zuppa di fagioli','tofu':'Tofu',
};
// piatti di riso e di pasta: il colore distingue la variante, e le altre restano a portata di tocco
const GENERIC = { rice:new Set(['risotto','white rice','pilaf','coconut rice','rice and gravy']), pasta:new Set(['spaghetti','pasta salad','macaroni salad']) };
const VARIANTS = { rice:['risozaff','risotto','risobianco','risopom'], pasta:['pastapom','pastabianco','pastapesto','carbonara'] };

/* PiattinoScan: la rete e il caricamento dei pesi stanno in scan.js */
// classi di PiattinoScan → voci dell'app: id di un cibo dell'elenco, [categoria, nome] o [nome, icona, kcal, P, C, G (per 100 g), porzione, frutta/verdura].
// I cibi extra hanno già l'id del cibo dell'elenco.
const SCAN_MAP = {
  apple_pie:['dessert','Torta di mele'], baby_back_ribs:['meat','Costine di maiale'], baklava:['dessert','Baklava'], beef_carpaccio:['Carpaccio di manzo','bistecca',130,21,1,5,100,0],
  beef_tartare:['Tartare di manzo','bistecca',180,20,2,10,150,0], beet_salad:['salad','Insalata di barbabietole'], beignets:['dessert','Bomboloni'], bibimbap:['rice','Bibimbap'],
  bread_pudding:['dessert','Budino di pane'], breakfast_burrito:'burrito', bruschetta:['Bruschetta','pomodoro',200,5,30,7,100,0], caesar_salad:['Insalata Caesar','insalata',150,7,7,11,250,1],
  cannoli:['Cannoli','cannolo',370,7,40,20,100,0], caprese_salad:['Insalata caprese','mozzarella',180,10,3,14,200,1], carrot_cake:['dessert','Torta di carote'], ceviche:['fish','Ceviche'],
  cheese_plate:['cheese','Tagliere di formaggi'], cheesecake:['Cheesecake','torta',320,6,26,22,120,0], chicken_curry:['curry','Pollo al curry'], chicken_quesadilla:['sandwich','Quesadilla'],
  chicken_wings:['chicken','Alette di pollo'], chocolate_cake:['dessert','Torta al cioccolato'], chocolate_mousse:['dessert','Mousse al cioccolato'], churros:['dessert','Churros'],
  clam_chowder:['soup','Zuppa di vongole'], club_sandwich:['sandwich','Club sandwich'], crab_cakes:['fried','Polpette di granchio'], creme_brulee:['dessert','Crème brûlée'],
  croque_madame:['sandwich','Toast con uovo'], cup_cakes:['dessert','Cupcake'], deviled_eggs:['egg','Uova ripiene'], donuts:['Ciambelle','ciambella',420,5,50,22,70,0],
  dumplings:['dumpling','Ravioli al vapore'], edamame:['Edamame','fagiolini',120,11,9,5,100,1], eggs_benedict:['egg','Uova alla Benedict'], escargots:['seafood','Lumache'],
  falafel:['Falafel','polpette',330,13,32,18,100,0], filet_mignon:['Filetto di manzo','bistecca',200,28,0,9,150,0], fish_and_chips:['fried','Pesce e patatine'], foie_gras:['meat','Foie gras'],
  french_fries:'patatine', french_onion_soup:['soup','Zuppa di cipolle'], french_toast:['pancake','French toast'], fried_calamari:['Calamari fritti','calamaro',230,15,15,12,150,0],
  fried_rice:['rice','Riso saltato'], frozen_yogurt:'gelato', garlic_bread:['bread',"Pane all'aglio"], gnocchi:['Gnocchi al sugo','gnocchi',150,3.5,28,3,250,0],
  greek_salad:['Insalata greca','insalata',110,4,5,8,250,1], grilled_cheese_sandwich:['sandwich','Toast al formaggio'], grilled_salmon:'salmone', guacamole:'guacamole',
  gyoza:['dumpling','Gyoza'], hamburger:'burger', hot_and_sour_soup:['soup','Zuppa agropiccante'], hot_dog:'hotdog', huevos_rancheros:['egg','Uova alla messicana'],
  hummus:'hummus', ice_cream:'gelato', lasagna:'lasagne', lobster_bisque:['soup','Crema di astice'], lobster_roll_sandwich:['sandwich',"Panino all'astice"],
  macaroni_and_cheese:['pasta','Pasta al formaggio'], macarons:['dessert','Macaron'], miso_soup:['soup','Zuppa di miso'], mussels:['Cozze','cozze',85,12,4,2.2,250,0],
  nachos:['fried','Nachos'], omelette:['Frittata','frittata',180,12,1,14,150,0], onion_rings:['fried','Anelli di cipolla'], oysters:['seafood','Ostriche'], pad_thai:['noodle','Pad thai'],
  paella:['rice','Paella'], pancakes:['pancake','Pancake'], panna_cotta:['dessert','Panna cotta'], peking_duck:['chicken','Anatra laccata'], pho:['noodle','Pho'], pizza:'pizza',
  pork_chop:['meat','Braciola di maiale'], poutine:['potato','Poutine'], prime_rib:['meat','Costata di manzo'], pulled_pork_sandwich:['sandwich','Panino con maiale sfilacciato'],
  ramen:['noodle','Ramen'], ravioli:['Ravioli al sugo','ravioli',190,8,25,6,250,0], red_velvet_cake:['dessert','Torta red velvet'], risotto:'risotto', samosa:['fried','Samosa'],
  sashimi:['Sashimi','sushi',140,22,0,5,150,0], scallops:['seafood','Capesante'], seaweed_salad:['salad','Insalata di alghe'], shrimp_and_grits:['seafood','Gamberi con polenta'],
  spaghetti_bolognese:['Spaghetti al ragù','pasta',170,8,22,5.5,300,0], spaghetti_carbonara:'carbonara', spring_rolls:['fried','Involtini primavera'], steak:['Bistecca','bistecca',220,27,0,12,180,0],
  strawberry_shortcake:['dessert','Torta con panna e fragole'], sushi:['Sushi','sushi',150,6,28,1.5,200,0], tacos:['sandwich','Tacos'], takoyaki:['fried','Takoyaki'],
  tiramisu:['Tiramisù','tiramisu',300,6,30,18,120,0], tuna_tartare:['fish','Tartare di tonno'], waffles:['pancake','Waffle'],
  stufato:'stufato', acqua:['Acqua','acqua',0,0,0,0,250,0],
};
const catItem = (c, conf) => ({ id:rid(), name:c[0], icon:c[1], grams:c[6], base:c[6], k:c[2]/100, pp:c[3]/100, cc:c[4]/100, ff:c[5]/100, fvv:c[7] ? 1/130 : 0, conf, on:false });
const itemFromSaved = (f, conf) => { const g = Math.max(1, f.grams || 100); return { id:rid(), name:f.name, icon:icoKey(f), grams:g, base:g, k:f.kcal/g, pp:f.p/g, cc:f.c/g, ff:f.f/g, fvv:(f.fv || 0)/g, conf, on:false }; };
// sk: nome di una classe di PiattinoScan, «db:<cibo dell'elenco>» o «my:<cibo memorizzato>»
function scanTarget(sk){
  if (sk.startsWith('my:')) return { id:sk, sk, make: conf => { const f = S.foods.find(x => x.id === sk.slice(3)); return f ? itemFromSaved(f, conf) : null; } };
  const v = sk.startsWith('db:') ? sk.slice(3) : (SCAN_MAP[sk] !== undefined ? SCAN_MAP[sk] : sk);
  if (typeof v === 'string' && FOOD[v]) return { id:'db:' + v, sk:'db:' + v, make: conf => itemFromFood(FOOD[v], FOOD[v].portion, conf, false) };
  if (Array.isArray(v) && v.length === 2) return { id:'c:' + sk, sk, make: conf => catItem([v[1], ...(CATS[v[0]] || CATS.dish).slice(1)], conf) };
  if (Array.isArray(v)) return { id:'x:' + sk, sk, make: conf => Object.assign(catItem(v, conf), sk === 'acqua' ? { key:'acqua', water:true } : {}) };
  return { id:'c:' + sk, sk, make: conf => catItem(CATS.dish, conf) };
}
/* memoria delle correzioni, solo su questo telefono: impronta della foto (8 bit) e cibo scelto */
const SCANMEM = {
  KEY:'piattino-scanmem', MAX:160, PER:8, list:null, cache:new Map(),
  load(){ if (!this.list) { try { this.list = JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch (e) { this.list = []; } } return this.list; },
  save(){ try { localStorage.setItem(this.KEY, JSON.stringify(this.list)); } catch (e) {} },
  clear(){ this.list = []; this.cache.clear(); try { localStorage.removeItem(this.KEY); } catch (e) {} },
  enc(v){ let m = 0; for (const x of v) m = Math.max(m, Math.abs(x)); const s = m / 127 || 1, q = new Int8Array(v.length); for (let i = 0; i < v.length; i++) q[i] = Math.round(v[i] / s); let b = ''; new Uint8Array(q.buffer).forEach(c => b += String.fromCharCode(c)); return btoa(b); },
  dec(b){ if (!this.cache.has(b)) { const s = atob(b), q = new Int8Array(s.length); for (let i = 0; i < s.length; i++) q[i] = (s.charCodeAt(i) << 24) >> 24; this.cache.set(b, q); } return this.cache.get(b); },
  add(emb, sk){
    if (!emb || !sk || !SCANM) return;
    const L = this.load(); L.push({ sk, m:SCANM.id, e:this.enc(emb), t:Date.now() });
    // al massimo PER impronte per cibo e MAX in tutto: si tolgono le più vecchie
    const same = L.filter(r => r.sk === sk); if (same.length > this.PER) L.splice(L.indexOf(same[0]), 1);
    if (L.length > this.MAX) L.splice(0, L.length - this.MAX);
    this.save();
  },
  match(emb){
    if (!emb || !SCANM) return null;
    let best = null;
    for (const r of this.load()) {
      if (r.m !== SCANM.id) continue;             // impronte di un'altra versione del modello: non confrontabili
      const q = this.dec(r.e); let dot = 0, nq = 0;
      for (let i = 0; i < q.length; i++) { dot += q[i] * emb[i]; nq += q[i] * q[i]; }
      const sim = dot / (Math.sqrt(nq) || 1);
      if (!best || sim > best.sim) best = { sk:r.sk, sim };
    }
    return best;
  },
};
let SCANM = null;
// probabilità delle classi (+ memoria delle correzioni) → voci da mostrare
function decideScan(p, emb){
  const agg = {};
  SCANM.spec.classes.forEach((c, i) => { if (p[i] < .005) return; const t = scanTarget(c); (agg[t.id] = agg[t.id] || { t, p:0 }).p += p[i]; });
  const ranked = Object.values(agg).sort((a, b) => b.p - a.p);
  const mem = SCANMEM.match(emb), hi = SCANM.spec.mem_hi || .8, lo = SCANM.spec.mem_lo || .7;
  const items = [], seen = new Set();
  const make = (t, conf) => { if (seen.has(t.id)) return null; const it = t.make(Math.min(1, conf)); if (!it) return null; seen.add(t.id); it.sk = t.sk; it.grp = 1; return it; };
  if (mem && mem.sim >= hi) { const it = make(scanTarget(mem.sk), mem.sim); if (it) { it.on = true; it.mem = true; items.push(it); } }
  const minAlt = ranked[0] && ranked[0].p >= .3 ? .04 : .015;   // se non è sicuro, mostra più alternative
  ranked.forEach((r, j) => {
    if (items.length >= 4 || (j > 0 && r.p < minAlt)) return;
    const it = make(r.t, r.p); if (!it) return;
    it.on = j === 0 && r.p >= .3 && !items.some(x => x.on); items.push(it);
  });
  if (mem && mem.sim >= lo && mem.sim < hi) { const it = make(scanTarget(mem.sk), mem.sim); if (it) { it.on = false; it.mem = true; items.splice(1, 0, it); items.length = Math.min(items.length, 4); } }
  SC.scanTop = ranked[0] ? { sk:ranked[0].t.sk, p:ranked[0].p } : null;
  return { items, dish: ranked[0] ? ranked[0].p : 0 };
}

let modelP = null, FOOD_LABELS = null, IMAGENET = null;
function loadScript(src){ return new Promise((res, rej) => { const el = document.createElement('script'); el.src = src; el.onload = res; el.onerror = () => rej(new Error('load ' + src)); document.head.appendChild(el); }); }
function rejectAfter(p, ms, what){ let t; return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error('timeout ' + what)), ms); })]).finally(() => clearTimeout(t)); }
function ensureModel(onFrac = () => {}){
  if (!modelP) modelP = (async () => {
    // se il caricamento si pianta (succede su alcuni iPhone) non resta fermo per sempre: dopo qualche secondo ripiega o dà errore
    if (!window.tf) await rejectAfter(loadScript('vendor/tf.min.js'), 25000, 'tf.min.js');
    onFrac(.04);
    // se un tentativo con la GPU non è mai finito (app chiusa mentre era ferma), la volta dopo si parte dal processore
    const GLK = 'piattino-gl-' + APP_VERSION; let gl = null; try { gl = localStorage.getItem(GLK); } catch (e) {}
    const glSet = v => { try { localStorage.setItem(GLK, v); } catch (e) {} };
    if (gl === 'trying' || gl === 'cpu') { glSet('cpu'); await tf.setBackend('cpu'); await tf.ready(); }
    else {
      glSet('trying');
      try { await rejectAfter(tf.ready(), 8000, 'tf.ready'); }
      catch (e) { console.warn('GPU non pronta, uso il processore', e); glSet('cpu'); await tf.setBackend('cpu'); await tf.ready(); }
    }
    onFrac(.06);
    try {
      const m = await SCAN.load(SCAN_URL, f => onFrac(.04 + .94 * f));
      tf.tidy(() => { SCAN.forward(m, tf.zeros([2, m.spec.size, m.spec.size, 3])); });   // prepara la GPU (due inquadrature, come nel riconoscimento)
      SCANM = m; if (tf.getBackend() === 'webgl') glSet('ok'); onFrac(1);
      return { scan: m };
    } catch (e) { console.warn('PiattinoScan non disponibile, uso i modelli di Google', e); MODEL.mb = MODEL.google; }
    const share = { mobile: MODELS.mobile.mb / MODEL.mb, food: MODELS.food.mb / MODEL.mb };
    let fm = 0, ff = 0; const report = () => onFrac(.04 + .94 * (fm * share.mobile + ff * share.food));
    [FOOD_LABELS, IMAGENET] = await Promise.all([fetch(MODELS.food.labels).then(r => r.json()), fetch('model/imagenet.json').then(r => r.json())]);
    const [mobile, food] = await Promise.all([
      tf.loadGraphModel(MODELS.mobile.url, { onProgress: f => { fm = f; report(); } }),
      tf.loadGraphModel(MODELS.food.url, { onProgress: f => { ff = f; report(); } }),
    ]);
    fm = ff = 1; report();
    tf.tidy(() => { mobile.predict(tf.zeros([1, 224, 224, 3])); food.predict(tf.zeros([1, 192, 192, 3])); });
    onFrac(1);
    return { mobile, food };
  })().catch(e => { modelP = null; throw e; });
  else modelP.then(() => onFrac(1), () => {});
  return modelP;
}
function topK(arr, k){ return Array.from(arr, (p, i) => [i, p]).sort((a, b) => b[1] - a[1]).slice(0, k); }
const itemFromFood = (f, grams, conf, on) => ({ id:rid(), key:f.key, name:f.name, icon:f.icon, grams, base:grams, k:f.kcal/100, pp:f.p/100, cc:f.c/100, ff:f.f/100, fvv:f.fv ? 1/130 : 0, conf, on, ...(f.drink ? { fvMax:1 } : {}), ...(f.water ? { water:true } : {}) });
const itemFromCat = (c, label, conf) => ({ id:rid(), name:(label && IT[label.toLowerCase()]) || c[0], icon:c[1], grams:c[6], base:c[6], k:c[2]/100, pp:c[3]/100, cc:c[4]/100, ff:c[5]/100, fvv:c[7] ? 1/130 : 0, conf, on:false });

/* colore del cibo al centro della foto: distingue, per esempio, il riso allo zafferano dal riso in bianco */
function foodColor(canvas){
  const out = { yellow:0, red:0, green:0, pale:0 };
  try {
    const N = 64, c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d', { willReadFrequently:true }); g.drawImage(canvas, 0, 0, N, N);
    const d = g.getImageData(0, 0, N, N).data; let n = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = (x + .5) / N - .5, dy = (y + .5) / N - .5; if (dx * dx + dy * dy > .14) continue;   // solo la zona centrale
      const i = (y * N + x) * 4, r = d[i], gg = d[i + 1], b = d[i + 2];
      const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), v = mx / 255, s = mx ? (mx - mn) / mx : 0;
      if (v < .2) continue;                                                                          // ombre
      let h = 0; if (mx !== mn) { h = mx === r ? ((gg - b) / (mx - mn)) % 6 : mx === gg ? (b - r) / (mx - mn) + 2 : (r - gg) / (mx - mn) + 4; h *= 60; if (h < 0) h += 360; }
      n++;
      if (s < .22 && v > .35) out.pale++;
      else if (h >= 34 && h <= 64 && s >= .36 && v >= .5) out.yellow++;
      else if ((h <= 24 || h >= 345) && s >= .45 && v >= .35) out.red++;
      else if (h >= 68 && h <= 165 && s >= .25) out.green++;
    }
    if (n) for (const k in out) out[k] /= n;
  } catch (e) {}
  return out;
}
// le voci di una categoria: la più probabile e, per riso e pasta, le varianti vicine
function dishItems(cat, labs, score, col){
  if (cat.startsWith('db:')) return [itemFromFood(FOOD[cat.slice(3)], FOOD[cat.slice(3)].portion, score, false)];
  const C = CATS[cat] || CATS.dish;
  labs = labs.slice().sort((a, b) => b.p - a.p);
  const L = labs[0], sum = labs.reduce((a, x) => a + x.p, 0);
  const specific = !!L && L.p >= Math.max(.15, .45 * sum);
  const named = (x, conf) => x.t.startsWith('db:') ? itemFromFood(FOOD[x.t.slice(3)], FOOD[x.t.slice(3)].portion, conf, false) : itemFromCat(C, x.label, conf);
  const out = [];
  if (VARIANTS[cat] && (!specific || GENERIC[cat].has(L.label.toLowerCase()))) {
    const colored = Math.max(.001, 1 - col.pale), share = k => col[k] >= .12 && col[k] / colored >= .4;
    const white = col.pale >= .6 && col.yellow < .1 && col.red < .1 && col.green < .1, risotto = specific && L.label.toLowerCase() === 'risotto';
    const pick = cat === 'rice' ? (share('yellow') ? 'risozaff' : share('red') ? 'risopom' : white && (!risotto || col.pale >= .7) ? 'risobianco' : null)
      : (col.red >= .15 && col.red > col.green ? 'pastapom' : col.green >= .15 ? 'pastapesto' : white ? 'pastabianco' : null);
    const main = pick ? itemFromFood(FOOD[pick], FOOD[pick].portion, score, false) : specific ? named(L, score) : itemFromCat(C, null, score);
    out.push(main);
    // le altre varianti, prima quelle del colore più vicino
    const tone = { risozaff:col.yellow, risopom:col.red, risobianco:col.pale * .5, risotto:.2, pastapom:col.red, pastapesto:col.green, pastabianco:col.pale * .5, carbonara:col.yellow * .7 };
    VARIANTS[cat].filter(k => k !== main.key).sort((a, b) => tone[b] - tone[a]).slice(0, 2).forEach(k => out.push(itemFromFood(FOOD[k], FOOD[k].portion, null, false)));
  } else if (specific) {
    out.push(named(L, score));
    const L2 = labs[1]; if (L2 && L2.p >= .1 && L2.p >= .3 * L.p) out.push(named(L2, L2.p));
  } else out.push(itemFromCat(C, null, score));
  return out;
}
// mette insieme i due modelli: i piatti si decidono per categoria, i cibi «da soli» solo se il modello generico è sicuro
function decide(dm, df, col){
  const cat = {}, labs = {}; let dish = 0;
  topK(df, 25).forEach(([i, p]) => {
    const label = FOOD_LABELS[i]; if (!label || i === 0 || p < .004 || /^\/[mg]\//.test(label)) return;
    const t = foodTarget(label), c = t.startsWith('db:') ? (DB_CAT[t.slice(3)] || t) : t;
    cat[c] = (cat[c] || 0) + p; (labs[c] = labs[c] || []).push({ label, p, t });
    dish += p * .5;
  });
  const simple = {};
  topK(dm, 12).forEach(([i, p]) => {
    const names = IMAGENET[i].toLowerCase().split(/,\s*/);
    const key = names.map(n => SIMPLE[n]).find(Boolean), vote = names.map(n => MN_VOTE[n]).find(Boolean);
    if (key) simple[key] = (simple[key] || 0) + p * (SHAKY.has(key) ? .6 : 1);
    else if (vote) { if ((cat[vote] || 0) >= .05) cat[vote] += p * .35; dish += p * .5; }
    else if (names.some(n => DISH_HINTS.includes(n))) dish += p;
  });
  const cats = Object.entries(cat).filter(([c]) => c !== 'dish').sort((a, b) => b[1] - a[1]);
  const [c1, s1] = cats[0] || ['dish', 0];
  const simp = Object.entries(simple).sort((a, b) => b[1] - a[1])[0];
  const simpleWins = !!simp && (simp[1] >= .8 || (simp[1] >= .4 && s1 < .6 && simp[1] >= s1) || (simp[1] >= .28 && s1 < .25));
  const items = [], seen = new Set();
  const push = (it, on) => { if (!it || items.length >= 4) return; const k = it.key || it.name; if (seen.has(k)) return; seen.add(k); it.on = !!on && !items.some(x => x.on); it.grp = 1; items.push(it); };
  const fromKey = (key, conf) => itemFromFood(FOOD[key], FOOD[key].portion, conf, false);
  if (simpleWins) {
    if (simp[0] === 'melagrana' && simp[1] < .75) push(fromKey('mela', Math.min(1, simp[1])), true);   // il modello generico non conosce le mele rosse
    push(fromKey(simp[0], Math.min(1, simp[1])), true);
    if (s1 >= .45) push(dishItems(c1, labs[c1] || [], Math.min(1, s1), col)[0], false);
  } else if (s1 >= .2) {
    dishItems(c1, labs[c1] || [], Math.min(1, s1), col).forEach((it, j) => push(it, j === 0 && s1 >= .3));
    const [c2, s2] = cats[1] || [];
    if (c2 && s2 >= Math.max(.15, .35 * s1)) push(dishItems(c2, labs[c2] || [], Math.min(1, s2), col)[0], false);
  }
  if (!simpleWins && simp && simp[1] >= .3 && s1 < .5) push(fromKey(simp[0], Math.min(1, simp[1])), false);
  if (!items.length && (cat.dish || 0) >= .3) { const L = labs.dish.sort((a, b) => b.p - a.p)[0]; push(itemFromCat(CATS.dish, L.p >= .45 * cat.dish ? L.label : null, Math.min(1, cat.dish)), cat.dish >= .5); }
  return { items, dish };
}
async function recognizePhoto(canvas, onFrac){
  const { mobile, food, scan } = await ensureModel(onFrac);
  SC.creep = 97; setPct(82, 'Riconosco il cibo');
  await sleep(30);   // lascia disegnare la percentuale prima del calcolo
  if (scan) {
    const [pp, pe] = tf.tidy(() => { const { logits, emb } = SCAN.forward(scan, SCAN.inputs(scan, canvas)); return [tf.softmax(logits).mean(0), emb.mean(0)]; });
    const [p, e] = await Promise.all([pp.data(), pe.data()]); pp.dispose(); pe.dispose();
    SC.emb = SCAN.embed(scan, e);
    setPct(94, 'Stimo porzioni e calorie');
    return decideScan(p, SC.emb);
  }
  // due inquadrature, tutta la foto e la zona centrale: la media è più stabile di una sola
  const [pm, pf] = tf.tidy(() => {
    const px = tf.browser.fromPixels(canvas).toFloat().div(255).expandDims(0);
    const zoom = tf.image.cropAndResize(px, [[.12, .12, .88, .88]], [0], [256, 256]);
    const run = (model, size, post) => tf.addN([px, zoom].map(v => { let y = model.predict(tf.image.resizeBilinear(v, [size, size])); if (Array.isArray(y)) y = y[0]; return post(y).reshape([-1]); })).div(2);
    return [run(mobile, 224, y => tf.softmax(y.slice([0, 1], [-1, 1000]))),      // MobileNet: 1001 logit, il primo è lo sfondo
            run(food, 192, y => y)];                                              // AIY Food: già probabilità
  });
  const [dm, df] = await Promise.all([pm.data(), pf.data()]); pm.dispose(); pf.dispose();
  setPct(94, 'Stimo porzioni e calorie');
  return decide(dm, df, foodColor(canvas));
}

/* porzione automatica: quanta parte del piatto è coperta dal cibo.
   Il piatto (chiaro, poco saturo) fa da riferimento, quindi la stima non dipende da quanto sei vicino. */
const NO_SCALE = new Set(['caffe','latte','latteint','soia','succo','bibita','ghiacciolo','yogurt','greco','cioccolata', ...DRINKS]);
// cibi chiari: su un piatto chiaro non si distinguono dal piatto, quindi la copertura misurata sarebbe troppo bassa
const PALE = new Set(['risobianco','riso','pastabianco','mozzarella','burrata','ricotta','stracchino','fiocchilatte','pure','cavolfiore','gnocchi','tofu','feta','finocchi']);
function estimatePortion(canvas){
  try {
    const N = CONFIG.portion.grid, c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d', { willReadFrequently:true }); g.drawImage(canvas, 0, 0, N, N);
    return estimateFromPixels(g.getImageData(0, 0, N, N).data, N);
  } catch (e) { return { method:'standard', scale:1 }; }
}
function applyEstimate(items, est){
  items.forEach(x => {
    if (est.method !== 'plate' || (x.key && (PIECE[x.key] || NO_SCALE.has(x.key) || PALE.has(x.key)))) return;
    x.auto = Math.max(10, Math.round(x.base * est.scale / 10) * 10);
    x.grams = x.auto;
  });
  SC.est = est;
}

/* description in words: «2 uova, 50 g di pane e un'insalata» */
const KW = {
  latte:['latte'], latteint:['latte intero'], pasta:['pasta','spaghetti','penne','fusilli','maccheroni'], pastaint:['pasta integrale'], riso:['riso'], risotto:['risotto'], risozaff:['risotto allo zafferano','riso allo zafferano','riso giallo','risotto giallo','risotto alla milanese'], risobianco:['riso in bianco','riso bianco','riso bollito'], risopom:['riso al pomodoro','riso al sugo'], pastapesto:['pasta al pesto','trofie al pesto','pesto'], pastabianco:['pasta in bianco','pasta al burro','pasta all\'olio'], polenta:['polenta'], salsiccia:['salsiccia','salsicce','luganega','salamella'],
  pastapom:['pasta al pomodoro','spaghetti al pomodoro','pasta al sugo'], pollo:['pollo','petto di pollo'], manzo:['manzo','carne','bistecca'], burger:['hamburger','panino hamburger'],
  crudo:['prosciutto crudo','prosciutto'], cotto:['prosciutto cotto'], uova:['uovo','uova','uovo sodo','uova sode'], olio:['olio'], yogurt:['yogurt'], greco:['yogurt greco'],
  avena:['avena','porridge'], biscotti:['biscotti','biscotto'], cornetto:['cornetto','croissant'], brioche:['brioche'], succo:['succo'], bibita:['bibita'],
  patate:['patate','patata'], pomodori:['pomodoro','pomodori'], fette:['fette biscottate'], crackers:['crackers','cracker'], fondente:['cioccolato'],
  caffe:['caffè','caffe','espresso'], pure:['purè','pure'], bosco:['frutti di bosco'], minestrone:['minestrone','minestra','zuppa'],
  lasagne:['lasagne','lasagna'], carbonara:['carbonara','spaghetti alla carbonara'], insalata:['insalata'], pane:['pane','pagnotta','panino al latte','panino','panini'], paneint:['pane integrale'],
  fagioli:['fagioli'], ceci:['ceci'], lenticchie:['lenticchie'], tonno:['tonno'], salmone:['salmone'], merluzzo:['merluzzo','pesce'], gamberi:['gamberi','gamberetti'],
  mozzarella:['mozzarella'], parmigiano:['parmigiano','grana'], ricotta:['ricotta'], gelato:['gelato'], mela:['mela','mele'], pizza:['pizza','pizzetta'],
  arancini:['arancini','arancino','arancina','arancine'], polpette:['polpette','polpetta'], cotoletta:['cotoletta','cotolette','milanese'], tortellini:['tortellini','cappelletti'],
  pastafagioli:['pasta e fagioli','pasta fagioli'], parmigiana:['parmigiana'], formaggio:['formaggio','pecorino','fontina'], salame:['salame','salami'],
  melanzane:['melanzane','melanzana'], fagiolini:['fagiolini'], ciliegie:['ciliegie','ciliegia'], melone:['melone'], crostata:['crostata'], focaccia:['focaccia'], piadina:['piadina','piada'],
};
// sinonimi che nelle frasi sarebbero ambigui (già usati da un altro cibo, o con un senso più comune)
const SYN_NOPARSE = new Set(['uovo','cioccolato','croissant','orzo','patatine','macchiato']);
const NUMW = { 'un':1, 'uno':1, 'una':1, "un'":1, 'due':2, 'tre':3, 'quattro':4, 'cinque':5, 'sei':6, 'mezzo':.5, 'mezza':.5 };
function parseDescription(text){
  let t = ' ' + text.toLowerCase().replace(/[’`]/g, "'") + ' ';
  const pairs = [];
  FOODS.forEach(f => {
    const base = f.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').replace(/\./g, '').trim();
    new Set([base, ...(KW[f.key] || []), ...(SYN[f.key] || []).filter(w => !SYN_NOPARSE.has(w))]).forEach(kw => pairs.push([kw, f]));
  });
  pairs.sort((a, b) => b[0].length - a[0].length);
  const found = [];
  const rx = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // prima le parole esatte, poi le varianti (mela/mele): così «pesce» non diventa «pesca».
  // Le parole di 4 lettere o meno valgono solo intere, o «col» diventerebbe «cola».
  const passes = [pairs.map(([kw, f]) => [rx(kw), f]),
    pairs.filter(([kw]) => !kw.includes(' ') && kw.length > 4).map(([kw, f]) => [rx(kw).replace(/[aeio]$/, '') + '[aeio]?', f])];
  for (const list of passes) for (const [pat, f] of list) {
    const re = new RegExp("(^|[^a-zàèéìòù])(" + pat + ")(?=$|[^a-zàèéìòù])");
    const m = re.exec(t); if (!m) continue;
    const start = m.index + m[1].length, end = start + m[2].length;
    if (found.some(x => x.f.key === f.key)) { t = t.slice(0, start) + ' '.repeat(end - start) + t.slice(end); continue; }
    const before = t.slice(Math.max(0, start - 40), start);
    let grams = f.portion; const piece = PIECE[f.key] || f.portion;
    // «mezzo litro d'acqua», «un litro di latte», «una bottiglietta d'acqua» (500 ml)
    const ml = /(?:^|\s)(\d+(?:[.,]\d+)?|un|uno|una|due|tre|quattro|cinque|sei|mezzo|mezza)\s*(litr[oi]|bottigli(?:ett)?[ae])\s+(?:di\s+|d')?$/.exec(before);
    const mq = /(\d+(?:[.,]\d+)?)\s*(kg|g|gr|grammi|ml|l|litri?)?\.?\s*(?:(?!(?:e|ed|con)\s)[a-zàèéìòù']+\s+){0,2}(?:di\s+|d')?$/.exec(before);
    const mw = /(?:^|\s)(un'|un|uno|una|due|tre|quattro|cinque|sei|mezzo|mezza)\s*(?:(?!(?:e|ed|con)\s)[a-zàèéìòù']+\s+){0,2}(?:di\s+|d')?$/.exec(before);
    if (ml) grams = (/\d/.test(ml[1]) ? parseFloat(ml[1].replace(',', '.')) : NUMW[ml[1]]) * (ml[2].startsWith('litr') ? 1000 : 500);
    else if (mq) { const n = parseFloat(mq[1].replace(',', '.')); const u = mq[2] || ''; grams = /^(g|gr|grammi|ml)$/.test(u) ? n : /^(kg|l|litr)/.test(u) ? n * 1000 : n * piece; }
    else if (mw) grams = NUMW[mw[1]] * piece;
    found.push({ f, grams: clamp(Math.round(grams), 1, 3000), at:start });
    t = t.slice(0, start) + ' '.repeat(end - start) + t.slice(end);
  }
  return found.sort((a, b) => a.at - b.at).slice(0, 8).map(x => itemFromFood(x.f, x.grams, null, true));
}
const TIPS = {
  kid: ['Ricordati di bere un bicchiere d\'acqua!', 'Se c\'è frutta o verdura, hai fatto un punto per il tuo arcobaleno.', 'Mangia con calma: la pancia ti dice quando è piena.'],
  teen: ['Aggiungi una fonte di proteine se il pasto ne è povero.', 'Un bicchiere d\'acqua aiuta concentrazione e sport.', 'Frutta o verdura in più? Ottima idea.'],
  adult: ['Metà piatto di verdure è la regola più semplice.', 'Controlla l\'olio: un cucchiaio sono circa 10 g.', 'Mangiare lentamente aiuta a sentirsi sazi prima.'],
  senior: ['Un bicchiere d\'acqua con il pasto aiuta la digestione.', 'Le proteine a ogni pasto mantengono forti i muscoli.', 'Le verdure cotte sono facili da digerire e piene di vitamine.'],
};
/* progress: the number follows the real work and never goes backwards */
function setPct(target, sub){
  if (target > (SC.realPct || 0)) { SC.realPct = target; SC.waitAt = Date.now(); }   // avanzamento vero (non la corsa lenta di SC.creep): serve a capire se l'analisi è ferma
  SC.pctTarget = Math.max(SC.pctTarget || 0, Math.min(100, target));
  if (sub && sub !== SC.sub) { SC.sub = sub; swapText($('#scanSub'), sub); }
  if (!SC.pctRaf) SC.pctRaf = setTimeout(tickPct, 30);
}
function tickPct(){
  SC.pctRaf = 0;
  if (SC.creep && SC.pctTarget < SC.creep) SC.pctTarget = Math.min(SC.creep, SC.pctTarget + .15);
  const cur = SC.pctShown || 0, tgt = SC.pctTarget || 0;
  SC.pctShown = tgt > cur ? Math.min(tgt, cur + Math.max(.4, (tgt - cur) * .16)) : cur;
  const n = Math.round(SC.pctShown);
  const el = $('#scanPct'); if (el) el.textContent = n + '%';
  const bar = $('#scanBar'); if (bar) bar.style.width = SC.pctShown + '%';
  $('#scanProg')?.setAttribute('aria-valuenow', n);
  if (SC.state === 'scanning' && (SC.pctShown < tgt || SC.creep)) SC.pctRaf = setTimeout(tickPct, 30);
}
/* «Non chiudere questa schermata»: compare con calma dopo qualche secondo; se l'avanzamento vero si ferma diventa un avviso più chiaro,
   poi dice cosa fare. Non chiude mai nulla da solo. Tiene lo schermo acceso (Wake Lock) finché l'analisi dura. */
const ATTESA = [
  'Non chiudere questa schermata.',
  'Ci vuole un po’ più del solito. Non chiudere questa schermata: sto ancora lavorando.',
  'Sembra ferma. Aspetta ancora un momento; se non riparte, tocca Annulla e riprova, oppure descrivi il piatto a parole.'
];
const attesaText = () => SC.waitLvl >= 0 ? ATTESA[SC.waitLvl] : '';
const attesaClass = () => SC.waitLvl >= 0 ? 'in' + (SC.waitLvl ? ' warn' : '') + (SC.waitLvl > 1 ? ' hard' : '') : '';
function attesaLevel(){
  const now = Date.now(), tot = now - SC.waitT0, stall = now - SC.waitAt;
  if (stall >= 25000) return 2;
  if (stall >= 6000 || tot >= 40000) return 1;
  return tot >= 2500 ? 0 : -1;
}
function attesaTick(){
  if (!SC.waitTimer) return;
  if (SC.state !== 'scanning' || SC.run !== SC.waitRun) return attesaStop();   // analisi finita, annullata o scanner chiuso
  const lvl = attesaLevel(); if (lvl === SC.waitLvl) return;
  const had = SC.waitLvl >= 0; SC.waitLvl = lvl;
  const el = $('#scanWait'); if (!el) return;
  el.className = 'scan-wait ' + attesaClass();
  const wb = $('#scanWaitBtn'); if (wb) wb.hidden = lvl < 2;
  if (had && lvl >= 0) swapText(el, attesaText()); else el.textContent = attesaText();
}
function attesaStart(run){
  attesaStop();
  SC.waitT0 = SC.waitAt = Date.now(); SC.waitRun = run; SC.waitLvl = -1; SC.realPct = 0;
  SC.waitTimer = setInterval(attesaTick, 500);
  attesaLock();
}
function attesaStop(abort){
  // analisi lasciata dopo un lungo stallo con il modello non pronto: la promessa appesa non deve ripresentarsi al tentativo dopo, che riparte dal processore
  // (a ogni uscita con il modello non pronto si azzera modelP, così il tentativo dopo riparte da capo; il ripiego sul processore solo dopo uno stallo lungo)
  if (abort && SC.waitTimer && !SCANM) {
    modelP = null;
    if (Date.now() - SC.waitAt >= 25000) { try { localStorage.setItem('piattino-gl-' + APP_VERSION, 'cpu'); } catch (e) {} }
  }
  if (SC.waitTimer) { clearInterval(SC.waitTimer); SC.waitTimer = 0; }
  SC.waitLvl = -1; attesaUnlock();
}
async function attesaLock(){
  if (!navigator.wakeLock || SC.wakeBusy || SC.wake) return;
  SC.wakeBusy = true;
  try {
    const w = await navigator.wakeLock.request('screen');
    if (!SC.waitTimer) { w.release().catch(() => {}); } else { SC.wake = w; w.addEventListener('release', () => { if (SC.wake === w) SC.wake = null; }); }
  } catch (e) {}
  SC.wakeBusy = false;
}
function attesaUnlock(){ const w = SC.wake; SC.wake = null; if (w) w.release().catch(() => {}); }
// il blocco schermo o il cambio di app rilasciano il Wake Lock da soli: al ritorno lo richiedo di nuovo se l'analisi è ancora in corso
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && SC.waitTimer && SC.state === 'scanning') attesaLock(); });
const waitPct = v => new Promise(res => { const t0 = Date.now(); (function chk(){ if ((SC.pctShown || 0) >= v - .5 || Date.now() - t0 > 1500 || SC.state !== 'scanning') res(); else setTimeout(chk, 40); })(); });

async function handlePhoto(file){
  if (!file) return;
  stopCamera();
  if (SC.img) { try { URL.revokeObjectURL(SC.img); } catch (e) {} }
  let prep;
  try { prep = await prepImage(file); }
  catch (e) { SC.state = 'error'; SC.err = 'Non riesco ad aprire questa immagine. Prova con una foto in formato JPEG o PNG.'; renderScanner(); return; }
  SC.img = prep.url; SC.square = prep.square; SC.thumb = prep.thumb; SC.desc = '';
  runScan();
}
async function runScan(){
  const run = SC.run = (SC.run || 0) + 1;
  const fromText = !!SC.desc;
  Object.assign(SC, { items:[], tip:'', sub:'', pctShown:0, pctTarget:0, creep:0, est:null, emb:null, scanTop:null });
  SC.state = 'scanning'; attesaStart(run); renderScanner();
  const t0 = Date.now();
  let items = [], dish = 0, failed = false;
  try {
    if (fromText) {
      setPct(35, 'Leggo la descrizione');
      items = parseDescription(SC.desc);
      await sleep(350); setPct(75, 'Calcolo i nutrienti');
    } else {
      setPct(8, 'Foto pronta');
      const MB = MODEL.mb;
      const r = await recognizePhoto(SC.square, f => setPct(8 + f * 72, f < 1 ? `Scarico il riconoscimento dei cibi: ${fmt1(f * MB)} di ${MB} MB (solo la prima volta)` : 'Riconoscimento pronto'));
      items = r.items; dish = r.dish;
      setPct(97, 'Calcolo i grammi dal piatto');
      applyEstimate(items, estimatePortion(SC.square));
    }
  } catch (e) { failed = true; console.error(e); }
  SC.creep = 0;
  if (run !== SC.run || SC.state !== 'scanning') return;
  attesaStop();
  setPct(100, failed ? '' : 'Fatto');
  await waitPct(100);
  const min = fromText ? 1200 : 1600; if (Date.now() - t0 < min) await sleep(min - (Date.now() - t0));
  if (run !== SC.run || SC.state !== 'scanning') return;
  if (failed || !items.length) {
    SC.state = 'error';
    SC.err = failed ? 'Non riesco a caricare il riconoscimento. Controlla la connessione: serve solo la prima volta.'
      : fromText ? 'Non ho trovato cibi che conosco nella descrizione. Prova con parole semplici, come «pasta», «mela», «pollo».'
      : dish > .1 ? 'Vedo un piatto, ma non riconosco il cibo con sicurezza. Descrivilo a parole o cercalo nell\'elenco.'
      : 'Non riconosco il cibo in questa foto. Avvicinati al piatto con buona luce, oppure descrivilo a parole.';
    renderScanner(); return;
  }
  const tips = TIPS[tierOf(ageOf(S.profile))];
  SC.tip = items.some(x => x.fvv) ? 'Frutta e verdura: ogni porzione ti avvicina alle 5 di oggi.' : tips[Math.floor(Math.random() * tips.length)];
  showResults(items);
}
function showResults(items){
  SC.items = items; SC.state = 'result'; SC.touched = false;
  const main = scanner.querySelector('.scan-main'); main.classList.remove('scanning'); main.classList.add('done');
  const unsure = !items.some(x => x.on);
  swapText($('#scanStatus'), unsure ? 'Forse è uno di questi' : 'Ecco cosa ho trovato');
  swapText($('#scanSub'), unsure ? 'Non sono sicuro: tocca il cerchio accanto al cibo giusto.' : items.map(x => x.name).join(', '));
  const tags = $('#tags'); const pos = [[8,14],[48,40],[12,66],[52,8],[30,82],[60,62],[4,40],[56,86]];
  tags.innerHTML = items.map((x, j) => `<span class="tag3d ios-glass" style="left:${pos[j][0]}%;top:${pos[j][1]}%"><span class="ti">${foodIco(x)}</span>${esc(x.name.replace(/\s*\(.*?\)/, ''))}</span>`).join('');
  tags.querySelectorAll('.tag3d').forEach((el, j) => setTimeout(() => el.classList.add('in'), 120 + j*180));
  scanner.querySelector('.scan-actions').innerHTML = '';
  setTimeout(() => { if (SC.state !== 'result') return; renderResult(); $('#scanResult')?.classList.add('show'); }, 700 + items.length*180);
}
const PORTIONS = [['Piccola', .65], ['Media', 1], ['Grande', 1.5]];
const itemEntry = x => ({ id:rid(), name:x.name, icon:x.icon, thumb:SC.thumb, grams:Math.round(x.grams), kcal:Math.round(x.k*x.grams), p:Math.round(x.pp*x.grams*10)/10, c:Math.round(x.cc*x.grams*10)/10, f:Math.round(x.ff*x.grams*10)/10, fv:Math.min(x.fvMax || 99, Math.round(x.fvv*x.grams*2)/2) });
function renderResult(){
  const box = $('#scanResult'); if (!box) return;
  const keep = box.querySelector('.result-in'), top = keep ? keep.scrollTop : 0;
  const on = SC.items.filter(x => x.on).map(itemEntry);
  const tot = on.reduce((a, e) => ({ kcal:a.kcal + e.kcal, p:a.p + e.p, c:a.c + e.c, f:a.f + e.f }), { kcal:0, p:0, c:0, f:0 });
  const unsure = SC.items.some(x => x.conf != null) && !SC.items.some(x => x.on) && !SC.touched;
  box.innerHTML = `<div class="grabber"></div><div class="result-in">
    ${SC.est && SC.items.some(x => x.auto) ? `<p class="est">${I.scale}<span>Grammi calcolati in automatico: il cibo copre circa il <b>${Math.round(SC.est.cover * 100)}%</b> del piatto.</span></p>`
      : SC.est && SC.est.method === 'standard' && SC.items.some(x => !(x.key && (PIECE[x.key] || NO_SCALE.has(x.key)))) ? `<p class="est">${I.scale}<span>Non vedo bene il bordo del piatto, quindi uso una porzione standard. Per il calcolo automatico fotografa tutto il piatto dall'alto.</span></p>` : ''}
    ${SC.items.some(x => x.mem) ? `<p class="est">${I.spark}<span>Ricordo questo piatto da una tua correzione precedente.</span></p>` : ''}
    ${unsure ? `<p class="note" style="margin:10px 0 0">Non sono sicuro di cosa ci sia nella foto. Tocca il cerchio accanto al cibo giusto, oppure cercalo nell'elenco.</p>` : ''}
    <div class="group" style="margin-top:10px">${SC.items.map((x, j) => { const e = itemEntry(x); return `${j === 1 && x.grp ? '<div class="alt-cap">Non è questo? Tocca quello giusto</div>' : ''}<div class="res-item ${x.on ? '' : 'off'}">
      <button class="check" data-a="res-toggle" data-id="${x.id}" aria-label="${x.on ? 'Escludi' : 'Includi'} ${esc(x.name)}">${I.check}</button>
      <span class="thumb ico">${foodIco(x)}</span>
      <div class="grow"><div style="font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.name)}</div><div class="small muted num">${x.conf != null ? `<b class="conf">${Math.round(x.conf * 100)}%</b> · ` : ''}<b style="color:var(--label)">${fmt(e.kcal)} kcal</b> · P ${fmt(e.p)} · C ${fmt(e.c)} · G ${fmt(e.f)}</div>
        <div class="portion-row"><div class="portion" role="group" aria-label="Porzione">${x.auto ? `<button class="auto ${x.grams === x.auto ? 'on' : ''}" data-a="res-portion" data-id="${x.id}" data-g="${x.auto}">${I.scale} Dalla foto</button>` : ''}${PORTIONS.map(([l, fct]) => `<button class="${(!x.auto || x.grams !== x.auto) && Math.abs(x.grams - Math.round(x.base * fct / 5) * 5) < 3 ? 'on' : ''}" data-a="res-portion" data-id="${x.id}" data-f="${fct}">${l}</button>`).join('')}</div>
        <div class="mini-step"><button data-a="res-step" data-id="${x.id}" data-d="-1" aria-label="Meno grammi">−</button><span>${fmt(x.grams)} g</span><button data-a="res-step" data-id="${x.id}" data-d="1" aria-label="Più grammi">+</button></div></div></div>
    </div>`; }).join('')}</div>
    <div class="nutri num">${nutriHtml(tot)}</div>
    <div class="tip"><span class="spark">${I.spark}</span><div><div style="font-weight:600">${esc(SC.quote || (SC.quote = pickQuote()))}</div>${SC.tip ? `<div class="small muted" style="margin-top:3px">${esc(SC.tip)}</div>` : ''}</div></div>
    <div class="group"><div class="field"><label for="memo" style="width:auto;flex:1">Memorizza nei miei cibi</label><span class="toggle"><input id="memo" type="checkbox" ${SC.memo ? 'checked' : ''}><span></span></span></div></div>
    <div class="stack" style="margin-top:14px">
      <button class="btn tinted" data-a="scan-manual">Non è giusto? Cerca nell'elenco</button>
      <button class="btn tinted" data-a="scan-again">Scansiona un altro piatto</button>
    </div>
    <p class="foot">${SC.items.some(x => x.conf != null) ? 'La percentuale indica quanto è sicuro il riconoscimento. Se il piatto è un altro tocca il cerchio della voce giusta, oppure cercalo nell\'elenco. Correggi i grammi con Piccola, Media, Grande o con − e +.' : 'Porzioni stimate dalla descrizione: correggile con Piccola, Media, Grande o con − e +.'}</p>
  </div>
  <div class="result-bar ios-glass">
    <div class="seg" role="group" aria-label="Pasto">${MEALS.map(m => `<button class="${SC.meal === m.k ? 'on' : ''}" data-a="res-meal" data-m="${m.k}">${m.l}</button>`).join('')}</div>
    <button class="btn primary" data-a="res-add" ${on.length ? '' : 'disabled'}>Aggiungi a ${esc(mealByK(SC.meal).l)}</button>
  </div>`;
  box.querySelector('.result-in').scrollTop = top;
  $('#memo').addEventListener('change', e => SC.memo = e.target.checked);
}

/* ---------- events ---------- */
const actions = {
  tab: el => { const moved = S.view !== el.dataset.v; S.view = el.dataset.v; closeSheet(); render(); window.scrollTo(0, 0); if (moved) enterView(); },
  day: el => { const d = +el.dataset.d, from = S.date; S.date = d === 0 ? todayKey() : addDays(S.date, d); if (S.date > todayKey()) S.date = todayKey(); render(); if (S.date !== from) enterView(S.date < from ? 'from-left' : 'from-right'); },
  goto: el => { S.date = el.dataset.k; S.view = 'today'; render(); window.scrollTo(0, 0); enterView(); },
  'water-add': el => {
    const d = ensureDay(S.date), g = T(), before = d.water || 0, n = +el.dataset.n;
    d.water = clamp(before + n, 0, 30); saveDay(S.date);
    const box = $('#waterBox'); if (box) { box.innerHTML = waterCard(d, g); fillsFrom(box); countUp(box); }
    const b = $('#waterBox .bottle'); if (b && n > 0) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    if (before < g.water && d.water >= g.water) toast('Obiettivo acqua raggiunto!');
    else if (n > 0) toast(`+${n * 250} ml · ${litri(d.water)} L oggi`);
  },
  quote: () => {
    const card = $('.quote'), q = card && card.querySelector('.q'); if (!q) return;
    const next = pickQuote(); S.currentQuote = next;
    card.classList.remove('tap'); void card.offsetWidth; card.classList.add('tap');
    if (reduceMotion()) { q.textContent = next; return; }
    if (!q.querySelector('.w')) q.innerHTML = words(q.textContent);
    const n = q.querySelectorAll('.w').length;
    q.classList.remove('words-in'); q.classList.add('words-out');            // le parole escono sfocate…
    clearTimeout(S.quoteT); S.quoteT = setTimeout(() => {                     // …e le nuove entrano una alla volta
      q.classList.remove('words-out'); q.innerHTML = words(next); void q.offsetWidth; q.classList.add('words-in');
    }, 200 + n * 12);
  },
  'add-open': el => openAdd(el.dataset.m),
  'add-photo': el => { const meal = A.meal, r = el.getBoundingClientRect(); closeSheet(true); openScanner(meal, r); },
  'add-tab': el => { A.tab = el.dataset.t; renderAdd(); },
  'add-pick-db': el => { A.src = srcFromDb(FOOD[el.dataset.k]); A.memSk = 'db:' + el.dataset.k; A.grams = A.src.grams; renderAdd(); },
  'add-pick-my': el => { const f = S.foods.find(x => x.id === el.dataset.id); if (!f) return; A.src = srcFromSaved(f); A.memSk = 'my:' + f.id; A.grams = A.src.grams; renderAdd(); },
  'g-step': el => { A.grams = clamp(Math.round((A.grams + +el.dataset.d) / 5) * 5, 5, 5000); $('#gramsIn').value = A.grams; $('#nutriBox').innerHTML = nutriHtml(entryFrom(A.src, A.grams)); },
  'add-meal': el => { A.meal = el.dataset.m; renderAdd(); },
  'add-confirm': () => {
    if (!(A.grams > 0)) return;
    if (A.src.water) {
      // acqua scelta dall'elenco: va nel contatore dei bicchieri (250 ml l'uno), come dallo scanner
      const d = ensureDay(S.date), n = Math.max(1, Math.round(A.grams / 250));
      d.water = clamp((d.water || 0) + n, 0, 30); saveDay(S.date); closeSheet(); if (S.view === 'today') renderToday();
      toast(`+${n * 250} ml · ${litri(d.water)} L oggi`); return;
    }
    addEntries(A.meal, [entryFrom(A.src, A.grams)]); closeSheet();
  },
  'sheet-close': () => { if ($('#addRoot') && A.src && !A.fromOutside) { A.src = null; renderAdd(); return; } A.fromOutside = false; closeSheet(); },
  entry: el => openEntry(el.dataset.m, el.dataset.id),
  'entry-del': el => { const d = ensureDay(S.date); d.meals[el.dataset.m] = d.meals[el.dataset.m].filter(e => e.id !== el.dataset.id); saveDay(S.date); closeSheet(); renderToday(); toast('Eliminato dal diario'); },
  'entry-memo': el => { const e = getDay(S.date).meals[el.dataset.m].find(x => x.id === el.dataset.id); if (e) { saveFoodMemo(e); toast('Memorizzato nei miei cibi'); } closeSheet(); },
  food: el => openSavedFood(el.dataset.id),
  'food-add': el => { const f = S.foods.find(x => x.id === el.dataset.id); if (!f) return; closeSheet(true); S.date = todayKey(); openAdd(autoMeal(), srcFromSaved(f)); A.fromOutside = true; },
  'food-del': el => { S.foods = S.foods.filter(f => f.id !== el.dataset.id); Store.del('food-' + el.dataset.id); closeSheet(); renderDiary(); toast('Rimosso dai miei cibi'); },
  'plan-add': el => {
    const day = getDay(S.date); const meals = day.plan && day.plan.meals ? day.plan.meals : buildPlan(S.date);
    const m = meals[+el.dataset.i]; if (!m) return;
    addEntries(m.meal, m.items.map(e => ({ ...e, id:rid() })), true); toast(`${m.label} aggiunto al diario`);
  },
  'plan-shuffle': () => { S.planShift++; renderPlan(); },
  'plan-reset': () => { const d = ensureDay(S.date); delete d.plan; saveDay(S.date); renderPlan(); },
  'edit-profile': () => { openSheet(`${sheetHead('Profilo')}<div class="sheet-body">${profileForm(S.profile)}</div>`); bindProfileForm(sheetEl); },
  'whats-new': () => checkWhatsNew(true),
  'reset-ask': () => { $('#resetBox').innerHTML = `<p class="note" style="margin:0 0 10px">Vuoi cancellare profilo, diario e cibi memorizzati? L'operazione non si può annullare.</p><div class="stack"><button class="btn danger fill" data-a="reset-yes">Sì, cancella tutto</button><button class="btn tinted" data-a="tab" data-v="profile">Annulla</button></div>`; },
  'reset-yes': () => {
    Store.del('profile'); Object.keys(S.days).forEach(k => Store.del('day-' + k)); S.foods.forEach(f => Store.del('food-' + f.id)); SCANMEM.clear();
    S.profile = null; S.days = {}; S.foods = []; S.weights = []; S.chat = []; S.meta = { riskSeen:{}, askedBody:false }; S.view = 'today'; S.date = todayKey();
    try { localStorage.removeItem(LKEY); } catch (e) {}
    render(); window.scrollTo(0, 0);
  },
  scan: () => { S.date = S.date || todayKey(); openScanner(); },
  'scan-close': () => closeScanner(),
  'cam-shot': () => snapCamera(),
  'cam-zoom': el => camSetZoom(+el.dataset.z),
  'cam-flip': () => { SC.facing = SC.facing === 'user' ? 'environment' : 'user'; if ((SC.zoom || 1) < 1) SC.zoom = 1; SC.hw = null; SC.onUw = false; stopCamera(); camWaitShow('Avvio la fotocamera…'); camZoomPaint(); startCamera(); },
  'scan-again': () => { SC.run = (SC.run || 0) + 1; Object.assign(SC, { img:null, desc:'', items:[] }); SC.state = canCamera() ? 'camera' : 'idle'; renderScanner(); if (SC.state === 'camera') startCamera(); else actions['pick-photo'](); },
  'res-portion': el => { const x = SC.items.find(i => i.id === el.dataset.id); if (!x) return; x.grams = el.dataset.g ? +el.dataset.g : Math.max(5, Math.round(x.base * +el.dataset.f / 5) * 5); renderResult(); },
  export: () => exportData(),
  goal: () => openGoal(),
  'install-tab': el => { S.installTab = el.dataset.k; document.querySelectorAll('[data-a=install-tab]').forEach(b => b.classList.toggle('on', b.dataset.k === S.installTab)); const box = $('#installSteps'); if (box) box.innerHTML = installSteps(S.installTab); },
  'install-done': () => { app.innerHTML = `<div class="welcome install"><div class="home-preview"><img src="icons/apple-touch-icon.png" alt=""><span>Piattino</span></div><h1 class="install-title">Perfetto!</h1><p class="tag">Ora chiudi questa pagina e apri Piattino toccando la sua icona sulla schermata Home. Lì potrai configurarla.</p><div style="margin-top:22px"><button class="btn tinted" data-a="install-skip">Non la trovo, continua nel browser</button></div></div>`; window.scrollTo(0, 0); },
  'install-skip': () => { S.installSkip = true; try { sessionStorage.setItem('piattino-install', 'skip'); } catch (e) {} renderWelcome(); window.scrollTo(0, 0); },
  coach: () => openCoach(),
  'coach-ask': el => coachAsk(el.dataset.q),
  'coach-act': el => coachAct(el.dataset.k),
  'gw-step': el => { const [lo, hi] = CONFIG.limits.weight; G.cur = clamp(Math.round((G.cur + +el.dataset.d) * 10) / 10, lo, hi); G.jumpOk = null; const i = $('#gwIn'); if (i) i.value = G.cur; if (G.mode === 'goal') { clearTimeout(G.t); G.t = setTimeout(renderGoal, 600); } },
  'gk-step': el => { const [lo, hi] = CONFIG.limits.weight; G.kg = clamp(Math.round((G.kg + +el.dataset.d) * 2) / 2, lo, hi); renderGoal(); },
  'g-rate': el => { G.rate = +el.dataset.r; renderGoal(); },
  'gw-save': () => {
    clearTimeout(G.t);
    const i = $('#gwIn'), v = i ? Math.round(+String(i.value).replace(',', '.') * 10) / 10 : G.cur, [lo, hi] = CONFIG.limits.weight;
    const fail = msg => { G.wErr = msg; G.jumpOk = null; renderGoal(); };
    if (!(v >= lo && v <= hi)) return fail(`Inserisci un peso tra ${lo} e ${hi} kg.`);
    if (checkBody(v, S.profile.height) === 'bmi') return fail('Con la tua altezza questo peso non sembra plausibile: controlla di averlo scritto in kg.');
    G.cur = v;
    // un salto grande rispetto all'ultima pesata è spesso un errore di battitura: si chiede conferma una volta
    const j = weightJump(S.weights, v);
    if (j && G.jumpOk !== v) { G.jumpOk = v; G.wErr = `Hai scritto ${fmt1(v)} kg, ma l'ultima pesata era ${fmt1(j.kg)} kg. Se è giusto, conferma.`; return renderGoal(); }
    G.wErr = ''; G.jumpOk = null;
    const before = T().kcal;
    logWeight(v); S.profile.weight = v; saveProfile();
    const after = T().kcal;
    render(); renderGoal();
    toast(after !== before ? `${fmt1(v)} kg registrati · ora ${fmt(after)} kcal al giorno` : `Peso registrato: ${fmt1(v)} kg`);
  },
  'w-del': el => {
    if (S.weights.length < 2) return;
    S.weights = S.weights.filter(x => x.d !== el.dataset.d);
    // il peso del profilo è sempre l'ultima pesata rimasta
    S.profile.weight = S.weights[S.weights.length - 1].kg; G.cur = +S.profile.weight; G.wErr = ''; G.jumpOk = null;
    saveProfile(); render(); renderGoal(); toast('Pesata tolta');
  },
  weight: () => openWeight(),
  'review-open': () => { closeSheet(true); if (S.profile.goal === 'lose' || S.profile.goal === 'gain' || S.profile.goal === 'muscle' || S.profile.target) openGoal(); else actions['edit-profile'](); },
  'review-keep': el => {
    // «Va bene così»: l'obiettivo resta, e il peso di oggi diventa il nuovo riferimento
    if (el.dataset.k === 'changed') S.profile.goalRef = { kg:+S.profile.weight, d:todayKey() };
    else S.profile.reviewSeen = { kind:el.dataset.k, d:todayKey() };
    saveProfile(); render(); renderGoal();
  },
  'review-maintain': () => {
    const p = S.profile; p.goal = 'maintain'; delete p.target; delete p.kcalAdj; delete p.reviewSeen; p.goalRef = { kg:+p.weight, d:todayKey() };
    saveProfile(); closeSheet(); render(); toast('Obiettivo: mantenere il peso');
  },
  'risk-ok': el => { S.meta.riskSeen[el.dataset.k] = todayKey(); Store.put(); render(); },
  'goal-save': () => {
    clearTimeout(G.t);
    const sm = goalSummary(); if (G.kg < sm.lo) return;
    const prev = S.profile.target, same = prev && prev.kg === G.kg && validKg(+prev.startKg);
    S.profile.target = { kg:G.kg, rate:G.rate, startKg: same ? prev.startKg : G.cur, startDate: same ? prev.startDate : todayKey() };
    S.profile.goal = sm.goal; S.profile.weight = G.cur; delete S.profile.kcalAdj; delete S.profile.reviewSeen;
    S.profile.goalRef = { kg:G.cur, d:todayKey() };
    if (!S.weights.some(x => x.d === todayKey())) logWeight(G.cur);
    saveProfile(); closeSheet(); render(); toast(sm.goal === 'maintain' ? 'Obiettivo: mantenere il peso' : `Obiettivo salvato: ${fmt1(G.kg)} kg`);
  },
  'goal-clear': () => { delete S.profile.target; delete S.profile.kcalAdj; delete S.profile.reviewSeen; S.profile.goalRef = { kg:+S.profile.weight, d:todayKey() }; saveProfile(); closeSheet(); render(); toast('Obiettivo di peso tolto'); },
  preload: () => preloadModel(),
  import: () => { const inp = $('#backupInput'); inp.value = ''; inp.click(); },
  'import-yes': () => { const d = S.pendingImport; if (!d) return; S.profile = d.profile; S.days = d.days; S.foods = d.foods; S.weights = d.weights; S.meta = d.meta; S.pendingImport = null; Store.saveNow(); S.view = 'today'; S.date = todayKey(); render(); window.scrollTo(0, 0); toast('Backup importato'); },
  'scan-describe': () => { stopCamera(); SC.state = 'describe'; renderScanner(); },
  'scan-desc-go': () => { const t = ($('#scanDesc')?.value || '').trim(); if (!t) { $('#scanDesc')?.focus(); return; } SC.desc = t.slice(0, 400); runScan(); },
  'scan-wait-describe': () => { SC.run = (SC.run || 0) + 1; attesaStop(true); SC.img = null; SC.state = 'describe'; renderScanner(); },
  'scan-stop': () => { SC.run = (SC.run || 0) + 1; attesaStop(true); SC.img = null; SC.state = SC.desc ? 'describe' : canCamera() ? 'camera' : 'idle'; renderScanner(); if (SC.state === 'camera') startCamera(); },
  'pick-photo': () => { stopCamera(); const inp = $('#photoInput'); inp.value = ''; inp.click(); },
  'scan-manual': () => { const thumb = SC.thumb, emb = SC.emb; closeScanner(); openAdd(SC.meal); A.pendingThumb = thumb; A.pendingEmb = emb; },
  'res-toggle': el => { const x = SC.items.find(i => i.id === el.dataset.id); if (!x) return; x.on = !x.on; if (x.on && x.grp) SC.items.forEach(i => { if (i !== x && i.grp) i.on = false; }); SC.touched = true; renderResult(); },
  'res-step': el => { const x = SC.items.find(i => i.id === el.dataset.id); if (!x) return; const step = Math.max(5, Math.round(x.base * .1 / 5) * 5); x.grams = clamp(x.grams + step * +el.dataset.d, step, 3000); renderResult(); },
  'res-meal': el => { SC.meal = el.dataset.m; renderResult(); },
  'res-add': () => {
    const chosen = SC.items.filter(x => x.on); if (!chosen.length) return;
    // PiattinoScan impara: un solo cibo scelto, diverso da quello proposto o proposto con poca sicurezza
    const pick = chosen.length === 1 ? chosen[0] : null;
    if (SC.emb && pick && pick.sk && SC.scanTop && (pick.sk !== SC.scanTop.sk || SC.scanTop.p < .6)) SCANMEM.add(SC.emb, pick.sk);
    // l'acqua va nel contatore dei bicchieri, non nel diario
    const glasses = chosen.filter(x => x.water).reduce((a, x) => a + Math.max(1, Math.round(x.grams / 250)), 0);
    const entries = chosen.filter(x => !x.water).map(itemEntry);
    if (SC.memo) entries.forEach(saveFoodMemo);
    const dateBefore = S.date; if (S.view !== 'today') { S.view = 'today'; }
    if (glasses) { const d = ensureDay(S.date); d.water = clamp((d.water || 0) + glasses, 0, 30); saveDay(S.date); }
    if (entries.length) addEntries(SC.meal, entries, true);
    closeScanner(); S.date = dateBefore; render(); window.scrollTo(0, 0);
    toast(entries.length ? `${SC.memo ? 'Aggiunto e memorizzato' : 'Aggiunto'} · ${fmt(entries.reduce((a, e) => a + e.kcal, 0))} kcal${glasses ? ` · +${glasses * 250} ml d'acqua` : ''}` : `+${glasses * 250} ml d'acqua`);
    SC.quote = null;
  },
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const fn = actions[el.dataset.a]; if (!fn) return;
  if (el.tagName === 'BUTTON' || el.dataset.a === 'quote') e.preventDefault();
  fn(el, e);
});
// niente zoom dell'intera app: pizzico (anche dal trackpad) e gesti a più dita non ingrandiscono la pagina
['gesturestart', 'gesturechange', 'gestureend'].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive:false }));
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive:false });
document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive:false });
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.a === 'quote') { e.preventDefault(); actions.quote(); }
  if (e.key === 'Escape') { if (sheetEl) closeSheet(); else if (scanner.classList.contains('show')) closeScanner(); }
});
$('#photoInput').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (f) handlePhoto(f); else if (SC.state === 'camera') startCamera(); });
// iOS: se l'utente annulla la scelta della foto non arriva nessun evento, quindi al ritorno riaccendiamo la fotocamera
window.addEventListener('focus', () => setTimeout(() => { if (scanner.classList.contains('show') && SC.state === 'camera' && !SC.stream) startCamera(); }, 400));
$('#backupInput').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  let raw = null; try { raw = JSON.parse(await f.text()); } catch (err) {}
  // readBackup (migrate.js) accetta i backup di tutte le versioni, li ripulisce e li porta al formato di oggi
  const r = readBackup(raw, { iconOk: k => !self.PIATTINO_ICONS || own(self.PIATTINO_ICONS, k) });
  if (!r.ok) { toast(r.why === 'newer' ? 'Questo backup viene da una versione più recente di Piattino: aggiorna l\'app e riprova.' : 'Questo file non è un backup di Piattino.', true); return; }
  const d = r.data;
  S.pendingImport = d;
  const when = r.exported ? new Date(r.exported).toLocaleDateString('it-IT', { day:'numeric', month:'long', year:'numeric' }) : '';
  const box = $('#backupBox'); if (!box) return;
  box.innerHTML = `<p class="note" style="margin:0">Vuoi sostituire i dati di questo dispositivo con il backup${when && when !== 'Invalid Date' ? ' del ' + esc(when) : ''}? Contiene ${Object.keys(d.days).length} giorni, ${d.weights.length} pesate e ${d.foods.length} cibi memorizzati.</p><button class="btn primary" data-a="import-yes">Importa e sostituisci</button><button class="btn tinted" data-a="tab" data-v="profile">Annulla</button>`;
});
async function exportData(){
  Store.saveNow();
  const data = JSON.stringify(toBackup({ profile:S.profile, days:S.days, foods:S.foods, weights:S.weights, meta:S.meta }));
  const name = `piattino-backup-${todayKey()}.json`;
  const file = new File([data], name, { type:'application/json' });
  try { if (navigator.canShare && navigator.canShare({ files:[file] })) { await navigator.share({ files:[file], title:'Backup Piattino' }); return; } }
  catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  toast('Backup esportato');
}

/* attach the scan photo to an item chosen from the list after a failed recognition,
   and let PiattinoScan remember the correction */
const origAdd = actions['add-confirm'];
actions['add-confirm'] = () => {
  if (A.pendingThumb && A.src && !A.src.thumb) A.src = { ...A.src, thumb: A.pendingThumb };
  if (A.pendingEmb && A.src && A.memSk && A.grams > 0) SCANMEM.add(A.pendingEmb, A.memSk);
  A.pendingThumb = null; A.pendingEmb = null; origAdd();
};

/* ---------- novità ---------- */
function checkWhatsNew(force = false) {
  try {
    const seen = localStorage.getItem('piattino-seen-v');
    if (!force && seen === APP_VERSION) return;
    if (!force) localStorage.setItem('piattino-seen-v', APP_VERSION);
    if (!seen && !force) return;
    setTimeout(() => {
      openSheet(`${sheetHead('Novità in Piattino', 'Chiudi')}<div class="sheet-body">
        <p class="note" style="margin-bottom:16px">Versione ${APP_VERSION}</p>
        <div class="card pad">
          <div class="meal-name">Obiettivi che seguono il tuo peso</div>
          <div class="small muted" style="margin-top:4px">Aggiorna il peso quando vuoi, da Profilo o dal Diario: Piattino ricalcola calorie, proteine e acqua e conserva lo storico con un grafico. Se il peso cambia molto ti propone di rivedere l'obiettivo, senza cambiarlo da solo.</div>
        </div>
        <div class="card pad" style="margin-top:12px">
          <div class="meal-name">Limiti più prudenti</div>
          <div class="small muted" style="margin-top:4px">Per dimagrire il ritmo massimo è 0,5 kg a settimana (e mai oltre lo 0,75% del peso), per aumentare 0,25 kg. Le calorie non scendono mai sotto il minimo sicuro. Se avevi scelto un ritmo più veloce, ora il piano usa il massimo prudente: la data di arrivo in «Obiettivo di peso» è aggiornata.</div>
        </div>
        <div class="card pad" style="margin-top:12px">
          <div class="meal-name">Un coach più attento</div>
          <div class="small muted" style="margin-top:4px">«Cosa faccio ora?» usa gli stessi obiettivi e gli stessi limiti del resto dell'app. Se i giorni registrati sono pochi o i numeri non tornano, te lo dice invece di dare cifre a caso.</div>
        </div>
        <div class="card pad" style="margin-top:12px">
          <div class="meal-name">Sesso: «Preferisco non dire»</div>
          <div class="small muted" style="margin-top:4px">Nel profilo puoi non indicare il sesso: Piattino usa una via di mezzo e resta sui limiti più prudenti.</div>
        </div>
        <div class="card pad" style="margin-top:12px">
          <div class="meal-name">Fotocamera con il grandangolo</div>
          <div class="small muted" style="margin-top:4px">Nuovo zoom 0,5× con il grandangolo, quando l'iPhone ce l'ha: per inquadrare tutto il piatto anche da vicino.</div>
        </div>
        <div class="card pad" style="margin-top:12px">
          <div class="meal-name">«Non chiudere questa schermata»</div>
          <div class="small muted" style="margin-top:4px">Mentre Piattino analizza la foto ti ricorda di non chiudere la schermata. Se l'analisi sembra ferma, ti dice cosa fare e compare il pulsante «Descrivi a parole»; lo schermo resta acceso così l'iPhone non si blocca a metà.</div>
        </div>
        <div class="card pad" style="margin-top:12px">
          <div class="meal-name">Nuova animazione di ricaricamento</div>
          <div class="small muted" style="margin-top:4px">Quando ricarichi l'app, il piattino si riempie con i tre bocconi per meno di un secondo, poi lascia il posto ai tuoi dati. Se torni dopo più di 10 minuti ritrovi la firma completa.</div>
        </div>
        <div class="card pad" style="margin-top:12px">
          <div class="meal-name">Barra in basso e scanner più precisi</div>
          <div class="small muted" style="margin-top:4px">L'indicatore della sezione non esce più dal bordo, e lo scanner aperto copre tutto lo schermo senza angoli che lasciano vedere sotto.</div>
        </div>
        <div class="card pad" style="margin-top:12px">
          <div class="meal-name">Su misura per lo schermo del tuo iPhone</div>
          <div class="small muted" style="margin-top:4px">Nell'app installata, la barra delle schede, il pulsante «Cosa faccio ora?» e la barra «Aggiungi» dello scanner seguono la curva degli angoli dello schermo, con lo stesso margine sui lati e in basso.</div>
        </div>
        <div class="card pad" style="margin-top:12px">
          <div class="meal-name">Scansione della foto più affidabile</div>
          <div class="small muted" style="margin-top:4px">Se il riconoscimento si bloccava all'inizio, ora l'app non resta ferma: se la grafica del telefono si pianta ripiega sul processore, oppure ti dice che c'è un problema, così puoi riprovare o descrivere il piatto a parole.</div>
        </div>
        <div class="card pad" style="margin-top:12px">
          <div class="meal-name">Icone 3D al posto delle emoji</div>
          <div class="small muted" style="margin-top:4px">Ogni cibo ha la sua icona disegnata apposta per Piattino: nel diario, nell'elenco, nel piano e nello scanner.</div>
        </div>
        <div class="card pad" style="margin-top:12px">
          <div class="meal-name">125 cibi e bevande nuovi</div>
          <div class="small muted" style="margin-top:4px">Ci sono anche würstel, tiramisù, sushi, kebab, cappuccino, tè freddo, spremuta e cola zero. La ricerca trova i cibi anche senza accenti e con altri nomi, per esempio «coca» o «clementina». Se scrivi «un bicchiere d'acqua», va nel contatore dell'acqua.</div>
        </div>
        <div class="card pad" style="margin-top:12px">
          <div class="meal-name">Nuova animazione di apertura</div>
          <div class="small muted" style="margin-top:4px">All'avvio il piattino si riempie e l'app entra più in fretta. Durante un aggiornamento compare «Aggiornamento…» invece di un salto improvviso.</div>
        </div>
      </div>`);
    }, force ? 0 : 2000);
  } catch (e) {}
}

/* ---------- boot ---------- */
const st = Store.load();
S.profile = st.profile; S.days = st.days; S.foods = st.foods; S.weights = st.weights; S.chat = st.chat; S.meta = st.meta;
if (st.migrated && st.profile) Store.put();
render();
// Avvio. Prima apertura della sessione: la firma (icona con molla, nome, piattino che si riempie) resta circa un secondo,
// poi si allarga e svanisce mentre i contenuti entrano a cascata. Ricaricamento (launch.js ha messo .launch-quick su <html>):
// resta solo il piattino che si riempie (~0,6 s), poi si dissolve mentre i contenuti entrano con una cascata più corta.
// veiled: i contenuti entrano da sotto la firma (completa o breve), che con Riduci movimento fa già da dissolvenza.
const bootIn = (first, veiled = first) => {
  const bar = $('#tabbar'), fab = $('#coachFab');
  if (reduceMotion()) {
    // solo una dissolvenza (le animazioni sono spente: si usa una transizione)
    if (!veiled) { app.style.opacity = '0'; void app.offsetWidth; app.style.transition = 'opacity .25s ease'; app.style.opacity = ''; setTimeout(() => { app.style.transition = ''; }, 300); }
    return;
  }
  if (!S.profile) {
    // benvenuto: la sua animazione d'ingresso è partita sotto la firma, la si fa ripartire
    const w = first && app.querySelector('.welcome.intro');
    if (w) { w.classList.remove('intro'); void w.offsetWidth; w.classList.add('intro'); }
    return;
  }
  if (!first) { app.classList.add('boot-quick'); setTimeout(() => app.classList.remove('boot-quick'), 1000); }
  enterView();
  bar.classList.remove('boot-rise'); void bar.offsetWidth; bar.classList.add('boot-rise');
  setTimeout(() => bar.classList.remove('boot-rise'), 900);
  if (!fab.hidden) { fab.style.animation = 'none'; void fab.offsetWidth; fab.style.animation = ''; }
};
(() => {
  const el = $('#launch');
  if (!el) { bootIn(false); return; }
  try { sessionStorage.setItem('piattino-launch', '1'); } catch (e) {}
  const root = document.documentElement;
  if (root.classList.contains('launch-quick')) {
    // firma breve: resta finché il terzo boccone è atterrato (~0,6 s dall'apertura, ~0,4 s con Riduci movimento), contando
    // il tempo già passato a caricare; se app.js arriva più tardi si dissolve subito. Poi velo e cascata partono insieme.
    const wait = Math.max(0, (reduceMotion() ? 400 : 620) - performance.now());
    setTimeout(() => {
      // se si è aspettato, gli anelli ripartono da vuoti sotto gli occhi (sotto il velo sarebbero già pieni)
      if (wait && S.profile) { S.ringPrev = {}; for (const k in numPrev) delete numPrev[k]; for (const k in fillPrev) delete fillPrev[k]; render(); }
      void el.offsetWidth; el.classList.add('out'); setTimeout(() => { el.remove(); root.classList.remove('launch-quick'); }, 440);
      bootIn(false, true);
    }, wait);
    return;
  }
  let done = false;
  const close = () => {
    if (done) return; done = true; el.classList.add('out'); setTimeout(() => el.remove(), 440);
    if (S.profile) { S.ringPrev = {}; for (const k in numPrev) delete numPrev[k]; for (const k in fillPrev) delete fillPrev[k]; render(); }
    bootIn(true);
  };
  // la firma è in pagina dal primo fotogramma: si chiude a circa 1,1 s dall'apertura (0,75 s con Riduci movimento),
  // contando anche il tempo già passato a caricare app.js, così il totale non supera ~1,4 s con la dissolvenza
  const at = reduceMotion() ? 750 : 1100;
  setTimeout(close, Math.max(150, at - performance.now())); el.addEventListener('click', close);
})();
// quando l'app esce di vista (background, ricaricamento, chiusura) se ne annota l'ora: launch.js la usa per scegliere
// tra firma completa (assente da più di 10 minuti) e firma breve
const markSeen = () => { try { localStorage.setItem('piattino-seen-at', String(Date.now())); } catch (e) {} };
window.addEventListener('pagehide', markSeen);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') markSeen(); });
// Prima di ricaricare per un aggiornamento: un velo con «Aggiornamento…» per un attimo, invece di un ricaricamento secco.
// Se l'app non è in primo piano nessuno lo vedrebbe: si ricarica subito.
function showUpdating(then){
  if (document.visibilityState !== 'visible') return then();
  const v = document.createElement('div');
  v.className = 'updating';
  v.innerHTML = '<div class="updating-pill ios-glass" role="status" aria-live="polite"><span class="mini-plate" aria-hidden="true"><span><i></i><i></i><i></i></span></span>Aggiornamento…</div>';
  document.body.appendChild(v); void v.offsetWidth; v.classList.add('show');
  setTimeout(then, reduceMotion() ? 350 : 700);
}
checkWhatsNew();
// dati vecchi o backup senza peso o altezza: si chiedono una volta al primo avvio, senza bloccare l'uso
// (se la finestra viene chiusa resta l'avviso «Completa il profilo» in Oggi)
if (S.profile && T().generic && !S.meta.askedBody) {
  setTimeout(() => { if (sheetEl || scanner.classList.contains('show')) return; S.meta.askedBody = true; Store.put(); actions['edit-profile'](); }, 2200);
}
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  // Su iOS la app resta in memoria per giorni: controlla gli aggiornamenti anche al ritorno in primo piano
  // e ricarica quando un nuovo service worker prende il controllo (solo se ce n'era già uno).
  let hadController = !!navigator.serviceWorker.controller, reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) { hadController = true; return; }
    if (reloaded) return;
    reloaded = true; Store.saveNow();
    showUpdating(() => { Store.saveNow(); location.reload(); });
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
    const check = () => reg.update().catch(() => {});
    check();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    window.addEventListener('pageshow', e => { if (e.persisted) check(); });
  }).catch(() => {});
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
})();
