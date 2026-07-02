// patient-management-app/backend/constants/index.js

// Daftar petugas yang valid untuk pendaftaran dan konsultasi
const VALID_PETUGAS = [
  "Arif",
  "Rani",
  "Nunung",
  "Heni",
  "Maria",
  "Emy",
  "Fadil",
  "Rayhan",
];

// Konfigurasi angka awal untuk generate nomor kartu berdasarkan huruf awal
const START_ANGKA_MAP = {
  S: 14335,
  A: 13906,
  E: 6033,
  C_G_GROUP: 699, // Angka awal untuk grup C dan G
  D: 8908,
  Z: 2128,
  W: 1909,
  T: 2438,
  U: 1583,
  K: 2180,
  B: 2285,
  I: 2899,
  L: 2263,
  O: 607,
  P: 2095,
  R: 9043,
  J: 8944,
  F: 2248,
  M: 9120,
  H: 10502,
  N: 8000,
  DEFAULT: 0,
};

// Mapping huruf ke grup untuk penomoran kartu
const LETTER_GROUPS_MAP = {
  C: "C_G_GROUP",
  G: "C_G_GROUP",
  S: "S",
  A: "A",
  E: "E",
  D: "D",
  Z: "Z",
  W: "W",
  T: "T",
  U: "U",
  K: "K",
  B: "B",
  I: "I",
  L: "L",
  O: "O",
  P: "P",
  R: "R",
  J: "J",
  F: "F",
  M: "M",
  H: "H",
  N: "N",
};

// Konfigurasi zona waktu
const TIME_ZONE_JAKARTA = "Asia/Jakarta";

// Konfigurasi email
const EMAIL_CONFIG = {
  senderName: "Klinik AZ",
};

// Konfigurasi pagination default
const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Konfigurasi validasi
const VALIDATION_CONFIG = {
  NO_HP_MIN_LENGTH: 10,
  NO_HP_MAX_LENGTH: 15,
  TENSISISTOLIK_MIN: 60,
  TENSISISTOLIK_MAX: 200,
  TENSIDIASTOLIK_MIN: 40,
  TENSIDIASTOLIK_MAX: 120,
  TINGGI_BADAN_MIN: 50,
  TINGGI_BADAN_MAX: 250,
  BERAT_BADAN_MIN: 10,
  BERAT_BADAN_MAX: 300,
  MAX_CARD_GENERATION_ATTEMPTS: 5,
};

module.exports = {
  VALID_PETUGAS,
  START_ANGKA_MAP,
  LETTER_GROUPS_MAP,
  TIME_ZONE_JAKARTA,
  EMAIL_CONFIG,
  PAGINATION_CONFIG,
  VALIDATION_CONFIG,
};
