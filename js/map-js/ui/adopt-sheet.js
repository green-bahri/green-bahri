"use strict";
/* adopt-sheet.js - نموذج تبني شجرة (مبني على BottomSheet) */

import { BottomSheet } from "./bottom-sheet.js";
import { insertTreeAdoption } from "../api.js";
import { trackTreeInteraction } from "../analytics.js";
import { showToast } from "./toast.js";

const SUBMIT_LABEL = "تأكيد التبني";

const ADOPTER_TYPES = [
  { value: "student",    label: "طالب" },
  { value: "faculty",    label: "كلية/قسم" },
  { value: "individual", label: "فرد/زائر" }
];

let currentTree = null;
let isSubmitting = false;
let built = false;

const sheet = new BottomSheet({
  name: "adopt",
  size: "fit",
  onClose: () => {
    currentTree = null;
    resetForm();
  }
});

const TEMPLATE = `
  <h3 class="bs__title">تبني شجرة</h3>
  <p class="bs__subtitle" id="adoptSubtitle"></p>
  <form class="sheet-form" id="adoptForm" novalidate>
    <div>
      <label for="adoptType">صفة المتبني</label>
      <select id="adoptType" name="adopter_type">
        ${ADOPTER_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join("")}
      </select>
    </div>
    <div>
      <label for="adoptName">الاسم الكامل أو اسم الكلية</label>
      <input type="text" id="adoptName" name="adopter_name" maxlength="100" autocomplete="name" required>
    </div>
    <div>
      <label for="adoptFaculty">الكلية/القسم (اختياري)</label>
      <input type="text" id="adoptFaculty" name="faculty" maxlength="100">
    </div>
    <button type="submit" class="form-submit">${SUBMIT_LABEL}</button>
  </form>
`;

function build() {
  if (built) return;
  built = true;
  sheet.setContent(TEMPLATE);
  sheet.on("submit", "#adoptForm", (e) => {
    e.preventDefault();
    handleSubmit();
  });
}

const getForm = () => sheet.body && sheet.body.querySelector("#adoptForm");
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

  const adopter_type = form.elements["adopter_type"].value;
  const adopter_name = form.elements["adopter_name"].value.trim();
  const faculty = form.elements["faculty"].value.trim() || null;

  if (!adopter_name) {
    showToast("⚠️ فضلاً أدخل الاسم", 2500);
    form.elements["adopter_name"].focus();
    return;
  }

  const treeId = currentTree.id;
  isSubmitting = true;
  btn.disabled = true;
  btn.textContent = "جاري التبني...";

  try {
    await insertTreeAdoption({ tree_id: treeId, adopter_name, adopter_type, faculty });
    trackTreeInteraction(treeId, "adopt"); // fire-and-forget
    showToast("🌱 تم تبني الشجرة بنجاح!");
    sheet.close();
  } catch (err) {
    console.error("❌ فشل تبني الشجرة:", err);
    // 23505 = انتهاك قيد UNIQUE (الشجرة متبناة مسبقاً)
    const isDuplicate = err?.code === "23505" || /duplicate|unique/i.test(err?.message || "");
    showToast(
      isDuplicate
        ? "⚠️ عذراً، هذه الشجرة متبنّاة بالفعل"
        : "❌ تعذّر إكمال التبني، حاول مرة أخرى",
      3000
    );
    isSubmitting = false;
    btn.disabled = false;
    btn.textContent = SUBMIT_LABEL;
  }
}

// يُبقى للتوافق مع الاستدعاءات الحالية؛ الإغلاق عند النقر على الخريطة يتولاه الـ overlay
export function initAdoptSheet(_mapInstance) {
  build();
}

export function openAdoptSheet(tree) {
  if (!tree || !tree.id) return;
  build();

  currentTree = tree;
  resetForm();
  sheet.body.querySelector("#adoptSubtitle").textContent = `الشجرة ${tree.code ?? ""}`.trim();
  sheet.open();
}

export function closeAdoptSheet() {
  sheet.close();
}
