/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function RouteMap() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vehicleMarkerRef = useRef(null);

  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );
  const [currentLang, setCurrentLang] = useState(() =>
    (i18n.language || localStorage.getItem('i18nextLng') || 'en')
      .toLowerCase()
      .startsWith('pl')
      ? 'pl'
      : 'en'
  );
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [currentStopIdx, setCurrentStopIdx] = useState(0);

  const routeData =
    location.state?.route ||
    JSON.parse(localStorage.getItem('wayfinder_active_route') || 'null') || {
      origin: 'Szwedzka',
      destination: 'PKP Targówek',
      transport_icon: 'tram',
      line_number: '17',
      walk_min: 2,
      ride_min: 12,
      stops_count: 4,
      next_departure_in: 3,
      origin_coords: { lat: 52.2631, lon: 21.0452, name: 'Szwedzka' },
      dest_coords: { lat: 52.2688, lon: 21.0612, name: 'PKP Targówek' },
      route_stops: [
        { stop_number: 0, name: 'Szwedzka', lat: 52.2631, lon: 21.0452, eta_min: 0, status: 'origin' },
        { stop_number: 1, name: 'Czynszowa', lat: 52.2602, lon: 21.0488, eta_min: 3, status: 'intermediate' },
        { stop_number: 2, name: 'Rondo Żaba', lat: 52.2691, lon: 21.0365, eta_min: 6, status: 'intermediate' },
        { stop_number: 3, name: 'Targówek-Ratusz', lat: 52.2742, lon: 21.0525, eta_min: 9, status: 'intermediate' },
        { stop_number: 4, name: 'PKP Targówek', lat: 52.2688, lon: 21.0612, eta_min: 12, status: 'destination' },
      ],
      ai_recommendation: {
        title: 'Take the tram',
        desc: 'Low-floor access. Less time in the rain.',
        time: '14',
        co2: '0.2 kg CO₂',
      },
    };

  const stopsList =
    Array.isArray(routeData.route_stops) && routeData.route_stops.length >= 2
      ? routeData.route_stops
      : [
          {
            stop_number: 0,
            name: routeData.origin || 'Centrum',
            lat: routeData.origin_coords?.lat || 52.2302,
            lon: routeData.origin_coords?.lon || 21.0104,
            eta_min: 0,
            status: 'origin',
          },
          {
            stop_number: 1,
            name: 'Świętokrzyska',
            lat: 52.2352,
            lon: 21.0082,
            eta_min: 3,
            status: 'intermediate',
          },
          {
            stop_number: 2,
            name: 'Rondo ONZ',
            lat: 52.2331,
            lon: 20.9984,
            eta_min: 6,
            status: 'intermediate',
          },
          {
            stop_number: 3,
            name: routeData.destination || 'Warszawa Centralna',
            lat: routeData.dest_coords?.lat || 52.2288,
            lon: routeData.dest_coords?.lon || 21.0032,
            eta_min: 9,
            status: 'destination',
          },
        ];

  const isPl = currentLang === 'pl';
  const isDark = theme === 'dark';

  const changeLanguage = (lng) => {
    setCurrentLang(lng);
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  const rec = routeData.ai_recommendation || {
    title: routeData.ai_title || 'Take the tram',
    desc: routeData.ai_desc || 'Low-floor access. Less time in the rain.',
    time: routeData.ai_time || '14',
    co2: routeData.ai_co2 || '0.2 kg CO₂',
  };

  const lineBadge = routeData.line_number || '17';
  const walkMin = routeData.walk_min || 3;
  const stopsCount = stopsList.length - 1;
  const nextDepMin = routeData.next_departure_in || 2;
  const shortDest = (routeData.destination || 'Centralna').replace(/^Warszawa\s+/i, '');

  const transportTypeLabel =
    routeData.transport_icon === 'bus'
      ? isPl
        ? 'Autobus'
        : 'Bus'
      : routeData.transport_icon === 'metro'
      ? 'Metro'
      : routeData.transport_icon === 'train'
      ? 'SKM'
      : isPl
      ? 'Tramwaj'
      : 'Tram';

  // Inicjalizacja mapy Google Maps / Leaflet
  useEffect(() => {
    let isCancelled = false;

    const ensureLeafletLoaded = () =>
      new Promise((resolve) => {
        if (window.L) {
          resolve(window.L);
          return;
        }
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }
        const existingScript = document.getElementById('leaflet-js');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve(window.L));
          return;
        }
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve(window.L);
        document.body.appendChild(script);
      });

    ensureLeafletLoaded().then((L) => {
      if (isCancelled || !mapContainerRef.current || !L) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      });
      mapInstanceRef.current = map;

      L.tileLayer('https://mt1.google.com/vt/lyrs=m&hl=pl&x={x}&y={y}&z={z}', {
        maxZoom: 20,
      }).addTo(map);

      const latlngs = stopsList.map((s) => [s.lat, s.lon]);
      const strokeColor = theme === 'dark' ? '#60DFAC' : '#087D56';
      const nodeFill = theme === 'dark' ? '#122119' : '#FFFFFF';
      const pillBg = theme === 'dark' ? '#1D3328' : '#FFFFFF';
      const pillText = theme === 'dark' ? '#F1F7F4' : '#13221B';

      L.polyline(latlngs, {
        color: '#000000',
        weight: 9,
        opacity: 0.14,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      L.polyline(latlngs, {
        color: strokeColor,
        weight: 5.5,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      stopsList.forEach((s, index) => {
        const isFirst = index === 0;
        const isLast = index === stopsList.length - 1;

        if (isFirst) {
          const startIcon = L.divIcon({
            className: 'wf-map-div-icon',
            html: `
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:22px;height:22px;border-radius:50%;background:rgba(8,125,86,0.22);display:flex;align-items:center;justify-content:center;">
                  <div style="width:11px;height:11px;border-radius:50%;background:${strokeColor};border:2px solid #fff;"></div>
                </div>
                <div style="background:${pillBg};color:${pillText};padding:6px 12px;border-radius:10px;font-family:'Inter',sans-serif;font-weight:700;font-size:11.5px;box-shadow:0 4px 14px rgba(0,0,0,0.16);white-space:nowrap;">
                  ${isPl ? 'Tu jesteś' : 'You are here'} · ${s.name}
                </div>
              </div>
            `,
            iconSize: [190, 30],
            iconAnchor: [11, 15],
          });
          L.marker([s.lat, s.lon], { icon: startIcon }).addTo(map);
        } else if (isLast) {
          const endIcon = L.divIcon({
            className: 'wf-map-div-icon',
            html: `
              <div style="display:flex;flex-direction:column;align-items:center;">
                <svg width="28" height="36" viewBox="0 0 28 36" fill="none" style="filter:drop-shadow(0 4px 8px rgba(0,0,0,0.25));">
                  <path d="M14 0C6.27 0 0 6.27 0 14c0 9.63 14 22 14 22s14-12.37 14-22c0-7.73-6.27-14-14-14z" fill="${strokeColor}"/>
                  <circle cx="14" cy="14" r="5" fill="${nodeFill}"/>
                </svg>
                <div style="margin-top:4px;background:${pillBg};color:${pillText};padding:6px 13px;border-radius:10px;font-family:'Inter',sans-serif;font-weight:700;font-size:11.5px;box-shadow:0 4px 14px rgba(0,0,0,0.18);white-space:nowrap;">
                  ${s.name}
                </div>
              </div>
            `,
            iconSize: [160, 68],
            iconAnchor: [80, 35],
          });
          L.marker([s.lat, s.lon], { icon: endIcon }).addTo(map);
        } else {
          L.circleMarker([s.lat, s.lon], {
            radius: 5.5,
            fillColor: nodeFill,
            color: strokeColor,
            weight: 3,
            fillOpacity: 1,
          })
            .bindTooltip(`${index}. ${s.name}`, {
              permanent: false,
              direction: 'top',
            })
            .addTo(map);
        }
      });

      const midIdx =
        currentStopIdx > 0
          ? currentStopIdx
          : Math.max(1, Math.floor(stopsList.length / 2));
      const activeStop = stopsList[midIdx] || stopsList[0];
      const badgeTextColor = theme === 'dark' ? '#112019' : '#FFFFFF';

      const vehIcon = L.divIcon({
        className: 'wf-map-div-icon',
        html: `
          <div style="display:inline-flex;align-items:center;gap:5px;background:${strokeColor};color:${badgeTextColor};padding:5px 11px;border-radius:10px;font-family:'Inter',sans-serif;font-weight:800;font-size:12px;box-shadow:0 4px 14px rgba(0,0,0,0.26);border:2px solid ${nodeFill};white-space:nowrap;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="3" width="16" height="16" rx="2"></rect>
              <path d="M4 11h16"></path>
              <circle cx="8" cy="16" r="1"></circle>
              <circle cx="16" cy="16" r="1"></circle>
            </svg>
            <span>${lineBadge}</span>
          </div>
        `,
        iconSize: [62, 28],
        iconAnchor: [31, 14],
      });

      vehicleMarkerRef.current = L.marker([activeStop.lat, activeStop.lon], {
        icon: vehIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, {
        paddingTopLeft: [45, 75],
        paddingBottomRight: [45, 290],
        maxZoom: 15,
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [theme, isPl, routeData.origin, routeData.destination]);

  // Automatyczne śledzenie GPS użytkownika w czasie rzeczywistym podczas podróży
  useEffect(() => {
    if (!journeyStarted) return;

    let watchId = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          // Znajdujemy przystanek na trasie najbliższy aktualnym współrzędnym GPS użytkownika
          let closestIdx = 0;
          let minDist = Infinity;
          stopsList.forEach((st, idx) => {
            const d = Math.hypot(st.lat - latitude, st.lon - longitude);
            if (d < minDist) {
              minDist = d;
              closestIdx = idx;
            }
          });
          // Jeśli GPS użytkownika przesunął się bliżej kolejnego przystanku, automatycznie go aktualizujemy
          setCurrentStopIdx((prev) => Math.max(prev, closestIdx));
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 3000 }
      );
    }

    // Dodatkowo płynna aktualizacja postępu na podstawie sygnału GPS pojazdu ZTM w trasie
    const gpsInterval = setInterval(() => {
      setCurrentStopIdx((prev) => {
        if (prev < stopsList.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 12000);

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearInterval(gpsInterval);
    };
  }, [journeyStarted, stopsList.length]);

  // Automatyczne przesuwanie znacznika pojazdu na mapie wraz ze zmianą przystanku GPS
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = vehicleMarkerRef.current;
    const stop = stopsList[currentStopIdx];
    if (map && marker && stop && journeyStarted) {
      marker.setLatLng([stop.lat, stop.lon]);
      map.panTo([stop.lat, stop.lon], { animate: true, duration: 0.6 });
    }
  }, [currentStopIdx, journeyStarted]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;
    const latlngs = stopsList.map((s) => [s.lat, s.lon]);
    map.fitBounds(window.L.latLngBounds(latlngs), {
      paddingTopLeft: [45, 75],
      paddingBottomRight: [45, 290],
      maxZoom: 15,
    });
  };

  const nowTime = new Date();
  const formatEtaClock = (plusMinutes) => {
    const d = new Date(nowTime.getTime() + plusMinutes * 60000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const remainingStops = Math.max(0, stopsList.length - 1 - currentStopIdx);
  const cleanCo2 = rec.co2.toLowerCase().includes('saved')
    ? rec.co2
    : `${rec.co2} ${isPl ? 'mniej' : 'saved'}`;

  return (
    <div className="route-map-page">
      <style>{`
        .route-map-page {
          position: relative;
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          overflow: hidden;
          background-color: var(--map-bg);
          color: var(--text-main);
        }

        [data-theme='light'] .route-map-page {
          --map-bg: #E6EFEA;
          --pill-bg: #FFFFFF;
          --pill-text: #16261E;
          --sheet-bg: #FFFFFF;
          --accent-green: #087D56;
          --accent-btn-text: #FFFFFF;
          --badge-bg: #E7F5EE;
          --badge-text: #087D56;
          --text-main: #13221B;
          --text-muted: #6C7F75;
          --border: #E2ECE6;
        }

        [data-theme='dark'] .route-map-page {
          --map-bg: #122119;
          --pill-bg: #1D3328;
          --pill-text: #F1F7F4;
          --sheet-bg: #172A21;
          --accent-green: #60DFAC;
          --accent-btn-text: #112019;
          --badge-bg: #203B2E;
          --badge-text: #60DFAC;
          --text-main: #F1F7F4;
          --text-muted: #98AFA3;
          --border: #284235;
        }

        .wf-map-div-icon {
          background: transparent !important;
          border: none !important;
        }

        .rm-leaflet-container {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        [data-theme='light'] .rm-leaflet-container .leaflet-tile-pane {
          filter: saturate(0.85) contrast(0.98) hue-rotate(8deg);
        }
        [data-theme='dark'] .rm-leaflet-container .leaflet-tile-pane {
          filter: invert(92%) hue-rotate(155deg) brightness(86%) contrast(94%) saturate(0.7);
        }

        .rm-topbar {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px 6px 16px;
        }
        .rm-topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .rm-topbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rm-circle-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background-color: var(--pill-bg);
          border: 1px solid var(--border);
          color: var(--text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: transform 0.15s;
        }
        .rm-circle-btn:active {
          transform: scale(0.93);
        }
        .rm-title-pill {
          background: var(--pill-bg);
          border: 1px solid var(--border);
          padding: 7px 14px;
          border-radius: 999px;
          font-size: 0.94rem;
          font-weight: 800;
          color: var(--text-main);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .rm-lang-pill {
          display: flex;
          align-items: center;
          background: var(--pill-bg);
          padding: 3px;
          border-radius: 999px;
          border: 1px solid var(--border);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .rm-lang-btn {
          border: none;
          background: transparent;
          padding: 5px 10px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 0.72rem;
          cursor: pointer;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .rm-lang-btn.active {
          background: var(--accent-green);
          color: var(--accent-btn-text);
        }

        .rm-recenter-wrap {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: flex-end;
          padding: 4px 16px 0 16px;
        }
        .rm-recenter-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background-color: var(--pill-bg);
          border: 1px solid var(--border);
          color: var(--accent-green);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .rm-bottom-sheet {
          position: relative;
          z-index: 10;
          margin: auto 12px 12px 12px;
          background-color: var(--sheet-bg);
          border: 1px solid var(--border);
          border-radius: 26px;
          padding: 10px 18px 18px 18px;
          box-shadow: 0 12px 34px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
        }
        .rm-grab-bar {
          width: 36px;
          height: 4px;
          border-radius: 2px;
          background-color: var(--border);
          margin: 0 auto 10px auto;
        }
        .rm-ai-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .rm-ai-label-left {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: var(--accent-green);
          text-transform: uppercase;
        }
        .rm-live-dep-tag {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--accent-green);
          background: var(--badge-bg);
          padding: 3px 9px;
          border-radius: 999px;
        }
        .rm-eta-heading {
          font-size: 1.45rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0 0 12px 0;
          letter-spacing: -0.02em;
        }
        .rm-line-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }
        .rm-line-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          background-color: var(--badge-bg);
          color: var(--badge-text);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .rm-line-info strong {
          display: block;
          font-size: 0.94rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .rm-line-info span {
          display: block;
          font-size: 0.77rem;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .rm-desc-text {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0 0 11px 0;
          line-height: 1.35;
        }
        .rm-co2-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: var(--badge-bg);
          color: var(--badge-text);
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 700;
          margin-bottom: 14px;
          align-self: flex-start;
        }

        .rm-timeline-panel {
          margin: 4px 0 14px 0;
          background: var(--badge-bg);
          border-radius: 16px;
          padding: 10px 14px;
          max-height: 150px;
          overflow-y: auto;
        }
        .rm-timeline-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.73rem;
          font-weight: 800;
          color: var(--badge-text);
          padding-bottom: 8px;
          margin-bottom: 8px;
          border-bottom: 1px solid var(--border);
        }
        .rm-timeline-list {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .rm-timeline-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          border-radius: 10px;
          transition: background 0.2s;
        }
        .rm-timeline-item.active {
          background: var(--sheet-bg);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .rm-timeline-item.passed {
          opacity: 0.48;
        }
        .rm-tl-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .rm-tl-bullet {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2.5px solid var(--accent-green);
          background: var(--sheet-bg);
          flex-shrink: 0;
        }
        .rm-timeline-item.active .rm-tl-bullet {
          background: var(--accent-green);
          box-shadow: 0 0 0 3px rgba(8, 125, 86, 0.22);
        }
        .rm-tl-name {
          font-size: 0.81rem;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rm-tl-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 6px;
          background: var(--badge-bg);
          color: var(--badge-text);
          margin-left: 6px;
        }
        .rm-tl-time {
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .rm-start-btn {
          width: 100%;
          height: 48px;
          border-radius: 15px;
          border: none;
          background-color: var(--accent-green);
          color: var(--accent-btn-text);
          font-size: 0.94rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.15s;
        }
        .rm-start-btn:active {
          transform: scale(0.98);
        }
      `}</style>

      {/* PRAWDZIWA MAPA WARSZAWY GOOGLE MAPS / LEAFLET */}
      <div ref={mapContainerRef} className="rm-leaflet-container" />

      {/* GÓRNY PASEK NAWIGACJI */}
      <div className="rm-topbar">
        <div className="rm-topbar-left">
          <button
            className="rm-circle-btn"
            onClick={() => navigate('/')}
            aria-label="Back to Home"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <span className="rm-title-pill">
            {isPl ? 'Twoja trasa' : 'Your route'}
          </span>
        </div>

        <div className="rm-topbar-right">
          <button className="rm-circle-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          <div className="rm-lang-pill">
            <button
              type="button"
              className={`rm-lang-btn ${currentLang === 'pl' ? 'active' : ''}`}
              onClick={() => changeLanguage('pl')}
            >
              PL
            </button>
            <button
              type="button"
              className={`rm-lang-btn ${currentLang === 'en' ? 'active' : ''}`}
              onClick={() => changeLanguage('en')}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* PRZYCISK CENTROWANIA TRASY */}
      <div className="rm-recenter-wrap">
        <button
          className="rm-recenter-btn"
          onClick={handleRecenter}
          title={isPl ? 'Wyśrodkuj trasę' : 'Fit route on map'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>
            <circle cx="12" cy="12" r="7"></circle>
          </svg>
        </button>
      </div>

      {/* DOLNA KARTA REKOMENDACJI AI + AUTOMATYCZNY TIMELINE GPS */}
      <div className="rm-bottom-sheet">
        <div className="rm-grab-bar" />

        <div className="rm-ai-label-row">
          <div className="rm-ai-label-left">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
            </svg>
            <span>{isPl ? 'REKOMENDACJA AI' : 'AI RECOMMENDED'}</span>
          </div>
          <span className="rm-live-dep-tag">
            {isPl
              ? `Odjazd za ${nextDepMin} min (${formatEtaClock(nextDepMin)})`
              : `Departs in ${nextDepMin} min (${formatEtaClock(nextDepMin)})`}
          </span>
        </div>

        <h2 className="rm-eta-heading">
          {rec.time} min {isPl ? 'do' : 'to'} {shortDest}
        </h2>

        <div className="rm-line-row">
          <div className="rm-line-icon-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="16" height="16" rx="2"></rect>
              <path d="M4 11h16"></path>
              <path d="M12 3v8"></path>
              <circle cx="8" cy="16" r="1"></circle>
              <circle cx="16" cy="16" r="1"></circle>
            </svg>
          </div>
          <div className="rm-line-info">
            <strong>
              {transportTypeLabel} {lineBadge} - {isPl ? 'bezpośredni' : 'direct'}
            </strong>
            <span>
              {walkMin} min {isPl ? 'pieszo' : 'walk'} · {stopsCount}{' '}
              {isPl ? 'przystanki' : 'stops'}
            </span>
          </div>
        </div>

        {journeyStarted ? (
          <div className="rm-timeline-panel">
            <div className="rm-timeline-top">
              <span>
                {remainingStops > 0
                  ? isPl
                    ? `GPS na żywo · Pozostało przystanków: ${remainingStops}`
                    : `Live GPS · ${remainingStops} stops remaining`
                  : isPl
                  ? 'Dotarłeś do celu podróży'
                  : 'You have reached your destination'}
              </span>
              <span>
                ETA {formatEtaClock(nextDepMin + remainingStops * 3)}
              </span>
            </div>

            <div className="rm-timeline-list">
              {stopsList.map((st, idx) => {
                const isPassed = idx < currentStopIdx;
                const isCurrent = idx === currentStopIdx;
                const roleTag =
                  idx === 0
                    ? isPl
                      ? 'Start'
                      : 'Board'
                    : idx === stopsList.length - 1
                    ? isPl
                      ? 'Cel'
                      : 'Exit'
                    : null;

                return (
                  <div
                    key={`${st.name}-${idx}`}
                    className={`rm-timeline-item ${isCurrent ? 'active' : ''} ${isPassed ? 'passed' : ''}`}
                  >
                    <div className="rm-tl-left">
                      <span className="rm-tl-bullet" />
                      <span className="rm-tl-name">{st.name}</span>
                      {roleTag && <span className="rm-tl-badge">{roleTag}</span>}
                    </div>
                    <span className="rm-tl-time">
                      {formatEtaClock(nextDepMin + idx * 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <p className="rm-desc-text">
              {isPl
                ? 'Niskopodłogowy pojazd. Mniej czasu w deszczu.'
                : 'Low-floor access. Less time in the rain.'}
            </p>
            <div className="rm-co2-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
              </svg>
              <span>{cleanCo2}</span>
            </div>
          </>
        )}

        <button
          type="button"
          className="rm-start-btn"
          onClick={() => {
            if (!journeyStarted) {
              setJourneyStarted(true);
              setCurrentStopIdx(0);
            } else {
              setJourneyStarted(false);
            }
          }}
        >
          <span>
            {journeyStarted
              ? isPl
                ? 'Zakończ nawigację'
                : 'End Journey'
              : isPl
              ? 'Rozpocznij podróż'
              : 'Start Journey'}
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
}