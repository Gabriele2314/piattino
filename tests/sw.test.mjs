// Controlli sul service worker e sulle versioni: un file dimenticato in SHELL blocca l'installazione dell'aggiornamento
// (cache.addAll fallisce) e gli utenti restano con la versione vecchia. Senza dipendenze: `node --test`
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');
const sw = read('sw.js'), app = read('app.js'), html = read('index.html');
const CODE = eval(sw.match(/const CODE = (\[[^\]]*\]);/)[1]);
const SHELL = eval(sw.match(/const SHELL = (\[[^\n]*\]);/)[1].replace('...CODE', '...' + JSON.stringify(CODE)));

test('ogni file della app shell esiste', () => {
  for (const f of SHELL) assert.ok(existsSync(new URL(f === './' ? 'index.html' : f, root)), `manca ${f}`);
});

test('ogni modulo importato dal codice dell\'app è in CODE (rete prima, e in cache per l\'uso offline)', () => {
  const seen = new Set(), todo = ['app.js'];
  while (todo.length) {
    const f = todo.pop(); if (seen.has(f)) continue; seen.add(f);
    for (const m of read(f).matchAll(/^import [^;]*? from '\.\/([\w.-]+)';/gms)) todo.push(m[1]);
  }
  assert.ok(seen.size > 1, 'app.js dovrebbe importare almeno un modulo');
  for (const f of seen) assert.ok(CODE.includes(f), `${f} è importato ma non è in CODE (sw.js)`);
});

test('ogni script di index.html è nella app shell', () => {
  for (const m of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) assert.ok(SHELL.includes('./' + m[1]), `${m[1]} non è in SHELL`);
});

test('versioni scritte nel formato giusto', () => {
  assert.match(sw, /const VERSION = 'piattino-v\d+';/);
  assert.match(app, /const APP_VERSION = '\d+\.\d+(\.\d+)?';/);
  // la scheda «Novità» mostra la versione corrente
  assert.match(app, /Versione \$\{APP_VERSION\}/);
});

test('i modelli non finiscono nella cache che si cancella a ogni versione', () => {
  assert.match(sw, /const MODELS = 'piattino-models-v\d+';/);
  assert.match(sw, /k !== VERSION && k !== MODELS/);
});
