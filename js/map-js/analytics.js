"use strict";
/* 
 * analytics.js - تتبع أحداث الأشجار وحفظها في جدول tree_analytics
 * يستند إلى sudmap (https://sudamap.pages.dev)
 */

import { supabase } from "./api.js";

export async function trackTreeEvent(treeId, eventType) {
  if (!treeId || !eventType) return;
  try {
    const { error } = await supabase
      .from("tree_analytics")
      .insert([{ tree_id: treeId, event_type: eventType }]);
    if (error) throw error;
  } catch (error) {
    console.debug(`[Analytics] تعذّر تسجيل الحدث (${eventType}):`, error);
  }
}

export function trackTreeView(treeId) {
  return trackTreeEvent(treeId, "view");
}

export function trackTreeInteraction(treeId, eventType) {
  return trackTreeEvent(treeId, eventType);
}