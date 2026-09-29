# Tuna Counter — Piano di sviluppo

Passi piccoli, uno per sessione. Ogni passo è "fatto" solo quando passano
`npx tsc --noEmit` e `npx jest`, e quando indicato è stato provato sul telefono
con Expo Go.

**Stato attuale**: passi 0-9 fatti e testati sul telefono; passo 10 (i18n)
in standby (solo inglese); passo 11 (Rifinitura) implementato, **in attesa
di conferma sul telefono**. Prossimo: 12 (build APK di prova). Esiste anche
un pulsante "DEV · Load demo data" (solo `__DEV__`, schermata Backup).
Prima di pubblicare vanno compilati `PRIVACY_POLICY_URL` e `CONTACT_EMAIL`
in `src/config/about.ts` (le righe restano nascoste finché sono `null`).
Nulla di pendente nel repo: tutto su `master`, nessun remote.

## 0. Setup progetto — FATTO
Progetto Expo (SDK 57, TypeScript strict, Expo Router) creato, `app.json`
configurato, Jest con test banale, primo commit.

## 1. Dominio: modello eventi e replay — FATTO
- Tipi TypeScript per l'evento (`delta` / `set`), validazione base (occurred_at
  non nel futuro, value intero).
- Funzione di replay: dalla lista di eventi ordinati calcola il conteggio
  corrente e la lista con valore risultante per riga.
- Nessun import da React/Expo in `src/domain`.
- Test: replay con `set` e `delta` misti, inserimento nel passato che
  ricalcola correttamente i valori successivi, conteggio negativo (deve
  essere impedito/segnalato secondo le regole in `docs/spec.md`).
- **Fatto quando**: test unitari verdi per replay base, evento nel passato,
  blocco del negativo.

## 2. Dominio: CSV (parse/serialize) — FATTO
- Serializzazione eventi → CSV (RFC 4180, intestazioni in inglese, nome file
  con data).
- Parsing CSV → eventi, con gestione righe malformate (riportate come errori,
  non crash), variante con `;` come separatore, rimozione del BOM, file
  vuoto/solo intestazione trattato come "0 eventi" valido, e valore di
  versione del formato.
- Test: round-trip export → import identico, note con virgole e virgolette,
  righe malformate ignorate con report corretto.
- **Fatto quando**: tutti i test CSV in `docs/spec.md` §4 passano.

## 3. Database SQLite — FATTO
- Schema iniziale tabella `events` in `src/db`, wrapper tipizzato per
  insert/select/delete.
- Sistema di migrazioni versionate (tabella `schema_version` o simile),
  con la regola: mai modificare una migrazione già rilasciata.
- Test: applicazione migrazione su DB vuoto, idempotenza, DB con dati
  preesistenti sopravvive a una nuova migrazione.
- **Fatto quando**: i test di migrazione passano e il replay dal dominio
  produce lo stesso risultato leggendo dati veri dal DB.

## 4. Sistema di design (font, colori, icone) — FATTO
I mockup in `design/` e le specifiche in `docs/design.md` sono arrivati dopo
la stesura iniziale di questo piano: questo passo prepara le fondamenta
visive comuni prima di costruire qualunque schermata.
- `npx expo install expo-font`: carica i 7 font in `design/fonts/ttf/`
  (Bricolage Grotesque, Figtree) con `useFonts()` in `app/_layout.tsx`,
  tenendo la splash screen (`expo-splash-screen`, già presente) visibile
  finché i font non sono pronti, per evitare il flash del font di fallback.
- Sostituire `src/ui/theme.ts` (oggi un proxy ai colori di navigazione di
  default di Expo Router) con un oggetto `Colors` tipizzato basato sui token
  di `docs/design.md` (background, surface, ink, accent, ecc.), esposto via
  context/hook React, non il `CompositionLocal` di Compose citato nel
  documento originale (è terminologia Android nativo, non applicabile qui).
- **Punto aperto (ancora da chiudere)**: `docs/design.md` definisce solo la
  palette chiara. La palette scura in `src/ui/colors.ts` è provvisoria
  (derivata a mano, marcata `PROVISIONAL` nel codice), non un mockup reale —
  da rivedere se/quando arriveranno mockup del tema scuro.
- `npx expo install react-native-svg`: serve già qui per le icone del bottone
  Home (Consuma, Modifica, ingranaggio Impostazioni), non solo per il
  grafico dello Storico (passo 8). Le icone dei mockup sono stroke SVG stile
  Feather/Lucide: usare `lucide-react-native` oppure ricopiare i path SVG dai
  file in `design/mockups/*.html` in piccoli componenti locali.
- Modulo `src/ui/tokens.ts` per le costanti di spaziatura/forma ricorrenti
  (padding schermo 24dp, radius carte 16-18dp, bottoni pillola 52dp, bordo
  1dp, ecc.) così i passi successivi non reinventano i numeri.
