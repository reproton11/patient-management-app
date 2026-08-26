# AGENTS.md — Panduan untuk AI Coding Assistant

Aplikasi manajemen pasien "Klinik AZ": monorepo dua aplikasi — `frontend/` (React 19 + Vite 7, JSX polos, Tailwind 3) dan `backend/` (Express 5 + Mongoose 8). Tidak ada test suite; verifikasi = `lint` + `build` + smoke test manual/curl.

## Perintah (root package.json)

```bash
npm run install:all    # install root + backend + frontend sekaligus
npm run dev            # backend (:5000) + frontend (:5173) bersamaan via concurrently
npm run lint           # ESLint frontend — HARUS hijau sebelum commit
npm run build          # build produksi frontend (juga validasi import/babel)
npm run seed:admin     # buat akun admin pertama dari env ADMIN_USERNAME/PASSWORD/NAME
node backend/scripts/migrateNamaTitleCase.js  # konversi semua nama pasien ke Title Case (idempotent)
```

## Environment

- `backend/.env` (lihat `.env.example`): `MONGO_URI` wajib; `JWT_SECRET`; `CORS_ORIGIN`; `PORT`. **Jangan pernah commit `.env`.**
- Frontend lokal TIDAK butuh `.env`: tanpa `VITE_API_BASE_URL`, axios fallback ke `/api` dan lewat proxy Vite → localhost:5000. Produksi wajib set URL Railway + suffix `/api`.

## Jebakan Frontend

- **Heroicons v1** (`@heroicons/react/outline`): nama gaya lama — `TrendingUpIcon`, BUKAN `ArrowTrendingUpIcon` (v2). Nama v2 akan gagal saat `vite build`.
- ESLint: `no-unused-vars` versi ini TIDAK menghitung JSX member-expression (`<motion.div>`) sebagai pemakaian. Config menangani via `varsIgnorePattern: '^[A-Z_]|^motion$'` + `argsIgnorePattern: '^_|^Icon$|^motion$'`. Komponen ikon dari prop destructured harus di-alias dalam body: `({ icon }) => { const Icon = icon; ... }`.
- Recharts v3: tooltip custom tetap butuh `<Tooltip content={<CustomTooltip />} />` — komponen `Tooltip` WAJIB di-import dari recharts.
- jsPDF/html2canvas HANYA via dynamic `import()` di handler cetak; halaman di-`React.lazy` di `App.jsx` (jaga chunk splitting).
- `dailyRegistrations[].date` sudah string terformat id-ID ("24 Agu") dari backend — jangan parse ulang.
- `GET /api/konsultasi/pasien/:id` bisa **404** saat riwayat kosong — tangani sebagai array kosong, bukan error.
- Angka pakai locale `id-ID` (`utils/helpers.js`, `components/analytics/chartTheme.js`). UI berbahasa Indonesia.
- Pola kartu aplikasi: `bg-white p-6 rounded-xl shadow-lg border border-gray-200`.

## Konvensi Backend

- Controller dibungkus `asyncHandler` (`middlewares/asyncHandler.js`) — tanpa try/catch; error diteruskan ke `middlewares/error.js` (CastError→404, ValidationError→400, duplikat→500→400).
- Semua route `/api/pasien|konsultasi|analytics` di belakang middleware `auth` (Bearer JWT, expiry 12 jam); identitas akun di `req.user.{id,nama,username}`.
- Validasi Joi dipisah per aksi: `*CreateSchema` (petugas **wajib**) vs `*UpdateSchema` (petugas opsional) di kedua controller.
- Identitas petugas pada record & `logAktivitas.oleh` mengikuti **dropdown** `["Heni","Maria","Emy","Aziz"]` (`constants/index.js`), bukan akun login; fallback ke `req.user.nama` hanya bila dropdown tak dikirim (auto-save).
- Nama pasien dinormalisasi `toTitleCase()` sebelum simpan (create & update). Di `daftarPasien`, urutan spread di `new Pasien({...})` penting: `nama` hasil normalisasi harus SETELAH `...value`.
- Pagination: batasi `limit` dengan `PAGINATION_CONFIG.MAX_LIMIT=100`; escape `$regex` input search; whitelist field `sortBy`.

## Fitur Auto-Save SOAP (`PatientConsultationDetail.jsx`)

- Debounce `AUTOSAVE_DELAY_MS = 3000` setelah berhenti mengetik; dirty-check via snapshot JSON (`soapBaselineRef`).
- Payload auto-save HANYA `{ soap, therapy }` — sengaja tanpa `petugasKonsultasi` agar nilai terkunci di database (penggantian hanya via tombol Simpan manual).
- Konsultasi baru butuh simpan manual pertama kali sebelum auto-save aktif.

## Operasional

- Rate limit: login maks 10 percobaan/15 menit (smoke test login berulang via curl bisa kena 429), API global 500 req/15 menit.
- Dashboard wajib pakai `GET /api/pasien/stats` — jangan regresi ke fetch daftar pasien penuh untuk statistik.
