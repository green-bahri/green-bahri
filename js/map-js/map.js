"use strict";
/* 
 * map.js - منطق الخريطة، الماركرات، والفلترة
 * يستند إلى sudmap (https://sudamap.pages.dev)
 */

import { STATUS_COLORS, SPECIES } from "./config.js";
import { showToast } from "./ui/toast.js";

const categoryLayers = { "الكل": L.layerGroup() };
const areasLayer = L.layerGroup(); 

const FALLBACK_COLOR = "#95a5a6";
const MARKER_MIN_ZOOM = 14;
const MARKER_MAX_ZOOM = 19;

let currentBaseLayer = null;
let osmLayer = null;
let satelliteLayer = null;
let lastIconTier = null;
let zoomHandler = null;

function escapeHTML(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// تحديد مستوى عرض الأيقونة (0: نقطة | 1: شجرة | 2: شجرة + كود)
function getIconTier(zoom) {
  if (zoom >= 18) return 2;
  if (zoom >= 17) return 1;
  return 0;
}

/**
 * إنشاء أيقونة الشجرة
 * - التكبير < 17: تظهر كنقطة ملونة
 * - التكبير >= 17: تظهر كأيقونة شجرة
 * - التكبير >= 18: إضافة كود الشجرة
 */
function createTreeIcon(tree, zoom) {
  const color = STATUS_COLORS[tree.status] || FALLBACK_COLOR;

  if (zoom < 17) {
    return L.divIcon({
      className: "tree-dot",
      html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  }

  const svg = `
    <svg viewBox="0 0 32 40" width="26" height="32" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))">
      <rect x="14" y="24" width="4" height="14" rx="1.5" fill="#6d4c41"/>
      <circle cx="16" cy="12" r="10" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="9.5" cy="18" r="7" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="22.5" cy="18" r="7" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="16" cy="17" r="8" fill="${color}"/>
    </svg>`;

  const label = zoom >= 18
    ? `<span class="tree-code-label" style="position:absolute;left:50%;bottom:-14px;transform:translateX(-50%);white-space:nowrap;font-size:10px;font-weight:600;line-height:1;color:#111;background:rgba(255,255,255,.9);padding:2px 4px;border-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,.3);pointer-events:none">${escapeHTML(tree.code)}</span>`
    : "";

  return L.divIcon({
    className: "tree-marker",
    html: `<div style="position:relative;width:26px;height:32px">${svg}${label}</div>`,
    iconSize: [26, 32],
    iconAnchor: [13, 32]
  });
}

export function initMap(config) {
  const mapInstance = L.map("map", {
    center: config.center,
    zoom: config.zoom,
    minZoom: config.minZoom,
    maxZoom: config.maxZoom,
    zoomControl: false
  });
  mapInstance.setMaxBounds(config.bounds);

  // طبقة OSM
  osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: config.maxZoom,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });

  // طبقة Esri (الافتراضية)
  satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>'
  });

  currentBaseLayer = satelliteLayer;
  currentBaseLayer.addTo(mapInstance);
  
  categoryLayers["الكل"].addTo(mapInstance);
  areasLayer.addTo(mapInstance);

  addBaseLayerToggle(mapInstance);
  return mapInstance;
}

