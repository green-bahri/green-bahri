"use strict";
/* 
 * tree-sheet.js - شيت تفاصيل الشجرة (مبني على BottomSheet)
 * يستند إلى sudmap (https://sudamap.pages.dev)
 */

import { BottomSheet } from "./bottom-sheet.js";
import { openReportSheet } from "./report-sheet.js";
import { showToast } from "./toast.js";
import { trackTreeView, trackTreeInteraction } from "../analytics.js";
import { getTreeViewCount } from "../api.js";

let mapInstance = null;
let treesData = [];
let currentTree = null;
let wired = false;

const sheet = new BottomSheet({
  name: "tree",
  size: "tall",
  initialState: "half",
  onClose: () => { currentTree = null; }
});

export function hideTreeSheet() {
  sheet.close();
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function buildContent(tree) {
  const notes = tree.notes && String(tree.notes).trim() ? tree.notes : "لا توجد ملاحظات";
  const logoHtml = tree.cover_photo_url
    ? `<img src="${escapeHtml(tree.cover_photo_url)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block;">`
    : "🌳";
  const facultyHtml = tree.faculty ? `<div class="tree-faculty">${escapeHtml(tree.faculty)}</div>` : "";

  return `
    <div class="tree-header">
      <div class="tree-logo">${logoHtml}</div>
      <div>
        <h3 class="tree-name">${escapeHtml(tree.code)} - ${escapeHtml(tree.species_ar)}</h3>
        ${facultyHtml}
        <div class="tree-view-counter">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="vertical-align:middle;margin-left:3px;">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
          <span id="treeViewCountSpan">...</span> مشاهدة
        </div>
      </div>
    </div>
    <div class="tree-notes">${escapeHtml(notes)}</div>
    <div class="tree-actions">
      <button type="button" class="action-btn report" data-action="report">الإبلاغ عن مشكلة</button>
      <button type="button" class="action-btn share" id="treeShareBtn">
        <svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.05 4.11c-.05.23-.09.46-.09.7 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/></svg>
        مشاركة
      </button>
    </div>
  `;
}

function wireActions() {
  if (wired) return;
  wired = true;

  sheet.on("click", '[data-action="report"]', () => {
    if (currentTree) openReportSheet(currentTree);
  });
  sheet.on("click", "#treeShareBtn", () => {
    if (currentTree) copyTreeShareLink(currentTree);
  });
}

async function copyTreeShareLink(tree) {
  if (!tree || !tree.id) return;

  function toSlug(text) {
    const map = {
      'ا':'a','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h','خ':'kh','د':'d','ذ':'th','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m','ن':'n','ه':'h','و':'w','ي':'y','ى':'a','ة':'h','أ':'a','إ':'e','آ':'a','ء':'',' ':'-','_':'-','.':'-'
    };
    let result = String(text || '').toLowerCase().trim().replace(/[^ء-ي0-9\s]/g, '');
    result = result.split('').map(ch => map[ch] || ch).join('').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return result || 'tree';
  }

  const slug = toSlug(tree.species_ar);
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('tree', `${tree.id}-${slug}`);

  try {
    await navigator.clipboard.writeText(url.toString());
    trackTreeInteraction(tree.id, 'copy_link');
    showToast('📎 تم نسخ رابط الشجرة', 2000);
  } catch (e) {
    showToast('❌ فشل النسخ', 2000);
  }
}

export function openTreeDetails(tree) {
  if (!tree) return;
  if (!tree.is_active) {
    showToast('⚠️ هذه الشجرة غير متوفرة حالياً', 4000);
    return;
  }

  wireActions();
  sheet.setContent(buildContent(tree));
  currentTree = tree;
  sheet.open("half");

  getTreeViewCount(tree.id).then(count => {
    const el = sheet.body && sheet.body.querySelector('#treeViewCountSpan');
    if (el && currentTree && currentTree.id === tree.id) {
      el.textContent = count.toLocaleString('ar-SA');
    }
  });

  trackTreeView(tree.id);
}

export function initTreeBottomSheet(map, treesArray) {
  mapInstance = map;
  treesData = treesArray;
  wireActions();

  // التعامل مع الروابط المباشرة (Deep Linking): ?tree=123
  const urlParams = new URLSearchParams(window.location.search);
  const treeParam = urlParams.get('tree');
  if (treeParam) {
    const match = treeParam.match(/^(\d+)/);
    if (match && match[1]) {
      const treeId = parseInt(match[1], 10);
      const foundTree = treesData.find(t => t.id === treeId);
      if (foundTree && foundTree.lat && foundTree.lng) {
        mapInstance.flyTo([foundTree.lat, foundTree.lng], 18, { duration: 1.5 });
        setTimeout(() => {
          if (foundTree.is_active) openTreeDetails(foundTree);
          else showToast('⚠️ هذه الشجرة غير متوفرة حالياً', 4000);
        }, 1600);
      } else {
        showToast('⚠️ هذه الشجرة غير موجودة', 3000);
        const url = new URL(window.location.href);
        url.searchParams.delete('tree');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }
}

export function onMarkerClick(tree) {
  if (!tree.is_active) {
    showToast('⚠️ هذه الشجرة غير متوفرة حالياً', 3000);
    return;
  }
  openTreeDetails(tree);
}