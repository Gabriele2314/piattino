// Test della migrazione dei dati salvati e dei backup. Senza dipendenze: `node --test`
import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../config.js';
import { migrate, readBackup, toBackup } from '../migrate.js';
import { targets } from '../targets.js';

const TODAY = '2026-11-12';
const e = (name, kcal, extra = {}) => ({ id: 'id' + name, name, emoji: '', icon: 'mela', grams: 100, kcal, p: 1, c: 2, f: 3, fv: 0, ...extra });
// dati come li salvava la 4.1 (formato 1)
const v1 = () => ({
  v: 1,
  profile: { name: 'Ada', birth: '1990-06-15', age: 36, sex: 'F', height: 165, weight: 68.4, activity: 1, goal: 'lose',
    target: { kg: 62, rate: .75, startKg: 72, startDate: '2026-09-01' }, kcalAdj: -150, campoSconosciuto: 'resta' },
  days: {
    '2026-11-10': { meals: { colazione: [e('Latte', 120)], pranzo: [e('Pasta', 420), e('Mela', 80)], cena: [], spuntini: [] }, water: 5 },
    '2026-11-11': { meals: { colazione: [], pranzo: [e('Riso', 380)], cena: [e('Pollo', 250)], spuntini: [] }, water: 3 },
  },
  foods: [e('Il mio piatto', 500, { thumb: 'data:image/jpeg;base64,AAAA', saved: 1760000000000 })],
  weights: [{ d: '2026-09-01', kg: 72 }, { d: '2026-10-01', kg: 70 }, { d: '2026-11-05', kg: 68.4 }],
  chat: [{ r: 'me', t: 'Ciao', day: '2026-11-11' }],
});

test('formato 1 → 2: non si perde niente', () => {
  const src = v1(), before = JSON.parse(JSON.stringify(src));
  const st = migrate(src, TODAY);
  assert.equal(st.v, C.schema);
  assert.deepEqual(src, before, 'la migrazione non modifica i dati di partenza');
  assert.deepEqual(st.days, before.days);
  assert.deepEqual(st.foods, before.foods);
  assert.deepEqual(st.chat, before.chat);
  assert.deepEqual(st.weights.map(({ d, kg }) => ({ d, kg })), before.weights);
  // il profilo conserva tutto, compresi i campi che la migrazione non conosce
  for (const [k, v] of Object.entries(before.profile)) assert.deepEqual(st.profile[k], v, k);
  // e guadagna i campi nuovi
  assert.deepEqual(st.profile.goalRef, { kg: 68.4, d: TODAY });
  assert.deepEqual(st.meta, { riskSeen: {}, askedBody: false });
  assert.equal(st.newer, false);
});

test('la migrazione è idempotente', () => {
  const once = migrate(v1(), TODAY);
  const twice = migrate(JSON.parse(JSON.stringify(once)), '2027-01-01');
  assert.deepEqual(twice, once);
});

test('obiettivo salvato con un ritmo oltre i nuovi limiti: resta nei dati, il calcolo lo limita', () => {
  const st = migrate(v1(), TODAY);
  assert.equal(st.profile.target.rate, .75);
  const g = targets(st.profile, TODAY);
  assert.equal(g.rate, .5);
  assert.ok(g.limited.includes('rate'));
});

test('dati delle primissime versioni: senza pesate, senza chat, con l\'età al posto della data di nascita', () => {
  const st = migrate({ v: 1, profile: { name: 'Bo', age: 40, sex: 'M', height: 180, weight: 82, activity: 2, goal: 'maintain' }, days: {}, foods: [] }, TODAY);
  assert.deepEqual(st.weights, [{ d: TODAY, kg: 82, n: 1 }]);   // lo storico parte dal peso del profilo
  assert.deepEqual(st.chat, []);
  assert.equal(targets(st.profile, TODAY).generic, false);
});

