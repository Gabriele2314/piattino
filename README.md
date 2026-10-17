# Piattino

Una web app ottimizzata per iPhone per organizzare la dieta e tenere il diario di quello che mangi, pensata per tutte le età dai 9 anni in su.

Funziona senza account e senza server: i dati restano sul telefono.

## Cosa fa

- **Oggi**: il pulsante «Aggiungi pasto» subito in alto (da lì si fotografa il piatto o lo si cerca nell'elenco: una strada sola), anelli per calorie, proteine e frutta e verdura, barre di carboidrati e grassi, bicchieri d'acqua e i quattro pasti.
- **Fotocamera** a tutto schermo, dentro «Aggiungi pasto»: mirino, otturatore, zoom 1×/2×, fotocamera frontale, libreria.
- **Riconoscimento sul telefono con PiattinoScan**, il riconoscimento dei cibi addestrato apposta per Piattino: conosce i 101 piatti di Food-101 e i cibi di tutti i giorni che lì mancano (frutta, verdura, polenta, minestrone, risotto allo zafferano, riso in bianco, pasta al pomodoro o al pesto, arancini, focaccia, piadina, cotoletta, parmigiana…). Gira sul telefono, senza internet dopo il primo download. Se non si carica, l'app usa i due modelli di Google di prima (MobileNet e AIY Food V1).
- **Impara dalle tue correzioni**: se dopo una foto scegli un cibo diverso da quello proposto, o lo cerchi nell'elenco, l'app ricorda l'«impronta» di quella foto (solo sul telefono) e la volta dopo riconosce quel piatto, con la nota «Ricordo questo piatto da una tua correzione precedente». Se fotografi un bicchiere d'acqua, va nel contatore dell'acqua.
- **Risultati**: il piatto più probabile con quanto è sicuro, le calorie e la porzione (piccola, media, grande), e sotto le alternative da scegliere con un tocco. Pasto e pulsante «Aggiungi» restano sempre in vista in fondo al pannello. Puoi anche descrivere il piatto a parole («2 uova, 50 g di pane e un'insalata»).
- **Grammi automatici**: dalla foto l'app misura quanta parte del piatto è coperta dal cibo e calcola i grammi (il piatto chiaro fa da riferimento, quindi non conta quanto sei vicino). Se il piatto non si vede bene usa una porzione standard.
- **Acqua** con una bottiglia che si riempie, i litri bevuti e i pulsanti «+ Bicchiere 250 ml», «+ Bottiglia 500 ml» e «−».
- **Percentuale di avanzamento** mentre scarica i modelli e analizza la foto.
- **Obiettivi**: dimagrire, mantenere, fare muscoli, aumentare di peso, mangiare sano. «Forza e muscoli» c'è anche per 9-13 anni: gioco, sport e proteine, senza calorie in più.
- **Obiettivo di peso** (adulti): scegli dove vuoi arrivare e quanto veloce; l'app calcola la data, le calorie al giorno e segue le pesate con un grafico. Non accetta obiettivi sotto il peso sano per la tua altezza. Sotto i 18 anni c'è «Come cresci», senza pesi da raggiungere.
- **Coach «Cosa faccio ora?»**: una chat che legge diario, pesate, acqua e abitudini delle ultime due settimane e dà consigli con i tuoi numeri. Se il peso è fermo può correggere le calorie con un tocco. Funziona sul telefono, senza internet e senza intelligenza artificiale esterna.
- **Piano**: menu mediterraneo di 5 pasti con porzioni calcolate sul profilo.
- **Diario**: serie di giorni, grafico della settimana, cibi memorizzati con la foto, storico.
- **Frasi motivazionali** diverse per bambini, ragazzi, adulti e over 65.
- **Backup**: esporta e importa i dati in un file JSON.

## Aspetto

All'apertura compare per un attimo la firma «Creata da Gabriele».

L'interfaccia è ottimizzata per iPhone e segue il design system del progetto. In `index.html` i token del sistema (colori, spaziature, raggi, caratteri) sono variabili CSS con i nomi originali, per quattro temi: chiaro, scuro e le due versioni con Aumenta contrasto. Testo secondario leggibile (4,5:1), aree di tocco da 44 pt, tab bar flottante in Liquid Glass, sfumature leggere negli sfondi, errori con glifo e testo. Lo scanner usa sempre i colori del tema scuro.

Anche il movimento è ottimizzato per iPhone: molle simulate al posto di durate fisse, solo transform e opacità perché resti fluido anche a 120 Hz, animazioni legate a quello che fai (lo scanner si apre dal pulsante della fotocamera e ci rientra, l'indicatore della tab bar scivola, i giorni arrivano dal lato verso cui ti sposti, i numeri contano fino al nuovo valore) e testi che entrano parola per parola da sfocati a nitidi. Gli sheet si chiudono anche trascinandoli verso il basso. Con Riduci movimento restano solo dissolvenze brevi.

## Per chi ha meno di 18 anni

Il profilo si compila con la data di nascita. Sotto i 18 anni Piattino non propone diete dimagranti: il fabbisogno è calcolato per la crescita (equazioni di Schofield) e l'obiettivo è solo «Mangiare sano» o «Energia per lo sport».

## Installare sull'iPhone

Al primo avvio nel browser l'app mostra la guida, con i passaggi per Safari e per Chrome (e per Android).

1. Apri il sito in **Safari** (o in Chrome, con iOS 16.4 o più recente).
2. Tocca **Condividi** (il quadrato con la freccia in su).
3. Scegli **Aggiungi alla schermata Home** e poi **Aggiungi**.
4. Apri Piattino dall'icona e configuralo da lì: l'app sulla Home ha una memoria separata dal browser.

Alla prima scansione l'app scarica PiattinoScan (circa 4,5 MB, con la percentuale). Puoi scaricarli prima da Profilo → Riconoscimento delle foto. Dopo funziona anche offline.

## Struttura

| File | Contenuto |
| --- | --- |
| `index.html` | Tutta l'app: stile, interfaccia e logica |
| `sw.js` | Service worker per l'uso offline |
| `manifest.webmanifest` | Nome, icone e colori dell'app installata |
| `model-scan/` | PiattinoScan: `model.json` (struttura della rete, classi, taratura della memoria delle correzioni) e `weights.bin` (pesi in 8 bit). È una EfficientNet-B0 (timm, Apache 2.0) rifinita su Food-101 e su foto a licenza libera di Wikimedia Commons; i crediti sono in `model-scan/CREDITI.md` |
| `model/` | Riserva: MobileNet v2 1.0 224 (grafo TensorFlow.js, Google, Apache 2.0) e i nomi delle 1.000 classi ImageNet |
| `model-food/` | Riserva: AIY Vision Food V1 (Google, Apache 2.0), convertito da TF Hub a TensorFlow.js con pesi float16, e le 2.024 etichette |
| `vendor/` | TensorFlow.js 4.22.0 (Apache 2.0) |
| `icons/` | Icone dell'app |

Per provarla sul computer serve un piccolo server locale, per esempio `python3 -m http.server`, poi apri `http://localhost:8000`.

## Avvertenza

I valori nutrizionali sono stime e il riconoscimento delle foto conosce solo i cibi più comuni. Piattino non sostituisce il parere di medico, pediatra o dietista.
