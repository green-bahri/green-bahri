"use strict";
/* 
 * gps-button.js - زر تحديد الموقع وتتبع الحركة
 * يستند إلى sudmap (https://sudamap.pages.dev)
 */

import { showToast } from "./toast.js";

export function createGPSButton(mapInstance) {
  let userCircle = null;
  let userArrow = null;
  let lastCoords = null;
  let watchId = null;
  let isTracking = false;
  let lastUpdateTime = 0;
  const UPDATE_INTERVAL = 2500;

  const gpsBtn = document.createElement('button');
  gpsBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
  gpsBtn.title = 'تحديد موقعي';
  gpsBtn.className = 'gps-btn';
  document.body.appendChild(gpsBtn);

  function getBearing(lat1, lon1, lat2, lon2) {
    const toRad = Math.PI / 180;
    const toDeg = 180 / Math.PI;
    const dLon = (lon2 - lon1) * toRad;
    const y = Math.sin(dLon) * Math.cos(lat2 * toRad);
    const x = Math.cos(lat1 * toRad) * Math.sin(lat2 * toRad) - Math.sin(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.cos(dLon);
    return (Math.atan2(y, x) * toDeg + 360) % 360;
  }

  function stopTracking() {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    isTracking = false;
    watchId = null;
    gpsBtn.classList.remove('is-tracking');
    if (userCircle) { mapInstance.removeLayer(userCircle); userCircle = null; }
    if (userArrow) { mapInstance.removeLayer(userArrow); userArrow = null; }
    lastCoords = null;
  }

  gpsBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('متصفحك لا يدعم تحديد الموقع');
      return;
    }
    if (isTracking) {
      stopTracking();
      return;
    }
    isTracking = true;
    gpsBtn.classList.add('is-tracking');

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastUpdateTime < UPDATE_INTERVAL) return;
        lastUpdateTime = now;
        const { latitude, longitude, accuracy, heading } = pos.coords;
        const latlng = L.latLng(latitude, longitude);
        if (!userCircle) {
          userCircle = L.circle(latlng, { radius: accuracy / 2, color: '#3498db', fillColor: '#3498db', fillOpacity: 0.15, weight: 1 }).addTo(mapInstance);
          mapInstance.setView(latlng, 17);
        } else {
          userCircle.setLatLng(latlng).setRadius(accuracy / 2);
        }
        let direction = heading;
        if ((direction === null || isNaN(direction)) && lastCoords) {
          direction = getBearing(lastCoords.lat, lastCoords.lng, latitude, longitude);
        }
        if (!userArrow) {
          userArrow = L.marker(latlng, {
            icon: L.divIcon({
              className: 'gps-arrow',
              html: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#3498db" style="transform:rotate(0deg);transition:transform 0.5s ease;transform-origin:center;"><path d="M12 2L4 22l8-4 8 4z"/></svg>`,
              iconSize: [20, 20], iconAnchor: [10, 10]
            }), interactive: false, zIndexOffset: 1000
          }).addTo(mapInstance);
        } else {
          userArrow.setLatLng(latlng);
        }
        if (direction !== null && !isNaN(direction)) {
          const arrowSvg = userArrow._icon?.querySelector('svg');
          if (arrowSvg) arrowSvg.style.transform = `rotate(${direction}deg)`;
        }
        lastCoords = { lat: latitude, lng: longitude };
      },
      (err) => {
        console.warn('GPS Error:', err.code, err.message);
        stopTracking();
        const messages = { 1: 'تم رفض إذن الوصول للموقع', 2: 'تعذّر تحديد موقعك حالياً', 3: 'انتهت مهلة تحديد الموقع' };
        showToast(messages[err.code] ?? 'حدث خطأ أثناء تحديد الموقع');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  });
}