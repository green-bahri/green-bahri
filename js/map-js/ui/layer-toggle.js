"use strict";
/* 
 * layer-toggle.js - قائمة الفلترة حسب الحالة والنوع
 * يستند إلى sudmap (https://sudamap.pages.dev)
 */

import { STATUS_LABELS, SPECIES } from "../config.js";

const GROUP_TITLE_STYLE = "font-weight:bold; margin-top:8px; font-size:12px; color:#666;";

export function createLayerToggle(mapInstance) {
  const filterState = {
    status: Object.keys(STATUS_LABELS),
    species: SPECIES.map(s => s.key)
  };
  window.treeFilterState = filterState;

  const btn = document.createElement('button');
  btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/></svg>`;
  btn.className = 'layer-btn';
  document.body.appendChild(btn);

  const menu = document.createElement('div');
  menu.className = 'menu-btn';
  document.body.appendChild(menu);

  function buildGroup(title, groupKey, items) {
    const titleEl = document.createElement('div');
    titleEl.style.cssText = GROUP_TITLE_STYLE;
    titleEl.textContent = title;
    menu.appendChild(titleEl);

    items.forEach(({ key, label }) => {
      const row = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = true;
      cb.dataset.group = groupKey;
      cb.value = key;
      cb.addEventListener('change', onFilterChange);
      row.appendChild(cb);
      row.appendChild(document.createTextNode('\u00A0' + label));
      menu.appendChild(row);
    });
  }

  buildGroup('الحالة', 'status', Object.entries(STATUS_LABELS).map(([key, label]) => ({ key, label })));
  buildGroup('النوع', 'species', SPECIES.map(s => ({ key: s.key, label: s.ar })));

  function readCheckedValues(groupKey) {
    return Array.from(menu.querySelectorAll(`input[data-group="${groupKey}"]:checked`)).map(cb => cb.value);
  }

  function isFilterActive() {
    return menu.querySelectorAll('input[type="checkbox"]:not(:checked)').length > 0;
  }

  function onFilterChange() {
    filterState.status = readCheckedValues('status');
    filterState.species = readCheckedValues('species');

    btn.classList.toggle('active', isFilterActive());

    if (typeof window.applyTreeFilters === 'function') {
      window.applyTreeFilters({ status: [...filterState.status], species: [...filterState.species] });
    }
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  });

  mapInstance.on('click', () => { menu.style.display = 'none'; });

  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) menu.style.display = 'none';
  });
}