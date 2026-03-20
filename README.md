# IRIS Competition Center

Website katalog kompetisi untuk IRIS dengan dua area utama:

- Website publik untuk menampilkan lomba dari Google Spreadsheet
- Admin panel untuk login, menambah lomba baru, upload poster ke Cloudinary, dan menghapus row dari spreadsheet

Project ini dibangun dengan `Next.js` dan disiapkan untuk deploy ke Vercel.

## Live URL

- Live site: https://bit.ly/iriscompcenter

## Fitur

- Homepage katalog lomba dengan search, filter, sorting, bookmark lokal, dan modal detail
- UI publik responsif untuk desktop dan mobile
- Efek cursor dan liquid background ringan di desktop
- Data publik tetap membaca sheet pertama dari Google Spreadsheet
- Admin login berbasis password + secure session cookie
- Admin create form untuk append row ke spreadsheet
- Upload poster ke Cloudinary atau input link poster manual
- Admin delete row langsung dari spreadsheet
- Chatbot kanan bawah untuk tanya deadline, lomba aktif, dan info dasar tentang IRIS Competition Center
- API route untuk konsumsi data publik dan aksi admin

## Stack

- `Next.js 16`
- `React 19`
- `Google Sheets API`
- `Cloudinary`
- `Groq API`
- `PapaParse`

## Struktur Penting

- [`app/page.js`](./app/page.js): homepage publik
- [`components/competition-center.js`](./components/competition-center.js): katalog publik dan modal detail
- [`lib/competition-data.js`](./lib/competition-data.js): fetch dan normalisasi data spreadsheet publik
- [`app/admin/login/page.js`](./app/admin/login/page.js): login admin
- [`app/admin/lomba/new/page.js`](./app/admin/lomba/new/page.js): dashboard admin create + delete
- [`lib/admin-auth.js`](./lib/admin-auth.js): auth admin berbasis cookie
- [`lib/admin-services.js`](./lib/admin-services.js): Google Sheets append/delete dan Cloudinary upload
- [`app/api/chat/route.js`](./app/api/chat/route.js): API chatbot Groq dengan scope terbatas

## Cara Kerja Data

### Website publik

Website publik membaca CSV dari Google Spreadsheet published sheet pertama:

- sumber data: sheet utama publik
- refresh otomatis: `revalidate` tiap 15 menit
- field privat seperti leader/daftar/menang tidak ditampilkan di website publik

### Admin

Admin panel bekerja server-side:

1. Admin login
2. Isi form tambah lomba
3. Jika upload poster, file dikirim ke Cloudinary
4. URL poster hasil upload dimasukkan ke kolom `Link Poster`
5. Server append row baru ke spreadsheet
6. Admin juga bisa menghapus row dari sheet utama

## Environment Variables

Buat file `.env.local` berdasarkan [`.env.example`](./.env.example).

Variable yang dibutuhkan:

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
```

## Setup Google Sheets

1. Aktifkan `Google Sheets API` di Google Cloud
2. Buat `Service Account`
3. Download key JSON
4. Ambil:
   - `client_email` -> `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` -> `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
5. Share spreadsheet ke email service account sebagai `Editor`
6. Isi `GOOGLE_SHEET_ID` dari URL spreadsheet
7. Isi `GOOGLE_SHEET_NAME` sesuai nama tab yang dipakai admin

## Setup Cloudinary

1. Ambil `cloud name`, `api key`, dan `api secret`
2. Isi env Cloudinary
3. Admin bisa:
   - upload file poster langsung
   - atau isi link poster manual

Jika keduanya diisi, upload file diprioritaskan.

## Setup Groq Chatbot

1. Ambil API key dari Groq
2. Isi `GROQ_API_KEY`
3. Opsional: isi `GROQ_MODEL`

Chatbot publik dibatasi untuk:

- pertanyaan tentang IRIS Competition Center
- pertanyaan tentang lomba yang tampil di website
- deadline, organizer, guidebook, registrasi, dan info dasar event

Jika pertanyaan di luar scope itu, chatbot akan menjawab `gatau`.

## Menjalankan Lokal

Install dependency:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Start production preview:

```bash
npm run start
```

## Route Penting

- `/` : website publik
- `/admin/login` : login admin
- `/admin/lomba/new` : dashboard admin
- `/api/competitions` : data publik JSON
- `/api/chat` : chatbot publik
- `/api/admin/competitions` : create lomba
- `/api/admin/competitions/delete` : delete row

## Catatan

- Admin delete saat ini menghapus row langsung dari spreadsheet target
- Data publik tetap bergantung pada isi spreadsheet
- Jika service account key sempat terekspos, lakukan key rotation di Google Cloud

## Deploy ke Vercel

1. Push project ke GitHub
2. Import repo ke Vercel
3. Isi semua environment variables di Vercel
4. Deploy

Setelah deploy, admin panel dan website publik akan memakai env production Vercel.
