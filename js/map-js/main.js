"use strict";
/* 
 * main.js - نقطة الدخول الرئيسية للخريطة
 * يستند إلى sudmap (https://sudamap.pages.dev)
 */

import { CONFIG } from "./config.js";
import { initMap, renderMarkersFromData, renderAreasFromData } from "./map.js";
import { loadMapData, fetchAreasFromSupabase } from "./api.js";
import { initUI } from "./ui/index.js";
import { initTreeBottomSheet, onMarkerClick } from "./ui/tree-sheet.js";
import { initOffline } from "./offline.js";


function relocateMapControls() {
  const host = document.getElementById('map-page');
  if (!host) return;
  const selectors = ['.gps-btn', '.center-btn', '.zoom-container', '.layer-btn', '.menu-btn', '.base-layer-btn', '.search-container'];
  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      if (el.parentElement !== host) host.appendChild(el);
    });
  });
}

/**
 * قياس ارتفاع شريط التنقل (Navbar) ديناميكياً
 * لحماية الأزرار العائمة من التداخل مع الشريط
 */
function measureNav() {
  const navWrap = document.querySelector('.nav-wrap');
  if (!navWrap) return;
  const h = Math.ceil(navWrap.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--nav-h', `${h}px`);
}

async function start() {
  console.log("🌳 أشجار بحري — بدء التهيئة");
  document.body.classList.add('on-map-page');
  initOffline();

  // ضبط شريط التنقل
  measureNav();
  window.addEventListener('load', measureNav);
  window.addEventListener('resize', measureNav);
  if ('ResizeObserver' in window) {
    const navWrap = document.querySelector('.nav-wrap');
    if (navWrap) new ResizeObserver(measureNav).observe(navWrap);
  }

  const skeleton = document.getElementById('skeleton-loader');

  try {
    // 1. تهيئة الخريطة
    const mapInstance = initMap(CONFIG);

    // 2. جلب وعرض أسماء المناطق
    fetchAreasFromSupabase().then(areas => {
      renderAreasFromData(mapInstance, areas);
    });

    // 3. جلب وعرض الأشجار (مع التحديث في الخلفية)
    const treesData = await loadMapData((freshTrees) => {
      renderMarkersFromData(mapInstance, freshTrees, onMarkerClick);
      if (typeof window.applyTreeFilters === 'function') {
        window.applyTreeFilters(window.treeFilterState);
      }
      relocateMapControls();
    });

    renderMarkersFromData(mapInstance, treesData, onMarkerClick);

    // 4. تهيئة الشيتات والواجهة
    initTreeBottomSheet(mapInstance, treesData);
    initUI(mapInstance, treesData);

    relocateMapControls();

    // إخفاء شاشة التحميل
    if (skeleton) {
      skeleton.classList.add('hidden');
      setTimeout(() => skeleton.remove(), 600);
    }
  } catch (error) {
    console.error("❌ خطأ حرج:", error);
    if (skeleton) {
      skeleton.classList.add('hidden');
      setTimeout(() => skeleton.remove(), 600);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}