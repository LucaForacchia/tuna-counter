# Tuna Counter — Specifica funzionale

App Android per tracciare il numero di scatolette di tonno in casa, destinata
alla pubblicazione su Google Play.
Tutti i dati restano sul dispositivo. Nessun account, nessun server, nessuna
raccolta dati, nessuna pubblicità.

## 1. Principio chiave: il log è la verità

L'app **non salva il numero corrente**: salva solo la lista degli eventi (variazioni).
Il numero corrente, il grafico e il log sono tutti *derivati* rileggendo gli eventi
in ordine cronologico. Questo rende banale inserire variazioni nel passato,
eliminare un evento sbagliato ed esportare/importare lo storico.

## 2. Modello dati

Tabella `events`:

| campo         | tipo              | note |
|---------------|-------------------|------|
| `id`          | TEXT (UUID)       | chiave primaria, stabile anche tra export/import |
| `occurred_at` | TEXT (ISO 8601 con offset, es. `2026-09-28T10:10:00+02:00`) | quando è successo davvero; può essere nel passato |
| `recorded_at` | TEXT (ISO 8601)   | quando è stato registrato nell'app |
| `type`        | TEXT              | `delta` oppure `set` |
| `value`       | INTEGER           | per `delta`: variazione (es. -1, +6); per `set`: valore assoluto (es. 12) |
| `note`        | TEXT, opzionale   | es. "spesa Esselunga" |

Calcolo: ordina per `occurred_at` (a parità, per `recorded_at`), parti da 0,
applica in sequenza: `delta` → somma, `set` → sostituisci.
Ogni evento nel log mostra anche il **valore risultante** dopo di esso.

### Regole
- Il conteggio non può scendere sotto 0. "Consuma" è disabilitato a 0.
- Se un evento inserito nel passato renderebbe negativo il conteggio in qualche
  punto della storia, l'app avvisa e chiede conferma (o blocca: da decidere in
  sviluppo, default = blocca con messaggio chiaro).
- `occurred_at` non può essere nel futuro.

## 3. Schermate

### 3.1 Home
- Il numero corrente, **molto grande**, al centro.
- Sotto, in piccolo: "ultima modifica: ieri, 19:40".
- Pulsante principale **Consuma** (−1), grande e comodo col pollice.
- Dopo "Consuma", un toast con **Annulla** per ~5 secondi (elimina l'evento appena creato).
- Pulsante secondario **Modifica** → apre il pannello 3.2.
- Accesso a Storico e Impostazioni (tab bar in basso o icone in alto).

### 3.2 Pannello Modifica (bottom sheet)
- Selettore modalità: **Aggiungi / Togli** oppure **Imposta a**.
  - Aggiungi/Togli: stepper con −/+ e campo numerico (es. +6 dopo la spesa).
  - Imposta a: campo numerico con il valore assoluto (es. inventario: "ne ho 9").
- **Quando**: default "adesso"; tocco → selettore data e ora (solo passato).
- Nota opzionale.
- Anteprima: "Da 4 → 10".
- Conferma / Annulla.

### 3.3 Storico
Due viste, con un selettore in alto:
- **Grafico**: grafico a gradini (step line) del conteggio nel tempo.
  Intervalli: 7 giorni / 30 giorni / 1 anno / tutto.
- **Log**: lista in ordine cronologico inverso. Ogni riga: data/ora, variazione
  ("−1", "+6", "= 9"), valore risultante, nota. Eventi inseriti nel passato
  hanno un piccolo indicatore. Swipe o tocco lungo → elimina (con conferma).

### 3.4 Impostazioni
- **Esporta CSV**: genera il file e apre il foglio di condivisione del sistema
  (salva su Drive, invia via mail, ecc.).
- **Importa CSV**: selettore file, poi scelta:
  - **Unisci** (default): aggiunge gli eventi con `id` non presenti.
  - **Sostituisci**: cancella tutto e carica il file (conferma esplicita).
- Riepilogo import: "32 eventi importati, 3 già presenti, 1 riga non valida (riga 17)".
- L'import è **atomico**: se il file è illeggibile non si modifica nulla.

## 4. Formato CSV

```
id,occurred_at,recorded_at,type,value,note
3f2c...,2026-09-20T18:30:00+02:00,2026-09-20T18:31:12+02:00,delta,6,spesa
9ab1...,2026-09-21T13:05:00+02:00,2026-09-21T13:05:00+02:00,delta,-1,
```

- UTF-8, separatore virgola, intestazione obbligatoria, quoting standard RFC 4180
  (le note possono contenere virgole e virgolette).
- Nome file: `tuna-counter-backup-AAAA-MM-GG.csv`.
- Le intestazioni e i valori di `type` sono sempre in inglese, indipendentemente
  dalla lingua dell'interfaccia, così un backup è leggibile da qualsiasi versione.
- Prima riga opzionale di versione del formato per il futuro: se si cambia il
  formato, l'import deve continuare a leggere i backup vecchi.
- Requisito: **export → import deve restituire esattamente gli stessi dati**
  (test automatico dedicato).

## 5. UI

Minimale ma curata:
- Molto spazio bianco, un solo colore d'accento (es. blu mare/teal).
- Numero grande in un font con cifre a larghezza fissa, animazione leggera al cambio.
- Feedback aptico al tocco su "Consuma".
- Supporto tema chiaro/scuro automatico.
- Interfaccia **in italiano e in inglese** (lingua del sistema, fallback inglese).
  Nessuna stringa scritta direttamente nei componenti: tutte in file di traduzione.
- Date e numeri formattati secondo la lingua del sistema.
- Accessibilità di base: etichette per lettori di schermo, contrasto sufficiente,
  pulsanti con area di tocco di almeno 48 dp, testo che regge il ridimensionamento
  del font di sistema.

## 6. Requisiti da app pubblicata

- Nome: **Tuna Counter**. Package Android: **`com.ibob_42.tunacounter`**.
  **Non si può cambiare dopo la pubblicazione.**
- Obiettivo di pubblicazione: medio termine. L'app va sviluppata fin da subito
  come se dovesse andare sullo store, ma per ora si usa sul proprio telefono.
- I dati degli utenti sopravvivono agli aggiornamenti: lo schema SQLite ha
  **migrazioni versionate** e non si cancella mai il database.
- L'app non richiede permessi Android (export/import passano dai selettori di sistema).
- Nessuna raccolta di dati → privacy policy breve e modulo "Sicurezza dei dati"
  su Play dichiarano "nessun dato raccolto né condiviso".
- Robustezza: nessun crash su CSV corrotti, database vuoto, date strane, rotazione
  dello schermo, app chiusa a metà di un'operazione.
- Pagina "Informazioni" in Impostazioni: versione, link alla privacy policy, contatto.

## 7. Fuori scope (per ora)
Più tipi di prodotto, sincronizzazione cloud, notifiche "stai finendo il tonno",
widget per la home del telefono. Possibili estensioni future.
