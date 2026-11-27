"use strict";
/* 
 * bottom-sheet.js - الكلاس الموحد لإدارة النوافذ السفلية
 * يستند إلى sudmap (https://sudamap.pages.dev)
 * 
 * المزايا:
 * - Overlay واحد مشترك (لا تراكب).
 * - إغلاق تلقائي للشيت السابق عند فتح الجديد.
 * - يدعم السحب باللمس، الإغلاق بـ Escape، زر ✕، أو النقر خارج الشيت.
 */

const openStack = [];
let overlayEl = null;
let globalsBound = false;

function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement("div");
  overlayEl.className = "bs-overlay";
  overlayEl.addEventListener("click", () => {
    const top = openStack[openStack.length - 1];
    if (top) top.close();
  });
  document.body.appendChild(overlayEl);
  return overlayEl;
}

function syncChrome() {
  const anyOpen = openStack.length > 0;
  ensureOverlay().classList.toggle("visible", anyOpen);
  document.body.classList.toggle("sheet-open", anyOpen);
}

function bindGlobals() {
  if (globalsBound) return;
  globalsBound = true;

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const top = openStack[openStack.length - 1];
    if (top) top.close();
  });

  window.addEventListener("resize", () => {
    openStack.forEach((s) => s._reflow());
  });
}

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export class BottomSheet {
  constructor(options = {}) {
    this.name = options.name || "sheet";
    this.size = options.size === "tall" ? "tall" : "fit";
    this.initialState = options.initialState || (this.size === "tall" ? "half" : "expanded");
    this.halfVh = options.halfVh ?? 50;
    this.modifier = options.modifier || "";
    this.closeButton = options.closeButton !== false;
    this.onOpen = options.onOpen || null;
    this.onClose = options.onClose || null;

    this.el = null;
    this.body = null;
    this.handle = null;
    this.state = "closed";

    this._open = false;
    this._translate = 100;
    this._drag = null;
    this._delegated = new Map();
  }

  _ensure() {
    if (this.el) return;
    ensureOverlay();
    bindGlobals();

    const el = document.createElement("div");
    el.className = `bs bs--${this.size} bs--${this.name} ${this.modifier}`.trim();
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `
      <div class="bs__handle"><div class="bs__bar"></div></div>
      ${this.closeButton ? '<button type="button" class="bs__close" aria-label="إغلاق">✕</button>' : ""}
      <div class="bs__body"></div>
    `;
    document.body.appendChild(el);

    this.el = el;
    this.handle = el.querySelector(".bs__handle");
    this.body = el.querySelector(".bs__body");

    this.handle.addEventListener("pointerdown", (e) => this._onPointerDown(e));
    this.handle.addEventListener("pointermove", (e) => this._onPointerMove(e));
    this.handle.addEventListener("pointerup", () => this._onPointerUp());
    this.handle.addEventListener("pointercancel", () => this._onPointerUp());

    const closeBtn = el.querySelector(".bs__close");
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());
  }

  _translateFor(state) {
    if (state === "closed") return 100;
    if (state === "expanded" || this.size === "fit") return 0;

    const h = this.el.offsetHeight || 1;
    const visiblePx = Math.min((window.innerHeight * this.halfVh) / 100, h);
    return ((h - visiblePx) / h) * 100;
  }

  _setTranslate(t) {
    this._translate = t;
    this.el.style.transform = `translateY(${t}%)`;
  }

  _snap(state) {
    const t = this._translateFor(state);
    const hiddenPx = Math.round(((this.el.offsetHeight || 0) * t) / 100);
    this.el.style.setProperty("--bs-hidden", `${hiddenPx}px`);
    this.state = state;
    this._setTranslate(t);
  }

  _reflow() {
    if (this._open && !this._drag) this._snap(this.state);
  }

  _onPointerDown(e) {
    if (!this._open) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    this._drag = { startY: e.clientY, startT: this._translate };
    this.el.classList.add("bs--dragging");
    try { this.handle.setPointerCapture(e.pointerId); } catch (_) {}
  }

  _onPointerMove(e) {
    if (!this._drag) return;
    const h = this.el.offsetHeight || window.innerHeight;
    const t = this._drag.startT + ((e.clientY - this._drag.startY) / h) * 100;
    this._setTranslate(clamp(t, 0, 100));
  }

  _onPointerUp() {
    if (!this._drag) return;
    this._drag = null;
    this.el.classList.remove("bs--dragging");

    const t = this._translate;
    if (this.size === "fit") {
      if (t > 30) this.close();
      else this._snap("expanded");
      return;
    }

    const half = this._translateFor("half");
    if (t > (half + 100) / 2) this.close();
    else if (t > half / 2) this._snap("half");
    else this._snap("expanded");
  }

  open(state = this.initialState) {
    this._ensure();
    [...openStack].forEach((s) => { if (s !== this) s._hide(); });

    const wasOpen = this._open;
    if (!wasOpen) {
      this._open = true;
      openStack.push(this);
      this.el.classList.add("bs--visible");
      this.el.setAttribute("aria-hidden", "false");
      void this.el.offsetHeight;
    }

    this._snap(this.size === "fit" ? "expanded" : state);
    syncChrome();
    if (!wasOpen && this.onOpen) this.onOpen();
  }

  _hide() {
    if (!this._open) return false;
    this._open = false;
    const i = openStack.indexOf(this);
    if (i > -1) openStack.splice(i, 1);

    this._drag = null;
    this.el.classList.remove("bs--dragging", "bs--visible");
    this.el.setAttribute("aria-hidden", "true");
    this.state = "closed";
    this._setTranslate(100);
    this.el.style.setProperty("--bs-hidden", "0px");

    if (this.onClose) this.onClose();
    return true;
  }

  close() {
    if (this._hide()) syncChrome();
  }

  toggle(state) {
    if (this._open) this.close();
    else this.open(state);
  }

  setContent(html) {
    this._ensure();
    this.body.innerHTML = html;
    this.body.scrollTop = 0;
  }

  on(type, selector, cb) {
    this._ensure();
    if (!this._delegated.has(type)) {
      const handlers = [];
      this._delegated.set(type, handlers);
      this.el.addEventListener(type, (e) => {
        const origin = e.target && e.target.closest ? e.target : null;
        if (!origin) return;
        handlers.forEach((h) => {
          const match = origin.closest(h.selector);
          if (match && this.el.contains(match)) h.cb.call(match, e, match);
        });
      });
    }
    this._delegated.get(type).push({ selector, cb });
  }

  get isOpen() { return this._open; }
}