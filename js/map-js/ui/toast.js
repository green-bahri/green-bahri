"use strict";
/* 
 * toast.js - إشعارات منبثقة قصيرة
 * يستند إلى sudmap (https://sudamap.pages.dev)
 */

export function showToast(message, duration = 3500) {
  document.querySelectorAll('.sudamap-toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'sudamap-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
    background: rgba(30, 30, 30, 0.88); color: #fff; padding: 10px 20px;
    border-radius: 20px; font-size: 13px; font-family: inherit;
    z-index: 9999; pointer-events: none; white-space: nowrap; direction: rtl;
    opacity: 0; transition: opacity 0.2s ease;
    backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}