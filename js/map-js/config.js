"use strict";
/* 
 * config.js - الثوابت والإعدادات الأساسية للخريطة
 * يستند إلى sudmap (https://sudamap.pages.dev)
 */

export const CONFIG = {
  center: [15.7515, 32.5950],  // منتصف جامعة بحري
  zoom: 17,                    // مستوى التكبير الافتراضي (تظهر الأشجار كأيقونات)
  minZoom: 15,
  maxZoom: 19,
  bounds: [[15.7350, 32.5750], [15.7680, 32.6150]] // حدود الخريطة لمنع الخروج عن الجامعة
};

// ألوان حالات الأشجار
export const STATUS_COLORS = {
  healthy: '#2ecc71',
  needs_water: '#f39c12',
  sick: '#e74c3c',
  dead: '#95a5a6'
};

// أنواع الأشجار المتاحة
export const SPECIES = [
  { key: 'neem', ar: 'نيم' },
  { key: 'acacia', ar: 'أكاسيا' },
  { key: 'sabbagh', ar: 'صبّاغ' },
  { key: 'other', ar: 'أخرى' }
];

// التسميات العربية لحالات الأشجار
export const STATUS_LABELS = {
  healthy: 'صحية',
  needs_water: 'تحتاج رعاية',
  sick: 'مريضة',
  dead: 'ميتة'
};