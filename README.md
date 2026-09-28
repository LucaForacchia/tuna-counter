# Tuna Counter

App Android per contare le scatolette di tonno in casa. Vedi `docs/spec.md` per la
specifica funzionale, `docs/plan.md` per i passi di sviluppo, `docs/play-store.md`
per la checklist di pubblicazione e `docs/design.md` per il design system.

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
