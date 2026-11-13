// Test del calcolo degli obiettivi. Senza dipendenze: `node --test`
import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../config.js';
import { targets, bmrOf, maxRate, rateOptions, minHealthyKg, checkBody, profileGaps, addWeight, weightJump, weightTrend, goalReview, coachData, riskSignals, journeyText, addDays, ageOf } from '../targets.js';

const TODAY = '2026-11-12';
const adult = (o = {}) => ({ name: 'Ada', birth: '1990-06-15', sex: 'F', height: 165, weight: 70, activity: 1, goal: 'maintain', ...o });
const entry = kcal => ({ id: 'x', name: 'Cibo', kcal, p: 10, c: 10, f: 5, fv: 0, grams: 100 });
// n giorni prima di oggi, ognuno con `per` voci da `kcal` in tutto
const diary = (n, kcal, per = 3) => Object.fromEntries(Array.from({ length: n }, (_, i) => [addDays(TODAY, -(i + 1)),
  { meals: { colazione: Array.from({ length: per }, () => entry(kcal / per)), pranzo: [], cena: [], spuntini: [] }, water: 4 }]));

test('Mifflin-St Jeor: valori noti', () => {
  // 10·70 + 6,25·165 − 5·36 − 161 = 1390,25
  assert.equal(bmrOf('F', 36, 70, 165), 1390.25);
  assert.equal(bmrOf('M', 36, 70, 165), 1556.25);
  // «preferisco non dire»: media delle due
  assert.equal(bmrOf('X', 36, 70, 165), (1390.25 + 1556.25) / 2);
  assert.equal(ageOf(adult(), TODAY), 36);
});

test('mantenimento: calorie = fabbisogno, macro che tornano', () => {
  const g = targets(adult(), TODAY);
  assert.equal(g.tdee, Math.round(1390.25 * 1.375));
  assert.equal(g.kcal, Math.round(g.tdee / 10) * 10);
  assert.equal(g.fv, 5);
  assert.equal(g.water, 8);               // 70 kg · 30 ml = 2,1 L = 8 bicchieri
  assert.ok(Math.abs(g.protein * 4 + g.carbs * 4 + g.fat * 9 - g.kcal) <= 12);
  assert.deepEqual(g.limited, []);
  assert.equal(g.generic, false);
});

test('ogni obiettivo dà numeri finiti e dentro i limiti', () => {
  for (const goal of ['lose', 'maintain', 'muscle', 'gain', 'healthy'])
    for (const sex of ['F', 'M', 'X'])
      for (const act of [0, 1, 2, 3]) {
        const g = targets(adult({ goal, sex, activity: act }), TODAY);
        for (const k of ['kcal', 'protein', 'fat', 'carbs', 'water', 'fv', 'bmr', 'tdee']) assert.ok(Number.isFinite(g[k]) && g[k] >= 0, `${goal}/${sex}/${act}: ${k}`);
        assert.ok(g.kcal >= C.safety.floorKcal[sex] && g.kcal >= g.bmr - 5 && g.kcal <= C.safety.ceilKcal, `${goal}/${sex}/${act}: kcal ${g.kcal}`);
        assert.ok(g.kcal >= g.tdee * (1 - C.safety.maxDeficitFrac) - 6, `${goal}/${sex}/${act}: deficit oltre il limite`);
        assert.ok(g.kcal <= g.tdee * (1 + C.safety.maxSurplusFrac) + 6 || g.kcal === Math.ceil(g.floor / 10) * 10, `${goal}/${sex}/${act}: surplus oltre il limite`);
      }
});

