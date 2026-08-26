# Panduan Implementasi — Refactor Keamanan, Efisiensi & Fitur Auto-Save

Dokumen ini merangkum seluruh perubahan pada iterasi pengembangan terbaru, diorganisir per fase beserta alasan dan cara mengujinya.

---

## Addendum — Dropdown Petugas Kembali & Nama Auto-Kapital

Revisi atas Fase 1 berdasarkan masukan pengguna:

### 1. Dropdown petugas dikembalikan seperti semula
- **Form Pendaftaran Pasien**: dropdown "Petugas Pendaftaran" wajib dipilih (Heni/Maria/Emy/Aziz).
- **Form SOAP Konsultasi**: dropdown "Petugas Konsultasi" wajib saat konsultasi baru; saat membuka riwayat lama terisi otomatis dari data.
- **Modal Edit Pasien**: kembali ada dropdown "Petugas yang Mengedit" (wajib sebelum simpan).
- Backend: validasi Joi enum `VALID_PETUGAS`; field pasien/konsultasi **dan** log aktivitas (`oleh`) memakai nilai dropdown — bukan lagi identitas akun login.
- Interaksi dengan auto-save: konsultasi yang sudah tersimpan **mengunci** nilai petugas — auto-save tidak mengirim/menimpanya; penggantian hanya lewat tombol Simpan manual (log aktivitas tetap mencatat akun login sebagai fallback bila dropdown tidak dikirim).
- Login/token/halaman login **tetap berlaku** seperti fase keamanan sebelumnya.

### 2. Nama pasien otomatis Title Case
- Helper `toTitleCase` (trim, rapikan spasi ganda, kapital per kata) diterapkan di:
  - Backend `daftarPasien` & `updatePasien` (sumber kebenaran) — `"budi SANTOSO"` → `"Budi Santoso"`
  - Frontend saat submit pendaftaran & edit modal (feedback instan)
- **Migrasi data lama**: `backend/scripts/migrateNamaTitleCase.js`, jalankan sekali:
  ```bash
  cd backend && node scripts/migrateNamaTitleCase.js
  ```
  Hasil eksekusi pertama: 86 dari 329 nama dikonversi.

---

## Fase 1 — Keamanan

### Masalah sebelumnya
- Semua endpoint API publik tanpa autentikasi; siapa pun bisa membaca data medis dan **menghapus pasien beserta seluruh riwayat konsultasinya**.
- Identitas petugas (`petugasUpdate`, `petugasPenghapus`, dll.) dikirim dari client sehingga audit trail mudah dipalsukan.
- Tanpa Helmet/rate limiting; pagination `limit` tidak dibatasi; input search rawan regex injection.

### Yang diimplementasikan

**Backend**
| File | Perubahan |
|---|---|
| `models/User.js` (baru) | Model user: username unik, password bcrypt (hash otomatis via `pre("save")`), nama untuk audit trail |
| `controllers/authController.js` (baru) | `POST /api/auth/login` → JWT 12 jam; `GET /api/auth/me`; `GET /api/auth/users` |
| `middlewares/auth.js` (baru) | Verifikasi Bearer token, menempelkan `req.user = { id, nama, username }` |
| `routes/*.js` | `router.use(auth)` pada semua route `/api/pasien`, `/api/konsultasi`, `/api/analytics` |
| `server.js` | `helmet()`, rate limit global 500 req/15 mnt, login dibatasi 10/15 mnt, CORS dari `CORS_ORIGIN` |
| `scripts/seedAdmin.js` (baru) | Seed akun admin pertama dari env vars |
| Controllers pasien/konsultasi | Identitas petugas kini dari `req.user.nama`; enum petugas hardcoded dihapus |

**Frontend**
| File | Perubahan |
|---|---|
| `pages/Login.jsx` (baru) | Halaman login |
| `components/ProtectedRoute.jsx` (baru) | Redirect ke `/login` jika belum punya token |
| `services/auth.js` (baru) | Simpan/baca/hapus sesi (token + user) di localStorage |
| `services/api.js` | Interceptor: attach `Authorization` otomatis; respons 401 → hapus sesi + redirect login |
| `App.jsx` | Route `/login` publik, halaman lain dibungkus `ProtectedRoute` |
| `layouts/DefaultLayout.jsx` | Kartu user + tombol logout di sidebar |
| `RegisterPatient.jsx`, `PatientConsultationDetail.jsx`, `Consultations.jsx` | Dropdown "pilih petugas" manual dihapus — identitas otomatis dari user login |

### Cara menguji
1. Akses `GET /api/pasien` tanpa token → harus **401**.
2. Login dengan akun hasil seed → dapat token → semua endpoint berfungsi normal.
3. Token kadaluarsa/salah saat memakai app → otomatis dilempar ke halaman login.

---

## Fase 2 — Efisiensi

### Masalah sebelumnya
- Dashboard mengambil hingga **1000 dokumen pasien lengkap** lalu menghitung statistik di browser (dan diam-diam salah jika >1000 pasien).
- Endpoint analytics menjalankan **±19 query MongoDB secara berurutan**, termasuk loop 7× untuk tren harian.
- Tidak ada index database; bundle frontend ~1.6 MB karena recharts/jsPDF/html2canvas dimuat di halaman mana pun.

### Yang diimplementasikan

