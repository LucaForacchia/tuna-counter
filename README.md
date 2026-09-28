# Tuna Counter

App Android per contare le scatolette di tonno in casa. Vedi `SPEC.md` per la
specifica funzionale, `PLAN.md` per i passi di sviluppo e `PLAY-STORE.md` per
la checklist di pubblicazione.

## Sviluppo

Richiede Node.js 24 (vedi `.nvmrc`: `nvm use`).

```bash
npm install
npx expo start
```

Scansiona il QR code con l'app **Expo Go** sul telefono Android. Non sono
previsti emulatore, Android Studio o build locali: build di rilascio via
EAS Build (cloud).

```bash
npx tsc --noEmit   # typecheck
npx jest           # test
```
