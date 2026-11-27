"use strict";
/* 
 * offline.js - التخزين المؤقت (IndexedDB) ومؤشر الاتصال بالإنترنت
 * يستند إلى sudmap (https://sudamap.pages.dev)
 */

let offlineIndicator = null;

const DB_NAME = 'bahri_trees_cache';
const DB_VERSION = 1;
const TREES_STORE = 'trees';
const CACHE_KEY = 'trees_list';

export async function initOffline() {
  createOfflineIndicator();
  setupNetworkListeners();
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(TREES_STORE)) db.createObjectStore(TREES_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveTreesToCache(trees) {
  try {
    const db = await openDB();
    const tx = db.transaction(TREES_STORE, 'readwrite');
    tx.objectStore(TREES_STORE).put(trees, CACHE_KEY);
    await new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = rej;
    });
  } catch (err) {
    console.error('[Cache] ❌ فشل حفظ البيانات:', err);
  }
}

export async function loadTreesFromCache() {
  try {
    const db = await openDB();
    const tx = db.transaction(TREES_STORE, 'readonly');
    const req = tx.objectStore(TREES_STORE).get(CACHE_KEY);
    const data = await new Promise((res, rej) => {
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    return data || null;
  } catch (err) {
    return null;
  }
}

function createOfflineIndicator() {
  offlineIndicator = document.createElement('div');
  offlineIndicator.id = 'offline-indicator';
  offlineIndicator.textContent = 'غير متصل';
  document.body.appendChild(offlineIndicator);
  updateOnlineStatus(navigator.onLine);
}

function setupNetworkListeners() {
  window.addEventListener('online', () => updateOnlineStatus(true));
  window.addEventListener('offline', () => updateOnlineStatus(false));
}

function updateOnlineStatus(isOnline) {
  if (!offlineIndicator) return;
  offlineIndicator.classList.toggle('visible', !isOnline);
}