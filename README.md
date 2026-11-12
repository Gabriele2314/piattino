# Piattino

Una web app ottimizzata per iPhone per organizzare la dieta e tenere il diario di quello che mangi, pensata per tutte le età dai 9 anni in su.

Funziona senza account e senza server: i dati restano sul telefono.

## Cosa fa

- **Oggi**: il pulsante «Aggiungi pasto» subito in alto (da lì si fotografa il piatto o lo si cerca nell'elenco: una strada sola), anelli per calorie, proteine e frutta e verdura, barre di carboidrati e grassi, bicchieri d'acqua e i quattro pasti.
- **Fotocamera** a tutto schermo, dentro «Aggiungi pasto»: mirino, otturatore, zoom 0,5× con il grandangolo, se l'iPhone ce l'ha, 1× e 2×, fotocamera frontale, libreria.
- **Riconoscimento sul telefono con PiattinoScan**, il riconoscimento dei cibi addestrato apposta per Piattino: conosce i 101 piatti di Food-101 e i cibi di tutti i giorni che lì mancano (frutta, verdura, polenta, minestrone, risotto allo zafferano, riso in bianco, pasta al pomodoro o al pesto, arancini, focaccia, piadina, cotoletta, parmigiana…). Lavora su una foto normale, in due dimensioni: non è una scansione 3D e non misura volumi. Gira sul telefono, senza internet dopo il primo download. Se non si carica, l'app usa i due modelli di Google di prima (MobileNet e AIY Food V1).
- **Impara dalle tue correzioni**: se dopo una foto scegli un cibo diverso da quello proposto, o lo cerchi nell'elenco, l'app ricorda l'«impronta» di quella foto (solo sul telefono) e la volta dopo riconosce quel piatto, con la nota «Ricordo questo piatto da una tua correzione precedente». Se fotografi un bicchiere d'acqua, va nel contatore dell'acqua.
- **Risultati**: il piatto più probabile con quanto è sicuro, le calorie e la porzione (piccola, media, grande), e sotto le alternative da scegliere con un tocco. Pasto e pulsante «Aggiungi» restano sempre in vista in fondo al pannello. Puoi anche descrivere il piatto a parole («2 uova, 50 g di pane e un'insalata»).
- **Grammi automatici**: dalla foto l'app misura quanta parte del piatto è coperta dal cibo e calcola i grammi (il piatto chiaro fa da riferimento, quindi non conta quanto sei vicino). È una stima in due dimensioni: non misura l'altezza del cibo. Se il piatto non si vede bene, se lo sfondo è bianco come il piatto o se il cibo è chiaro come il piatto (riso in bianco, mozzarella, purè) usa una porzione standard.
- **Elenco degli alimenti**: quasi 250 cibi e bevande (dalla 3.0 anche würstel, tiramisù, sushi, kebab, cappuccino, tè freddo, spremuta, cola zero…). La ricerca ignora maiuscole e accenti e conosce altri nomi («coca», «clementina», «fesa di tacchino»). Le bevande contano al massimo una porzione di frutta e verdura.
- **Acqua** con una bottiglia che si riempie, i litri bevuti e i pulsanti «+ Bicchiere 250 ml», «+ Bottiglia 500 ml» e «−». Anche «un bicchiere d'acqua» scritto nella descrizione, o l'acqua scelta dall'elenco, va nel contatore.
- **Percentuale di avanzamento** mentre scarica i modelli e analizza la foto. Se l'analisi va per le lunghe, l'app dice di non chiudere la schermata, tiene lo schermo acceso e, se sembra ferma, mostra il pulsante «Descrivi a parole».
- **Obiettivi che seguono il tuo peso**: dimagrire, mantenere, fare muscoli, aumentare di peso, mangiare sano. Da peso, altezza, età, sesso (anche «Preferisco non dire») e livello di attività l'app stima il metabolismo a riposo (Mifflin-St Jeor) e il fabbisogno, e da lì calorie, proteine, carboidrati, grassi, frutta e verdura e acqua. Il peso si aggiorna quando vuoi (Profilo → Peso → Aggiorna, oppure dal Diario): gli obiettivi si ricalcolano e lo storico resta sul telefono. «Forza e muscoli» c'è anche per 9-13 anni: gioco, sport e proteine, senza calorie in più.
- **Limiti di sicurezza**: per dimagrire al massimo 0,5 kg a settimana e mai oltre lo 0,75% del peso, con un deficit entro il 20% del fabbisogno; per aumentare al massimo 0,25 kg a settimana (0,5 se si è sottopeso). Le calorie non scendono mai sotto 1.200 kcal (donne) o 1.500 kcal (uomini e «Preferisco non dire») né sotto il metabolismo a riposo. Peso e altezza fuori dagli intervalli plausibili non vengono accettati, e una pesata molto diversa dalla precedente chiede conferma.
- **Se il peso cambia molto** (almeno 2 kg o il 3%), se raggiungi il peso scelto o se dimagrire non è più consigliato, l'app propone di rivedere l'obiettivo: non lo cambia da sola.
- **«Come stai?»**: se per più giorni le calorie registrate sono molto basse, se il peso scende troppo in fretta o se le registrazioni diventano moltissime, compare un invito gentile a parlarne con il medico o con un dietista. Non è una diagnosi e si chiude con «Ho capito».
- **Obiettivo di peso** (adulti): scegli dove vuoi arrivare e quanto veloce, tra i ritmi che restano nei limiti; l'app calcola la data sul ritmo reale, le calorie al giorno e segue le pesate con un grafico e una frase che descrive la direzione, senza voti e senza confronti. Non imposta obiettivi sotto il peso minimo per la tua altezza (indice di massa corporea 18,5). Sotto i 18 anni c'è «Come cresci», senza pesi da raggiungere.
- **Coach «Cosa faccio ora?»**: una chat che legge diario, pesate, acqua e abitudini delle ultime due settimane e dà consigli con i tuoi numeri, usando gli stessi obiettivi e gli stessi limiti del resto dell'app. Se il peso è fermo può correggere le calorie con un tocco, a passi di 150 kcal ed entro i limiti di sicurezza. Se i giorni registrati sono meno di 3 su 7, o i numeri non tornano, non dà cifre: dice cosa manca. Funziona sul telefono, senza internet e senza intelligenza artificiale esterna.
- **Piano**: menu mediterraneo di 5 pasti con porzioni calcolate sul profilo.
- **Diario**: giorni registrati nella settimana, grafico delle calorie, il percorso del peso, cibi memorizzati con la foto, storico.
- **Frasi motivazionali** diverse per bambini, ragazzi, adulti e over 65.
- **Backup**: esporta e importa i dati in un file JSON. I backup delle versioni precedenti si importano e vengono portati al formato nuovo senza perdere niente.

## Aspetto

All'apertura compare per circa un secondo la firma «Creata da Gabriele», con un piattino che si riempie; poi i contenuti entrano a cascata. Durante un aggiornamento compare per un attimo «Aggiornamento…». Al ricaricamento compare per meno di un secondo il piattino con i tre bocconi; la firma completa torna se l'app non è stata aperta negli ultimi 10 minuti.

Nessuna emoji: ogni cibo ha un'icona 3D in SVG (UI kit di Piattino, in `icons/kit-*.js`), con luce dall'alto a sinistra, riflesso e ombra a terra, su un fondo appena tinto. Le voci vecchie salvate con un'emoji vengono mostrate con l'icona corrispondente.

L'interfaccia è ottimizzata per iPhone e segue il design system del progetto. In `index.html` i token del sistema (colori, spaziature, raggi, caratteri) sono variabili CSS con i nomi originali, per quattro temi: chiaro, scuro e le due versioni con Aumenta contrasto. Testo secondario leggibile (4,5:1), aree di tocco da 44 pt, tab bar flottante in Liquid Glass, sfumature leggere negli sfondi, errori con glifo e testo. Lo scanner usa sempre i colori del tema scuro.

Nell'app installata su un iPhone con Face ID l'interfaccia segue gli angoli dello schermo. L'app riconosce il modello dalla misura dello schermo e usa il raggio dei suoi angoli, da 39 a 62 pt. La tab bar, il pulsante «Cosa faccio ora?» e la barra «Aggiungi» dello scanner hanno lo stesso margine sui lati e in basso, pari al raggio dello schermo meno il loro. Così le loro curve sono concentriche con quelle del display. Lo scanner si apre con angoli arrotondati e poi copre tutto lo schermo. Nel browser e sugli iPhone con tasto Home la disposizione resta quella di sempre.

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
| `index.html` | Struttura della pagina e stile |
| `app.js` | Logica e interfaccia dell'app (modulo ES, nessun passaggio di build) |
| `config.js` | Tutte le formule e le soglie, con le fonti: metabolismo, livelli di attività, limiti di sicurezza, intervalli plausibili, segnali di rischio |
| `targets.js` | Calcolo degli obiettivi giornalieri, storico e andamento del peso, proposta di rivedere l'obiettivo, segnali di rischio (funzioni pure) |
| `migrate.js` | Formato dei dati salvati e dei backup, migrazione dalle versioni precedenti |
| `foods.js` | Elenco degli alimenti con i valori per 100 g (fonti: CREA e, dove manca, USDA) |
| `portion.js` | Stima della porzione dalla foto, con il piatto come riferimento (funzione pura sui pixel) |
| `scan.js` | PiattinoScan: caricamento dei pesi ed esecuzione della rete con TensorFlow.js |
| `tools/` | Strumenti per chi sviluppa, non usati dall'app: `benchmark-fetch.mjs` scarica da Wikimedia Commons poche foto non usate nell'addestramento, `benchmark.html` ci fa girare PiattinoScan e mostra quante ne riconosce |
| `tests/` | Test senza dipendenze: `node --test` (Node 22 o più recente) |
| `launch.js` | Piccolo script che sceglie la firma d'avvio (completa o breve) prima del primo fotogramma |
| `CLAUDE.md` | Regole del progetto (numerazione delle versioni, priorità di prodotto) |
| `sw.js` | Service worker per l'uso offline |
| `manifest.webmanifest` | Nome, icone e colori dell'app installata |
| `model-scan/` | PiattinoScan: `model.json` (struttura della rete, classi, taratura della memoria delle correzioni) e `weights.bin` (pesi in 8 bit). È una EfficientNet-B0 (timm, Apache 2.0) rifinita su Food-101 e su foto a licenza libera di Wikimedia Commons; i crediti sono in `model-scan/CREDITI.md` |
| `model/` | Riserva: MobileNet v2 1.0 224 (grafo TensorFlow.js, Google, Apache 2.0) e i nomi delle 1.000 classi ImageNet |
| `model-food/` | Riserva: AIY Vision Food V1 (Google, Apache 2.0), convertito da TF Hub a TensorFlow.js con pesi float16, e le 2.024 etichette |
| `vendor/` | TensorFlow.js 4.22.0 (Apache 2.0) |
| `icons/kit-frutta.js`, `icons/kit-orto.js`, `icons/kit-cucina.js`, `icons/kit-dolci-bevande.js` | UI kit delle icone 3D dei cibi: ogni file registra degli SVG in `PIATTINO_ICONS` (per chiave) e in `PIATTINO_ICON_ALIAS` (dall'emoji delle voci vecchie alla chiave) |
| `icons/` | Icone dell'app |

Per provarla sul computer serve un piccolo server locale, per esempio `python3 -m http.server`, poi apri `http://localhost:8000`.

## Avvertenza

I valori nutrizionali e gli obiettivi (calorie, proteine, acqua, ritmo di variazione del peso) sono stime calcolate con formule valide per la popolazione generale, e il riconoscimento delle foto conosce solo i cibi più comuni. Piattino non fa diagnosi e non sostituisce il parere di medico, pediatra o dietista: in gravidanza, in allattamento, con una malattia o con un disturbo dell'alimentazione gli obiettivi vanno decisi con loro.