- **Fatto quando**: `npx tsc --noEmit` e `npx jest` passano; sul telefono un
  testo di prova mostra Bricolage Grotesque e Figtree ai pesi giusti, in
  tema chiaro e scuro, senza flash del font di fallback.

## 5. Home ("Pantry") — FATTO
- Schermo Home: numero corrente grande (calcolato via replay dagli eventi in
  DB), "ultima modifica: ...", pulsante **Consuma** (−1) con feedback aptico,
  toast/snackbar **Annulla** (~5s) che elimina l'evento appena creato.
- Blocco di "Consuma" quando il conteggio è a 0.
- Applicare `docs/design.md` (sezione "Pantry"): il "coperchio" con il
  conteggio (cerchio esterno 272dp `lidOuter`, cerchio interno 244dp
  `surface` con bordo 10dp `lidRim`, numero in Bricolage Grotesque
  ExtraBold 104sp a cifre tabulari), bottone **−** filled `accent` da 128dp,
  bottone **± n** outline da 88dp che apre il passo 6, card "ultima
  modifica" in fondo, bottom nav a 3 tab (Pantry/Storico/Backup) con pillola
  attiva 64×32dp `accentSoft`.
- Nota di naming: internamente lo schermo resta "Home" come in questo piano
  e in `docs/spec.md`; l'etichetta della tab nella UI (da tradurre al passo
  10) è "Pantry" come nei mockup — è solo una scelta di copy, non un
  conflitto di funzionalità.
- **Fatto quando**: sul telefono, toccando Consuma il numero scende, Annulla
  ripristina il valore, a 0 il pulsante è disabilitato, e l'aspetto rispecchia
  `design/screenshots/01-home.png` in entrambi i temi.
- **Nota aggiunta al passo 6**: la modalità "Imposta a" citata inizialmente
  in SPEC.md §3.2 non è nel mockup del Pannello Modifica. Deciso con l'utente:
  si usa solo al primo avvio (setup del conteggio iniziale, qui su Home) e
  nel reset (passo 9) — il Pannello Modifica resta Aggiungi/Togli come nel
  mockup. Vedi `docs/spec.md` §3.1/§3.4 aggiornate.

## 6. Pannello Modifica — FATTO
- **Primo avvio**: se il DB non ha ancora eventi, Home mostra un piccolo
  setup ("Quante scatolette hai ora?") che crea l'unico evento `set`
  generato dall'interfaccia normale, invece di partire silenziosamente da 0.
- Bottom sheet con selettore Aggiungi/Togli (solo queste due opzioni, come
  nel mockup — niente "Imposta a" qui, vedi nota al passo 5), stepper e campo
  numerico, selettore data/ora (solo passato, con
  `@react-native-community/datetimepicker`), nota opzionale, anteprima
  "After saving: N cans", conferma/annulla.
- Scrittura dell'evento nel DB e ricalcolo Home.
- Gestione del caso "evento nel passato che renderebbe negativo il
  conteggio in qualche punto" secondo la regola di blocco in `docs/spec.md`.
- Applicare `docs/design.md` (sezione "Adjust sheet"): sheet con angoli
  superiori 28dp e maniglia 36×4dp, segmented control Add/Remove (opzione
  selezionata `ink`-filled con testo bianco), riga quantità con stepper
  circolari 56dp e campo numerico centrale 120×64dp toccabile per digitare,
  box anteprima su sfondo `background`, bottoni Annulla (outline)/Salva
  (filled `accent`) alti 52dp.
- **Fatto quando**: sul telefono, al primo avvio si imposta il conteggio
  iniziale; poi si può aggiungere/togliere un valore, anche con data nel
  passato (bloccato se farebbe scendere il conteggio sotto 0 in qualche punto
  della storia), l'Home si aggiorna, e l'aspetto rispecchia
  `design/screenshots/02-adjust-quantity.png`.

## 7. Storico — Log — FATTO
- Vista lista in ordine cronologico inverso: data/ora, variazione, valore
  risultante, nota, indicatore per eventi inseriti nel passato.
- Eliminazione evento (swipe o tocco lungo) con conferma, ricalcolo replay.
- Applicare `docs/design.md` (sezione "History", righe sui log): chip delta
  44×32dp (`accentSoft`/`onAccentSoft` per i positivi, `cool`/`onCool` per i
  negativi), totale allineato a destra in grassetto, nota con icona a
  fumetto.
- **Fatto quando**: sul telefono il log mostra correttamente gli eventi
  creati nei passi precedenti, l'eliminazione funziona con conferma, e
  l'aspetto rispecchia la parte "log" di `design/screenshots/03-history.png`.

