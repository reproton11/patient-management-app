# Klinik AZ — Patient Management App

Aplikasi manajemen pasien & konsultasi klinik: pendaftaran pasien, rekam SOAP konsultasi dengan auto-save, cetak rekam medis PDF, dan analytics.

| Bagian | Teknologi |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS 3, Recharts, Framer Motion |
| Backend | Node.js, Express 5, MongoDB (Mongoose 8), JWT Auth |
| Deploy | Vercel (frontend) + Railway (backend) |

## Struktur Proyek

```
patient-management-app/
├── frontend/          # React SPA
│   └── src/
│       ├── components/analytics/   # Komponen chart analytics
│       ├── hooks/                  # useIndonesiaRegions
│       ├── layouts/                # DefaultLayout (shell aplikasi)
│       ├── pages/                  # Halaman (lazy-loaded)
│       ├── services/               # api.js (axios + interceptor), auth.js (sesi localStorage)
│       └── utils/                  # Helper bersama
├── backend/
│   ├── constants/     # VALID_PETUGAS, pagination, validasi, penomoran kartu
│   ├── controllers/   # Logika endpoint
│   ├── middlewares/   # auth, error handler, asyncHandler
│   ├── models/        # Pasien, Konsultasi, User
│   ├── routes/        # /api/auth, /api/pasien, /api/konsultasi, /api/analytics
│   ├── scripts/       # seedAdmin, migrasi nama Title Case, sinkron password admin
│   └── utils/         # jwt helper
└── AGENTS.md          # Konvensi & panduan untuk AI coding assistant
```

## Menjalankan di Lokal

### Prasyarat
- Node.js >= 18
- MongoDB Atlas URI (atau MongoDB lokal)

### Langkah

```bash
# 1. Install semua dependensi
npm run install:all

# 2. Siapkan environment
cp backend/.env.example backend/.env    # isi MONGO_URI
# frontend tidak butuh .env untuk development lokal

# 3. Buat akun admin pertama
cd backend
ADMIN_USERNAME=admin ADMIN_PASSWORD=password-anda node scripts/seedAdmin.js

# 4. Jalankan full-stack dari root
cd ..
npm run dev
```

Frontend: http://localhost:5173 · Backend: http://localhost:5000

Login menggunakan username/password yang di-seed di langkah 3.

## Environment Variables

### Backend (`backend/.env`)

| Var | Wajib | Keterangan |
|---|---|---|
| `PORT` | Tidak | Default `3000`; Railway menyuntikkan otomatis |
| `MONGO_URI` | **Ya** | Connection string MongoDB |
| `CORS_ORIGIN` | Produksi | Origin frontend dipisah koma. Kosong = semua origin (hanya dev) |
| `JWT_SECRET` | **Ya** | Secret signing token login (min. 32 karakter acak) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Seed only | Untuk membuat akun admin pertama |

### Frontend (`frontend/.env`, opsional di lokal)

| Var | Keterangan |
|---|---|
| `VITE_API_BASE_URL` | URL backend dengan suffix `/api`. Kosongkan di lokal agar lewat proxy Vite |

## Deployment

### Railway (backend)
1. Root directory: `backend`, start command: `node server.js`
2. Set env vars: `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN` (domain Vercel Anda)
3. Healthcheck path: `/`
4. Jalankan seed sekali: `node scripts/seedAdmin.js`

### Vercel (frontend)
1. Root directory: `frontend`, framework: Vite (terdeteksi otomatis)
2. Set env var: `VITE_API_BASE_URL=https://<nama-app>.up.railway.app/api`
3. Redeploy setiap kali env berubah

## Perintah Berguna

```bash
npm run dev            # jalankan backend + frontend bersamaan
npm run lint           # ESLint frontend
npm run build          # build produksi frontend
npm run seed:admin     # buat akun admin pertama (butuh ADMIN_* env)
```

## Keamanan

- Semua endpoint `/api/pasien|konsultasi|analytics` memerlukan Bearer token (kadaluarsa 12 jam)
- Identitas petugas pada record & audit trail dipilih dari dropdown (`VALID_PETUGAS`), bukan akun login; fallback ke akun login hanya saat dropdown tidak terkirim
- Helmet aktif; rate limiting global 500 req/15 menit dan login dibatasi 10 percobaan/15 menit
- Pagination dibatasi maksimal 100 item per halaman
