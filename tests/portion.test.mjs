// Test della stima della porzione dal piatto, su immagini sintetiche. Senza dipendenze: `node --test`
import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../config.js';
import { estimateFromPixels } from '../portion.js';

const N = CONFIG.portion.grid;
const WOOD = [120, 85, 50], WHITE = [245, 245, 242], RED = [190, 60, 40], DARK = [40, 40, 45], LINEN = [238, 236, 230];
// disegna una scena: sfondo, poi forme { cx, cy, rx, ry, col } (ellissi) o { x0, y0, x1, y1, col } (rettangoli), in ordine
function scene(bg, shapes){
  const d = new Uint8ClampedArray(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let col = bg;
    for (const s of shapes) {
      if (s.rx ? ((x + .5 - s.cx) / s.rx) ** 2 + ((y + .5 - s.cy) / s.ry) ** 2 <= 1 : x >= s.x0 && x <= s.x1 && y >= s.y0 && y <= s.y1) col = s.col;
    }
    d.set([...col, 255], (y * N + x) * 4);
  }
  return d;
}
// piatto di raggio R (il bordo comincia al 79% del raggio); il cibo copre `cover` della zona interna
const plate = (cover, { R = 30, cx = 36, cy = 36, squash = 1, col = WHITE, food = RED } = {}) => {
  const inner = Math.sqrt(CONFIG.portion.rimFrom), k = Math.sqrt(cover) * inner;
  return [{ cx, cy, rx: R, ry: R * squash, col }, { cx, cy, rx: R * k, ry: R * squash * k, col: food }];
};

test('la copertura misurata segue quella vera', () => {
  for (const cover of [.15, .3, .55, .8]) {
    const est = estimateFromPixels(scene(WOOD, plate(cover)), N);
    assert.equal(est.method, 'plate', `copertura ${cover}`);
    assert.ok(Math.abs(est.cover - cover) < .05, `copertura ${cover}: misurata ${est.cover.toFixed(2)}`);
  }
});

test('una porzione media dà circa la porzione standard; il fattore resta nei limiti', () => {
  const P = CONFIG.portion;
  assert.ok(Math.abs(estimateFromPixels(scene(WOOD, plate(P.mediumCover)), N).scale - 1) < .1);
  assert.equal(estimateFromPixels(scene(WOOD, plate(.1)), N).scale, P.minScale);
  assert.equal(estimateFromPixels(scene(WOOD, plate(.98)), N).scale, P.maxScale);
});

test('non conta quanto si è vicini né da che angolo si guarda', () => {
  const near = estimateFromPixels(scene(WOOD, plate(.4, { R: 34 })), N);
  const far = estimateFromPixels(scene(WOOD, plate(.4, { R: 20 })), N);
  const tilted = estimateFromPixels(scene(WOOD, plate(.4, { squash: .65 })), N);
  const aside = estimateFromPixels(scene(WOOD, plate(.4, { R: 24, cx: 30, cy: 42 })), N);
  for (const e of [near, far, tilted, aside]) { assert.equal(e.method, 'plate'); assert.ok(Math.abs(e.cover - .4) < .07, `misurata ${e.cover.toFixed(2)}`); }
});

test('un tovagliolo o un oggetto chiaro accanto al piatto non falsa la misura', () => {
  const est = estimateFromPixels(scene(WOOD, [...plate(.4, { R: 24, cx: 40, cy: 40 }), { x0: 0, y0: 0, x1: 12, y1: 9, col: WHITE }]), N);
  assert.equal(est.method, 'plate');
  assert.ok(Math.abs(est.cover - .4) < .07, `misurata ${est.cover.toFixed(2)}`);
});

test('piatto vuoto visibile in mezzo al cibo (cibo a ciambella): il centro resta piatto', () => {
  const inner = Math.sqrt(CONFIG.portion.rimFrom) * 30;
  const est = estimateFromPixels(scene(WOOD, [{ cx: 36, cy: 36, rx: 30, ry: 30, col: WHITE }, { cx: 36, cy: 36, rx: inner * .9, ry: inner * .9, col: RED }, { cx: 36, cy: 36, rx: inner * .5, ry: inner * .5, col: WHITE }]), N);
  assert.equal(est.method, 'plate');
  assert.ok(Math.abs(est.cover - (.81 - .25)) < .07, `misurata ${est.cover.toFixed(2)}`);
});

test('quando il piatto non si può usare come riferimento si torna alla porzione standard', () => {
  const std = (d, why) => { const e = estimateFromPixels(d, N); assert.equal(e.method, 'standard', why); assert.equal(e.scale, 1); return e.why; };
  assert.equal(std(scene(WOOD, []), 'nessun piatto'), 'no-plate');
  assert.equal(std(scene(WOOD, plate(.4, { col: DARK })), 'piatto scuro'), 'no-plate');
  assert.equal(std(scene(LINEN, plate(.4)), 'tovaglia bianca'), 'background');
  assert.equal(std(scene(WOOD, plate(.4, { R: 10 })), 'piatto troppo piccolo'), 'no-plate');
  assert.equal(std(scene(WOOD, plate(.4, { squash: .4 })), 'piatto troppo di sbieco'), 'shape');
  assert.equal(std(scene(WOOD, plate(.01)), 'piatto vuoto'), 'empty');
  // primo piano: il cibo copre anche il bordo
  assert.ok(['rim', 'no-plate'].includes(std(scene(WOOD, [{ cx: 36, cy: 36, rx: 30, ry: 30, col: WHITE }, { cx: 36, cy: 36, rx: 28.5, ry: 28.5, col: RED }]), 'bordo coperto')));
  // immagine vuota o rumore: nessuna eccezione
  assert.equal(estimateFromPixels(new Uint8ClampedArray(N * N * 4), N).method, 'standard');
});
