// Piattino: PiattinoScan, il riconoscimento dei cibi. Caricamento dei pesi ed esecuzione della rete con TensorFlow.js
// (la variabile globale `tf`, da vendor/tf.min.js). Lo usano l'app e tools/benchmark.html.
/* PiattinoScan: il riconoscimento addestrato per Piattino (EfficientNet-B0 su Food-101 e sui cibi di Piattino).
   Se non si carica, l'app usa i due modelli di Google qui sopra. */
export const SCAN_URL = 'model-scan/';
export const SCAN = {
  // pesi in 8 bit con una scala per canale → tensori float32
  fromBuffers(spec, buf){
    const W = {};
    for (const [name, t] of Object.entries(spec.tensors)) {
      const n = t.shape.reduce((a, b) => a * b, 1);
      let data;
      if (t.dtype === 'f32') data = new Float32Array(buf, t.o, n);
      else {
        const q = new Int8Array(buf, t.o, n), sc = new Float32Array(buf, t.so, t.ch);
        data = new Float32Array(n);
        for (let i = 0; i < n; i++) data[i] = q[i] * sc[i % t.ch];
      }
      W[name] = tf.tensor(data, t.shape);
    }
    return { spec, W, id: spec.classes.length + '-' + spec.bytes };
  },
  async load(base, onFrac){
    const spec = await fetch(base + 'model.json').then(r => { if (!r.ok) throw new Error('model.json ' + r.status); return r.json(); });
    const res = await fetch(base + 'weights.bin'); if (!res.ok) throw new Error('weights.bin ' + res.status);
    const reader = res.body && res.body.getReader ? res.body.getReader() : null;
    let buf;
    if (reader) {
      const all = new Uint8Array(spec.bytes); let got = 0;
      for (;;) { const { done, value } = await reader.read(); if (done) break; all.set(value, got); got += value.length; onFrac(got / spec.bytes); }
      buf = all.buffer;
    } else { buf = await res.arrayBuffer(); onFrac(1); }
    return SCAN.fromBuffers(spec, buf);
  },
  // due inquadrature, tutta la foto e la zona centrale; il browser rimpicciolisce con qualità alta, come in addestramento
  inputs(m, src){
    const { size, mean, std } = m.spec, W = src.width, H = src.height;
    const view = (sx, sy, sw, sh) => { const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, sx, sy, sw, sh, 0, 0, size, size); return c; };
    const views = [view(0, 0, W, H), view(W * .12, H * .12, W * .76, H * .76)];
    return tf.tidy(() => tf.stack(views.map(c => tf.browser.fromPixels(c))).toFloat().div(255).sub(mean).div(std));
  },
  // x: [n, size, size, 3] → { logits [n, classi], emb [n, embed] }
  forward(m, x){
    const W = m.W; let emb;
    const seq = (ops, h) => {
      for (const op of ops) {
        if (op.t === 'conv') {
          const a = { x: h, filter: W[op.w], strides: op.s, pad: op.p, bias: W[op.b] };
          h = op.dw ? tf.fused.depthwiseConv2d(a) : tf.fused.conv2d(a);
          if (op.act === 'silu') h = tf.mul(h, tf.sigmoid(h));
        } else if (op.t === 'se') {
          let s = tf.mean(h, [1, 2]);
          s = tf.add(tf.matMul(s, W[op.rw]), W[op.rb]); s = tf.mul(s, tf.sigmoid(s));
          s = tf.sigmoid(tf.add(tf.matMul(s, W[op.ew]), W[op.eb]));
          h = tf.mul(h, tf.reshape(s, [s.shape[0], 1, 1, s.shape[1]]));
        } else if (op.t === 'block') { const y = seq(op.ops, h); h = op.skip ? tf.add(h, y) : y; }
        else if (op.t === 'pool') { h = tf.mean(h, [1, 2]); emb = h; }
        else if (op.t === 'dense') h = tf.add(tf.matMul(h, W[op.w]), W[op.b]);
      }
      return h;
    };
    const logits = seq(m.spec.ops, x);
    return { logits, emb };
  },
  // impronta della foto per la memoria delle correzioni: centrata sulla media dei cibi e di lunghezza 1
  embed(m, e){
    const mu = m.spec.emb_mean, v = new Float32Array(e.length); let n = 0;
    for (let i = 0; i < e.length; i++) { v[i] = e[i] - (mu ? mu[i] : 0); n += v[i] * v[i]; }
    n = Math.sqrt(n) || 1; for (let i = 0; i < v.length; i++) v[i] /= n;
    return v;
  },
};