test('profilo senza peso o altezza: si carica lo stesso e l\'app chiede i dati', () => {
  const st = migrate({ v: 1, profile: { name: 'Cy', birth: '1985-01-01', sex: 'F', activity: 1, goal: 'healthy' }, days: v1().days }, TODAY);
  assert.equal(Object.keys(st.days).length, 2);
  assert.equal(st.profile.goalRef, undefined);
  const g = targets(st.profile, TODAY);
  assert.equal(g.generic, true);
  assert.deepEqual(g.missing, ['weight', 'height']);
  // se lo storico ha una pesata valida, il profilo la riprende
  const st2 = migrate({ v: 1, profile: { birth: '1985-01-01', sex: 'F', height: 160 }, days: {}, weights: [{ d: '2026-10-01', kg: 61 }] }, TODAY);
  assert.equal(st2.profile.weight, 61);
});

test('dati rovinati o vuoti: nessuna eccezione', () => {
  for (const raw of [null, undefined, 'x', 42, [], {}, { v: 1 }, { profile: 'no', days: [], foods: {}, weights: 'x', chat: 5, meta: 7 }]) {
    const st = migrate(raw, TODAY);
    assert.equal(st.profile, null);
    assert.deepEqual(st.days, {});
    assert.deepEqual(st.weights, []);
  }
  const st = migrate({ profile: { weight: 70, height: 170, birth: '1990-01-01' }, days: { '2026-11-01': null, '2026-11-02': { water: 'x' }, '2026-11-03': { pranzo: [e('Pasta', 400), null] } },
    weights: [null, { d: 'ieri', kg: 70 }, { d: '2026-11-01', kg: 5 }, { d: '2026-11-02', kg: '69.96' }, { d: '2026-11-02', kg: 70.2 }] }, TODAY);
  assert.deepEqual(Object.keys(st.days), ['2026-11-02', '2026-11-03']);
  assert.equal(st.days['2026-11-02'].water, 0);
  assert.deepEqual(st.days['2026-11-02'].meals, { colazione: [], pranzo: [], cena: [], spuntini: [] });
  // pasti scritti direttamente nel giorno: finiscono dentro `meals`
  assert.equal(st.days['2026-11-03'].meals.pranzo.length, 1);
  assert.equal(st.days['2026-11-03'].pranzo, undefined);
  // pesate: scartate quelle non valide, una per giorno (vale l'ultima)
  assert.deepEqual(st.weights, [{ d: '2026-11-02', kg: 70.2, n: 1 }]);
});

test('backup: esportazione e reimportazione senza perdite', () => {
  const st = migrate(v1(), TODAY);
  st.meta.riskSeen.lowIntake = '2026-11-01';
  const file = JSON.parse(JSON.stringify(toBackup(st, new Date('2026-11-12T10:00:00Z'))));
  assert.equal(file.app, 'piattino');
  assert.equal(file.v, C.schema);
  const r = readBackup(file, { today: TODAY });
  assert.equal(r.ok, true);
  assert.deepEqual(r.data.days, st.days);
  assert.deepEqual(r.data.foods, st.foods);
  assert.deepEqual(r.data.weights, st.weights);
  assert.deepEqual(r.data.meta, st.meta);
  for (const k of ['name', 'birth', 'sex', 'height', 'weight', 'activity', 'goal', 'target', 'kcalAdj', 'goalRef']) assert.deepEqual(r.data.profile[k], st.profile[k], k);
});

