// Katalog ICD-10 WHO 2019 dengan nama Indonesia, sumber mirror
// github.com/fendis0709/icd-10 (lihat backend/data/icd10.json).
// Kata dan bentuk tanpa pemisah diindeks sekali saat load supaya pencarian
// per ketikan tidak melakukan split berulang atas ~10rb nama.
const rawCatalog = require("../data/icd10.json");
const asyncHandler = require("../middlewares/asyncHandler");
const Konsultasi = require("../models/Konsultasi");

// Singkatan/istilah yang sering ditulis dokter tetapi tidak ada di nama resmi
const ALIAS = {
  gerd: "K21.9",
  "asam lambung": "K21.9",
  htn: "I10",
  hipertensi: "I10",
  maag: "K30",
  "dm tipe 2": "E11.9",
  "diabetes tipe 2": "E11.9",
  diabetes: "E11.9",
  "diabetes tipe 1": "E10.9",
  tipes: "A01.0",
  tifus: "A01.0",
  kolesterol: "E78.5",
  "asam urat": "M10.9",
  cad: "I25.1",
  sembelit: "K59.0",
  ppok: "J44.9",
  fatty: "K76.0",
};

// 8 besar diagnosis klinik hasil analisis teks soap.A histori; dipakai untuk
// mem-pad badge "kode sering digunakan" selama data kode masih kosong.
const DEFAULT_POPULER = [
  "K30",
  "K76.0",
  "I10",
  "K21.9",
  "I25.1",
  "B18.1",
  "K59.0",
  "K29.7",
];

const MAX_LIMIT = 20;
const MIN_QUERY_LENGTH = 2;
const MIN_SUBSTRING_LENGTH = 5;

const normalizeKode = (v) =>
  String(v || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const normalizeText = (v) => String(v || "").toLowerCase().trim();

const toWords = (v) =>
  normalizeText(v)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const toConcat = (v) => normalizeText(v).replace(/[^a-z0-9]/g, "");

const catalog = rawCatalog.map((entry) => ({
  kode: entry.kode,
  nama: entry.nama,
  namaEn: entry.namaEn,
  kodeNorm: normalizeKode(entry.kode),
  namaWords: toWords(entry.nama),
  namaEnWords: toWords(entry.namaEn),
  namaConcat: toConcat(entry.nama),
  namaEnConcat: toConcat(entry.namaEn),
}));

// Prioritas: alias > kode persis > awalan kode > awal kata nama > substring nama
const hitungSkor = (entry, qKode, qText, aliasKode) => {
  if (aliasKode && entry.kode === aliasKode) return 100;
  if (entry.kodeNorm === qKode) return 100;
  if (entry.kodeNorm.startsWith(qKode)) return 80;

  if (
    entry.namaWords.some((kata) => kata.startsWith(qText)) ||
    entry.namaEnWords.some((kata) => kata.startsWith(qText))
  ) {
    return 60;
  }

  if (qText.length >= MIN_SUBSTRING_LENGTH) {
    const qConcat = toConcat(qText);
    if (
      qConcat.length >= MIN_SUBSTRING_LENGTH &&
      (entry.namaConcat.includes(qConcat) ||
        entry.namaEnConcat.includes(qConcat))
    ) {
      return 40;
    }
  }

  return 0;
};

const searchIcd10 = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim();
  const limit = Math.min(
    Math.max(parseInt(req.query.limit, 10) || 10, 1),
    MAX_LIMIT
  );

  if (q.length < MIN_QUERY_LENGTH) {
    return res.json({ hasil: [] });
  }

  const qKode = normalizeKode(q);
  const qText = normalizeText(q);
  const aliasKode = ALIAS[qText];

  const hasil = catalog
    .map((entry) => ({
      entry,
      skor: hitungSkor(entry, qKode, qText, aliasKode),
    }))
    .filter((baris) => baris.skor > 0)
    .sort((a, b) => b.skor - a.skor || a.entry.kode.localeCompare(b.entry.kode))
    .slice(0, limit)
    .map(({ entry }) => ({
      kode: entry.kode,
      nama: entry.nama,
      namaEn: entry.namaEn,
    }));

  res.json({ hasil });
});

// Kode sering digunakan: frekuensi pola "KODE - " di soap.A semua konsultasi,
// diurutkan lalu dipad dari DEFAULT_POPULER hingga 8 badge. Cache 10 menit.
const POPULER_LIMIT = 8;
const POPULER_TTL_MS = 10 * 60 * 1000;
const KODE_LINE_RE = /(?:^|\n)\s*([A-Z][0-9]{2}(?:\.[0-9A-Z]{1,4})?)\s*-/g;
let populerCache = { data: null, at: 0 };

const getIcd10Populer = asyncHandler(async (req, res) => {
  if (populerCache.data && Date.now() - populerCache.at < POPULER_TTL_MS) {
    return res.json({ hasil: populerCache.data });
  }

  const rows = await Konsultasi.find({}, { "soap.A": 1 }).lean();
  const counts = new Map();
  for (const row of rows) {
    const teks = (row.soap && row.soap.A) || "";
    for (const m of teks.matchAll(KODE_LINE_RE)) {
      counts.set(m[1], (counts.get(m[1]) || 0) + 1);
    }
  }

  const kodeFinal = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([kode]) => kode)
    .slice(0, POPULER_LIMIT);
  for (const kode of DEFAULT_POPULER) {
    if (kodeFinal.length >= POPULER_LIMIT) break;
    if (!kodeFinal.includes(kode)) kodeFinal.push(kode);
  }

  const hasil = kodeFinal
    .map((kode) => catalog.find((entry) => entry.kode === kode))
    .filter(Boolean)
    .map((entry) => ({
      kode: entry.kode,
      nama: entry.nama,
      namaEn: entry.namaEn,
    }));

  populerCache = { data: hasil, at: Date.now() };
  res.json({ hasil });
});

module.exports = { searchIcd10, getIcd10Populer };
