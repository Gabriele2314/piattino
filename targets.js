// Piattino: calcolo degli obiettivi giornalieri e controlli di sicurezza.
// Funzioni pure (niente DOM, niente localStorage): le usano l'app, il coach e i test (tests/*.mjs).
// Numeri e soglie stanno tutti in config.js.
import { CONFIG as C } from './config.js';

/* ---------- date e piccoli aiuti ---------- */
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pad2 = n => String(n).padStart(2, '0');
export const dkey = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const parseKey = k => { const [y, m, d] = String(k).split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dkey(d); };
export const todayKey = () => dkey(new Date());
export const isKey = k => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k) && dkey(parseKey(k)) === k;
const dayDiff = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 864e5);
const inRange = (v, [lo, hi]) => Number.isFinite(v) && v >= lo && v <= hi;
const round1 = v => Math.round(v * 10) / 10;

/* ---------- profilo ---------- */
// M, F oppure X («preferisco non dire»)
export const normSex = s => s === 'M' || s === 'F' ? s : 'X';
export function ageOf(p, today = todayKey()){
  if (!p) return 0;
  if (isKey(p.birth)) {
    const b = parseKey(p.birth), n = parseKey(today);
    let a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a;
  }
  return +p.age || 0;
}
export const tierOf = age => age < 14 ? 'kid' : age < 18 ? 'teen' : age < 65 ? 'adult' : 'senior';
export const bmiOf = (w, h) => w / Math.pow(h / 100, 2);
// peso più basso che l'app accetta come obiettivo per questa altezza (kg interi)
export const minHealthyKg = h => Math.ceil(C.safety.minBmi * Math.pow(h / 100, 2));

// cosa manca per calcolare obiettivi su misura: 'weight', 'height', 'birth'
export function profileGaps(p, today = todayKey()){
  const out = [];
  if (!p) return ['weight', 'height', 'birth'];
  if (!inRange(+p.weight, C.limits.weight)) out.push('weight');
  if (!inRange(+p.height, C.limits.height)) out.push('height');
  if (!inRange(ageOf(p, today), C.limits.age)) out.push('birth');
  return out;
}
// controllo dei valori inseriti: null se plausibili, altrimenti il campo da correggere ('weight', 'height', 'bmi')
export function checkBody(weight, height){
  if (!inRange(+weight, C.limits.weight)) return 'weight';
  if (!inRange(+height, C.limits.height)) return 'height';
  if (!inRange(bmiOf(+weight, +height), C.limits.bmi)) return 'bmi';
  return null;
}

/* ---------- metabolismo a riposo ---------- */
export function bmrOf(sex, age, w, h){
  const one = s => {
    if (age < 18) { const [k, c] = (age < 10 ? C.bmr.schofield.under10 : C.bmr.schofield.under18)[s]; return k * w + c; }
    const m = C.bmr.mifflin; return m.kg * w + m.cm * h + m.age * age + m[s];
  };
  sex = normSex(sex);
  return sex === 'X' ? (one('M') + one('F')) / 2 : one(sex);
}

/* ---------- ritmo di variazione del peso ---------- */
// massimo prudente in kg a settimana per questa persona
export function maxRate(dir, w, bmi){
  const s = C.safety;
  if (dir === 'lose') return Math.floor(Math.min(s.loseMaxKgWeek, s.loseMaxFracWeek * w) * 100 + 1e-6) / 100;
  return bmi < s.minBmi ? s.gainMaxKgWeekUnderweight : s.gainMaxKgWeek;
}
// ritmi da proporre: solo quelli entro il massimo; ce n'è sempre almeno uno
export function rateOptions(dir, w, bmi){
  const cap = maxRate(dir, w, bmi);
  const list = C.rates[dir === 'lose' ? 'lose' : 'gain'].filter(([r]) => r <= cap + 1e-9);
  return list.length ? list : [[cap, 'Tranquillo']];
}
export const defaultRate = (dir, w, bmi) => { const o = rateOptions(dir, w, bmi); return o[Math.min(1, o.length - 1)][0]; };

