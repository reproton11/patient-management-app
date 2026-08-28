# Klinik AZ — Patient Management App

Aplikasi manajemen pasien & konsultasi klinik: pendaftaran pasien, rekam SOAP konsultasi dengan auto-save, cetak rekam medis PDF, dan analytics.

| Bagian | Teknologi |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS 3, Recharts, react-select |
| Backend | Node.js, Express 5, MongoDB (Mongoose 8), JWT Auth |
| Deploy | Vercel (frontend) + Railway (backend) |

UI memakai tema **clean medical**: aksen cyan `#0891B2` + emerald, font Figtree, kartu glassmorphism lembut di atas latar aurora, dan tabel data responsif dengan sorting, pencarian, dan filter. Halaman Analytics menyertakan **peta choropleth sebaran pasien per provinsi** (klik provinsi → detail kabupaten/kota).

## Struktur Proyek

```
patient-management-app/
├── frontend/          # React SPA
│   └── src/
│       ├── components/ui/        # Primitif UI: Button, Card, DataTable, Modal, Field, dll
│       ├── components/analytics/ # Komponen chart & peta distribusi (choropleth d3-geo)
│       ├── hooks/                # useIndonesiaRegions
│       ├── layouts/              # DefaultLayout (sidebar + drawer mobile)
│       ├── pages/                # Halaman (lazy-loaded)
│       ├── services/             # api.js (axios + interceptor), auth.js (sesi localStorage)
│       └── utils/                # Helper bersama
├── backend/
│   ├── controllers/   # Logika endpoint
│   ├── models/        # Pasien, Konsultasi, User
│   ├── routes/        # /api/auth, /api/pasien, /api/konsultasi, /api/analytics
│   ├── middlewares/   # auth, error handler, asyncHandler
│   └── scripts/       # seedAdmin, migrasi, util
```

## Menjalankan di Lokal

```bash
# 1. Install semua dependensi
npm run install:all

# 2. Siapkan environment (isi MONGO_URI & JWT_SECRET)
cp backend/.env.example backend/.env
# frontend tidak butuh .env untuk development lokal

# 3. Buat akun admin pertama
npm run seed:admin

# 4. Jalankan full-stack dari root
npm run dev
```

Frontend: http://localhost:5173 · Backend: http://localhost:5000

## Environment Variables

Backend (`backend/.env`):

| Var | Wajib | Keterangan |
|---|---|---|
| `MONGO_URI` | **Ya** | Connection string MongoDB |
| `JWT_SECRET` | **Ya** | Secret token login (min. 32 karakter acak) |
| `CORS_ORIGIN` | Produksi | Origin frontend dipisah koma; kosong = semua (hanya dev) |
| `PORT` | Tidak | Railway menyuntikkan otomatis |

Frontend (`frontend/.env`, opsional): `VITE_API_BASE_URL` — URL backend + suffix `/api`; kosongkan di lokal agar lewat proxy Vite.

## Deployment

- **Railway (backend):** root directory `backend`, start `node server.js`; set `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`; jalankan seed sekali.
- **Vercel (frontend):** root directory `frontend` (Vite terdeteksi otomatis); set `VITE_API_BASE_URL=https://<nama-app>.up.railway.app/api`.

## Perintah Berguna

```bash
npm run dev            # jalankan backend + frontend bersamaan
npm run lint           # ESLint frontend
npm run build          # build produksi frontend
npm run seed:admin     # buat akun admin pertama (butuh ADMIN_* env)
```

## Keamanan

- Semua endpoint data memerlukan Bearer token (kadaluarsa 12 jam); rate limiting global 500 req/15 menit, login 10 percobaan/15 menit
- Identitas petugas pada record dipilih dari dropdown (`VALID_PETUGAS`), bukan akun login
- Pagination dibatasi maksimal 100 item per halaman; `.env` tidak pernah di-commit