test('pesi e altezze estremi: mai NaN, mai sotto il pavimento, mai deficit oltre il limite', () => {
  for (const weight of [20, 25, 40, 55, 120, 200, 300])
    for (const height of [100, 140, 165, 200, 230])
      for (const birth of ['2008-01-01', '1990-06-15', '1940-01-01'])
        for (const sex of ['F', 'M', 'X'])
          for (const goal of ['lose', 'gain', 'muscle']) {
            const p = adult({ weight, height, birth, sex, goal, target: { kg: goal === 'lose' ? weight - 30 : weight + 30, rate: 2 }, kcalAdj: goal === 'lose' ? -500 : 500 });
            const g = targets(p, TODAY), tag = `${weight} kg ${height} cm ${birth} ${sex} ${goal}`;
            for (const k of ['kcal', 'protein', 'fat', 'carbs', 'water']) assert.ok(Number.isFinite(g[k]) && g[k] >= 0, `${tag}: ${k} = ${g[k]}`);
            assert.ok(g.kcal >= C.safety.floorKcal[sex], `${tag}: sotto il pavimento (${g.kcal})`);
            assert.ok(g.kcal >= g.bmr - 5, `${tag}: sotto il metabolismo a riposo`);
            assert.ok(g.kcal <= Math.max(C.safety.ceilKcal, g.tdee), `${tag}: oltre il tetto`);
            assert.ok(g.kcal >= g.tdee * (1 - C.safety.maxDeficitFrac) - 6, `${tag}: deficit oltre il limite`);
            assert.ok(g.pace >= -C.safety.loseMaxKgWeek - .01, `${tag}: ritmo ${g.pace}`);
            assert.ok(g.protein * 4 <= g.kcal * C.protein.maxKcalFrac + 4, `${tag}: troppe proteine`);
            assert.ok(g.water >= 6 && g.water <= 14, `${tag}: acqua ${g.water}`);
          }
});

test('dimagrire: il ritmo chiesto viene limitato al massimo prudente', () => {
  const p = adult({ weight: 90, goal: 'lose', target: { kg: 75, rate: .75 } });   // obiettivo salvato con la versione precedente
  const g = targets(p, TODAY);
  assert.equal(g.rate, .5);
  assert.ok(g.limited.includes('rate'));
  assert.ok(g.kcal >= g.tdee * .8 - 6);
  // 60 kg: lo 0,75% del peso è 0,45 kg a settimana
  assert.equal(maxRate('lose', 60, 22), .45);
  assert.deepEqual(rateOptions('lose', 60, 22).map(r => r[0]), [.25, .35]);
  assert.deepEqual(rateOptions('lose', 100, 33).map(r => r[0]), [.25, .35, .5]);
  // sempre almeno un ritmo, anche con un peso molto basso
  assert.equal(rateOptions('lose', 26, 19).length, 1);
});

test('dimagrire: pavimento calorico e metabolismo a riposo non si superano', () => {
  // donna piccola e poco attiva: il fabbisogno è già vicino al pavimento
  const g = targets(adult({ weight: 50, height: 150, birth: '1960-01-01', activity: 0, goal: 'lose', target: { kg: 46, rate: .5 } }), TODAY);
  assert.ok(g.kcal >= 1200 && g.kcal >= g.bmr);
  assert.ok(g.limited.includes('floor') || g.limited.includes('deficit'));
  // con «preferisco non dire» vale il pavimento più alto
  const x = targets(adult({ sex: 'X', weight: 50, height: 150, activity: 0, goal: 'lose', target: { kg: 46, rate: .5 } }), TODAY);
  assert.ok(x.kcal >= 1500);
});

test('sottopeso: niente dimagrimento, nemmeno con la correzione del coach', () => {
  const g = targets(adult({ weight: 48, height: 170, goal: 'lose', target: { kg: 45, rate: .5 }, kcalAdj: -300 }), TODAY);
  assert.ok(g.bmi < 18.5);
  assert.ok(g.kcal >= g.tdee - 6);
  assert.match(g.note, /non è consigliato/);
});

test('obiettivo sotto il peso minimo per l\'altezza: ci si ferma al minimo', () => {
  const min = minHealthyKg(165);   // 51 kg
  assert.equal(min, 51);
  const g = targets(adult({ weight: 51.1, goal: 'lose', target: { kg: 40, rate: .5 } }), TODAY);
  assert.equal(g.reached, true);
  assert.ok(g.kcal >= g.tdee - 6);
});