/* ---------- obiettivi giornalieri ---------- */
const NOTE = {
  minor: 'Chi sta crescendo ha bisogno di tutta l\'energia per il suo corpo: niente diete, solo pasti equilibrati.',
  low: 'Con un indice di massa corporea sotto 18,5 dimagrire non è consigliato: il piano resta di mantenimento.',
  reached: 'Hai raggiunto il tuo obiettivo di peso: il piano passa al mantenimento. Complimenti!',
  muscleKid: 'Alla tua età i muscoli crescono giocando: sport, corsa, salti, arrampicate ed esercizi a corpo libero. Proteine a ogni pasto, tanto sonno, niente pesi pesanti senza istruttore e niente integratori.',
  muscleTeen: 'Per i muscoli contano allenamento, sonno e proteine a ogni pasto. Allenati con un istruttore e non usare integratori senza il parere del medico.',
  muscle: 'Leggero surplus di calorie e più proteine: abbinalo ad allenamenti di forza 3-4 volte a settimana.',
  generic: 'Questi sono valori di riferimento generici: aggiungi peso e altezza nel profilo per avere obiettivi su misura.',
};
const waterGlasses = w => Math.round(clamp(w * C.water.mlPerKg, C.water.minMl, C.water.maxMl) / C.water.glassMl);