test('backup delle versioni precedenti (formato 1): si importa e viene migrato', () => {
  const old = { app: 'piattino', exported: '2026-10-01T08:00:00.000Z', ...v1() };
  const r = readBackup(JSON.parse(JSON.stringify(old)), { today: TODAY });
  assert.equal(r.ok, true);
  assert.equal(r.data.v, C.schema);
  assert.deepEqual(r.data.days, old.days);
  assert.equal(r.data.weights.length, 3);
  assert.equal(r.data.profile.weight, 68.4);
  assert.deepEqual(r.data.profile.target, old.profile.target);
  assert.deepEqual(r.data.profile.goalRef, { kg: 68.4, d: TODAY });
  // il primissimo formato: senza pesate
  const first = { app: 'piattino', v: 1, profile: { name: 'Bo', age: 40, sex: 'M', height: 180, weight: 82, activity: 2, goal: 'maintain' }, days: {}, foods: [] };
  const r1 = readBackup(first, { today: TODAY });
  assert.equal(r1.ok, true);
  assert.deepEqual(r1.data.weights, [{ d: TODAY, kg: 82, n: 1 }]);
  assert.equal(targets(r1.data.profile, TODAY).generic, false);
});

test('backup: file non valido o di una versione più recente', () => {
  assert.deepEqual(readBackup(null), { ok: false, why: 'shape' });
  assert.deepEqual(readBackup({ app: 'altro', days: {}, profile: {} }), { ok: false, why: 'shape' });
  assert.deepEqual(readBackup({ app: 'piattino', profile: {} }), { ok: false, why: 'shape' });
  assert.deepEqual(readBackup({ app: 'piattino', v: C.schema + 1, days: {}, profile: {} }), { ok: false, why: 'newer' });
});

test('backup: il contenuto viene ripulito (anche le voci del diario)', () => {
  const bad = { app: 'piattino', v: 1,
    profile: { name: '<img src=x onerror=alert(1)>'.repeat(5), birth: 'domani', sex: '<b>', height: '1e9', weight: -4, activity: 99, goal: '<script>', kcalAdj: -99999,
      target: { kg: 5, rate: 9 } },
    days: { '2026-11-10': { meals: { pranzo: [{ id: 5, name: 'x'.repeat(500), icon: '"><svg onload=1>', thumb: 'javascript:alert(1)', grams: 1e9, kcal: -5, p: 'NaN', c: 1e9, f: 2, fv: 1 }] }, water: 1e9 },
      '<script>': { meals: {} }, '2026-13-45': { meals: {} } },
    foods: [{ name: 'ok', thumb: 'data:text/html;base64,AAAA', icon: 'nonesiste', kcal: 100 }],
    weights: [{ d: '2026-11-01', kg: 70, n: 1e9 }, { d: '2026-11-02', kg: 9999 }],
    meta: { riskSeen: { '<x>': '2026-11-01', lowIntake: 'ieri', fastLoss: '2026-11-01' } } };
  const r = readBackup(bad, { today: TODAY, iconOk: k => k === 'mela' });
  assert.equal(r.ok, true);
  const p = r.data.profile;
  assert.equal(p.name.length, 30);
  assert.equal(p.birth, '');
  assert.equal(p.sex, 'X');
  assert.equal(p.goal, 'healthy');
  assert.equal(p.activity, 3);
  assert.equal(p.target, undefined);   // 5 kg non è un obiettivo valido
  assert.ok(p.kcalAdj >= -500);
  assert.deepEqual(Object.keys(r.data.days), ['2026-11-10']);
  const en = r.data.days['2026-11-10'].meals.pranzo[0];
  assert.equal(en.name.length, 80);
  assert.equal(en.icon, '');
  assert.equal(en.thumb, null);
  assert.equal(en.grams, 5000);
  assert.equal(en.kcal, 0);
  assert.equal(en.p, 0);
  assert.equal(r.data.days['2026-11-10'].water, 40);
  assert.equal(r.data.foods[0].thumb, null);
  assert.equal(r.data.foods[0].icon, '');
  assert.deepEqual(r.data.weights, [{ d: '2026-11-01', kg: 70, n: 99 }]);
  assert.deepEqual(r.data.meta.riskSeen, { fastLoss: '2026-11-01' });
  // anche con un profilo ripulito fino a restare senza peso, gli obiettivi restano utilizzabili
  assert.ok(targets(p, TODAY).kcal > 0);
});
