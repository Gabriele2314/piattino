// Piattino: tutte le formule e le soglie in un posto solo.
// Qui si cambiano i numeri; i calcoli stanno in targets.js, la migrazione dei dati in migrate.js.
// I test (tests/*.mjs, `node --test`) leggono questo stesso file.
//
// Fonti:
// - Metabolismo a riposo, adulti: Mifflin MD, St Jeor ST et al., Am J Clin Nutr 1990;51:241-7.
// - Metabolismo a riposo, sotto i 18 anni: Schofield WN, Hum Nutr Clin Nutr 1985;39C Suppl 1:5-41.
// - Livelli di attività: moltiplicatori di uso comune con Mifflin-St Jeor (sedentario 1,2 … molto attivo 1,725).
// - Energia di 1 kg di peso corporeo: 7.700 kcal (stima di uso comune, Wishnofsky 1958).
// - Acqua: EFSA, Dietary Reference Values for water (2010): circa 2,0 L (donne) e 2,5 L (uomini) al giorno in tutto,
//   di cui circa l'80% da bevande. Qui 30 ml per kg di peso, entro 1,5-3,5 L.
// - Frutta e verdura: OMS, almeno 400 g al giorno, cioè 5 porzioni.
// - Peso minimo per l'altezza: indice di massa corporea 18,5 (OMS).