function macros(kcal, goal, tier, w, h){
  const P = C.protein, table = goal === 'muscle' ? P.perKg.muscle : (goal === 'lose' || goal === 'gain') ? P.perKg.loseGain : P.perKg.base;
  const wRef = Math.min(w, P.refBmiCap * Math.pow(h / 100, 2));
  const protein = Math.round(Math.min(wRef * table[tier], kcal * P.maxKcalFrac / 4));
  const fat = Math.round(kcal * (goal === 'muscle' ? C.fatKcalFrac.muscle : C.fatKcalFrac.base) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { protein, fat, carbs };
}

// Restituisce sempre numeri utilizzabili. Se mancano peso o altezza: valori di riferimento generici (generic: true).
// limited: quali limiti di sicurezza hanno corretto il risultato ('rate', 'deficit', 'surplus', 'floor', 'ceil').
// pace: kg a settimana che ci si può aspettare con queste calorie (negativo = si scende).
export function targets(p, today = todayKey()){
  p = p || {};
  const age = ageOf(p, today), sex = normSex(p.sex), goal = p.goal || 'healthy';
  const missing = profileGaps(p, today);
  const tier = missing.includes('birth') ? 'adult' : tierOf(age);
  const base = { fv: C.fruitVeg, tier, sex, reached: false, limited: [], rate: 0, pace: 0, missing, generic: false };

  if (missing.length) {
    const kcal = C.generic.kcal[tier], protein = C.generic.protein[tier];
    const fat = Math.round(kcal * C.fatKcalFrac.base / 9);
    return { ...base, generic: true, kcal, protein, fat, carbs: Math.round((kcal - protein * 4 - fat * 9) / 4), water: C.generic.waterGlasses,
      bmr: 0, tdee: kcal, bmi: 0, floor: tier === 'adult' || tier === 'senior' ? C.safety.floorKcal[sex] : 0, note: NOTE.generic };
  }

  const w = +p.weight, h = +p.height, act = clamp(Math.round(+p.activity || 0), 0, 3);
  const bmi = bmiOf(w, h), bmr = bmrOf(sex, age, w, h);
  const s = C.safety;
  let kcal, tdee, note = '', reached = false, rate = 0, floor = 0;
  const limited = [];

  if (age < 18) {
    kcal = tdee = bmr * C.activity.minor[act];
    note = goal === 'muscle' ? (age < 14 ? NOTE.muscleKid : NOTE.muscleTeen) : NOTE.minor;
    kcal = clamp(kcal, s.floorKcal.F, s.ceilKcal);
  } else {
    tdee = bmr * C.activity.adult[act];
    kcal = tdee;
    floor = Math.max(s.floorKcal[sex], bmr);
    const tg = p.target && +p.target.kg ? p.target : null;
    const moving = ['lose', 'gain', 'muscle'].includes(goal);
    if (goal === 'lose' && bmi < s.minBmi) note = NOTE.low;
    else if (tg && moving) {
      const dir = goal === 'lose' ? 'lose' : 'gain';
      // l'obiettivo non scende mai sotto il peso minimo per l'altezza, qualunque cosa ci sia nei dati salvati
      const goalKg = dir === 'lose' ? Math.max(+tg.kg, minHealthyKg(h)) : +tg.kg;
      const diff = goalKg - w, asked = +tg.rate > 0 ? +tg.rate : defaultRate(dir, w, bmi), cap = maxRate(dir, w, bmi);
      if ((dir === 'lose' && diff < -C.review.reachedKg) || (dir === 'gain' && diff > C.review.reachedKg)) {
        rate = Math.min(asked, cap);
        if (asked > cap + 1e-9) limited.push('rate');
        kcal = tdee + (dir === 'lose' ? -1 : 1) * rate * C.kcalPerKg / 7;
      } else { reached = true; if (goal === 'muscle') kcal = tdee * C.goalFactor.muscleReached; }
    } else if (goal === 'muscle') kcal = tdee * (age >= 65 ? C.goalFactor.muscleSenior : C.goalFactor.muscle);
    else kcal = tdee * (C.goalFactor[goal] || 1);

    // correzione proposta dal coach: solo con un obiettivo che muove il peso, mai verso il basso se dimagrire non è consigliato
    let adj = moving ? clamp(+p.kcalAdj || 0, -s.coachAdjMaxKcal, s.coachAdjMaxKcal) : 0;
    if (bmi < s.minBmi && adj < 0) adj = 0;
    kcal += adj;

    // il ritmo massimo vale comunque: né un obiettivo in percentuale né la correzione del coach lo possono superare
    const perWeek = C.kcalPerKg / 7;
    const lo = Math.max(tdee * (1 - s.maxDeficitFrac), tdee - maxRate('lose', w, bmi) * perWeek);
    const hi = Math.min(tdee * (1 + s.maxSurplusFrac), tdee + maxRate('gain', w, bmi) * perWeek);
    if (kcal < lo - .5) { kcal = lo; limited.push('deficit'); }
    if (kcal > hi + .5) { kcal = hi; limited.push('surplus'); }
    if (kcal < floor) { kcal = floor; if (goal === 'lose') limited.push('floor'); }
    // il tetto ferma i numeri assurdi, ma non crea mai un deficit oltre il limite per chi ha un fabbisogno molto alto
    if (kcal > Math.max(s.ceilKcal, lo)) { kcal = Math.max(s.ceilKcal, lo); limited.push('ceil'); }
    if (goal === 'muscle') note = NOTE.muscle;
    if (reached) note = NOTE.reached;
  }
  // arrotondato alla decina, senza mai finire sotto il pavimento
  kcal = Math.round(kcal / 10) * 10;
  if (floor && kcal < floor) kcal = Math.ceil(floor / 10) * 10;
  const pace = age < 18 ? 0 : Math.round((kcal - tdee) * 7 / C.kcalPerKg * 100) / 100;
  return { ...base, ...macros(kcal, goal, tier, w, h), kcal, water: waterGlasses(w), bmr: Math.round(bmr), tdee: Math.round(tdee), bmi,
    floor: Math.round(floor), note, reached, limited, rate, pace };
}

/* ---------- storico del peso ---------- */
// aggiunge o sostituisce la pesata di un giorno; n conta quante volte è stata registrata quel giorno
export function addWeight(weights, kg, d = todayKey()){
  kg = round1(kg);
  const old = (weights || []).find(x => x.d === d);
  return [...(weights || []).filter(x => x.d !== d), { d, kg, n: (old ? old.n || 1 : 0) + 1 }].sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0).slice(-400);
}
// la pesata precedente più vicina, se quella nuova se ne allontana tanto da sembrare un errore di battitura
export function weightJump(weights, kg, d = todayKey()){
  const L = C.limits, prev = (weights || []).filter(x => x.d < d && dayDiff(x.d, d) <= L.weightJumpDays).pop();
  return prev && Math.abs(kg - prev.kg) / prev.kg > L.weightJumpFrac ? prev : null;
}
// andamento (retta ai minimi quadrati) delle pesate degli ultimi `days` giorni; null se sono troppo poche
export function weightTrend(weights, today = todayKey(), days = C.trend.windowDays){
  const since = addDays(today, -days);
  const rows = (weights || []).filter(x => x.d >= since && x.d <= today);
  const pts = rows.map(x => [dayDiff(since, x.d), x.kg]);
  if (pts.length < C.trend.minPoints) return null;
  const span = pts[pts.length - 1][0] - pts[0][0]; if (span < C.trend.minSpanDays) return null;
  const n = pts.length, mx = pts.reduce((a, q) => a + q[0], 0) / n, my = pts.reduce((a, q) => a + q[1], 0) / n;
  const slope = pts.reduce((a, q) => a + (q[0] - mx) * (q[1] - my), 0) / pts.reduce((a, q) => a + (q[0] - mx) ** 2, 0);
  // salti impossibili fra due pesate vicine: quasi certamente un errore, l'andamento non è affidabile
  let coherent = true;
  for (let i = 1; i < n; i++) {
    const dd = pts[i][0] - pts[i - 1][0], dk = Math.abs(pts[i][1] - pts[i - 1][1]);
    if (dk > Math.max(2, C.trend.maxPlausibleKgWeek * dd / 7)) coherent = false;
  }
  return { perWeek: slope * 7, span, n, first: pts[0][1], last: pts[n - 1][1], coherent };
}

