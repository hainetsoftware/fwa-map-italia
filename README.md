# Tuscany BTS Map: Opnet (ex-Linkem) & Eolo (ex-NGI)

🇬🇧 [English](#english) · 🇮🇹 [Italiano](#italiano)

---

<a name="english"></a>
## 🇬🇧 English

Interactive map and static high-performance catalog for visualizing Radio Base Stations (BTS) and telecommunications installations of **Opnet S.p.A.** (formerly **Linkem S.p.A.**) and **Eolo S.p.A.** (formerly **NGI S.p.A.**) in the Tuscany Region, Italy.

Built on official open data provided by **ARPAT** (Regional Environmental Protection Agency of Tuscany) and **ISTAT** administrative boundaries.

### Key Features

- **100% Client-Side / Static Architecture**: No backend server or database required. Deployable on **GitHub Pages**, Cloudflare Pages, or any static hosting with zero configuration.
- **Multi-Operator Support with Layer Switcher**:
  - **Opnet (ex-Linkem)**: 149 installations (high-contrast grayscale markers).
  - **Eolo (ex-NGI)**: 171 installations (dedicated markers and clusters in blue tones).
  - Independent switcher located in the app's top bar.
  - Separate clustering groups (`opnetClusterGroup` and `eoloClusterGroup`) to avoid mixed clusters.
- **Minimal Design System**: UI chrome strictly in grayscale (no glow, gradients, or neon accents).
- **Leaflet Map with CartoDB Positron**: Grayscale map with WGS84 ISTAT regional boundaries and panning locked outside Tuscany (`maxBoundsViscosity: 1.0`).
- **Technology-Differentiated Vector Icons**: Geometric SVG markers specific to each technology:
  - **Opnet**: 5G (solid black circle), 4G LTE (anthracite square), Radio Link (white ring, black center), WiMAX/Other (gray diamond).
  - **Eolo**: 5G (navy blue circle), Wireless + Radio Link (sapphire blue square), Radio Link (white ring, blue center), Wireless/Other (light blue diamond).
- **Live Search Engine & Filters**:
  - Instant full-text search (installation name, station code, address, municipality, ARPAT protocol, operator).
  - Province filter (all 10 Tuscan provinces: AR, FI, GR, LI, LU, MS, PI, PT, PO, SI) with counts updated based on active layers.
  - Dynamic municipality (comune) filter.
  - Transmission technology filters.
- **Detail Card & Quick Actions**: Copy WGS84 GPS coordinates to clipboard, direct links to Google Maps and OpenStreetMap.
- **Fully Responsive**: Optimized for both desktop and mobile devices (collapsible side drawer).

### Project Structure

```
OpNet/
├── index.html              # Main HTML5 application page
├── css/
│   └── style.css           # Stylesheet with grayscale UI and blue accents for Eolo
├── js/
│   └── app.js              # App logic, Leaflet, separate clusters and reactive filters
├── data/
│   ├── bts.json             # Normalized Opnet installation dataset in Tuscany (149)
│   ├── bts_eolo.json         # Normalized Eolo installation dataset in Tuscany (171)
│   └── tuscany.geojson       # Regional boundary of Tuscany in WGS84 (ISTAT / OpenPolis)
├── scripts/
│   └── prepare_data.py     # Python script for data normalization and boundary download
├── bts_data.json            # Raw ARPAT Opnet data
├── bts_data_eolo.json        # Raw ARPAT Eolo data
└── README.md                # Documentation and usage guide
```

### Data Sources & References

- **ARPAT**: [Radiocommunication Installations Registry of the Tuscany Region](https://www.arpat.toscana.it/impianti-di-radiocomunicazione/)
- **ISTAT**: Boundaries of administrative units for statistical purposes (WGS84 EPSG:4326)
- **Leaflet.js** & **Leaflet.markercluster**
- **CartoDB Positron**: Minimal grayscale tile layer

### License

Code released under the **[MIT License](./LICENSE)** — © 2026 hai.network. See the [LICENSE](./LICENSE) file for details.

The datasets in `data/` and the raw files (`bts_data.json`, `bts_data_eolo.json`, `tuscany.geojson`) are redistributed from ARPAT and ISTAT open data; they remain subject to the original terms of those sources. Please check the [ARPAT open data portal](https://www.arpat.toscana.it/impianti-di-radiocomunicazione/) for the applicable reuse terms and keep the source attribution when reusing them.

---

<a name="italiano"></a>
## 🇮🇹 Italiano

Mappa interattiva e catalogo statico ad alte prestazioni per la visualizzazione delle Stazioni Radio Base (BTS) e impianti di telecomunicazione di **Opnet S.p.A.** (precedentemente **Linkem S.p.A.**) ed **Eolo S.p.A.** (precedentemente **NGI S.p.A.**) nella Regione Toscana.

Basato sui dati aperti ufficiali forniti da **ARPAT** (Agenzia Regionale per la Protezione Ambientale della Toscana) e confini amministrativi **ISTAT**.

### Caratteristiche Principali

- **Architettura 100% Client-Side / Statica**: Nessun server di backend o database richiesto. Distribuibile su **GitHub Pages**, Cloudflare Pages o qualsiasi hosting statico con zero configurazione.
- **Supporto Multi-Operatore con Layer Switcher**:
  - **Opnet (ex-Linkem)**: 149 impianti (marker in scala di grigi ad alto contrasto).
  - **Eolo (ex-NGI)**: 171 impianti (marker e cluster dedicati in tonalità blu).
  - Switcher indipendente posizionato nella barra superiore dell'applicazione.
  - Gruppi di clustering separati (`opnetClusterGroup` ed `eoloClusterGroup`) per evitare cluster misti.
- **Design System Minimale**: UI chrome rigorosamente in scala di grigi (senza glow, gradienti o accenti neon).
- **Mappa Leaflet con CartoDB Positron**: Mappa grayscale con confini regionali ISTAT WGS84 e blocco del panning fuori dalla Toscana (`maxBoundsViscosity: 1.0`).
- **Iconografia Vettoriale Differenziata**: Marker SVG geometrici specifici per tecnologia:
  - **Opnet**: 5G (cerchio nero solido), 4G LTE (quadrato antracite), Ponte Radio (anello bianco con centro nero), WiMAX/Altro (rombo grigio).
  - **Eolo**: 5G (cerchio blu navy), Wireless + Ponte Radio (quadrato blu zaffiro), Ponte Radio (anello bianco con centro blu), Wireless/Altro (rombo azzurro).
- **Motore di Ricerca e Filtri Live**:
  - Ricerca istantanea full-text (nome impianto, codice stazione, indirizzo, comune, protocollo ARPAT, gestore).
  - Filtro per Provincia (tutte le 10 province toscane: AR, FI, GR, LI, LU, MS, PI, PT, PO, SI) con conteggi aggiornati in base ai layer attivi.
  - Filtro dinamico per Comune.
  - Filtri per tecnologia trasmissiva.
- **Scheda di Dettaglio & Azioni Rapide**: Copia coordinate GPS WGS84 negli appunti, link diretto a Google Maps e OpenStreetMap.
- **Completamente Responsive**: Ottimizzato sia per desktop che per dispositivi mobili (drawer laterale a scomparsa).

### Struttura del Progetto

```
OpNet/
├── index.html              # Pagina principale HTML5 dell'applicazione
├── css/
│   └── style.css           # Foglio di stile con UI grayscale e accenti blu per Eolo
├── js/
│   └── app.js              # Logica applicativa, Leaflet, cluster separati e filtri reattivi
├── data/
│   ├── bts.json             # Dataset normalizzato impianti Opnet in Toscana (149)
│   ├── bts_eolo.json         # Dataset normalizzato impianti Eolo in Toscana (171)
│   └── tuscany.geojson       # Confine regionale della Toscana in WGS84 (ISTAT / OpenPolis)
├── scripts/
│   └── prepare_data.py     # Script Python per normalizzazione dati e download confini
├── bts_data.json            # Dati grezzi ARPAT Opnet
├── bts_data_eolo.json        # Dati grezzi ARPAT Eolo
└── README.md                # Documentazione e guida d'uso
```

### Fonti Dati & Riferimenti

- **ARPAT**: [Catasto Impianti di Radiocomunicazione della Regione Toscana](https://www.arpat.toscana.it/impianti-di-radiocomunicazione/)
- **ISTAT**: Confini delle unità amministrative a fini statistici (WGS84 EPSG:4326)
- **Leaflet.js** & **Leaflet.markercluster**
- **CartoDB Positron**: Tile layer grayscale minimale

### Licenza

Codice rilasciato sotto **[Licenza MIT](./LICENSE)** — © 2026 hai.network. Vedi il file [LICENSE](./LICENSE) per i dettagli.

I dataset in `data/` e i file grezzi (`bts_data.json`, `bts_data_eolo.json`, `tuscany.geojson`) sono ridistribuiti a partire dai dati aperti ARPAT e ISTAT; restano soggetti ai termini originali di tali fonti. Verifica i termini di riuso sul [portale open data ARPAT](https://www.arpat.toscana.it/impianti-di-radiocomunicazione/) e mantieni l'attribuzione della fonte in caso di riutilizzo.