**Backend**
- Index baru: `Pasien.tanggalDaftar (-1)`, `Pasien.nama`, `Konsultasi.{pasienId, tanggalKonsultasi}`.
- Endpoint baru **`GET /api/pasien/stats`**: hitungan pasien hari/minggu/bulan, daftar pasien hari ini, dan 10 log aktivitas terbaru dalam satu request (4 query paralel).
- `analyticsController`: loop 7 hari diganti **satu agregasi `$group` by `$dateToString`**; 13 query independen dijalankan paralel via `Promise.all`.

**Frontend**
| File | Perubahan |
|---|---|
| `App.jsx` | Semua halaman di-`React.lazy` + `<Suspense>` fallback spinner |
| `PatientConsultationDetail.jsx` | jsPDF & html2canvas di-`import()` dinamis hanya saat klik "Cetak Rekam Medis"; fetch konsultasi `limit=9999` ganda dihapus (riwayat penuh diambil on-demand saat cetak); respons 404 riwayat kosong ditangani anggun |
| `Dashboard.jsx` | Satu request ke `/pasien/stats` menggantikan fetch ribuan pasien |

### Hasil
- Payload dashboard turun dari ribuan dokumen menjadi beberapa KB.
- Waktu respons analytics lokal: **~276 ms** (sebelumnya ribuan ms karena query serial).
- Chunk awal lebih kecil; recharts & PDF lib hanya dimuat saat diroute/tombol dibuka.

---

## Fase 3 — Stabilitas & Kualitas Kode

### Yang diimplementasikan

**Backend**
- `middlewares/error.js` (baru): error handler terpusat — `CastError`→404, Mongoose `ValidationError`→400, duplikat→400, sisanya→500 JSON konsisten.
- `middlewares/asyncHandler.js` (baru): semua controller bebas try/catch boilerplate; error otomatis diteruskan ke middleware.
- Escape `$regex` pada pencarian; `limit` dibatasi `PAGINATION_CONFIG.MAX_LIMIT=100`; `sortBy` divalidasi whitelist field.

**Frontend**
- Guard anti-crash: akses `soap?.O?.tensi`, `alamat?`, tanggal invalid, `logAktivitas` kosong — tidak lagi meledak pada data lama yang tidak lengkap.
- Util bersama `utils/helpers.js` (`calculateAge`, `formatDateSafe`) dipakai 3 file yang sebelumnya menduplikasi fungsi.
- Label pagination "Previous/Next" → "Sebelumnya/Berikutnya"; pencarian di halaman konsultasi di-debounce 400 ms.

**Pembersihan**
- Dihapus: `pages/PatientDetail.jsx` (dead code), `App.css` sisa template Vite, deps `react-tooltip`, `multer`, `multer-gridfs-storage`, `gridfs-stream`.
- `console.log` debug di `api.js` dihapus.

---

## Fase 4 — Developer Experience

| Item | Detail |
|---|---|
| `README.md` | Setup lokal, tabel env vars, panduan deploy Vercel/Railway |
| `.env.example` | `backend/.env.example` & `frontend/.env.example` |
| ESLint | Config diperbaiki (false positive `motion` hilang, unused var asli dibersihkan) → `npm run lint` hijau |
| Root `package.json` | `npm run dev` menjalankan backend+frontend bersamaan (concurrently); script `install:all`, `seed:admin` |
| `engines` | Node >=18 di kedua package.json |
| `.gitignore` | Sisa fence markdown dibersihkan |

---

## Fitur Baru — Auto-Save Form SOAP ⏱️

Di halaman detail pasien (`PatientConsultationDetail.jsx`):

1. **Debounce 3 detik** — timer dimulai setiap kali form SOAP/therapy berubah; tersimpan 3 detik setelah user berhenti mengetik.
2. **Dirty-check** — perbandingan snapshot JSON; tidak ada request jika isi tidak berubah atau sama dengan kondisi tersimpan terakhir.
3. **Skip render awal** — mengisi form dari data lama tidak memicu save (baseline diset oleh `fillFormWithConsultationData`).
4. **Anti tabrakan** — jika masih ada save yang berjalan lalu user mengetik lagi, perubahan terakhir masuk antrean dan dieksekusi setelahnya; pergantian konsultasi aktif membatalkan save yang tertunda agar tidak salah target.
5. **Indikator status** — "Perubahan belum disimpan..." → "Menyimpan..." → "✓ Tersimpan HH:MM", atau "Auto-save gagal" + toast bila error.
6. **Batasan** — konsultasi *baru* tetap butuk simpan manual pertama kali (tombol Simpan), setelah itu auto-save aktif. Petugas konsultasi otomatis diisi dari user login.

---

## Checklist Verifikasi Pasca-Deploy

- [ ] Railway: env `JWT_SECRET`, `CORS_ORIGIN` terisi; jalankan `node scripts/seedAdmin.js` sekali
- [ ] Vercel: env `VITE_API_BASE_URL=https://<railway>.up.railway.app/api`
- [ ] Buka domain Vercel → dialihkan ke login → login berhasil
- [ ] Dashboard tampil cepat (tanpa fetch ribuan pasien)
- [ ] Buat konsultasi baru → simpan manual → edit SOAP → tunggu 3 detik → indikator "Tersimpan" muncul
- [ ] Cetak rekam medis → PDF terunduh
- [ ] Analytics termuat lengkap
