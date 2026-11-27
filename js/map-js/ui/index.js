"use strict";
/* 
 * index.js - تهيئة وتجميع عناصر واجهة المستخدم العائمة
 * يستند إلى sudmap (https://sudamap.pages.dev)
 */

import { createCenterButton } from "./center-button.js";
import { createLayerToggle } from "./layer-toggle.js";
import { createGPSButton } from "./gps-button.js";
import { createSearchBar, setAddTemporaryMarker } from "./search-bar.js";
import { initShareFeature, addTemporaryMarker } from "./share-location.js";
import { createZoomButtons } from "./zoom-buttons.js";

export function initUI(mapInstance, storesData) {
  console.log("جاري تهيئة واجهة المستخدم ...");
  
  createCenterButton(mapInstance);
  createLayerToggle(mapInstance);
  createGPSButton(mapInstance);
  
  // ربط دالة إضافة الماركر المؤقت بـ Search bar
  setAddTemporaryMarker(addTemporaryMarker);
  createSearchBar(mapInstance, storesData || []);
  
  initShareFeature(mapInstance);
  createZoomButtons(mapInstance);
}