/* ---------- rivedere l'obiettivo ---------- */
// Quando conviene proporre di rivedere l'obiettivo (mai cambiarlo in silenzio). null se non c'è niente da proporre.
// kind: 'low' (dimagrire non è più consigliato), 'reached' (obiettivo di peso raggiunto), 'changed' (peso cambiato molto).
// p.goalRef = { kg, d }: il peso di quando l'obiettivo è stato scelto o confermato. p.reviewSeen = { kind, d }: «Va bene così».
export function goalReview(p, today = todayKey()){
  if (!p || profileGaps(p, today).length || ageOf(p, today) < 18) return null;
  const R = C.review, w = +p.weight, goal = p.goal || 'healthy';
  const snoozed = k => p.reviewSeen && p.reviewSeen.kind === k && isKey(p.reviewSeen.d) && dayDiff(p.reviewSeen.d, today) < R.snoozeDays;
  if (goal === 'lose' && bmiOf(w, +p.height) < C.safety.minBmi) return snoozed('low') ? null : { kind: 'low' };
  const tg = p.target && +p.target.kg ? p.target : null, moving = ['lose', 'gain', 'muscle'].includes(goal);
  if (tg && moving) {
    const done = goal === 'lose' ? w <= +tg.kg + R.reachedKg : w >= +tg.kg - R.reachedKg;
    if (done) return snoozed('reached') ? null : { kind: 'reached', kg: +tg.kg };
  }
  const ref = p.goalRef && +p.goalRef.kg > 0 ? p.goalRef : null;
  if (!ref) return null;
  const delta = round1(w - ref.kg);
  if (Math.abs(delta) < Math.max(R.changeKg, R.changeFrac * ref.kg)) return null;
  // con un peso da raggiungere, muoversi nella direzione scelta è il piano che funziona: non c'è niente da rivedere
  if (tg && moving && ((goal === 'lose') === (delta < 0))) return null;
  return snoozed('changed') ? null : { kind: 'changed', delta, since: ref.d || null };
}

/* ---------- diario: quanto è stato registrato ---------- */
const MEAL_KEYS = ['colazione', 'pranzo', 'cena', 'spuntini'];
export function dayTotals(day){
  const t = { kcal: 0, p: 0, c: 0, f: 0, fv: 0, n: 0 };
  const meals = (day && day.meals) || {};
  MEAL_KEYS.forEach(m => (Array.isArray(meals[m]) ? meals[m] : []).forEach(e => { t.kcal += +e.kcal || 0; t.p += +e.p || 0; t.c += +e.c || 0; t.f += +e.f || 0; t.fv += +e.fv || 0; t.n++; }));
  return t;
}
const pastDays = (days, today, n) => Array.from({ length: n }, (_, i) => addDays(today, -(i + 1))).map(k => ({ k, t: dayTotals((days || {})[k]) }));

