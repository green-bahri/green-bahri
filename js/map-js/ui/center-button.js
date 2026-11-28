"use strict";
/* 
 * center-button.js - زر العودة لمركز الخريطة الافتراضي
 * يستند إلى sudmap (https://sudamap.pages.dev)
 */

import { CONFIG } from "../config.js";

export function createCenterButton(mapInstance) {
  const centerBtn = document.createElement('button');
  centerBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`;
  centerBtn.title = 'العودة لمركز الخريطة';
  centerBtn.className = 'center-btn';
  document.body.appendChild(centerBtn);

  centerBtn.addEventListener('click', () => {
    const labels = document.querySelectorAll('.tree-marker, .tree-dot');
    labels.forEach(l => l.style.opacity = '0');
    mapInstance.flyTo(CONFIG.center, CONFIG.zoom, { duration: 0.5 });
    setTimeout(() => { labels.forEach(l => l.style.opacity = '1'); }, 600);
  });
}