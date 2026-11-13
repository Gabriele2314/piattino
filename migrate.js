// Piattino: formato dei dati salvati e dei backup.
// Funzioni pure: le usano l'app (all'avvio e quando si importa un backup) e i test (tests/*.mjs).
//
// Formato 1 (fino alla 4.1): { v:1, profile, days, foods, weights?, chat? }. Le primissime versioni non avevano weights e chat,
//   e il profilo poteva avere `age` al posto di `birth`.
// Formato 2 (dalla 4.2): come il formato 1, più
//   - profile.sex: 'M', 'F' oppure 'X' («preferisco non dire»);
//   - profile.goalRef = { kg, d }: il peso di quando l'obiettivo è stato scelto o confermato;
//   - profile.reviewSeen = { kind, d }: l'ultima proposta di rivedere l'obiettivo a cui si è risposto «Va bene così»;
//   - weights[i].n: quante volte la pesata di quel giorno è stata registrata;
//   - meta = { riskSeen: { segnale: data }, askedBody: bool }.
// La migrazione aggiunge e basta: non toglie campi, nemmeno quelli che non conosce. È idempotente.
import { CONFIG as C } from './config.js';
import { isKey, todayKey, normSex } from './targets.js';

const MEALS = ['colazione', 'pranzo', 'cena', 'spuntini'];
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const validKg = kg => Number.isFinite(kg) && kg >= C.limits.weight[0] && kg <= C.limits.weight[1];

export function migrate(raw, today = todayKey()){
  const v = isObj(raw) ? raw : {};
  const st = {
    v: C.schema,
    profile: isObj(v.profile) ? { ...v.profile } : null,
    days: isObj(v.days) ? { ...v.days } : {},
    foods: Array.isArray(v.foods) ? v.foods.filter(isObj) : [],
    weights: Array.isArray(v.weights) ? v.weights : [],
    chat: Array.isArray(v.chat) ? v.chat.filter(isObj) : [],
    meta: { riskSeen: {}, askedBody: false, ...(isObj(v.meta) ? v.meta : {}) },
    // dati scritti da una versione più recente di questa: si leggono lo stesso, ma chi importa deve saperlo
    newer: +v.v > C.schema,
  };
  if (!isObj(st.meta.riskSeen)) st.meta.riskSeen = {};

  // giorni: ogni giorno ha i quattro pasti e l'acqua. I pasti scritti direttamente nel giorno (senza `meals`) vengono spostati dentro.
  for (const k of Object.keys(st.days)) {
    const d = st.days[k];
    if (!isObj(d)) { delete st.days[k]; continue; }
    const meals = isObj(d.meals) ? { ...d.meals } : {};
    const day = { ...d, meals, water: Math.max(0, +d.water || 0) };
    for (const m of MEALS) {
      if (!Array.isArray(meals[m])) meals[m] = Array.isArray(d[m]) ? d[m] : [];
      if (!isObj(d.meals)) delete day[m];
      meals[m] = meals[m].filter(isObj);
    }
    st.days[k] = day;
  }

  // pesate: una per giorno (vale l'ultima scritta), in ordine di data
  const byDay = new Map();
  for (const x of st.weights) {
    if (!isObj(x) || !isKey(x.d) || !validKg(+x.kg)) continue;
    byDay.set(x.d, { ...x, kg: Math.round(+x.kg * 10) / 10, n: Math.max(1, Math.round(+x.n) || 1) });
  }
  st.weights = [...byDay.values()].sort((a, b) => a.d < b.d ? -1 : 1);

  const p = st.profile;
  if (p) {
    p.sex = normSex(p.sex);
    const w = +p.weight, last = st.weights[st.weights.length - 1];
    // lo storico parte dal peso del profilo; se il profilo non ha un peso valido ma lo storico sì, vale l'ultima pesata
    if (validKg(w) && !st.weights.length) st.weights = [{ d: today, kg: Math.round(w * 10) / 10, n: 1 }];
    else if (!validKg(w) && last) p.weight = last.kg;
    if (isObj(p.target)) {
      p.target = { ...p.target };
      if (!isKey(p.target.startDate)) p.target.startDate = today;
      if (!validKg(+p.target.startKg)) {
        const at = st.weights.find(x => x.d >= p.target.startDate) || st.weights[0];
        if (at) p.target.startKg = at.kg; else if (validKg(+p.weight)) p.target.startKg = +p.weight;
      }
    }
    // riferimento per «il peso è cambiato molto»: si parte dal peso di oggi, così l'aggiornamento non fa comparire subito la proposta
    if (!(isObj(p.goalRef) && validKg(+p.goalRef.kg)) && validKg(+p.weight)) p.goalRef = { kg: +p.weight, d: today };
  }
  return st;
}

