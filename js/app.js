/**
 * TUSCANY OPNET & EOLO BTS MAP - CORE APPLICATION
 * Vanilla JavaScript (ES6+), Leaflet, Leaflet.markercluster
 * Static client-side application for visualizing Opnet and Eolo Base Transceiver Stations.
 */

(function () {
  'use strict';

  // Application State
  const state = {
    allStations: {
      opnet: [],
      eolo: []
    },
    activeLayers: {
      opnet: true,
      eolo: true
    },
    filteredStations: [],
    tuscanyGeoJSON: null,
    tuscanyBounds: null,
    selectedStationId: null,
    filters: {
      search: '',
      province: 'ALL',
      comune: 'ALL',
      tech: 'ALL' // 'ALL', '5g', '4g_fwa', 'ponte_radio', 'wimax_other'
    },
    settings: {
      clustering: true,
      showBoundary: true
    }
  };

  // Map & Layer References
  let map = null;
  let boundaryLayer = null;
  let opnetClusterGroup = null;
  let eoloClusterGroup = null;
  let markersById = new Map();

  // Province names mapping
  const PROVINCE_NAMES = {
    'AR': 'Arezzo',
    'FI': 'Firenze',
    'GR': 'Grosseto',
    'LI': 'Livorno',
    'LU': 'Lucca',
    'MS': 'Massa-Carrara',
    'PI': 'Pisa',
    'PT': 'Pistoia',
    'PO': 'Prato',
    'SI': 'Siena'
  };

  // DOM Element References
  const DOM = {
    map: document.getElementById('map'),
    searchInput: document.getElementById('search-input'),
    searchClear: document.getElementById('search-clear'),
    provinceSelect: document.getElementById('province-select'),
    comuneSelect: document.getElementById('comune-select'),
    techPills: document.querySelectorAll('.tech-pill-btn'),
    resetFiltersBtn: document.getElementById('reset-filters-btn'),
    stationList: document.getElementById('station-list'),
    resultsCount: document.getElementById('results-count'),
    statVisible: document.getElementById('stat-visible'),
    statTotal: document.getElementById('stat-total'),
    stat5g: document.getElementById('stat-5g'),
    stat4g: document.getElementById('stat-4g'),
    statPr: document.getElementById('stat-pr'),
    layerToggleOpnet: document.getElementById('layer-toggle-opnet'),
    layerToggleEolo: document.getElementById('layer-toggle-eolo'),
    labelLayerOpnet: document.getElementById('label-layer-opnet'),
    labelLayerEolo: document.getElementById('label-layer-eolo'),
    countOpnetTotal: document.getElementById('count-opnet-total'),
    countEoloTotal: document.getElementById('count-eolo-total'),
    detailPanel: document.getElementById('detail-panel'),
    detailHeaderEl: document.getElementById('detail-header-el'),
    detailTitle: document.getElementById('detail-title'),
    detailCode: document.getElementById('detail-code'),
    detailOperator: document.getElementById('detail-operator'),
    detailLocation: document.getElementById('detail-location'),
    detailAddress: document.getElementById('detail-address'),
    detailTech: document.getElementById('detail-tech'),
    detailRef: document.getElementById('detail-ref'),
    detailCoords: document.getElementById('detail-coords'),
    detailClose: document.getElementById('detail-close'),
    btnCopyCoords: document.getElementById('btn-copy-coords'),
    btnGmaps: document.getElementById('btn-gmaps'),
    btnOsm: document.getElementById('btn-osm'),
    btnResetView: document.getElementById('btn-reset-view'),
    btnToggleBoundary: document.getElementById('btn-toggle-boundary'),
    btnToggleCluster: document.getElementById('btn-toggle-cluster'),
    btnToggleSidebar: document.getElementById('btn-toggle-sidebar'),
    sidebar: document.getElementById('sidebar'),
    toast: document.getElementById('toast')
  };

  // --------------------------------------------------------------------------
  // SVG Marker Icons Generator (Grayscale for Opnet, Blue for Eolo)
  // --------------------------------------------------------------------------
  function createMarkerIcon(station) {
    let svgContent = '';
    const isSelected = state.selectedStationId === station.id;
    const isOpnet = station.operatorGroup === 'opnet';
    const strokeCol = isSelected ? (isOpnet ? '#000000' : '#1e3a8a') : '#ffffff';
    const strokeWidth = isSelected ? '2.5' : '1.8';

    if (isOpnet) {
      // OPNET GRAYSCALE MARKERS
      if (station.has5G) {
        // 5G: Solid black circle with white inner dot
        svgContent = `
          <svg viewBox="0 0 24 24" width="22" height="22" class="bts-marker-glyph">
            <circle cx="12" cy="12" r="9" fill="#111827" stroke="${strokeCol}" stroke-width="${strokeWidth}"/>
            <circle cx="12" cy="12" r="3.2" fill="#ffffff"/>
          </svg>
        `;
      } else if (station.has4G) {
        // 4G: Dark charcoal square with inner dot
        svgContent = `
          <svg viewBox="0 0 24 24" width="20" height="20" class="bts-marker-glyph">
            <rect x="4" y="4" width="16" height="16" rx="2.5" fill="#374151" stroke="${strokeCol}" stroke-width="${strokeWidth}"/>
            <circle cx="12" cy="12" r="3" fill="#ffffff"/>
          </svg>
        `;
      } else if (station.hasPonteRadio) {
        // Ponte radio only: White ring with black center dot
        svgContent = `
          <svg viewBox="0 0 24 24" width="20" height="20" class="bts-marker-glyph">
            <circle cx="12" cy="12" r="8.5" fill="#ffffff" stroke="#111827" stroke-width="2.2"/>
            <circle cx="12" cy="12" r="3.5" fill="#111827"/>
          </svg>
        `;
      } else {
        // Legacy / WiMAX / Wi-Fi / Other: Diamond with center dot
        svgContent = `
          <svg viewBox="0 0 24 24" width="18" height="18" class="bts-marker-glyph">
            <polygon points="12,2 22,12 12,22 2,12" fill="#4b5563" stroke="${strokeCol}" stroke-width="${strokeWidth}"/>
            <circle cx="12" cy="12" r="2.5" fill="#ffffff"/>
          </svg>
        `;
      }
    } else {
      // EOLO BLUE MARKERS
      if (station.has5G) {
        // 5G: Solid navy blue circle with white inner dot
        svgContent = `
          <svg viewBox="0 0 24 24" width="22" height="22" class="bts-marker-glyph">
            <circle cx="12" cy="12" r="9" fill="#1e3a8a" stroke="${strokeCol}" stroke-width="${strokeWidth}"/>
            <circle cx="12" cy="12" r="3.2" fill="#ffffff"/>
          </svg>
        `;
      } else if (station.techCategory === 'wireless_pr') {
        // Wireless + Ponte Radio: Solid sapphire blue square with inner dot
        svgContent = `
          <svg viewBox="0 0 24 24" width="20" height="20" class="bts-marker-glyph">
            <rect x="4" y="4" width="16" height="16" rx="2.5" fill="#2563eb" stroke="${strokeCol}" stroke-width="${strokeWidth}"/>
            <circle cx="12" cy="12" r="3" fill="#ffffff"/>
          </svg>
        `;
      } else if (station.hasPonteRadio) {
        // Ponte radio only: White ring with blue center dot
        svgContent = `
          <svg viewBox="0 0 24 24" width="20" height="20" class="bts-marker-glyph">
            <circle cx="12" cy="12" r="8.5" fill="#ffffff" stroke="#2563eb" stroke-width="2.2"/>
            <circle cx="12" cy="12" r="3.5" fill="#2563eb"/>
          </svg>
        `;
      } else {
        // Wireless / Altro: Sky blue diamond with center dot
        svgContent = `
          <svg viewBox="0 0 24 24" width="18" height="18" class="bts-marker-glyph">
            <polygon points="12,2 22,12 12,22 2,12" fill="#0284c7" stroke="${strokeCol}" stroke-width="${strokeWidth}"/>
            <circle cx="12" cy="12" r="2.5" fill="#ffffff"/>
          </svg>
        `;
      }
    }

    return L.divIcon({
      className: 'bts-custom-marker',
      html: svgContent,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  }

  // --------------------------------------------------------------------------
  // Map Initialization
  // --------------------------------------------------------------------------
  function initMap() {
    map = L.map('map', {
      center: [43.4, 11.1],
      zoom: 8,
      minZoom: 7,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: true
    });

    // CartoDB Positron Grayscale Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a> | Dati ARPAT',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // 1. Grayscale Opnet Cluster Group
    opnetClusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        let sizeClass = 'marker-cluster-opnet-small';
        let size = 30;

        if (count >= 25) {
          sizeClass = 'marker-cluster-opnet-large';
          size = 40;
        } else if (count >= 10) {
          sizeClass = 'marker-cluster-opnet-medium';
          size = 35;
        }

        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster ${sizeClass}`,
          iconSize: L.point(size, size)
        });
      }
    });

    // 2. Blue Eolo Cluster Group (Separate so clusters do not mix!)
    eoloClusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        let sizeClass = 'marker-cluster-eolo-small';
        let size = 30;

        if (count >= 25) {
          sizeClass = 'marker-cluster-eolo-large';
          size = 40;
        } else if (count >= 10) {
          sizeClass = 'marker-cluster-eolo-medium';
          size = 35;
        }

        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster ${sizeClass}`,
          iconSize: L.point(size, size)
        });
      }
    });

    map.addLayer(opnetClusterGroup);
    map.addLayer(eoloClusterGroup);
  }

  // --------------------------------------------------------------------------
  // Load Datasets
  // --------------------------------------------------------------------------
  async function loadData() {
    try {
      // 1. Fetch Tuscany GeoJSON Boundary
      const geoResp = await fetch('data/tuscany.geojson');
      if (geoResp.ok) {
        state.tuscanyGeoJSON = await geoResp.json();
        setupTuscanyBoundary();
      }

      // 2. Fetch Opnet BTS Dataset
      const opnetResp = await fetch('data/bts.json');
      if (opnetResp.ok) {
        state.allStations.opnet = await opnetResp.json();
        if (DOM.countOpnetTotal) {
          DOM.countOpnetTotal.textContent = `(${state.allStations.opnet.length})`;
        }
      }

      // 3. Fetch Eolo BTS Dataset
      const eoloResp = await fetch('data/bts_eolo.json');
      if (eoloResp.ok) {
        state.allStations.eolo = await eoloResp.json();
        if (DOM.countEoloTotal) {
          DOM.countEoloTotal.textContent = `(${state.allStations.eolo.length})`;
        }
      }

      // Initial filter & render
      populateProvinceDropdown();
      populateComuneDropdown();
      applyFilters();

    } catch (err) {
      console.error('Error loading datasets:', err);
      showToast('Errore nel caricamento dei dati.');
    }
  }

  // --------------------------------------------------------------------------
  // Boundary Setup & Strict Pan Constraints
  // --------------------------------------------------------------------------
  function setupTuscanyBoundary() {
    if (!state.tuscanyGeoJSON) return;

    boundaryLayer = L.geoJSON(state.tuscanyGeoJSON, {
      style: {
        color: '#1f2937',
        weight: 1.5,
        opacity: 0.8,
        fillColor: '#000000',
        fillOpacity: 0.01,
        dashArray: '4, 4'
      }
    });

    if (state.settings.showBoundary) {
      boundaryLayer.addTo(map);
    }

    state.tuscanyBounds = boundaryLayer.getBounds();

    map.fitBounds(state.tuscanyBounds, {
      padding: [20, 20],
      animate: false
    });

    const paddedBounds = state.tuscanyBounds.pad(0.08);
    map.setMaxBounds(paddedBounds);
    map.options.maxBoundsViscosity = 1.0;
  }

  // --------------------------------------------------------------------------
  // Get All Active Stations across enabled operator layers
  // --------------------------------------------------------------------------
  function getActiveRawStations() {
    const list = [];
    if (state.activeLayers.opnet) {
      list.push(...state.allStations.opnet);
    }
    if (state.activeLayers.eolo) {
      list.push(...state.allStations.eolo);
    }
    return list;
  }

  // --------------------------------------------------------------------------
  // Populate Filter Selectors
  // --------------------------------------------------------------------------
  function populateProvinceDropdown() {
    const activeStations = getActiveRawStations();
    const provinceCounts = {};
    activeStations.forEach(s => {
      if (s.province) {
        provinceCounts[s.province] = (provinceCounts[s.province] || 0) + 1;
      }
    });

    DOM.provinceSelect.innerHTML = `<option value="ALL">Tutte le Province (${activeStations.length})</option>`;

    const sortedProvinces = Object.keys(provinceCounts).sort();
    sortedProvinces.forEach(prov => {
      const name = PROVINCE_NAMES[prov] ? `${prov} - ${PROVINCE_NAMES[prov]}` : prov;
      const count = provinceCounts[prov];
      const opt = document.createElement('option');
      opt.value = prov;
      opt.textContent = `${name} (${count})`;
      DOM.provinceSelect.appendChild(opt);
    });

    if (provinceCounts[state.filters.province]) {
      DOM.provinceSelect.value = state.filters.province;
    } else {
      state.filters.province = 'ALL';
      DOM.provinceSelect.value = 'ALL';
    }
  }

  function populateComuneDropdown() {
    const activeStations = getActiveRawStations();
    const selectedProv = state.filters.province;
    const comuniCounts = {};

    activeStations.forEach(s => {
      if (selectedProv === 'ALL' || s.province === selectedProv) {
        if (s.comune) {
          comuniCounts[s.comune] = (comuniCounts[s.comune] || 0) + 1;
        }
      }
    });

    DOM.comuneSelect.innerHTML = `<option value="ALL">Tutti i Comuni (${Object.keys(comuniCounts).length})</option>`;

    const sortedComuni = Object.keys(comuniCounts).sort((a, b) => a.localeCompare(b, 'it'));
    sortedComuni.forEach(comune => {
      const opt = document.createElement('option');
      opt.value = comune;
      opt.textContent = `${comune} (${comuniCounts[comune]})`;
      DOM.comuneSelect.appendChild(opt);
    });

    if (comuniCounts[state.filters.comune]) {
      DOM.comuneSelect.value = state.filters.comune;
    } else {
      state.filters.comune = 'ALL';
      DOM.comuneSelect.value = 'ALL';
    }
  }

  // --------------------------------------------------------------------------
  // Filtering Logic
  // --------------------------------------------------------------------------
  function applyFilters() {
    const activeStations = getActiveRawStations();
    const search = state.filters.search.toLowerCase().trim();
    const prov = state.filters.province;
    const comune = state.filters.comune;
    const tech = state.filters.tech;

    state.filteredStations = activeStations.filter(station => {
      // 1. Search Query
      if (search) {
        const textToMatch = [
          station.name,
          station.code,
          station.comune,
          station.address,
          station.reference,
          station.province,
          station.technology,
          station.operator
        ].filter(Boolean).join(' ').toLowerCase();

        if (!textToMatch.includes(search)) {
          return false;
        }
      }

      // 2. Province filter
      if (prov !== 'ALL' && station.province !== prov) {
        return false;
      }

      // 3. Comune filter
      if (comune !== 'ALL' && station.comune !== comune) {
        return false;
      }

      // 4. Technology filter
      if (tech !== 'ALL') {
        if (tech === '5g' && !station.has5G) return false;
        if (tech === '4g_fwa') {
          const is4GFwa = station.has4G || (station.operatorGroup === 'eolo' && (station.hasWireless || station.has4G));
          if (!is4GFwa || station.has5G) return false;
        }
        if (tech === 'ponte_radio' && (!station.hasPonteRadio || station.has4G || station.has5G)) return false;
        if (tech === 'wimax_other') {
          const isOther = station.hasWimax || station.hasWifi || (!station.has5G && !station.has4G && !station.hasPonteRadio && !station.hasWireless);
          if (!isOther) return false;
        }
      }

      return true;
    });

    // Update Counters
    const totalActive = activeStations.length;
    const visibleCount = state.filteredStations.length;

    if (DOM.statVisible) DOM.statVisible.textContent = visibleCount;
    if (DOM.statTotal) DOM.statTotal.textContent = totalActive;
    if (DOM.resultsCount) DOM.resultsCount.textContent = visibleCount;

    const count5g = state.filteredStations.filter(s => s.has5G).length;
    const count4g = state.filteredStations.filter(s => s.has4G || (s.operatorGroup === 'eolo' && s.hasWireless)).length;
    const countPr = state.filteredStations.filter(s => s.hasPonteRadio).length;

    if (DOM.stat5g) DOM.stat5g.textContent = count5g;
    if (DOM.stat4g) DOM.stat4g.textContent = count4g;
    if (DOM.statPr) DOM.statPr.textContent = countPr;

    renderMarkers();
    renderResultsList();
  }

  // --------------------------------------------------------------------------
  // Render Markers into Separate Cluster Groups
  // --------------------------------------------------------------------------
  function renderMarkers() {
    opnetClusterGroup.clearLayers();
    eoloClusterGroup.clearLayers();
    markersById.clear();

    const opnetMarkers = [];
    const eoloMarkers = [];

    state.filteredStations.forEach(station => {
      const icon = createMarkerIcon(station);
      const marker = L.marker([station.lat, station.lng], { icon: icon });
      const isOpnet = station.operatorGroup === 'opnet';

      // Popup content
      const popupHtml = `
        <div class="popup-card">
          <div class="popup-header ${isOpnet ? '' : 'popup-header-eolo'}">
            <div class="popup-title">${escapeHtml(station.name)}</div>
            <div class="popup-subtitle">${escapeHtml(station.comune)} (${escapeHtml(station.province)}) • ${escapeHtml(station.operator)}</div>
          </div>
          <div class="popup-body">
            <div class="popup-row">
              <div class="popup-label">Gestore</div>
              <div><span class="badge ${isOpnet ? 'badge-opnet' : 'badge-eolo'}">${escapeHtml(station.operator)}</span></div>
            </div>
            <div class="popup-row">
              <div class="popup-label">Tecnologia</div>
              <div><strong>${escapeHtml(station.technology || 'Non specificata')}</strong></div>
            </div>
            <div class="popup-row">
              <div class="popup-label">Indirizzo</div>
              <div>${escapeHtml(station.address || 'Non specificato')}</div>
            </div>
            ${station.reference ? `
            <div class="popup-row">
              <div class="popup-label">Riferimento ARPAT</div>
              <div style="font-family: var(--font-mono); font-size: 10px;">${escapeHtml(station.reference)}</div>
            </div>` : ''}
            <div class="popup-row">
              <div class="popup-label">Coordinate</div>
              <div style="font-family: var(--font-mono); font-size: 10px;">${station.lat.toFixed(6)}, ${station.lng.toFixed(6)}</div>
            </div>
          </div>
          <div class="popup-actions">
            <button class="btn btn-sm" onclick="window.btsApp.copyCoords(${station.lat}, ${station.lng})">
              Copia Coords
            </button>
            <button class="btn btn-sm btn-dark" onclick="window.btsApp.selectStation('${station.id}')">
              Dettagli
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 300,
        className: 'custom-popup-wrapper'
      });

      marker.on('click', () => {
        selectStation(station.id, false);
      });

      markersById.set(station.id, marker);

      if (isOpnet) {
        opnetMarkers.push(marker);
      } else {
        eoloMarkers.push(marker);
      }
    });

    // Handle Opnet Layer
    if (state.activeLayers.opnet) {
      if (!map.hasLayer(opnetClusterGroup)) map.addLayer(opnetClusterGroup);
      if (state.settings.clustering) {
        opnetClusterGroup.addLayers(opnetMarkers);
      } else {
        opnetMarkers.forEach(m => m.addTo(map));
      }
    } else {
      if (map.hasLayer(opnetClusterGroup)) map.removeLayer(opnetClusterGroup);
    }

    // Handle Eolo Layer
    if (state.activeLayers.eolo) {
      if (!map.hasLayer(eoloClusterGroup)) map.addLayer(eoloClusterGroup);
      if (state.settings.clustering) {
        eoloClusterGroup.addLayers(eoloMarkers);
      } else {
        eoloMarkers.forEach(m => m.addTo(map));
      }
    } else {
      if (map.hasLayer(eoloClusterGroup)) map.removeLayer(eoloClusterGroup);
    }
  }

  // --------------------------------------------------------------------------
  // Render Sidebar Results List
  // --------------------------------------------------------------------------
  function renderResultsList() {
    if (!DOM.stationList) return;

    if (state.filteredStations.length === 0) {
      DOM.stationList.innerHTML = `
        <div class="empty-results">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <div>Nessun impianto corrispondente ai filtri</div>
        </div>
      `;
      return;
    }

    const itemsHtml = state.filteredStations.map(station => {
      const isSelected = state.selectedStationId === station.id;
      const isOpnet = station.operatorGroup === 'opnet';
      return `
        <li class="station-item ${isSelected ? 'selected' : ''}" data-id="${station.id}" onclick="window.btsApp.selectStation('${station.id}', true)">
          <div class="station-item-header">
            <span class="station-item-name">${escapeHtml(station.name)}</span>
            <div class="station-item-meta">
              <span class="badge ${isOpnet ? 'badge-opnet' : 'badge-eolo'}">${escapeHtml(station.operator)}</span>
              <span class="station-item-province">${escapeHtml(station.province)}</span>
            </div>
          </div>
          <div class="station-item-comune">${escapeHtml(station.comune)}</div>
          <div class="station-item-tags">
            ${station.has5G ? `<span class="badge ${isOpnet ? 'badge-dark' : 'badge-blue'}">5G</span>` : ''}
            ${station.has4G ? '<span class="badge">4G</span>' : ''}
            ${station.hasWireless && !station.has5G ? `<span class="badge ${isOpnet ? '' : 'badge-blue'}">Wireless</span>` : ''}
            ${station.hasPonteRadio ? '<span class="badge">Ponte Radio</span>' : ''}
            ${station.hasWimax ? '<span class="badge">WiMAX</span>' : ''}
          </div>
        </li>
      `;
    }).join('');

    DOM.stationList.innerHTML = itemsHtml;
  }

  // --------------------------------------------------------------------------
  // Select Station & Show Detail Panel
  // --------------------------------------------------------------------------
  function selectStation(stationId, flyTo = true) {
    const allActive = getActiveRawStations();
    const station = allActive.find(s => s.id === stationId);
    if (!station) return;

    state.selectedStationId = stationId;
    const isOpnet = station.operatorGroup === 'opnet';

    document.querySelectorAll('.station-item').forEach(item => {
      if (item.dataset.id === stationId) {
        item.classList.add('selected');
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });

    if (DOM.detailHeaderEl) {
      if (isOpnet) DOM.detailHeaderEl.classList.remove('detail-header-eolo');
      else DOM.detailHeaderEl.classList.add('detail-header-eolo');
    }

    if (DOM.detailTitle) DOM.detailTitle.textContent = station.name;
    if (DOM.detailCode) DOM.detailCode.textContent = station.code || 'N/D';
    if (DOM.detailOperator) DOM.detailOperator.textContent = station.operator;
    if (DOM.detailLocation) DOM.detailLocation.textContent = `${station.comune} (${station.province})`;
    if (DOM.detailAddress) DOM.detailAddress.textContent = station.address || 'Non specificato';
    if (DOM.detailTech) DOM.detailTech.textContent = station.technology || 'Non specificata';
    if (DOM.detailRef) DOM.detailRef.textContent = station.reference || 'Non disponibile';
    if (DOM.detailCoords) DOM.detailCoords.textContent = `${station.lat.toFixed(6)}, ${station.lng.toFixed(6)}`;

    DOM.btnCopyCoords.onclick = () => copyCoords(station.lat, station.lng);
    DOM.btnGmaps.href = `https://www.google.com/maps?q=${station.lat},${station.lng}`;
    DOM.btnOsm.href = `https://www.openstreetmap.org/?mlat=${station.lat}&mlon=${station.lng}#map=17/${station.lat}/${station.lng}`;

    DOM.detailPanel.classList.add('visible');

    if (flyTo) {
      map.flyTo([station.lat, station.lng], Math.max(map.getZoom(), 15), {
        duration: 0.8
      });

      const marker = markersById.get(stationId);
      if (marker) {
        const clusterGroup = isOpnet ? opnetClusterGroup : eoloClusterGroup;
        if (state.settings.clustering && clusterGroup.hasLayer(marker)) {
          clusterGroup.zoomToShowLayer(marker, () => {
            marker.openPopup();
          });
        } else {
          marker.openPopup();
        }
      }
    }

    if (window.innerWidth <= 860) {
      DOM.sidebar.classList.remove('open');
    }
  }

  function closeDetailPanel() {
    DOM.detailPanel.classList.remove('visible');
    state.selectedStationId = null;
    document.querySelectorAll('.station-item').forEach(i => i.classList.remove('selected'));
  }

  // --------------------------------------------------------------------------
  // Helpers & Actions
  // --------------------------------------------------------------------------
  function copyCoords(lat, lng) {
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Coordinate copiate: ${text}`);
    }).catch(() => {
      showToast(`Coordinate: ${text}`);
    });
  }

  function showToast(message) {
    if (!DOM.toast) return;
    DOM.toast.textContent = message;
    DOM.toast.classList.add('show');
    setTimeout(() => {
      DOM.toast.classList.remove('show');
    }, 2400);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function resetFilters() {
    state.filters.search = '';
    state.filters.province = 'ALL';
    state.filters.comune = 'ALL';
    state.filters.tech = 'ALL';

    DOM.searchInput.value = '';
    DOM.searchClear.style.display = 'none';
    DOM.provinceSelect.value = 'ALL';
    populateProvinceDropdown();
    populateComuneDropdown();

    DOM.techPills.forEach(p => {
      if (p.dataset.tech === 'ALL') p.classList.add('active');
      else p.classList.remove('active');
    });

    applyFilters();

    if (state.tuscanyBounds) {
      map.fitBounds(state.tuscanyBounds, { padding: [20, 20] });
    }
  }

  // --------------------------------------------------------------------------
  // Event Listeners
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    // Layer toggles
    if (DOM.layerToggleOpnet) {
      DOM.layerToggleOpnet.addEventListener('change', (e) => {
        state.activeLayers.opnet = e.target.checked;
        DOM.labelLayerOpnet.classList.toggle('active', state.activeLayers.opnet);
        populateProvinceDropdown();
        populateComuneDropdown();
        applyFilters();
      });
    }

    if (DOM.layerToggleEolo) {
      DOM.layerToggleEolo.addEventListener('change', (e) => {
        state.activeLayers.eolo = e.target.checked;
        DOM.labelLayerEolo.classList.toggle('active', state.activeLayers.eolo);
        populateProvinceDropdown();
        populateComuneDropdown();
        applyFilters();
      });
    }

    // Search input
    let searchDebounce = null;
    DOM.searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      DOM.searchClear.style.display = val ? 'flex' : 'none';
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        state.filters.search = val;
        applyFilters();
      }, 150);
    });

    DOM.searchClear.addEventListener('click', () => {
      DOM.searchInput.value = '';
      DOM.searchClear.style.display = 'none';
      state.filters.search = '';
      applyFilters();
    });

    // Province dropdown
    DOM.provinceSelect.addEventListener('change', (e) => {
      state.filters.province = e.target.value;
      populateComuneDropdown();
      applyFilters();

      if (state.filters.province !== 'ALL' && state.filteredStations.length > 0) {
        const lats = state.filteredStations.map(s => s.lat);
        const lngs = state.filteredStations.map(s => s.lng);
        const provBounds = L.latLngBounds(
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)]
        );
        map.fitBounds(provBounds, { padding: [40, 40] });
      }
    });

    // Comune dropdown
    DOM.comuneSelect.addEventListener('change', (e) => {
      state.filters.comune = e.target.value;
      applyFilters();

      if (state.filters.comune !== 'ALL' && state.filteredStations.length > 0) {
        const lats = state.filteredStations.map(s => s.lat);
        const lngs = state.filteredStations.map(s => s.lng);
        const comuneBounds = L.latLngBounds(
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)]
        );
        map.fitBounds(comuneBounds, { padding: [50, 50], maxZoom: 14 });
      }
    });

    // Tech pills
    DOM.techPills.forEach(pill => {
      pill.addEventListener('click', () => {
        DOM.techPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.filters.tech = pill.dataset.tech;
        applyFilters();
      });
    });

    // Reset filters
    if (DOM.resetFiltersBtn) {
      DOM.resetFiltersBtn.addEventListener('click', resetFilters);
    }

    // Detail Panel close
    if (DOM.detailClose) {
      DOM.detailClose.addEventListener('click', closeDetailPanel);
    }

    // Reset View Button
    if (DOM.btnResetView) {
      DOM.btnResetView.addEventListener('click', () => {
        if (state.tuscanyBounds) {
          map.fitBounds(state.tuscanyBounds, { padding: [20, 20] });
        }
      });
    }

    // Toggle Boundary Outline
    if (DOM.btnToggleBoundary) {
      DOM.btnToggleBoundary.addEventListener('click', () => {
        state.settings.showBoundary = !state.settings.showBoundary;
        DOM.btnToggleBoundary.classList.toggle('active', state.settings.showBoundary);
        if (boundaryLayer) {
          if (state.settings.showBoundary) {
            boundaryLayer.addTo(map);
          } else {
            map.removeLayer(boundaryLayer);
          }
        }
      });
    }

    // Toggle Clustering
    if (DOM.btnToggleCluster) {
      DOM.btnToggleCluster.addEventListener('click', () => {
        state.settings.clustering = !state.settings.clustering;
        DOM.btnToggleCluster.classList.toggle('active', state.settings.clustering);
        renderMarkers();
      });
    }

    // Mobile Sidebar Toggle
    if (DOM.btnToggleSidebar) {
      DOM.btnToggleSidebar.addEventListener('click', () => {
        DOM.sidebar.classList.toggle('open');
      });
    }
  }

  // --------------------------------------------------------------------------
  // Global API Exposure
  // --------------------------------------------------------------------------
  window.btsApp = {
    selectStation,
    copyCoords,
    resetFilters
  };

  // --------------------------------------------------------------------------
  // Bootstrap
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupEventListeners();
    loadData();
  });

})();