test('aumentare: al massimo 0,25 kg a settimana, 0,5 solo se sottopeso', () => {
  const g = targets(adult({ goal: 'gain', target: { kg: 76, rate: .5 } }), TODAY);
  assert.equal(g.rate, .25);
  assert.ok(g.limited.includes('rate'));
  const u = targets(adult({ weight: 48, height: 170, goal: 'gain', target: { kg: 55, rate: .5 } }), TODAY);
  assert.equal(u.rate, .5);
  assert.ok(u.kcal <= u.tdee * 1.2 + 6);
});

test('correzione del coach: entro ±300 kcal e mai oltre i limiti', () => {
  const base = targets(adult({ goal: 'lose' }), TODAY);
  const adj = targets(adult({ goal: 'lose', kcalAdj: -5000 }), TODAY);
  assert.ok(adj.kcal >= base.tdee * .8 - 6 && adj.kcal >= adj.floor);
  // con «mantenere» la correzione non vale
  assert.equal(targets(adult({ kcalAdj: -300 }), TODAY).kcal, targets(adult(), TODAY).kcal);
});

test('cambio di obiettivo: le calorie si ordinano come ci si aspetta', () => {
  const k = goal => targets(adult({ goal }), TODAY).kcal;
  assert.ok(k('lose') < k('maintain'));
  assert.equal(k('maintain'), k('healthy'));
  assert.ok(k('maintain') < k('muscle') && k('muscle') < k('gain'));
  assert.ok(targets(adult({ goal: 'muscle' }), TODAY).protein > targets(adult({ goal: 'maintain' }), TODAY).protein);
});

test('cambio di peso: gli obiettivi si ricalcolano', () => {
  const a = targets(adult({ weight: 70 }), TODAY), b = targets(adult({ weight: 80 }), TODAY);
  assert.ok(b.kcal > a.kcal && b.protein > a.protein && b.water > a.water);
  assert.equal(b.bmr - a.bmr, 100);   // 10 kcal per kg
});

test('proteine: con un indice di massa corporea alto non crescono all\'infinito', () => {
  const g = targets(adult({ weight: 160, goal: 'lose' }), TODAY);
  assert.ok(g.protein <= Math.round(30 * 1.65 * 1.65 * 1.3));
});

test('sotto i 18 anni: niente deficit, niente obiettivo di peso, niente correzioni', () => {
  const kid = { birth: '2015-03-01', sex: 'M', height: 140, weight: 35, activity: 2, goal: 'lose', target: { kg: 30, rate: .5 }, kcalAdj: -300 };
  const g = targets(kid, TODAY);
  assert.equal(g.tier, 'kid');
  assert.equal(g.kcal, Math.round(g.tdee / 10) * 10);
  assert.equal(g.pace, 0);
  assert.equal(goalReview(kid, TODAY), null);
  // Schofield 10-17 anni, maschio: 17,686·35 + 658,2
  assert.equal(g.bmr, Math.round(17.686 * 35 + 658.2));
  const teenX = targets({ ...kid, birth: '2010-03-01', sex: 'X' }, TODAY);
  assert.ok(teenX.bmr > 13.384 * 35 + 692.6 && teenX.bmr < 17.686 * 35 + 658.2);
});

test('peso o altezza mancanti: valori di riferimento, l\'app non si blocca', () => {
  for (const p of [adult({ weight: '' }), adult({ height: undefined }), adult({ weight: 0 }), adult({ weight: 'abc' }), {}, null]) {
    const g = targets(p, TODAY);
    assert.equal(g.generic, true);
    for (const k of ['kcal', 'protein', 'fat', 'carbs', 'water', 'fv']) assert.ok(Number.isFinite(g[k]) && g[k] > 0, k);
  }
  assert.deepEqual(profileGaps(adult({ weight: '' }), TODAY), ['weight']);
  assert.deepEqual(profileGaps(adult(), TODAY), []);
});

test('validazione dei valori inseriti', () => {
  assert.equal(checkBody(70, 165), null);
  assert.equal(checkBody(19, 165), 'weight');
  assert.equal(checkBody(301, 165), 'weight');
  assert.equal(checkBody(70, 99), 'height');
  assert.equal(checkBody(70, 231), 'height');
  assert.equal(checkBody(NaN, 165), 'weight');
  assert.equal(checkBody(300, 100), 'bmi');   // tutti e due nei limiti, ma insieme non plausibili
  assert.equal(checkBody(20, 230), 'bmi');
});

