# Piattino: regole del progetto

## Numerazione delle versioni

Formato `maggiore.minore.patch`. Prima di alzare la versione, classifica il cambiamento:

- **Cambio di design** → +1 sulla prima cifra (2.3 → 3.0)
- **Nuova funzionalità** → +.1 sulla seconda cifra (2.2 → 2.3)
- **Bug o sicurezza** → +..1 sulla terza cifra (2.3 → 2.3.1)

Da aggiornare insieme: `APP_VERSION` in `app.js` e `VERSION` (`piattino-vN`) in `sw.js`.
Aggiorna anche la scheda «Novità» in `app.js` con ciò che è cambiato.

## Priorità di prodotto (dalla whiteboard di Gabriele)

IDEA → MARKETING → funziona → intuitività → DESIGN. L'ordine conta, non invertirlo.

- Colori dei valori nutrizionali: strategici (cosa è buono, da moderare, critico), non solo estetici.
- Icona app: un piatto identitario, non un hamburger.
- Quando una modifica tocca uno di questi punti, segnalalo nella PR.

## Pubblicazione

`main` è collegato a Vercel (`piattino.vercel.app`): ogni push su `main` fa un deploy di produzione.
