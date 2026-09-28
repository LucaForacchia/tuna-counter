# Tuna Counter — Checklist di pubblicazione su Google Play

Requisiti verificati a fine settembre 2026: ricontrollali in Play Console prima di pubblicare, cambiano spesso.

Stato: pubblicazione prevista nel **medio termine**. Nel frattempo l'app si usa sul proprio telefono tramite APK. Le voci qui sotto hanno tempi lunghi: vanno avviate qualche settimana prima della data in cui si vuole pubblicare.

## Da avviare per primi (hanno tempi lunghi)
- [ ] **Account sviluppatore Google Play**: quota una tantum di 25 $, verifica dell'identità con documento (di solito 1–2 giorni).
- [ ] **Recluta i tester**: gli account personali nuovi devono fare un test chiuso con **almeno 12 tester iscritti ininterrottamente per 14 giorni** prima di poter chiedere l'accesso alla produzione.
  - Punta a 15 persone, non 12: se qualcuno si disiscrive, il conteggio riparte.
  - Servono telefoni Android veri e account Google distinti. Google guarda anche se l'app viene usata davvero.
  - Chiedi loro di usarla e di mandarti feedback: ti serviranno per rispondere al questionario di accesso.
- [x] **Nome del package**: `com.ibob_42.tunacounter`.
- [ ] Controlla che "Tuna Counter" non sia già usato da un'app simile sul Play Store.

## Build
- [ ] Android App Bundle (**AAB**) generato con EAS Build (profilo `production`).
- [ ] Target API conforme: da agosto 2026, API 36 (Android 16) per le nuove app.
- [ ] Play App Signing attivo. EAS gestisce la chiave di upload: **non perderla** e annota dove sta.
- [ ] `versionCode` incrementato a ogni caricamento.

## Scheda dello store
- [ ] Titolo (max 30 caratteri), descrizione breve (max 80), descrizione completa, in italiano e inglese.
- [ ] Icona 512×512, grafica in evidenza 1024×500, almeno 2 screenshot del telefono.
- [ ] Categoria (es. "Casa e giardino" o "Produttività") ed email di contatto.

## Dichiarazioni in "Contenuti dell'app"
- [ ] **Privacy policy** su un URL pubblico, per esempio una pagina gratuita su GitHub Pages. Contenuto: nessun dato raccolto, tutto resta sul dispositivo, i backup CSV li gestisce l'utente.
- [ ] Modulo **Sicurezza dei dati**: nessun dato raccolto né condiviso.
- [ ] Questionario di classificazione dei contenuti (rating).
- [ ] Pubblico di destinazione, pubblicità (no), accesso all'app (nessun login).

## Percorso di rilascio
1. **Test interno**: solo tu, per verificare che l'AAB si installi e funzioni.
2. **Test chiuso**: i 12+ tester per 14 giorni. Pubblica gli aggiornamenti anche durante il test.
3. **Richiesta di accesso alla produzione** dalla Dashboard, con il questionario sul test. La revisione di solito richiede alcuni giorni.
4. **Produzione**.
