// patient-management-app/frontend/src/utils/regionMatch.js
// Pencocokan nama provinsi antara data pasien (label bebas dari dropdown/input)
// dan properti `name` pada GeoJSON (uppercase, 34 provinsi, pra-2022).
// Provinsi pecahan 2022 (38) digabung ke geometri induknya.

const PROVINCE_ALIASES = {
  ACEH: "ACEH",
  DIACEH: "ACEH",
  NAD: "ACEH",
  DAERAHISTIMEWAYOGYAKARTA: "DAERAHISTIMEWAYOGYAKARTA",
  DIYOGYAKARTA: "DAERAHISTIMEWAYOGYAKARTA",
  YOGYAKARTA: "DAERAHISTIMEWAYOGYAKARTA",
  PAPUA: "PAPUA",
  IRIANJAYA: "PAPUA",
  PAPUASELATAN: "PAPUA",
  PAPUATENGAH: "PAPUA",
  PAPUAPEGUNUNGAN: "PAPUA",
  PAPUABARAT: "PAPUABARAT",
  IRIANJAYABARAT: "PAPUABARAT",
  PAPUABARATDAYA: "PAPUABARAT",
  BANGKABELITUNG: "KEPULAUANBANGKABELITUNG",
  KEPULAUANBANGKABELITUNG: "KEPULAUANBANGKABELITUNG",
  BABEL: "KEPULAUANBANGKABELITUNG",
};

/**
 * Normalisasi label provinsi menjadi kunci kanonik (uppercase, tanpa non-huruf,
 * sudah melalui tabel alias).
 */
export const normalizeProvince = (label) => {
  const key = String(label ?? "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  if (!key) return "";
  return PROVINCE_ALIASES[key] || key;
};

/**
 * [{ _id, count }] → Map(normalizedKey → total count)
 * Provinsi yang beralias ke geometri yang sama dijumlahkan.
 */
export const aggregateByProvince = (provinceData) => {
  const map = new Map();
  (provinceData || []).forEach((item) => {
    const key = normalizeProvince(item._id);
    if (!key) return;
    map.set(key, (map.get(key) || 0) + (Number(item.count) || 0));
  });
  return map;
};

/**
 * Map(normalizedKey → label asli terbaik dari data) untuk keperluan tampilan.
 */
export const provinceLabelIndex = (provinceData) => {
  const map = new Map();
  (provinceData || []).forEach((item) => {
    const key = normalizeProvince(item._id);
    const label = String(item._id || "").trim();
    if (!key || !label) return;
    const prev = map.get(key);
    if (!prev || label.length > prev.length) map.set(key, label);
  });
  return map;
};

/**
 * Filter & agregasi baris regencyByProvince untuk satu provinsi terpilih.
 * data: [{ _id: { provinsi, kabupaten }, count }]
 */
export const regenciesForProvince = (regencyByProvince, selectedKey) => {
  const map = new Map();
  (regencyByProvince || []).forEach((item) => {
    if (normalizeProvince(item._id?.provinsi) !== selectedKey) return;
    const kab = String(item._id?.kabupaten || "").trim();
    if (!kab) return;
    map.set(kab, (map.get(kab) || 0) + (Number(item.count) || 0));
  });
  return [...map.entries()]
    .map(([kabupaten, count]) => ({ kabupaten, count }))
    .sort((a, b) => b.count - a.count);
};

export const MERGED_PROVINCES_NOTE =
  "Provinsi pecahan 2022 (Papua Selatan, Papua Tengah, Papua Pegunungan, Papua Barat Daya) digabung ke geometri induknya pada peta.";