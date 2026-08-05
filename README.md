[LEGGIMI.md](https://github.com/user-attachments/files/30745610/LEGGIMI.md)
# Lista camper — launcher e icone

Il launcher su GitHub Pages esiste per un motivo solo: dare a iPhone e Android
un documento di primo livello **tuo**, in cui poter dichiarare le icone. La web app
Apps Script gira dentro un iframe su `script.google.com`, il cui `<head>` non e'
modificabile: senza questa pagina, Safari ripiega su uno screenshot.

## Flusso attuale

La pagina non reindirizza piu' al primo accesso. Distingue due casi:

| Contesto | Cosa fa |
|---|---|
| Aperta nel browser | Mostra icona, titolo, pulsante **Installa app** (solo Android) e **Apri la lista** |
| Avviata dall'icona in home (`display-mode: standalone` o `navigator.standalone`) | Dopo 400 ms va su `URL_APP` |

Questo risolve il problema di prima: c'e' il tempo di installare, perche' la pagina
resta aperta invece di scappare subito su Apps Script.

## File nella cartella (tutti allo stesso livello)

```
index.html                 launcher; contiene URL_APP e i <link> alle icone
manifest.webmanifest       nome, colori, icone (any + maskable)
sw.js                      service worker minimo — vedi sotto, e' obbligatorio
apple-touch-icon.png       180x180, senza alpha — icona iPhone
favicon.ico                16/32/48
icon-192.png icon-512.png  icone del manifest
icon-maskable-192.png icon-maskable-512.png   con safe zone per Android
icon-16.png icon-32.png    favicon nitida su desktop
```

## Perche' serve `sw.js`

Chrome ha eliminato l'obbligo di service worker per l'installazione **dal menu**
(v108 su mobile, v112 su desktop), ma l'algoritmo che decide se emettere
`beforeinstallprompt` richiede ancora un fetch handler. Senza `sw.js` l'evento non
scatta mai, `#installa` resta `display:none` e il pulsante non compare: sembra un bug
del codice, e' una condizione di installabilita' non soddisfatta.

Registrazione da aggiungere in fondo allo `<script>` di `index.html`:

```js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}
```

Il service worker e' volutamente *network first* e ignora tutto cio' che sta fuori dal
proprio scope: l'URL `/exec` non viene mai intercettato, altrimenti una risposta dalla
cache romperebbe l'autenticazione Google. Quando modifichi il launcher, alza `CACHE`
da `lista-camper-v1` a `-v2`, altrimenti i telefoni che l'hanno gia' visitato
continueranno a vedere la versione vecchia.

Chrome applica anche un'euristica di coinvolgimento: il prompt puo' non comparire alla
primissima visita. Se il pulsante non si vede, resta sempre disponibile
**menu ⋮ → Installa app / Aggiungi a schermata Home**.

## Installazione sul telefono

**Android (Chrome)** — apri l'URL Pages del launcher, tocca *Installa app*. Se il
pulsante manca, usa il menu ⋮. Viene generato un WebAPK con l'icona maskable.

**iPhone (Safari)** — `beforeinstallprompt` non esiste su iOS: il pulsante non comparira'
mai, ed e' corretto cosi'. Serve *Condividi → Aggiungi a Home*. Il nome proposto e'
"Camper" (`apple-mobile-web-app-title`), l'icona viene da `apple-touch-icon.png`.

Da sapere sul comportamento successivo: con `apple-mobile-web-app-capable = yes`
l'icona apre un contenitore standalone, ma il redirect verso `script.google.com` e'
cross-origin e iOS a quel punto passa la mano a Safari. L'icona in home e' quella
giusta — che era l'obiettivo — ma l'avvio fa un passaggio visibile. Togliendo quel
meta la pagina diventa un normale segnalibro Safari: stessa icona, avvio piu' diretto,
niente contenitore standalone. Scelta tua fra le due; il meta ha senso tenerlo se un
domani servirai l'app da un dominio tuo.

Su Android l'equivalente e' piu' morbido: `scope` copre solo il launcher, quindi dopo
il redirect Chrome passa a una Custom Tab, mantenendo icona e nome nei recenti.

## Aggiornamenti e cache

- **GitHub Pages**: basta un commit, Pages ripubblica da solo. Nessun deploy da rifare.
- **Apps Script**: solo se cambi il codice della web app serve Deploy → nuova versione
  sullo stesso deployment (cosi' l'URL `/exec` non cambia).
- **Icona iOS non aggiornata**: iOS non rilegge mai l'icona di un segnalibro esistente.
  Rimuovi e riaggiungi. Se persiste, rinomina il file (`apple-touch-icon-v2.png`) e
  aggiorna il `<link>`: Safari tiene queste immagini in cache molto a lungo.
- **Verifica rapida**: apri in incognito
  `https://<utente>.github.io/<repo>/<cartella>/apple-touch-icon.png`. Un 404 qui e'
  la causa piu' frequente dello screenshot al posto dell'icona, e non produce nessun
  errore visibile.

## Palette

| ruolo | hex |
|---|---|
| verde launcher / theme-color | `#0B6140` |
| verde sfondo icona | `#0A7C42` |
| verde scuro (collina) | `#00351A` |
| verde lime (spunta) | `#80C82D` |
| bianco carrozzeria | `#FBFAF9` |
| blu notte (finestrini) | `#0C313E` |

I due verdi non coincidono: `#0B6140` nella pagina e nel manifest, `#0A7C42` nello
sfondo dell'icona. Se vuoi continuita' perfetta fra icona e barra di stato, allinea
entrambi a uno dei due valori (in `index.html` e in `manifest.webmanifest`).