test('storico del peso: una pesata per giorno, in ordine, con il conto delle registrazioni', () => {
  let w = addWeight([], 70.04, '2026-11-01');
  w = addWeight(w, 69.5, '2026-11-08');
  w = addWeight(w, 69.8, '2026-11-08');
  w = addWeight(w, 71, '2026-10-20');
  assert.deepEqual(w.map(x => x.d), ['2026-10-20', '2026-11-01', '2026-11-08']);
  assert.deepEqual(w[2], { d: '2026-11-08', kg: 69.8, n: 2 });
  assert.equal(w[1].kg, 70);
  // 7 kg invece di 70: chiede conferma
  assert.ok(weightJump(w, 7, '2026-11-10'));
  assert.equal(weightJump(w, 69.2, '2026-11-10'), null);
  assert.equal(weightJump([], 70, '2026-11-10'), null);
});

test('andamento del peso', () => {
  const w = [0, 7, 14, 21].map((d, i) => ({ d: addDays('2026-10-20', d), kg: 80 - i * .5 }));
  const tr = weightTrend(w, TODAY);
  assert.ok(Math.abs(tr.perWeek + .5) < .01);
  assert.equal(tr.coherent, true);
  assert.equal(weightTrend(w.slice(0, 1), TODAY), null);
  // un salto impossibile rende l'andamento inaffidabile
  const bad = weightTrend([...w, { d: addDays('2026-10-20', 22), kg: 60 }], TODAY);
  assert.equal(bad.coherent, false);
});

test('rivedere l\'obiettivo: si propone, non si cambia in silenzio', () => {
  const ref = { kg: 70, d: '2026-09-01' };
  assert.equal(goalReview(adult({ goalRef: ref }), TODAY), null);
  assert.equal(goalReview(adult({ weight: 71.5, goalRef: ref }), TODAY), null);                 // sotto soglia (2 kg / 3%)
  assert.deepEqual(goalReview(adult({ weight: 73, goalRef: ref }), TODAY), { kind: 'changed', delta: 3, since: '2026-09-01' });
  assert.equal(goalReview(adult({ weight: 66, goalRef: ref }), TODAY).delta, -4);
  // con 120 kg la soglia è il 3% (3,6 kg), non 2 kg
  assert.equal(goalReview(adult({ weight: 123, goalRef: { kg: 120, d: '2026-09-01' } }), TODAY), null);
  // dimagrire verso un peso scelto: scendere è il piano, salire no
  const lose = { goal: 'lose', target: { kg: 62, rate: .35 }, goalRef: ref };
  assert.equal(goalReview(adult({ ...lose, weight: 66 }), TODAY), null);
  assert.equal(goalReview(adult({ ...lose, weight: 73 }), TODAY).kind, 'changed');
  assert.deepEqual(goalReview(adult({ ...lose, weight: 62.1 }), TODAY), { kind: 'reached', kg: 62 });
  // «Va bene così»: non torna per due settimane
  assert.equal(goalReview(adult({ ...lose, weight: 62.1, reviewSeen: { kind: 'reached', d: addDays(TODAY, -3) } }), TODAY), null);
  assert.equal(goalReview(adult({ ...lose, weight: 62.1, reviewSeen: { kind: 'reached', d: addDays(TODAY, -15) } }), TODAY).kind, 'reached');
  // dimagrire non più consigliato
  assert.deepEqual(goalReview(adult({ goal: 'lose', weight: 48, height: 170 }), TODAY), { kind: 'low' });
  // il calcolo intanto resta prudente: con l'obiettivo raggiunto le calorie sono di mantenimento
  const g = targets(adult({ ...lose, weight: 62.1 }), TODAY);
  assert.ok(g.reached && g.kcal >= g.tdee - 6);
});

