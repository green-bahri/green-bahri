"use strict";
/* 
 * zoom-buttons.js - أزرار التكبير والتصغير
 * يستند إلى sudmap (https://sudamap.pages.dev)
 */

export function createZoomButtons(mapInstance) {
  if (document.querySelector('.zoom-container')) return;
  
  const container = document.createElement('div');
  container.className = 'zoom-container';
  
  const zoomInBtn = document.createElement('button');
  zoomInBtn.className = 'zoom-btn';
  zoomInBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`;
  zoomInBtn.title = 'تكبير';
  zoomInBtn.addEventListener('click', (e) => { e.stopPropagation(); mapInstance.zoomIn(); });
  
  const divider = document.createElement('div');
  divider.className = 'zoom-divider';
  
  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.className = 'zoom-btn';
  zoomOutBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>`;
  zoomOutBtn.title = 'تصغير';
  zoomOutBtn.addEventListener('click', (e) => { e.stopPropagation(); mapInstance.zoomOut(); });
  
  container.appendChild(zoomInBtn);
  container.appendChild(divider);
  container.appendChild(zoomOutBtn);
  document.body.appendChild(container);
}