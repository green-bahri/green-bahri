"use strict";
/* 
 * share-location.js - مشاركة الموقع (نسخ الإحداثيات)
 * يستند إلى sudmap (https://sudamap.pages.dev)
 */

import { CONFIG } from "../config.js";
import { showToast } from "./toast.js";

let tempMarker = null;
let currentTempLatLng = null;
let bottomSheet = null;
let isBottomSheetVisible = false;

function createBottomSheet() {
  if (bottomSheet) return bottomSheet;
  const sheet = document.createElement('div');
  sheet.className = 'share-bottom-sheet';
  sheet.innerHTML = `
    <div class="share-sheet-handle"><div class="share-handle-bar"></div></div>
    <div class="share-sheet-content">
      <button class="share-location-btn" id="shareLocationBtn">
        <svg class="share-btn-icon" viewBox="0 0 24 24" width="18" height="18"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        نسخ رابط المكان
      </button>
    </div>
  `;
  document.body.appendChild(sheet);
  let startY = 0;
  const handle = sheet.querySelector('.share-sheet-handle');
  handle.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; });
  handle.addEventListener('touchmove', (e) => { if (e.touches[0].clientY - startY > 20 && isBottomSheetVisible) hideBottomSheet(); });
  return sheet;
}

function showBottomSheet() {
  if (!bottomSheet) bottomSheet = createBottomSheet();
  bottomSheet.classList.add('visible');
  isBottomSheetVisible = true;
  const btn = bottomSheet.querySelector('.share-location-btn');
  btn.classList.remove('copied');
  btn.innerHTML = `<svg class="share-btn-icon" viewBox="0 0 24 24" width="18" height="18"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> نسخ رابط المكان`;
}

function hideBottomSheet() {
  if (bottomSheet) { bottomSheet.classList.remove('visible'); isBottomSheetVisible = false; }
}

function removeTemporaryMarker(mapInstance) {
  if (tempMarker) { mapInstance.removeLayer(tempMarker); tempMarker = null; }
  currentTempLatLng = null;
}

function addTemporaryMarker(mapInstance, latlng) {
  removeTemporaryMarker(mapInstance);
  const markerIcon = L.divIcon({
    className: 'temp-marker',
    html: `<svg width="28" height="36" viewBox="0 0 24 36" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"><path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="#e74c3c" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="8" r="2" fill="white"/></svg>`,
    iconSize: [28, 36], iconAnchor: [14, 36]
  });
  tempMarker = L.marker(latlng, { icon: markerIcon, interactive: false }).addTo(mapInstance);
  currentTempLatLng = latlng;
}

async function copyShareLocation(mapInstance) {
  if (!currentTempLatLng) { showToast('⚠️ لا يوجد موقع للمشاركة'); return; }
  const zoom = mapInstance.getZoom();
  const url = new URL(window.location.href);
  url.searchParams.delete('tree');
  url.searchParams.set('lat', currentTempLatLng.lat.toFixed(6));
  url.searchParams.set('lng', currentTempLatLng.lng.toFixed(6));
  url.searchParams.set('z', zoom);
  try {
    await navigator.clipboard.writeText(url.toString());
    const btn = bottomSheet.querySelector('.share-location-btn');
    btn.classList.add('copied');
    btn.innerHTML = `<svg class="share-btn-icon" viewBox="0 0 24 24" width="18" height="18"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/></svg> تم النسخ ✓`;
    showToast('📋 تم نسخ رابط المكان', 2500);
    setTimeout(() => {
      if (bottomSheet && bottomSheet.querySelector('.share-location-btn')) {
        const resetBtn = bottomSheet.querySelector('.share-location-btn');
        if (!resetBtn.classList.contains('copied')) return;
        resetBtn.classList.remove('copied');
        resetBtn.innerHTML = `<svg class="share-btn-icon" viewBox="0 0 24 24" width="18" height="18"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> نسخ رابط المكان`;
      }
    }, 2000);
  } catch (err) { showToast('❌ فشل نسخ الرابط، حاول يدوياً'); }
}

function setupLongPress(mapInstance, onLongPress) {
  mapInstance.on('contextmenu', (e) => {
    e.originalEvent?.preventDefault();
    const target = e.originalEvent?.target;
    if (target) {
      const isTreeMarker = target.closest?.('.tree-marker, .tree-dot');
      const isMarkerIcon = target.closest?.('.leaflet-marker-icon');
      if (isTreeMarker || isMarkerIcon) return;
    }
    onLongPress({ lat: e.latlng.lat, lng: e.latlng.lng });
  });
}

function getCoordinatesFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const lat = parseFloat(urlParams.get('lat'));
  const lng = parseFloat(urlParams.get('lng'));
  const zoom = parseInt(urlParams.get('z'), 10);
  if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng, zoom: !isNaN(zoom) ? zoom : null };
  return null;
}

export function initShareFeature(mapInstance) {
  bottomSheet = createBottomSheet();
  const copyBtn = bottomSheet.querySelector('#shareLocationBtn');
  copyBtn.addEventListener('click', () => copyShareLocation(mapInstance));
  setupLongPress(mapInstance, (coords) => { addTemporaryMarker(mapInstance, coords); showBottomSheet(); });
  
  mapInstance.on('click', (e) => {
    if (bottomSheet && bottomSheet.contains(e.originalEvent?.target)) return;
    if (isBottomSheetVisible) { hideBottomSheet(); removeTemporaryMarker(mapInstance); }
    else if (tempMarker) { removeTemporaryMarker(mapInstance); }
  });
  
  const urlCoords = getCoordinatesFromURL();
  if (urlCoords) {
    const { lat, lng, zoom } = urlCoords;
    const targetZoom = (zoom && zoom >= CONFIG.minZoom && zoom <= CONFIG.maxZoom) ? zoom : 16;
    mapInstance.flyTo([lat, lng], targetZoom, { duration: 1.2 });
    setTimeout(() => {
      addTemporaryMarker(mapInstance, { lat, lng });
      showToast('📍 تم استعراض الموقع المُشارَك', 3000);
      mapInstance.fire('zoomend');
    }, 500);
  }
}

export { addTemporaryMarker };