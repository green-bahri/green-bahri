"use strict";
/* 
 * report-sheet.js - نموذج الإبلاغ عن مشكلة في شجرة 
 * يستند إلى sudmap (https://sudamap.pages.dev)
 */

import { BottomSheet } from "./bottom-sheet.js";
import { insertTreeReport } from "../api.js";
import { trackTreeInteraction } from "../analytics.js";
import { showToast } from "./toast.js";

const SUBMIT_LABEL = "إرسال البلاغ";

const ISSUE_TYPES = [
  { value: "needs_water", label: "تحتاج ماء" },
  { value: "broken",      label: "تالفة/مكسورة" },
  { value: "pest",        label: "آفات/حشرات" },
  { value: "other",       label: "أخرى" }
];

let currentTree = null;
let isSubmitting = false;
let built = false;

const sheet = new BottomSheet({
  name: "report",
  size: "fit",
  onClose: () => {
    currentTree = null;
    resetForm();
  }
});

const TEMPLATE = `
  <h3 class="bs__title">الإبلاغ عن مشكلة</h3>
  <p class="bs__subtitle" id="reportSubtitle"></p>
  <form class="sheet-form" id="reportForm" novalidate>
    <div>
      <label for="reportIssue">نوع المشكلة</label>
      <select id="reportIssue" name="issue_type">
        ${ISSUE_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join("")}
      </select>
    </div>
    <div>
      <label for="reportName">اسمك (اختياري)</label>
      <input type="text" id="reportName" name="reporter_name" maxlength="60" autocomplete="name">
    </div>
    <div>
      <label for="reportPhone">رقم الهاتف (اختياري)</label>
      <input type="tel" id="reportPhone" name="reporter_phone" maxlength="20" autocomplete="tel" dir="ltr" style="text-align:right;">
    </div>
    <div>
      <label for="reportNote">وصف المشكلة</label>
      <textarea id="reportNote" name="note" maxlength="500"></textarea>
    </div>
    <button type="submit" class="form-submit">${SUBMIT_LABEL}</button>
  </form>
`;

function build() {
  if (built) return;
  built = true;
  sheet.setContent(TEMPLATE);
  sheet.on("submit", "#reportForm", (e) => {
    e.preventDefault();
    handleSubmit();
  });
}

const getForm = () => sheet.body && sheet.body.querySelector("#reportForm");
const getSubmitBtn = () => sheet.body && sheet.body.querySelector(".form-submit");

function resetForm() {
  const form = getForm();
  if (form) form.reset();
  isSubmitting = false;
  const btn = getSubmitBtn();
  if (btn) {
    btn.disabled = false;
    btn.textContent = SUBMIT_LABEL;
  }
}

async function handleSubmit() {
  const form = getForm();
  const btn = getSubmitBtn();
  if (isSubmitting || !currentTree || !form) return;

  const issue_type = form.elements["issue_type"].value;
  const reporter_name = form.elements["reporter_name"].value.trim() || null;
  const reporter_phone = form.elements["reporter_phone"].value.trim() || null;
  const note = form.elements["note"].value.trim() || null;

  if (issue_type === "other" && !note) {
    showToast("⚠️ فضلاً صف المشكلة", 2500);
    form.elements["note"].focus();
    return;
  }

  const treeId = currentTree.id;
  isSubmitting = true;
  btn.disabled = true;
  btn.textContent = "جاري الإرسال...";

  try {
    await insertTreeReport({ tree_id: treeId, issue_type, reporter_name, reporter_phone, note });
    trackTreeInteraction(treeId, "report");
    showToast("✅ تم إرسال البلاغ بنجاح");
    sheet.close();
  } catch (err) {
    console.error("❌ فشل إرسال البلاغ:", err);
    showToast("❌ فشل إرسال البلاغ، حاول مرة أخرى", 3000);
    isSubmitting = false;
    btn.disabled = false;
    btn.textContent = SUBMIT_LABEL;
  }
}

export function initReportSheet(_mapInstance) {
  build();
}

export function openReportSheet(tree) {
  if (!tree || !tree.id) return;
  build();

  currentTree = tree;
  resetForm();
  sheet.body.querySelector("#reportSubtitle").textContent = `الشجرة ${tree.code ?? ""}`.trim();
  sheet.open();
}

export function closeReportSheet() {
  sheet.close();
}