// Controlli sull'elenco degli alimenti. Senza dipendenze: `node --test`
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import { FOODS } from '../foods.js';

// carboidrati che comprendono molta fibra (che dà meno di 4 kcal per grammo): le calorie stanno sotto il conto 4/4/9
const FIBRE = new Set(['limone', 'mais']);

test('chiavi uniche e campi al loro posto', () => {
  const keys = new Set();
  for (const f of FOODS) {
    assert.ok(/^[a-z]+$/.test(f.key) && !keys.has(f.key), `chiave ${f.key}`);
    keys.add(f.key);
    assert.ok(typeof f.name === 'string' && f.name.length > 1 && f.name.length <= 40, `${f.key}: nome`);
    for (const k of ['kcal', 'p', 'c', 'f']) assert.ok(Number.isFinite(f[k]) && f[k] >= 0, `${f.key}: ${k}`);
    assert.ok(f.kcal <= 900, `${f.key}: ${f.kcal} kcal per 100 g`);
    assert.ok(f.p + f.c + f.f <= 101, `${f.key}: i macronutrienti superano 100 g su 100 g`);
    assert.ok(f.portion >= 4 && f.portion <= 500, `${f.key}: porzione ${f.portion} g`);
    assert.ok(f.fv === 0 || f.fv === 1, `${f.key}: frutta/verdura`);
  }
  assert.ok(FOODS.length >= 240);
});

test('calorie e macronutrienti stanno insieme (4 kcal/g proteine e carboidrati, 9 kcal/g grassi)', () => {
  for (const f of FOODS) {
    if (FIBRE.has(f.key)) continue;
    const est = 4 * f.p + 4 * f.c + 9 * f.f;
    assert.ok(Math.abs(f.kcal - est) <= Math.max(12, f.kcal * .12), `${f.key} (${f.name}): ${f.kcal} kcal dichiarate, ${Math.round(est)} dai macronutrienti`);
  }
});

test('frutta e verdura: mai cibi molto calorici', () => {
  for (const f of FOODS.filter(x => x.fv)) assert.ok(f.kcal <= 170, `${f.key}: ${f.kcal} kcal conta come frutta e verdura`);
});

test('ogni alimento ha la sua icona nel kit', () => {
  const ctx = { self: {} }; ctx.window = ctx.self; ctx.globalThis = ctx.self;
  const dir = new URL('../icons/', import.meta.url);
  for (const f of readdirSync(dir).filter(n => /^kit-.*\.js$/.test(n))) vm.runInNewContext(readFileSync(new URL(f, dir), 'utf8'), ctx);
  const icons = ctx.self.PIATTINO_ICONS || ctx.PIATTINO_ICONS;
  assert.ok(icons && Object.keys(icons).length > 100, 'kit di icone non caricato');
  for (const f of FOODS) assert.ok(Object.prototype.hasOwnProperty.call(icons, f.icon), `${f.key}: icona «${f.icon}» mancante`);
});
