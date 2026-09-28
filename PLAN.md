# Tuna Counter — Piano di sviluppo

Passi piccoli, uno per sessione. Ogni passo è "fatto" solo quando passano
`npx tsc --noEmit` e `npx jest`, e quando indicato è stato provato sul telefono
con Expo Go.

## 0. Setup progetto — FATTO
Progetto Expo (SDK 57, TypeScript strict, Expo Router) creato, `app.json`
configurato, Jest con test banale, primo commit.

## 1. Dominio: modello eventi e replay
- Tipi TypeScript per l'evento (`delta` / `set`), validazione base (occurred_at
  non nel futuro, value intero).
- Funzione di replay: dalla lista di eventi ordinati calcola il conteggio
  corrente e la lista con valore risultante per riga.
- Nessun import da React/Expo in `src/domain`.
- Test: replay con `set` e `delta` misti, inserimento nel passato che
  ricalcola correttamente i valori successivi, conteggio negativo (deve
  essere impedito/segnalato secondo le regole in SPEC.md).
- **Fatto quando**: test unitari verdi per replay base, evento nel passato,
  blocco del negativo.

## 2. Dominio: CSV (parse/serialize)
- Serializzazione eventi → CSV (RFC 4180, intestazioni in inglese, nome file
  con data).
- Parsing CSV → eventi, con gestione righe malformate (riportate come errori,
  non crash) e valore di versione del formato.
- Test: round-trip export → import identico, note con virgole e virgolette,
  righe malformate ignorate con report corretto.
- **Fatto quando**: tutti i test CSV in SPEC.md §4 passano.

## 3. Database SQLite
- Schema iniziale tabella `events` in `src/db`, wrapper tipizzato per
  insert/select/delete.
- Sistema di migrazioni versionate (tabella `schema_version` o simile),
  con la regola: mai modificare una migrazione già rilasciata.
- Test: applicazione migrazione su DB vuoto, idempotenza, DB con dati
  preesistenti sopravvive a una nuova migrazione.
- **Fatto quando**: i test di migrazione passano e il replay dal dominio
  produce lo stesso risultato leggendo dati veri dal DB.

## 4. Home
- Schermo Home: numero corrente grande (calcolato via replay dagli eventi in
  DB), "ultima modifica: ...", pulsante **Consuma** (−1) con feedback aptico,
  toast/snackbar **Annulla** (~5s) che elimina l'evento appena creato.
- Blocco di "Consuma" quando il conteggio è a 0.
- **Fatto quando**: sul telefono, toccando Consuma il numero scende, Annulla
  ripristina il valore, a 0 il pulsante è disabilitato.

## 5. Pannello Modifica
- Bottom sheet con selettore Aggiungi/Togli vs Imposta a, stepper e campo
  numerico, selettore data/ora (solo passato), nota opzionale, anteprima
  "Da X → Y", conferma/annulla.
- Scrittura dell'evento nel DB e ricalcolo Home.
- Gestione del caso "evento nel passato che renderebbe negativo il
  conteggio in qualche punto" secondo la regola di blocco in SPEC.md.
- **Fatto quando**: sul telefono si può aggiungere/togliere/impostare un
  valore, anche con data nel passato, e l'Home si aggiorna.

## 6. Storico — Log
- Vista lista in ordine cronologico inverso: data/ora, variazione, valore
  risultante, nota, indicatore per eventi inseriti nel passato.
- Eliminazione evento (swipe o tocco lungo) con conferma, ricalcolo replay.
- **Fatto quando**: sul telefono il log mostra correttamente gli eventi
  creati nei passi precedenti e l'eliminazione funziona con conferma.

## 7. Storico — Grafico
- Grafico a gradini del conteggio nel tempo con `react-native-gifted-charts`
  (o libreria equivalente compatibile con Expo Go), selettore intervallo
  7gg / 30gg / 1 anno / tutto.
- **Fatto quando**: sul telefono il grafico riflette gli eventi del log per
  ciascun intervallo.

## 8. Impostazioni — Export/Import CSV
- Esporta CSV: usa la logica del passo 2, salva con `expo-file-system` e
  condivide con `expo-sharing`.
- Importa CSV: `expo-document-picker`, scelta Unisci/Sostituisci, import
  atomico, riepilogo ("N importati, M già presenti, K righe non valide").
- **Fatto quando**: sul telefono un export seguito da un import (anche su
  DB svuotato) restituisce lo stesso stato; un CSV corrotto non modifica
  nulla e mostra un errore chiaro.

## 9. i18n
- Estrazione di tutte le stringhe UI in file di traduzione it/en
  (`expo-localization` + `i18next`/`react-i18next`), fallback inglese.
- Formattazione date/numeri secondo la lingua di sistema.
- **Fatto quando**: cambiando la lingua di sistema del telefono, l'app
  cambia lingua senza riavvio manuale del testo (o al riavvio dell'app,
  da verificare in pratica).

## 10. Rifinitura
- Tema chiaro/scuro automatico, font a cifre fisse per il numero, animazione
  leggera al cambio, contrasto e aree di tocco ≥48dp, supporto al
  ridimensionamento del font di sistema.
- Pagina "Informazioni" in Impostazioni (versione, link privacy policy,
  contatto).
- Verifica robustezza: CSV corrotti, DB vuoto, date strane, rotazione
  schermo, chiusura app a metà operazione — nessun crash.
- **Fatto quando**: giro manuale su questi casi sul telefono senza crash.

## 11. Build APK di prova
- Configurazione profilo EAS `preview`, build cloud con EAS Build (piano
  gratuito), incremento `android.versionCode`.
- Installazione dell'APK generato sul proprio telefono (fuori da Expo Go).
- **Fatto quando**: l'APK installato sul telefono funziona come in Expo Go,
  con lo stesso database (o uno pulito, da verificare) e nessun permesso
  Android superfluo richiesto.

---

Dopo questi passi, si passa alla checklist di `PLAY-STORE.md` per la
pubblicazione vera e propria (tester, scheda dello store, dichiarazioni).
