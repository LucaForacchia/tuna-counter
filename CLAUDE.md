# CLAUDE.md — Tuna Counter

Questo file va nella radice del repository. Claude Code lo legge a ogni sessione.

## Contesto
- Tuna Counter: app **Android** per contare le scatolette di tonno. Destinata alla **pubblicazione su Google Play**, quindi va trattata come prodotto vero, non come prototipo.
- Specifica completa in `docs/spec.md`: leggila prima di modificare funzionalità. Checklist di pubblicazione in `docs/play-store.md`. Design system (colori, font, layout) in `docs/design.md`.
- Lo sviluppatore (Luca) ha una laurea in matematica ma **non ha mai sviluppato app mobile**. Spiega brevemente le scelte non ovvie di React Native/Expo/Android, senza dilungarti su ciò che è semplice programmazione.
- Rispondi in italiano. Codice, nomi di variabili e commit vanno in inglese. Testi dell'interfaccia in file di traduzione (it + en).

## Vincoli della macchina (importante)
- Il computer ha **8 GB di RAM**. Non proporre l'emulatore Android, Android Studio o build locali (`eas build --local`, `expo run:android`).
- Durante lo sviluppo il test si fa su **telefono Android fisico con Expo Go** (QR code da `npx expo start`).
- Le build di rilascio (AAB per Play, APK di prova) si fanno **in cloud con EAS Build** (piano gratuito).
- Tutte le librerie devono funzionare **dentro Expo Go**. Se una libreria richiede un development build, fermati e chiedi.

## Stack
- Expo (ultima SDK stabile) + React Native + **TypeScript strict**.
- Verifica che la SDK scelta produca build con il **target API richiesto oggi da Google Play** (da agosto 2026: API 36 per le nuove app). Se non è così, segnalalo.
- Navigazione: Expo Router.
- Persistenza: `expo-sqlite`, con migrazioni versionate.
- Export: `expo-file-system` + `expo-sharing`. Import: `expo-document-picker`.
- Grafico: disegnato a mano con `react-native-svg` (`Path`/`Line`/`Circle`), niente libreria di grafici esterna.
- i18n: `expo-localization` + una libreria leggera di traduzioni (es. `i18next`/`react-i18next`).
- Test: Jest (`jest-expo`) per la logica di dominio.
- Installa le dipendenze con `npx expo install <pkg>` (non `npm install`), così le versioni restano allineate alla SDK.

## Architettura
```
src/
  domain/   # logica pura, NESSUN import da React/Expo: eventi, replay, validazione, CSV parse/serialize
  db/       # SQLite: schema, migrazioni, query
  i18n/     # traduzioni it/en
  ui/       # componenti riutilizzabili, tema
app/        # schermate (Expo Router)
```
- Il **log degli eventi è la fonte di verità**. Il conteggio si calcola sempre con il replay in `src/domain`.
- Tutta la logica in `src/domain` deve avere test unitari. In particolare:
  - replay con eventi `set` e `delta`
  - inserimento nel passato
  - conteggio negativo
  - round-trip CSV (export → import = dati identici)
  - CSV con virgole e virgolette nelle note
  - righe malformate
  - migrazioni del database
- Mai modificare una migrazione già rilasciata: se ne aggiunge una nuova.

## Configurazione Android (app.json / app.config)
- `name`: "Tuna Counter"; `android.package`: `com.ibob_42.tunacounter`. Non cambiarlo mai.
- Pubblicazione su Play prevista nel medio termine. Nel frattempo si installa sul proprio telefono con APK di prova (profilo EAS `preview`).
- Incrementa `android.versionCode` a ogni build caricata su Play.
- Nessun permesso Android: rimuovi quelli aggiunti di default che non servono.

## Modo di lavorare
- Procedi per **passi piccoli**, uno per sessione, seguendo `docs/plan.md`.
- Prima di dichiarare finito un passo, devono passare `npx tsc --noEmit` e `npx jest`.
- Non aggiungere dipendenze non elencate sopra senza chiedere.
- Fai commit piccoli e descrittivi dopo ogni passo funzionante.
- Alla fine di ogni passo, dimmi esattamente cosa provare sul telefono.
