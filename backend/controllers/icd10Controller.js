// Katalog ICD-10 WHO 2019 dengan nama Indonesia, sumber mirror
// github.com/fendis0709/icd-10 (lihat backend/data/icd10.json).
// Kata dan bentuk tanpa pemisah diindeks sekali saat load supaya pencarian
// per ketikan tidak melakukan split berulang atas ~10rb nama.
const rawCatalog = require("../data/icd10.json");
const asyncHandler = require("../middlewares/asyncHandler");

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
};

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

module.exports = { searchIcd10 };
