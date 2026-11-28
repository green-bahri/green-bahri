"use strict";
/* 
 * search-bar.js - شريط البحث والتنقل الذكي (يدعم الكود، النوع، الكلية، والروابط)
 * يستند إلى sudmap (https://sudamap.pages.dev)
 */

import { CONFIG } from "../config.js";
import { showToast } from "./toast.js";

let tempMarkerFn = null;
export function setAddTemporaryMarker(fn) { tempMarkerFn = fn; }

let debounceTimer = null;
const MAX_RESULTS = 30;

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function formatTreeLabel(tree) {
  const faculty = tree.faculty ? ` (${tree.faculty})` : '';
  return `${tree.code} - ${tree.species_ar}${faculty}`;
}

export function createSearchBar(mapInstance, treesData) {
  const searchContainer = document.createElement('div');
  searchContainer.className = 'search-container';
  searchContainer.innerHTML = `
    <span class="search-icon"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg></span>
    <input type="text" class="search-input" placeholder="ابحث بالكود أو النوع أو الكلية..." autocomplete="off" spellcheck="false">
    <span class="search-clear" role="button" aria-label="مسح البحث">✕</span>
  `;
  document.body.appendChild(searchContainer);
  const searchInput = searchContainer.querySelector('.search-input');
  const searchClear = searchContainer.querySelector('.search-clear');
  const dropdown = document.createElement('div');
  dropdown.className = 'search-dropdown';
  searchContainer.appendChild(dropdown);

  function extractCoordsFromUrl(urlString) {
    try {
      const url = new URL(urlString, window.location.origin);
      const treeParam = url.searchParams.get('tree');
      if (treeParam) {
        const match = treeParam.match(/^(\d+)/);
        if (match && match[1]) {
          const foundTree = treesData.find(t => t.id === parseInt(match[1], 10));
          if (foundTree && foundTree.lat && foundTree.lng) return { lat: foundTree.lat, lng: foundTree.lng, zoom: 18 };
        }
        return null;
      }
      const lat = parseFloat(url.searchParams.get('lat'));
      const lng = parseFloat(url.searchParams.get('lng'));
      const zoom = parseInt(url.searchParams.get('z'), 10);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng, zoom: !isNaN(zoom) ? zoom : null };
    } catch (e) { return null; }
    return null;
  }

  function runSearch(query) {
    dropdown.innerHTML = '';
    searchClear.style.display = query ? 'block' : 'none';
    if (!query) { dropdown.style.display = 'none'; return; }

    const matches = treesData.filter(t => {
      if (!t || !t.is_active || t.lat == null || t.lng == null) return false;
      return [t.code, t.species_ar, t.faculty].some(field => field && String(field).trim().toLowerCase().includes(query));
    }).slice(0, MAX_RESULTS);

    if (matches.length === 0) {
      dropdown.innerHTML = `<div class="search-item" style="color:#999; text-align:center; cursor:default;">لا توجد نتائج</div>`;
      dropdown.style.display = 'block';
      return;
    }

    const safeQuery = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeQuery})`, 'gi');

    matches.forEach(item => {
      const label = formatTreeLabel(item);
      const div = document.createElement('div');
      div.className = 'search-item';
      div.innerHTML = escapeHtml(label).replace(regex, '<mark>$1</mark>');
      div.addEventListener('click', () => {
        searchInput.value = label;
        dropdown.style.display = 'none';
        searchClear.style.display = 'block';
        searchInput.blur();
        mapInstance.flyTo([item.lat, item.lng], 18, { duration: 0.5 });
      });
      dropdown.appendChild(div);
    });
    dropdown.style.display = 'block';
  }

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const rawValue = e.target.value.trim();
      const coords = extractCoordsFromUrl(rawValue);
      if (coords) {
        const { lat, lng, zoom } = coords;
        const targetZoom = (zoom && zoom >= CONFIG.minZoom && zoom <= CONFIG.maxZoom) ? zoom : 16;
        mapInstance.flyTo([lat, lng], targetZoom, { duration: 1 });
        setTimeout(() => {
          if (tempMarkerFn) tempMarkerFn(mapInstance, { lat, lng });
          showToast('📍 تم الانتقال للموقع من الرابط', 2500);
          mapInstance.fire('zoomend');
        }, 400);
        searchInput.value = '';
        dropdown.style.display = 'none';
        searchClear.style.display = 'none';
        return;
      }
      runSearch(rawValue.toLowerCase());
    }, 300);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const firstItem = dropdown.querySelector('.search-item');
      if (firstItem && !firstItem.textContent.includes('لا توجد نتائج')) firstItem.click();
      searchInput.blur();
    }
    if (e.key === 'Escape') { dropdown.style.display = 'none'; searchInput.blur(); }
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    dropdown.style.display = 'none';
    searchClear.style.display = 'none';
    searchInput.focus();
  });

  document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target)) dropdown.style.display = 'none';
  });
}