"use strict";
/* 
 * api.js - جلب البيانات من Supabase + إدارة التخزين المؤقت
 * يستند إلى sudmap (https://sudamap.pages.dev)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { saveTreesToCache, loadTreesFromCache } from "./offline.js";

const SUPABASE_URL = "https://wyvoqclkymuszcxsbdmt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GafF1GnPIVtM60oqXidcDA_Cz49GEiv";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PHOTOS_BUCKET = "tree-photos";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

async function fetchFromSupabase() {
  const { data, error } = await supabase.from("trees").select("*");
  if (error) throw error;
  return data || [];
}

/**
 * جلب الأشجار (Cache-first + Background refresh)
 */
export async function loadMapData(onFreshData) {
  const cached = await loadTreesFromCache();

  if (cached && cached.length) {
    // تم حذف الـ console.log الخاص بعدد الأشجار هنا

    if (navigator.onLine) {
      fetchFromSupabase()
        .then((fresh) => {
          if (fresh && fresh.length) {
            saveTreesToCache(fresh);
            if (typeof onFreshData === "function") onFreshData(fresh);
          }
        })
        .catch((err) => console.warn("[Cache] فشل التحديث:", err));
    }
    return cached;
  }

  if (!navigator.onLine) return [];

  try {
    const fresh = await fetchFromSupabase();
    await saveTreesToCache(fresh);
    return fresh;
  } catch (err) {
    console.error("[Cache] ❌ فشل الجلب:", err);
    return [];
  }
}

export async function uploadPhoto(file, treeId, folder = "updates") {
  if (!file) throw new Error("لم يتم اختيار صورة");
  if (!treeId) throw new Error("معرف الشجرة مطلوب");

  const ext = MIME_TO_EXT[file.type];
  if (!ext) throw new Error("نوع الصورة غير مدعوم");
  if (file.size > MAX_PHOTO_SIZE) throw new Error("حجم الصورة يتجاوز 5MB");

  const safeFolder = String(folder).replace(/[^a-zA-Z0-9_-]/g, "") || "updates";
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${safeFolder}/${treeId}/${Date.now()}-${rand}.${ext}`;

  const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false
  });

  if (error) throw error;
  const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function insertTreeReport(data) {
  const { data: row, error } = await supabase.from("tree_reports").insert([data]).select().single();
  if (error) throw error;
  return row;
}

export async function insertTreeAdoption(data) {
  const { data: row, error } = await supabase.from("tree_adoptions").insert([data]).select().single();
  if (error) throw error;
  return row;
}

export async function insertTreeUpdate(data) {
  const { data: row, error } = await supabase.from("tree_updates").insert([data]).select().single();
  if (error) throw error;
  return row;
}

export async function getTreeViewCount(treeId) {
  if (!treeId) return 0;
  try {
    const { data, error } = await supabase.rpc("get_tree_views", { tree_id_param: treeId });
    if (error) throw error;
    return Number(data) || 0;
  } catch (error) {
    return 0;
  }
}

// جلب أسماء الأماكن/المناطق
export async function fetchAreasFromSupabase() {
  try {
    const { data, error } = await supabase.from("areas").select("*");
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("فشل جلب المناطق:", err);
    return [];
  }
}