export const CONFIG = Object.freeze({
  // versione del formato dei dati salvati e dei backup (vedi migrate.js)
  schema: 2,

  // intervalli plausibili dei valori inseriti
  limits: Object.freeze({
    weight: [20, 300],        // kg
    height: [100, 230],       // cm
    age: [9, 110],            // anni
    bmi: [10, 80],            // peso e altezza insieme: fuori da qui è quasi certamente un errore di battitura
    weightJumpFrac: .1,       // una pesata che cambia più del 10% in meno di `weightJumpDays` chiede conferma
    weightJumpDays: 14,
  }),

  // metabolismo a riposo (kcal al giorno)
  bmr: Object.freeze({
    // Mifflin-St Jeor: 10·kg + 6,25·cm − 5·anni + costante
    mifflin: Object.freeze({ kg: 10, cm: 6.25, age: -5, M: 5, F: -161 }),
    // Schofield: [kcal per kg, costante]
    schofield: Object.freeze({
      under10: Object.freeze({ M: [22.706, 504.3], F: [20.315, 485.9] }),
      under18: Object.freeze({ M: [17.686, 658.2], F: [13.384, 692.6] }),
    }),
    // sesso «preferisco non dire» (X): media delle due formule
  }),

  // moltiplicatori del livello di attività (0 poco … 3 tanto)
  activity: Object.freeze({
    adult: [1.2, 1.375, 1.55, 1.725],
    minor: [1.45, 1.6, 1.75, 1.9],
  }),

  kcalPerKg: 7700,

  // limiti di sicurezza: valgono per l'app, per l'obiettivo di peso e per il coach
  safety: Object.freeze({
    // pavimento calorico: mai sotto questo e mai sotto il metabolismo a riposo. Con X vale il più alto dei due.
    floorKcal: Object.freeze({ M: 1500, F: 1200, X: 1500 }),
    ceilKcal: 4200,
    // dimagrire: al massimo 0,5 kg a settimana e mai oltre lo 0,75% del peso; deficit mai oltre il 20% del fabbisogno
    loseMaxKgWeek: .5,
    loseMaxFracWeek: .0075,
    maxDeficitFrac: .2,
    // aumentare: al massimo 0,25 kg a settimana (0,5 solo se sottopeso); surplus mai oltre il 20% del fabbisogno
    gainMaxKgWeek: .25,
    gainMaxKgWeekUnderweight: .5,
    maxSurplusFrac: .2,
    // sotto questo indice di massa corporea niente dimagrimento, e nessun obiettivo di peso più in basso
    minBmi: 18.5,
    // correzione delle calorie proposta dal coach: a passi, entro questo totale
    coachStepKcal: 150,
    coachAdjMaxKcal: 300,
  }),

  // ritmi proposti nella schermata «Obiettivo di peso» (kg a settimana); quelli oltre i limiti non compaiono
  rates: Object.freeze({
    lose: [[.25, 'Tranquillo'], [.35, 'Consigliato'], [.5, 'Deciso']],
    gain: [[.1, 'Tranquillo'], [.25, 'Consigliato'], [.5, 'Deciso']],
  }),

  // obiettivi senza un peso da raggiungere: variazione delle calorie rispetto al fabbisogno
  goalFactor: Object.freeze({ lose: .85, maintain: 1, healthy: 1, sport: 1, gain: 1.1, muscle: 1.08, muscleSenior: 1.05, muscleReached: 1.03 }),

  // proteine: grammi per kg di peso, per obiettivo e fascia d'età
  protein: Object.freeze({
    perKg: Object.freeze({
      muscle: Object.freeze({ kid: 1.1, teen: 1.3, adult: 1.8, senior: 1.4 }),
      loseGain: Object.freeze({ kid: .95, teen: .9, adult: 1.3, senior: 1.1 }),
      base: Object.freeze({ kid: .95, teen: .9, adult: 1, senior: 1.1 }),
    }),
    // con un indice di massa corporea alto i grammi si calcolano sul peso che corrisponde a questo indice, non su quello reale
    refBmiCap: 30,
    // mai più di questa parte delle calorie
    maxKcalFrac: .35,
  }),
  fatKcalFrac: Object.freeze({ base: .3, muscle: .27 }),

  water: Object.freeze({ mlPerKg: 30, minMl: 1500, maxMl: 3500, glassMl: 250 }),
  fruitVeg: 5,   // porzioni al giorno

  // valori di riferimento quando peso o altezza mancano (dati vecchi o backup incompleti): l'app funziona lo stesso
  generic: Object.freeze({
    kcal: Object.freeze({ kid: 1900, teen: 2300, adult: 2000, senior: 1900 }),
    protein: Object.freeze({ kid: 40, teen: 55, adult: 55, senior: 60 }),
    waterGlasses: 8,
  }),

  // «il peso è cambiato molto»: si propone di rivedere l'obiettivo, non lo si cambia in silenzio
  review: Object.freeze({
    changeKg: 2,          // almeno 2 kg…
    changeFrac: .03,      // …oppure il 3% del peso di quando l'obiettivo è stato scelto (vale il più grande)
    reachedKg: .2,        // obiettivo raggiunto entro 0,2 kg
    snoozeDays: 14,       // «Va bene così»: non lo richiede per due settimane
  }),

  // andamento del peso
  trend: Object.freeze({
    windowDays: 35,
    minSpanDays: 6,
    minPoints: 2,
    // una variazione più rapida di così fra due pesate vicine è quasi sempre un errore: l'andamento non si usa
    maxPlausibleKgWeek: 3,
  }),

  // quando il coach può dare numeri: servono abbastanza giorni registrati bene e dati coerenti
  coach: Object.freeze({
    minLoggedDays: 3,        // negli ultimi 7 giorni
    minEntriesPerDay: 2,     // un giorno «registrato bene» ha almeno 2 voci
    minKcalFracOfBmr: .5,    // media sotto metà del metabolismo a riposo: diario quasi certamente incompleto
    maxKcalFracOfTdee: 2.5,  // media oltre 2,5 volte il fabbisogno: quasi certamente un errore
  }),

  // stima della porzione dalla foto (portion.js): il piatto chiaro fa da riferimento
  portion: Object.freeze({
    grid: 72,            // la foto viene ridotta a 72×72 pixel
    maxSat: .16,         // «piatto» = pixel poco saturo…
    minLight: .66,       // …e chiaro
    minPlateFrac: .08,   // il piatto occupa almeno l'8% della foto
    maxEdgeFrac: .3,     // se la macchia chiara tocca più del 30% del bordo della foto è lo sfondo, non un piatto
    minSizeFrac: .4,     // larghezza e altezza del piatto: almeno il 40% della foto
    maxAspect: 1.8,      // piatto visto di sbieco: al massimo così schiacciato
    rimFrom: .62,        // oltre il 79% del raggio (0,62 = 0,79²) è bordo del piatto
    minRimPlate: .45,    // almeno il 45% del bordo deve essere piatto visibile
    minCover: .04,       // sotto il 4% di copertura il piatto è vuoto
    mediumCover: .55,    // una porzione media copre circa il 55% dell'interno del piatto
    minScale: .5,        // la stima non scende sotto metà…
    maxScale: 1.6,       // …né sale oltre 1,6 volte la porzione standard
  }),

  // segnali a cui rispondere con un invito gentile a parlarne con medico o dietista (mai una diagnosi)
  risk: Object.freeze({
    windowDays: 7,
    minEntriesPerDay: 3,           // si contano solo i giorni registrati con almeno 3 voci
    lowKcalFracOfFloor: .8,        // adulti: giorno sotto l'80% del pavimento calorico
    lowKcalFracOfTargetMinor: .6,  // sotto i 18 anni: giorno sotto il 60% del fabbisogno
    lowDays: 4,                    // per almeno 4 giorni su 7
    fastLossFracWeek: .01,         // peso che scende di oltre l'1% a settimana…
    fastLossMinSpanDays: 13,       // …per almeno due settimane
    weighInsPerWeek: 12,           // oltre 12 pesate registrate in 7 giorni
    entriesPerDay: 30,             // oltre 30 voci di diario al giorno…
    entriesDays: 3,                // …per almeno 3 giorni su 7
    snoozeDays: 14,                // dopo «Ho capito» lo stesso messaggio non torna per due settimane
  }),
});
