# Piattino

Una web app in stile iPhone per organizzare la dieta e tenere il diario di quello che mangi, pensata per tutte le età dai 9 anni in su.

Funziona senza account e senza server: i dati restano sul telefono.

## Cosa fa

- **Oggi**: anelli per calorie, proteine e frutta e verdura, barre di carboidrati e grassi, bicchieri d'acqua e i quattro pasti.
- **Fotocamera** come quella dell'iPhone: mirino a tutto schermo, otturatore, zoom 1×/2×, fotocamera frontale, libreria.
- **Riconoscimento sul telefono** con due modelli di Google che lavorano insieme: MobileNet per frutta, verdura e cibi semplici, AIY Food V1 per 2.024 piatti (pizza, lasagne, carbonara, risotto, sushi…). Per ogni cibo mostra quanto è sicuro, le calorie e la porzione (piccola, media, grande). Puoi anche descrivere il piatto a parole («2 uova, 50 g di pane e un'insalata»).
- **Percentuale di avanzamento** mentre scarica i modelli e analizza la foto.
- **Obiettivi**: dimagrire, mantenere, fare muscoli, aumentare di peso, mangiare sano. «Forza e muscoli» c'è anche per 9-13 anni: gioco, sport e proteine, senza calorie in più.
- **Obiettivo di peso** (adulti): scegli dove vuoi arrivare e quanto veloce; l'app calcola la data, le calorie al giorno e segue le pesate con un grafico. Non accetta obiettivi sotto il peso sano per la tua altezza. Sotto i 18 anni c'è «Come cresci», senza pesi da raggiungere.
- **Coach «Cosa faccio ora?»**: una chat che legge diario, pesate, acqua e abitudini delle ultime due settimane e dà consigli con i tuoi numeri. Se il peso è fermo può correggere le calorie con un tocco. Funziona sul telefono, senza internet e senza intelligenza artificiale esterna.
- **Piano**: menu mediterraneo di 5 pasti con porzioni calcolate sul profilo.
- **Diario**: serie di giorni, grafico della settimana, cibi memorizzati con la foto, storico.
- **Frasi motivazionali** diverse per bambini, ragazzi, adulti e over 65.
- **Backup**: esporta e importa i dati in un file JSON.

## Per chi ha meno di 18 anni

Il profilo si compila con la data di nascita. Sotto i 18 anni Piattino non propone diete dimagranti: il fabbisogno è calcolato per la crescita (equazioni di Schofield) e l'obiettivo è solo «Mangiare sano» o «Energia per lo sport».

## Installare sull'iPhone

1. Apri il sito in **Safari**.
2. Tocca **Condividi** (il quadrato con la freccia in su).
3. Scegli **Aggiungi alla schermata Home**.

Alla prima scansione l'app scarica i modelli di riconoscimento (circa 24 MB, con la percentuale). Puoi scaricarli prima da Profilo → Riconoscimento delle foto. Dopo funziona anche offline.

## Struttura

| File | Contenuto |
| --- | --- |
| `index.html` | Tutta l'app: stile, interfaccia e logica |
| `sw.js` | Service worker per l'uso offline |
| `manifest.webmanifest` | Nome, icone e colori dell'app installata |
| `model/` | MobileNet v2 1.0 224 (grafo TensorFlow.js, Google, Apache 2.0) e i nomi delle 1.000 classi ImageNet |
| `model-food/` | AIY Vision Food V1 (Google, Apache 2.0), convertito da TF Hub a TensorFlow.js con pesi float16, e le 2.024 etichette |
| `vendor/` | TensorFlow.js 4.22.0 (Apache 2.0) |
| `icons/` | Icone dell'app |

Per provarla sul computer serve un piccolo server locale, per esempio `python3 -m http.server`, poi apri `http://localhost:8000`.

## Avvertenza

I valori nutrizionali sono stime e il riconoscimento delle foto conosce solo i cibi più comuni. Piattino non sostituisce il parere di medico, pediatra o dietista.