## 8. Storico — Grafico — FATTO
- Grafico a gradini del conteggio nel tempo, selettore intervallo
  30gg / 1 anno / tutto, usando la serie calcolata dal dominio (passo
  1/2, regola di costruzione in `docs/spec.md` §3.3).
- **Nota**: la spec citava inizialmente anche "7 giorni" come intervallo, ma
  sia il mockup sia `design/screenshots/03-history.png` mostrano solo 3 tab
  (30 giorni / 1 anno / Tutto). Deciso con l'utente: si seguono i mockup, "7
  giorni" tolto da `docs/spec.md` §3.3.
- Il mockup (`design/mockups/03-history.html`) disegna il grafico come SVG
  scritto a mano: un path a gradini con comandi H/V, riempimento
  `accentSoft` al 60% fino alla baseline, griglia tratteggiata `outlineSoft`,
  pallino finale `accent` con anello bianco. **Non serve una libreria di
  grafici**: `react-native-svg` (già installato al passo 4) con
  `<Path>`/`<Line>`/`<Circle>` basta ed è più semplice per riprodurre
  esattamente questo stile — va scritta una piccola funzione che genera la
  stringa del path SVG dai punti della serie.
- **Fatto quando**: sul telefono il grafico riflette gli eventi del log per
  ciascun intervallo, e l'aspetto rispecchia la parte "grafico" di
  `design/screenshots/03-history.png`.

## 9. Impostazioni — Export/Import CSV ("Backup") — FATTO
- Esporta CSV: usa la logica del passo 2, salva con `expo-file-system` e
  condivide con `expo-sharing`.
- Importa CSV: `expo-document-picker`, scelta Unisci/Sostituisci, import
  atomico, riepilogo ("N importati, M già presenti, K righe non valide").
- **Reset**: azione distruttiva separata (non nel mockup, da aggiungere),
  sempre con conferma esplicita che avvisa che cancella tutto lo storico —
  vedi `docs/spec.md` §3.4. Via di fuga pensata per essere usata raramente.
- Applicare `docs/design.md` (sezione "Backup"): due card con icona
  quadrata arrotondata 44dp (`accentSoft`/download per Export,
  `cool`/upload per Import), bottone Export filled `accent`, bottone Import
  outline `ink`, blocco anteprima CSV in monospace su sfondo `ink`.
- **Fatto quando**: sul telefono un export seguito da un import (anche su
  DB svuotato) restituisce lo stesso stato; un CSV corrotto non modifica
  nulla e mostra un errore chiaro; l'aspetto rispecchia
  `design/screenshots/04-backup.png`.

## 10. i18n — IN STANDBY (solo inglese per ora)
- Estrazione di tutte le stringhe UI in file di traduzione it/en
  (`expo-localization` + `i18next`/`react-i18next`), fallback inglese.
- Formattazione date/numeri secondo la lingua di sistema.
- Scelta definitiva della copy dove il mockup differisce da `docs/spec.md`
  (es. anteprima "Da X → Y" vs "After saving: N cans" nel passo 6).
- **Fatto quando**: cambiando la lingua di sistema del telefono, l'app
  cambia lingua senza riavvio manuale del testo (o al riavvio dell'app,
  da verificare in pratica).

## 11. Rifinitura — implementato, da confermare sul telefono
- Tema chiaro/scuro automatico (con la palette scura decisa al passo 4),
  font a cifre fisse per il numero verificato senza clipping sotto
  ridimensionamento del font di sistema, animazione leggera al cambio.
- Verifica aree di tocco ≥48dp: il segmented control dei mockup è alto
  40-44dp (sotto il minimo di `docs/spec.md` §5) — va mantenuta la
  dimensione visiva del mockup ma allargata l'area di tocco con `hitSlop`,
  senza cambiare l'aspetto.
- Pagina "Informazioni" in Impostazioni (versione, link privacy policy,
  contatto): nessun mockup dedicato, riusa lo stile delle card di Backup.
- Verifica robustezza: CSV corrotti, DB vuoto, date strane, rotazione
  schermo, chiusura app a metà operazione — nessun crash.
- **Fatto quando**: giro manuale su questi casi sul telefono senza crash, in
  entrambi i temi.

## 12. Build APK di prova
- Configurazione profilo EAS `preview`, build cloud con EAS Build (piano
  gratuito), incremento `android.versionCode`.
- Installazione dell'APK generato sul proprio telefono (fuori da Expo Go).
- **Fatto quando**: l'APK installato sul telefono funziona come in Expo Go,
  con lo stesso database (o uno pulito, da verificare) e nessun permesso
  Android superfluo richiesto.

---

Dopo questi passi, si passa alla checklist di `docs/play-store.md` per la
pubblicazione vera e propria (tester, scheda dello store, dichiarazioni).
