// Piattino: stima della porzione dalla foto, usando il piatto come riferimento.
// Funzione pura sui pixel (niente DOM): la usano l'app e i test (tests/portion.test.mjs). Le soglie stanno in config.js.
//
// Come funziona: si cerca il piatto (la più grande macchia chiara e poco satura), gli si adatta un'ellisse e si misura quanta
// parte della zona interna è coperta da qualcosa che non è piatto. Una porzione media copre circa metà dell'interno: da lì il
// fattore che moltiplica la porzione standard del cibo riconosciuto. Poiché il riferimento è il piatto, non conta quanto si è vicini.
//
// Limiti noti: non misura l'altezza del cibo (una montagna di pasta e uno strato sottile danno lo stesso risultato), non vede i cibi
// chiari su un piatto chiaro (per quelli l'app non usa la stima) e presume un piatto di misura normale.
import { CONFIG } from './config.js';
import { clamp } from './targets.js';

const STANDARD = Object.freeze({ method: 'standard', scale: 1 });

// d: pixel RGBA di un'immagine N×N. Restituisce { method:'plate', cover, scale } oppure { method:'standard', scale:1, why }.
export function estimateFromPixels(d, N){
  const P = CONFIG.portion, light = new Uint8Array(N * N);
  for (let i = 0, n = N * N; i < n; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if ((mx ? (mx - mn) / mx : 0) < P.maxSat && (mx + mn) / 510 > P.minLight) light[i] = 1;
  }
  // la macchia chiara più grande: tovaglioli, riflessi e altri oggetti chiari lontani dal piatto non contano
  const label = new Int32Array(N * N), stack = new Int32Array(N * N);
  let best = 0, bestSize = 0, next = 0;
  for (let s = 0; s < N * N; s++) {
    if (!light[s] || label[s]) continue;
    let top = 0, size = 0; stack[top++] = s; label[s] = ++next;
    while (top) {
      const i = stack[--top], x = i % N; size++;
      if (x > 0 && light[i - 1] && !label[i - 1]) { label[i - 1] = next; stack[top++] = i - 1; }
      if (x < N - 1 && light[i + 1] && !label[i + 1]) { label[i + 1] = next; stack[top++] = i + 1; }
      if (i >= N && light[i - N] && !label[i - N]) { label[i - N] = next; stack[top++] = i - N; }
      if (i < N * (N - 1) && light[i + N] && !label[i + N]) { label[i + N] = next; stack[top++] = i + N; }
    }
    if (size > bestSize) { bestSize = size; best = next; }
  }
  if (bestSize < N * N * P.minPlateFrac) return { ...STANDARD, why: 'no-plate' };
  let minX = N, minY = N, maxX = -1, maxY = -1, edge = 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (label[y * N + x] !== best) continue;
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (x === 0 || y === 0 || x === N - 1 || y === N - 1) edge++;
  }
  // una macchia chiara che corre lungo i bordi della foto è una tovaglia o un tavolo bianco, non un piatto
  if (edge > (4 * N - 4) * P.maxEdgeFrac) return { ...STANDARD, why: 'background' };
  const w = maxX - minX + 1, h = maxY - minY + 1;
  // serve un piatto abbastanza grande e abbastanza rotondo
  if (w < N * P.minSizeFrac || h < N * P.minSizeFrac || w / h > P.maxAspect || h / w > P.maxAspect) return { ...STANDARD, why: 'shape' };
  const cx = minX + w / 2, cy = minY + h / 2, rx = w / 2, ry = h / 2;
  let inside = 0, food = 0, rim = 0, rimPlate = 0;
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry, e = dx * dx + dy * dy;
    if (e > 1) continue;
    const isPlate = light[y * N + x];   // dentro l'ellisse ogni pixel chiaro è piatto, anche se il cibo lo separa dal resto
    if (e > P.rimFrom) { rim++; if (isPlate) rimPlate++; continue; }   // bordo del piatto
    inside++; if (!isPlate) food++;
  }
  // il bordo deve essere davvero piatto: nei primi piani il «bianco» è besciamella o sfondo
  if (inside < 50 || rim < 30 || rimPlate / rim < P.minRimPlate) return { ...STANDARD, why: 'rim' };
  const cover = food / inside;
  if (cover < P.minCover) return { ...STANDARD, why: 'empty' };
  return { method: 'plate', cover, scale: clamp(cover / P.mediumCover, P.minScale, P.maxScale) };
}
