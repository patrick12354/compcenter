# IRIS Competition Center

IRIS Competition Center adalah website katalog kompetisi milik IRIS yang menampilkan data lomba dari Google Spreadsheet dalam format yang lebih rapi, cepat dipindai, dan siap dipakai sebagai website publik. Project ini juga memiliki admin panel untuk menambah dan menghapus lomba tanpa mengubah struktur spreadsheet sumber.

Live site:
- https://bit.ly/iriscompcenter

## Ringkasan Fitur

- Homepage publik dengan search, filter, sorting, bookmark lokal, spotlight deadline, modal detail, dan CTA ke Instagram IRIS
- UI responsif untuk desktop dan mobile
- Efek cursor dan liquid accent ringan di desktop
- Chatbot kanan bawah untuk menjawab pertanyaan seputar IRIS dan lomba yang tampil
- Admin panel dengan login, tambah lomba, upload poster ke Cloudinary, dan hapus row spreadsheet
- Counter kunjungan kecil di footer homepage dengan penyimpanan persisten
- Data publik tersinkron dari sheet utama tanpa menampilkan kolom privat

## Stack

- `Next.js 16`
- `React 19`
- `Google Sheets API`
- `Cloudinary`
- `Groq API`
- `Upstash Redis REST`
- `PapaParse`

## Struktur Folder

### `app/`

Folder utama App Router Next.js. Semua page, route handler, metadata, dan stylesheet global ada di sini.

- [`app/page.js`](./app/page.js)
  Homepage publik.
- [`app/layout.js`](./app/layout.js)
  Layout global, font, metadata, dan favicon.
- [`app/globals.css`](./app/globals.css)
  Styling global seluruh website, termasuk homepage, modal, admin, chatbot, dan counter.
- [`app/lomba/[slug]/page.js`](./app/lomba/[slug]/page.js)
  Detail page statis per lomba.
- [`app/admin/`](./app/admin)
  Halaman admin.
- [`app/api/`](./app/api)
  Route handler server-side untuk data publik, admin action, chatbot, dan counter kunjungan.

### `components/`

Berisi komponen UI yang dipakai ulang di berbagai halaman.

- [`components/competition-center.js`](./components/competition-center.js)
  Komponen utama homepage publik.
- [`components/competition-card.js`](./components/competition-card.js)
  Card lomba di katalog.
- [`components/competition-chatbot.js`](./components/competition-chatbot.js)
  Floating chatbot di kanan bawah.
- [`components/site-views-counter.js`](./components/site-views-counter.js)
  Counter kunjungan kecil di bagian bawah homepage.
- [`components/cursor-effects.js`](./components/cursor-effects.js)
  Efek cursor dan liquid background untuk desktop.
- [`components/admin-login-form.js`](./components/admin-login-form.js)
  Form login admin.
- [`components/admin-competition-form.js`](./components/admin-competition-form.js)
  Form tambah lomba di admin.
- [`components/admin-competition-list.js`](./components/admin-competition-list.js)
  Daftar row spreadsheet di admin beserta tombol hapus.

### `lib/`

Berisi helper, service, parser, dan logic server-side/non-UI.

- [`lib/competition-data.js`](./lib/competition-data.js)
  Fetch data lomba, normalisasi row spreadsheet, slug, parser deadline, dan insight homepage.
- [`lib/competition-helpers.js`](./lib/competition-helpers.js)
  Helper presentasi seperti calendar link dan share text.
- [`lib/chatbot-context.js`](./lib/chatbot-context.js)
  Knowledge base IRIS dan batas konteks chatbot.
- [`lib/admin-auth.js`](./lib/admin-auth.js)
  Session cookie admin.
- [`lib/admin-services.js`](./lib/admin-services.js)
  Integrasi Google Sheets dan Cloudinary untuk create/delete/upload.

## Route Penting

- `/`
  Website publik.
- `/lomba/[slug]`
  Detail page per lomba.
- `/admin/login`
  Login admin.
- `/admin/lomba/new`
  Dashboard admin untuk create dan delete.
- `/api/competitions`
  JSON data lomba publik.
- `/api/chat`
  API chatbot publik.
- `/api/visits`
  API counter kunjungan persisten.
- `/api/admin/competitions`
  API create lomba dari admin.
- `/api/admin/competitions/delete`
  API delete row dari admin.

## Alur Data

### Website publik

Website publik membaca data dari sheet utama yang sama. Row spreadsheet dinormalisasi dulu agar UI bisa menampilkan:

- nama lomba
- penyelenggara
- deadline pendaftaran
- tanggal penyisihan
- link registrasi
- link guidebook
- Instagram
- Linktree
- poster

Kolom privat seperti leader, status daftar, dan status menang tidak ditampilkan di website publik.

### Admin

Alur admin:

1. Admin login lewat password
2. Admin mengisi form tambah lomba
3. Jika poster di-upload, file dikirim ke Cloudinary
4. URL poster hasil upload dimasukkan ke kolom `Link Poster`
5. Server append row baru ke spreadsheet
6. Data publik di-revalidate
7. Admin juga bisa menghapus row, dan jika poster berasal dari Cloudinary project ini maka image ikut dihapus

### Chatbot

Chatbot hanya boleh menjawab:

- pertanyaan tentang IRIS
- pertanyaan tentang IRIS Competition Center
- pertanyaan tentang lomba yang sedang tampil

Jika pertanyaan berada di luar konteks tersebut, chatbot akan menolak menjawab topik lain.

### Counter kunjungan

Counter tidak memakai file lokal atau variabel memory biasa, karena itu tidak aman untuk deployment Vercel. Counter memakai Redis REST agar jumlah kunjungan tetap tersimpan saat deploy baru.

## Environment Variables

Buat file `.env.local` berdasarkan [`.env.example`](./.env.example).

```env
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=

GOOGLE_SHEET_ID=
GOOGLE_SHEET_NAME=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=

GROQ_API_KEY=
GROQ_MODEL=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_REDIS_KEY=
```

## Setup Integrasi

### Google Sheets

1. Aktifkan `Google Sheets API` di Google Cloud
2. Buat `Service Account`
3. Download key JSON
4. Ambil:
   - `client_email` untuk `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` untuk `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
5. Share spreadsheet ke email service account sebagai `Editor`
6. Isi `GOOGLE_SHEET_ID`
7. Isi `GOOGLE_SHEET_NAME`

### Cloudinary

1. Ambil `cloud name`, `api key`, dan `api secret`
2. Isi env Cloudinary
3. Admin bisa upload poster langsung atau mengisi link manual
4. Jika dua-duanya diisi, upload file diprioritaskan

### Groq

1. Ambil API key dari Groq
2. Isi `GROQ_API_KEY`
3. Opsional isi `GROQ_MODEL`

### Upstash Redis

1. Buat database di Upstash Redis
2. Ambil `REST URL` dan `REST TOKEN`
3. Isi:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `UPSTASH_REDIS_KEY` jika ingin custom key counter

## Menjalankan Lokal

Install dependency:

```bash
npm install
```

Jalankan dev server:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Preview production build:

```bash
npm run start
```

## Deploy ke Vercel

1. Push project ke GitHub
2. Import repo ke Vercel
3. Isi semua environment variables di Vercel
4. Deploy
5. Jika ada env baru yang ditambahkan, lakukan redeploy agar env terbaca deployment baru

## Catatan

- Counter kunjungan baru aktif jika env Upstash Redis sudah diisi
- Chatbot baru aktif penuh jika env Groq sudah diisi
- Jika credential sensitif pernah terekspos, lakukan rotation token/key