/* ---------- backup ---------- */
// quello che finisce nel file esportato
export function toBackup(st, now = new Date()){
  return { app: 'piattino', v: C.schema, exported: now.toISOString(), profile: st.profile, days: st.days, foods: st.foods, weights: st.weights, meta: st.meta };
}

const cleanStr = (s, max) => (typeof s === 'string' ? s : '').slice(0, max);
const num = (v, lo, hi, def = 0) => { v = +v; return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def; };
const isDataImage = s => typeof s === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s) && s.length < 300000;
const GOALS = ['lose', 'maintain', 'muscle', 'gain', 'healthy', 'sport'];

// Legge un backup di qualsiasi versione (formato 1 o 2), lo ripulisce (il file viene da fuori: niente HTML, niente valori assurdi)
// e lo porta al formato di oggi. iconOk(chiave) dice se un'icona esiste.
// Restituisce { ok:true, data } oppure { ok:false, why: 'shape' | 'newer' }.
export function readBackup(d, { today = todayKey(), iconOk = () => true } = {}){
  if (!isObj(d) || d.app !== 'piattino' || !isObj(d.days) || !isObj(d.profile)) return { ok: false, why: 'shape' };
  if (+d.v > C.schema) return { ok: false, why: 'newer' };
  const entry = e => ({
    id: cleanStr(e.id, 32) || Math.random().toString(36).slice(2, 12),
    name: cleanStr(e.name, 80),
    emoji: cleanStr(e.emoji, 8),
    icon: typeof e.icon === 'string' && /^[a-z-]{1,24}$/.test(e.icon) && iconOk(e.icon) ? e.icon : '',
    ...('thumb' in e ? { thumb: isDataImage(e.thumb) ? e.thumb : null } : {}),
    grams: num(e.grams, 0, 5000), kcal: num(e.kcal, 0, 10000),
    p: num(e.p, 0, 2000), c: num(e.c, 0, 2000), f: num(e.f, 0, 2000), fv: num(e.fv, 0, 100),
    ...(Number.isFinite(+e.saved) ? { saved: +e.saved } : {}),
  });
  const m = migrate(d, today);   // prima la forma (pasti dentro `meals`, pesate valide), poi la pulizia dei contenuti
  const days = {};
  for (const k of Object.keys(m.days).filter(isKey).slice(-2000)) {
    const meals = {};
    for (const meal of MEALS) meals[meal] = m.days[k].meals[meal].slice(0, 50).map(entry);
    days[k] = { meals, water: num(m.days[k].water, 0, 40) };
  }
  const src = m.profile, birth = isKey(src.birth) ? src.birth : '';
  const profile = {
    name: cleanStr(src.name, 30), birth, sex: normSex(src.sex),
    height: num(src.height, 0, 300), weight: num(src.weight, 0, 500),
    activity: Math.round(num(src.activity, 0, 3)), goal: GOALS.includes(src.goal) ? src.goal : 'healthy',
    age: Math.round(num(src.age, 0, 130)),
  };
  if (Number.isFinite(+src.kcalAdj) && +src.kcalAdj) profile.kcalAdj = num(src.kcalAdj, -500, 500);
  if (isObj(src.target) && validKg(+src.target.kg)) {
    profile.target = { kg: +src.target.kg, rate: num(src.target.rate, 0, 2, 0), startDate: isKey(src.target.startDate) ? src.target.startDate : today };
    if (validKg(+src.target.startKg)) profile.target.startKg = +src.target.startKg;
  }
  if (isObj(src.goalRef) && validKg(+src.goalRef.kg)) profile.goalRef = { kg: +src.goalRef.kg, d: isKey(src.goalRef.d) ? src.goalRef.d : today };
  if (isObj(src.reviewSeen) && isKey(src.reviewSeen.d)) profile.reviewSeen = { kind: cleanStr(src.reviewSeen.kind, 12), d: src.reviewSeen.d };
  const riskSeen = {};
  for (const [k, v] of Object.entries(m.meta.riskSeen)) if (/^[a-zA-Z]{1,16}$/.test(k) && isKey(v)) riskSeen[k] = v;
  const data = {
    profile, days,
    foods: m.foods.slice(0, 500).map(entry),
    weights: m.weights.slice(-400).map(x => ({ d: x.d, kg: x.kg, n: Math.min(99, x.n) })),
    chat: [],
    meta: { riskSeen, askedBody: !!m.meta.askedBody },
  };
  // un secondo passaggio completa i campi che dipendono dai valori ripuliti (goalRef, peso di partenza dell'obiettivo)
  return { ok: true, data: migrate({ v: C.schema, ...data }, today), exported: typeof d.exported === 'string' ? d.exported : '' };
}