// Il coach dà numeri solo se i dati bastano e stanno in piedi. why: 'profile', 'few', 'incoherent' oppure null.
export function coachData({ profile, days, today = todayKey() }){
  const g = targets(profile, today);
  const logged = pastDays(days, today, 7).filter(x => x.t.n >= C.coach.minEntriesPerDay);
  if (g.generic) return { ok: false, why: 'profile', logged: logged.length };
  if (logged.length < C.coach.minLoggedDays) return { ok: false, why: 'few', logged: logged.length };
  const avg = logged.reduce((a, x) => a + x.t.kcal, 0) / logged.length;
  if (avg < g.bmr * C.coach.minKcalFracOfBmr || avg > g.tdee * C.coach.maxKcalFracOfTdee) return { ok: false, why: 'incoherent', logged: logged.length };
  return { ok: true, why: null, logged: logged.length };
}

/* ---------- segnali di rischio ---------- */
// Elenco dei segnali presenti: 'lowIntake', 'fastLoss', 'manyLogs'. Non sono diagnosi: servono solo a mostrare un invito gentile.
// seen = { kind: 'AAAA-MM-GG' }: i segnali già letti, che non tornano per `snoozeDays`.
export function riskSignals({ profile, days, weights, today = todayKey(), seen = {} }){
  if (!profile) return [];
  const R = C.risk, g = targets(profile, today), minor = ageOf(profile, today) < 18, out = [];
  const week = pastDays(days, today, R.windowDays);
  const full = week.filter(x => x.t.n >= R.minEntriesPerDay);
  const lowAt = minor ? g.kcal * R.lowKcalFracOfTargetMinor : C.safety.floorKcal[g.sex] * R.lowKcalFracOfFloor;
  if (!g.generic && full.filter(x => x.t.kcal < lowAt).length >= R.lowDays) out.push('lowIntake');
  const tr = weightTrend(weights, today);
  if (!g.generic && tr && tr.coherent && tr.n >= 3 && tr.span >= R.fastLossMinSpanDays && tr.perWeek < -R.fastLossFracWeek * +profile.weight) out.push('fastLoss');
  const since = addDays(today, -R.windowDays);
  const weighIns = (weights || []).filter(x => x.d > since && x.d <= today).reduce((a, x) => a + (x.n || 1), 0);
  const todayN = dayTotals((days || {})[today]).n;
  if (weighIns > R.weighInsPerWeek || week.filter(x => x.t.n > R.entriesPerDay).length + (todayN > R.entriesPerDay ? 1 : 0) >= R.entriesDays) out.push('manyLogs');
  return out.filter(k => !(isKey(seen[k]) && dayDiff(seen[k], today) < R.snoozeDays));
}

/* ---------- come sta andando il percorso: parole, non voti ---------- */
// Una frase per accompagnare il grafico del peso. Niente colpe e niente confronti: descrive la direzione e basta.
export function journeyText({ weights, goal, minor, today = todayKey() }){
  const n = (weights || []).length;
  if (minor) return 'Mentre cresci il peso sale insieme all\'altezza: è normale. Qui vedi il tuo andamento, senza numeri da raggiungere.';
  if (n < 2) return 'Segna il peso ogni tanto: basta una volta a settimana, al mattino, per vedere il percorso.';
  const tr = weightTrend(weights, today);
  if (!tr) return 'Hai iniziato a segnare il peso. Tra qualche giorno qui vedrai la direzione, che conta più del singolo numero.';
  if (!tr.coherent) return 'Tra le ultime pesate c\'è un salto insolito: se è un errore di battitura puoi correggerlo registrando di nuovo il peso di quel giorno.';
  const pw = tr.perWeek, flat = Math.abs(pw) < .1;
  const swing = 'Il peso cambia anche per acqua, sale, ciclo e allenamenti: guarda la tendenza delle settimane, non il numero di un giorno.';
  if (goal === 'lose') return flat ? 'In queste settimane il peso è stabile. Succede: il corpo si muove a gradini e ogni giorno registrato ti aiuta a capire.' : pw < 0 ? 'Il peso sta scendendo con calma, ed è il modo in cui i risultati restano. Continua così.' : swing;
  if (goal === 'gain' || goal === 'muscle') return flat ? 'In queste settimane il peso è stabile. Ci vuole pazienza: uno spuntino in più al giorno fa la differenza nel tempo.' : pw > 0 ? 'Il peso sta salendo con calma: è la direzione che hai scelto. Continua così.' : swing;
  return flat ? 'Il tuo peso è stabile: stai mantenendo l\'equilibrio.' : swing;
}