test('coach: numeri solo con dati sufficienti e coerenti', () => {
  const profile = adult({ goal: 'lose' });
  assert.deepEqual(coachData({ profile, days: {}, today: TODAY }), { ok: false, why: 'few', logged: 0 });
  assert.equal(coachData({ profile, days: diary(2, 1700), today: TODAY }).why, 'few');
  assert.equal(coachData({ profile, days: diary(5, 1700), today: TODAY }).ok, true);
  assert.equal(coachData({ profile, days: diary(5, 300), today: TODAY }).why, 'incoherent');     // diario incompleto
  assert.equal(coachData({ profile, days: diary(5, 9000), today: TODAY }).why, 'incoherent');
  assert.equal(coachData({ profile: adult({ weight: '' }), days: diary(5, 1700), today: TODAY }).why, 'profile');
  // i giorni con una sola voce non contano come registrati
  assert.equal(coachData({ profile, days: diary(5, 1700, 1), today: TODAY }).why, 'few');
});

test('segnali di rischio', () => {
  const profile = adult({ goal: 'lose' });
  const none = riskSignals({ profile, days: diary(7, 1600), weights: [], today: TODAY });
  assert.deepEqual(none, []);
  // 4 giorni su 7 sotto l'80% del pavimento (960 kcal), registrati per intero
  assert.deepEqual(riskSignals({ profile, days: diary(4, 800), weights: [], today: TODAY }), ['lowIntake']);
  assert.deepEqual(riskSignals({ profile, days: diary(3, 800), weights: [], today: TODAY }), []);
  // giorni con poche voci: probabilmente diario incompleto, non un segnale
  assert.deepEqual(riskSignals({ profile, days: diary(6, 800, 2), weights: [], today: TODAY }), []);
  // calo di oltre l'1% a settimana per due settimane
  const fast = [0, 7, 14, 21].map((d, i) => ({ d: addDays(TODAY, d - 21), kg: 73 - i }));
  assert.deepEqual(riskSignals({ profile, days: {}, weights: fast, today: TODAY }), ['fastLoss']);
  const slow = [0, 7, 14, 21].map((d, i) => ({ d: addDays(TODAY, d - 21), kg: 71.2 - i * .4 }));
  assert.deepEqual(riskSignals({ profile, days: {}, weights: slow, today: TODAY }), []);
  // pesate registrate moltissime volte
  const many = Array.from({ length: 7 }, (_, i) => ({ d: addDays(TODAY, -i), kg: 70, n: 2 }));
  assert.deepEqual(riskSignals({ profile, days: {}, weights: many, today: TODAY }), ['manyLogs']);
  // già letto: non torna per due settimane, poi sì
  assert.deepEqual(riskSignals({ profile, days: diary(4, 800), weights: [], today: TODAY, seen: { lowIntake: addDays(TODAY, -2) } }), []);
  assert.deepEqual(riskSignals({ profile, days: diary(4, 800), weights: [], today: TODAY, seen: { lowIntake: addDays(TODAY, -20) } }), ['lowIntake']);
  // sotto i 18 anni la soglia è sul fabbisogno
  const kid = { birth: '2014-03-01', sex: 'F', height: 145, weight: 38, activity: 1, goal: 'healthy' };
  assert.deepEqual(riskSignals({ profile: kid, days: diary(5, 900), weights: [], today: TODAY }), ['lowIntake']);
});

test('parole che accompagnano il grafico: nessuna colpa, nessun confronto', () => {
  const up = [0, 7, 14, 21].map((d, i) => ({ d: addDays(TODAY, d - 21), kg: 70 + i * .4 }));
  const down = up.map((x, i) => ({ ...x, kg: 70 - i * .3 }));
  const all = [
    journeyText({ weights: [], goal: 'lose', today: TODAY }),
    journeyText({ weights: up, goal: 'lose', today: TODAY }),
    journeyText({ weights: down, goal: 'lose', today: TODAY }),
    journeyText({ weights: down, goal: 'gain', today: TODAY }),
    journeyText({ weights: up, goal: 'maintain', today: TODAY }),
    journeyText({ weights: up, minor: true, today: TODAY }),
  ];
  for (const t of all) {
    assert.ok(t.length > 20);
    assert.doesNotMatch(t, /ideale|normopeso|sovrappeso|obes|colpa|sgarr|fallit|hai sbagliato|devi/i);
  }
});
