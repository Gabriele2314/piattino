# Piattino

Una web app in stile iPhone per organizzare la dieta e tenere il diario di quello che mangi, pensata per tutte le età dai 9 anni in su.

Funziona senza account e senza server: i dati restano sul telefono.

## Cosa fa

- **Oggi**: anelli per calorie, proteine e frutta e verdura, barre di carboidrati e grassi, bicchieri d'acqua e i quattro pasti.
- **Scansione**: fotocamera dal vivo dentro una scena 3D. Il riconoscimento del cibo avviene sul telefono con MobileNet (TensorFlow.js). Puoi anche descrivere il piatto a parole («2 uova, 50 g di pane e un'insalata»).
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

Alla prima scansione l'app scarica il modello di riconoscimento (circa 14 MB). Dopo funziona anche offline.

## Struttura

| File | Contenuto |
| --- | --- |
| `index.html` | Tutta l'app: stile, interfaccia e logica |
| `sw.js` | Service worker per l'uso offline |
| `manifest.webmanifest` | Nome, icone e colori dell'app installata |
| `model/` | MobileNet v2 1.0 224 (grafo TensorFlow.js, Google, Apache 2.0) |
| `vendor/` | TensorFlow.js 4.22.0 e @tensorflow-models/mobilenet 2.1.1 (Apache 2.0) |
| `icons/` | Icone dell'app |

Per provarla sul computer serve un piccolo server locale, per esempio `python3 -m http.server`, poi apri `http://localhost:8000`.

## Avvertenza

I valori nutrizionali sono stime e il riconoscimento delle foto conosce solo i cibi più comuni. Piattino non sostituisce il parere di medico, pediatra o dietista.
