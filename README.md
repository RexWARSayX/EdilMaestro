# EdilMaestro

Web app PWA mobile-first per gestire cantieri, lavorazioni, registrazioni costi e report da smartphone o desktop.

## Stack

- Vite
- React
- TypeScript
- vite-plugin-pwa
- Capacitor per packaging Android e iOS

## Funzioni incluse

- Dashboard operativa con indicatori principali
- Registro cantieri con campi coerenti all'export Canva
- Gestione lavorazioni con tipologia economia, misura e corpo
- Registrazioni giornaliere costi per operai, materiali, mezzi, attrezzature, subappalti e spese varie
- Report stampabile
- Report stampabile per singolo cantiere con intestazione, voci valorizzate e totale con IVA
- Persistenza locale in localStorage
- Backup completo in file JSON e ripristino da backup
- Installazione come app tramite PWA

## Modello dati

- Cantiere: nome, indirizzo, committente, responsabile, stato
- Lavorazione: cantiere, descrizione, tipologia, quantita, unita, importo
- Registrazione: data, cantiere, lavorazione, tipologia costo, quantita, costo unitario, totale, note

## Avvio

1. Installa le dipendenze con npm install
2. Avvia lo sviluppo con npm run dev
3. Genera la build con npm run build
4. Prova la build locale con npm run preview

## App Android installabile manualmente

Il progetto include ora il contenitore Android nativo con Capacitor:

- nome app: EdilMaestro
- package id: com.edilmaestro.app
- icona Android generata dal file icons8-materiali-100.png

Comandi utili:

- npm run android:sync
- npm run android:open
- npm run android:apk:debug
- npm run android:apk:release

Prerequisiti per generare l'APK sul PC:

1. Java JDK installato e disponibile nel PATH
2. Android Studio oppure Android SDK con build-tools e platform-tools
3. Variabili ambiente Android configurate correttamente

Output atteso dell'APK debug:

- android/app/build/outputs/apk/debug/app-debug.apk

Output atteso dell'APK release firmato:

- android/app/build/outputs/apk/release/app-release.apk

Installazione manuale su Android:

1. genera l'APK con npm run android:apk:debug
2. copia app-debug.apk sul telefono
3. abilita l'installazione da origini sconosciute sul dispositivo se richiesta
4. apri il file APK sul telefono e completa l'installazione

## iPhone via Safari

Il progetto e predisposto per iPhone in due modalita:

- PWA installabile da Safari con Aggiungi a Home
- contenitore iOS Capacitor nel progetto

Comandi utili per iOS:

- npm run ios:sync
- npm run ios:open

Installazione via Safari su iPhone:

1. rendi disponibile la web app da un URL raggiungibile dall'iPhone
2. apri l'app in Safari su iPhone
3. tocca Condividi
4. scegli Aggiungi a Home
5. conferma il nome EdilMaestro

Note pratiche:

1. da Windows non puoi compilare la build nativa iOS
2. il contenitore iOS e presente nel repo, ma per aprirlo e installarlo come app nativa serve un Mac con Xcode
3. se il tuo obiettivo e usarla su iPhone senza distribuzione, la strada piu pratica resta Safari

## Pubblicazione piu semplice per iPhone

La strada piu rapida e pubblicare la cartella dist su Netlify Drop, senza configurare repository o pipeline.

Passi:

1. esegui npm run build
2. apri https://app.netlify.com/drop
3. trascina dentro la cartella dist
4. attendi il link pubblico HTTPS generato da Netlify
5. apri quel link da Safari su iPhone
6. tocca Condividi e poi Aggiungi a Home

Compatibilita gia preparata nel progetto:

1. meta tag Apple per Safari iPhone
2. apple-touch-icon per l'icona Home Screen
3. file _redirects per evitare errori 404 sulle rotte React dopo refresh o apertura diretta

Attenzione ai dati:

1. l'app salva i dati in localStorage del dispositivo
2. i dati del PC non compaiono automaticamente su iPhone
3. per portare i dati su iPhone usa il backup JSON da Impostazioni, poi importa il file sull'iPhone nella stessa app

## Deploy fisso consigliato

Se vuoi un link stabile da riusare ogni volta su iPhone, il progetto e ora pronto per Netlify con configurazione dedicata in [netlify.toml](netlify.toml).

Flusso consigliato:

1. crea un account Netlify
2. crea un nuovo sito collegando questa cartella o un repository futuro
3. Netlify usera automaticamente questi valori:
4. build command: npm run build
5. publish directory: dist
6. redirect SPA: gia configurato per React Router

Risultato:

1. avrai un URL stabile HTTPS
2. ogni nuova build potra sostituire quella precedente senza cambiare link
3. il link potra essere aggiunto una sola volta alla Home di iPhone e poi aggiornato nel tempo

Uso pratico su iPhone:

1. apri il link stabile in Safari
2. tocca Condividi
3. scegli Aggiungi a Home
4. per gli aggiornamenti futuri mantieni lo stesso link

## Accesso privato con Tailscale

Se vuoi tenere l'app privata e usarla solo tu su iPhone, la soluzione consigliata e Tailscale.

Idea:

1. il PC Windows ospita l'app in locale
2. Tailscale espone quel server solo dentro la tua rete privata personale
3. l'iPhone entra nella stessa rete Tailscale
4. apri il link privato in Safari e fai Aggiungi a Home

Preparazione:

1. installa Tailscale su Windows
2. installa Tailscale su iPhone
3. accedi con lo stesso account su entrambi i dispositivi
4. nel progetto esegui npm run build
5. poi esegui npm run preview:private

Pubblicazione privata sul PC:

1. apri PowerShell come utente normale
2. verifica che Tailscale funzioni con tailscale status
3. esponi il server locale solo nella tailnet con questo comando:
4. tailscale serve https / http://127.0.0.1:4173

Tailscale ti fornira un indirizzo HTTPS privato del tipo:

1. https://nome-pc.nome-tailnet.ts.net

Uso su iPhone:

1. attiva Tailscale su iPhone
2. apri quell'indirizzo in Safari
3. verifica che l'app si apra correttamente
4. tocca Condividi
5. scegli Aggiungi a Home

Note importanti:

1. il link non e pubblico su internet normale, e raggiungibile solo dai dispositivi dentro la tua tailnet
2. il PC deve essere acceso quando vuoi usare l'app in rete privata
3. dopo il primo caricamento alcune schermate possono restare disponibili anche offline grazie alla PWA, ma non fare affidamento su questo per dati critici
4. i dati dell'iPhone restano separati da quelli del PC finche non importi un backup JSON

## Origine del modello

L'app e stata riallineata al file Canva esterno CODICE CANVA VER 3_Riparato.txt, usato come base per ricostruire struttura dati, tipologie di costo e flusso operativo senza dipendere dagli SDK proprietari Canva.