// زر التبديل بين القمر الصناعي والخريطة العادية
function addBaseLayerToggle(mapInstance) {
  const btn = document.createElement('button');
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>`;
  btn.className = 'map-btn base-layer-btn satellite-active';
  btn.title = 'تبديل الخريطة';
  document.body.appendChild(btn);

  let layerMode = 1; // 1: Esri | 0: OSM

  btn.addEventListener('click', () => {
    mapInstance.removeLayer(currentBaseLayer);
    layerMode = (layerMode + 1) % 2;
    
    if (layerMode === 0) {
      currentBaseLayer = osmLayer;
      btn.classList.remove('satellite-active');
      showToast('🗺️ وضع الخريطة العادية', 2000);
    } else {
      currentBaseLayer = satelliteLayer;
      btn.classList.add('satellite-active');
      showToast('🛰️ أقمار صناعية', 2000);
    }
    currentBaseLayer.addTo(mapInstance);
  });
}

/**
 * عرض أسماء المناطق باستخدام Tooltip (متمركز بدقة ولا يعترض النقرات)
 */
export function renderAreasFromData(mapInstance, areasArray) {
  areasLayer.clearLayers();
  if (!areasArray || !areasArray.length) return;

  areasArray.forEach(area => {
    if (area.lat == null || area.lng == null) return;

    L.tooltip({
      permanent: true,
      direction: 'center',
      className: 'map-area-label',
      opacity: 1,
      interactive: false
    })
      .setLatLng([area.lat, area.lng])
      .setContent(escapeHTML(area.name))
      .addTo(areasLayer);
  });
}

// جمع الماركرات الظاهرة
function collectMarkers(onlyVisibleLayers, mapInstance) {
  const markers = new Set();
  Object.keys(categoryLayers).forEach(key => {
    const layer = categoryLayers[key];
    if (!layer) return;
    if (onlyVisibleLayers && !mapInstance.hasLayer(layer)) return;
    layer.eachLayer(marker => markers.add(marker));
  });
  return markers;
}

// تطبيق فلترة التكبير
function applyZoomFilter(mapInstance) {
  const currentZoom = mapInstance.getZoom();
  const tier = getIconTier(currentZoom);
  const tierChanged = tier !== lastIconTier;

  if (tierChanged) {
    collectMarkers(false, mapInstance).forEach(marker => {
      if (marker.treeData) {
        marker.setIcon(createTreeIcon(marker.treeData, currentZoom));
      }
    });
    lastIconTier = tier;
  }

  collectMarkers(true, mapInstance).forEach(marker => {
    const minZ = marker.options.minZoom !== undefined ? marker.options.minZoom : 0;
    const maxZ = marker.options.maxZoom !== undefined ? marker.options.maxZoom : MARKER_MAX_ZOOM;
    const shouldShow = currentZoom >= minZ && currentZoom <= maxZ;
    const isShowing = mapInstance.hasLayer(marker);

    if (shouldShow && !isShowing) mapInstance.addLayer(marker);
    else if (!shouldShow && isShowing) mapInstance.removeLayer(marker);
  });
}

// رسم الأشجار
export function renderMarkersFromData(mapInstance, dataArray, onMarkerClick = null) {
  Object.keys(categoryLayers).forEach(key => categoryLayers[key].clearLayers());
  const initialZoom = mapInstance.getZoom();

  dataArray.forEach((item) => {
    const { lat, lng, is_active, status } = item;
    if (!is_active || lat == null || lng == null) return;

    const marker = L.marker([lat, lng], {
      icon: createTreeIcon(item, initialZoom),
      interactive: true,
      minZoom: MARKER_MIN_ZOOM,
      maxZoom: MARKER_MAX_ZOOM
    });

    marker.treeData = item;
    marker.on('contextmenu', (e) => L.DomEvent.stopPropagation(e));

    if (onMarkerClick) {
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onMarkerClick(item);
      });
    }

    categoryLayers["الكل"].addLayer(marker);
    if (!categoryLayers[status]) categoryLayers[status] = L.layerGroup();
    categoryLayers[status].addLayer(marker);
  });

  lastIconTier = getIconTier(initialZoom);
  applyZoomFilter(mapInstance);

  if (zoomHandler) mapInstance.off('zoomend', zoomHandler);
  zoomHandler = () => applyZoomFilter(mapInstance);
  mapInstance.on('zoomend', zoomHandler);
}

export function setupLongPress(mapInstance, onLongPressCallback) {
  mapInstance.on('contextmenu', (e) => {
    e.originalEvent?.preventDefault();
    if (onLongPressCallback) onLongPressCallback({ lat: e.latlng.lat, lng: e.latlng.lng });
  });
}

export function getCoordinatesFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const lat = parseFloat(urlParams.get('lat'));
  const lng = parseFloat(urlParams.get('lng'));
  const zoom = parseInt(urlParams.get('z'), 10);
  if (!isNaN(lat) && !isNaN(lng)) return { lat, lng, zoom: !isNaN(zoom) ? zoom : null };
  return null;
}

// دالة عامة تُستدعى من layer-toggle.js لفلترة الحالات والأنواع
window.applyTreeFilters = function (filterState) {
  const group = categoryLayers['الكل'];
  const map = group && group._map;
  if (!map) return;

  const { status = [], species = [] } = filterState || {};
  const zoom = map.getZoom();

  const stripMarks = (s) => String(s || '').replace(/[\u064B-\u065F\u0670]/g, '').trim();
  const speciesKeyOf = (tree) =>
    tree.species_key ??
    (SPECIES.find(s => stripMarks(s.ar) === stripMarks(tree.species_ar))?.key ?? 'other');

  group.eachLayer(marker => {
    const tree = marker.treeData;
    if (!tree) return;

    if (marker._baseMinZoom === undefined) marker._baseMinZoom = marker.options.minZoom ?? 0;

    const passes = status.includes(tree.status) && species.includes(speciesKeyOf(tree));
    marker.options.minZoom = passes ? marker._baseMinZoom : Infinity;

    const maxZ = marker.options.maxZoom ?? 19;
    const shouldShow = passes && zoom >= marker._baseMinZoom && zoom <= maxZ;
    const isShowing = map.hasLayer(marker);

    if (shouldShow && !isShowing) {
      marker.setIcon(createTreeIcon(tree, zoom));
      map.addLayer(marker);
    } else if (!shouldShow && isShowing) {
      map.removeLayer(marker);
    }
  });
};

export { categoryLayers };