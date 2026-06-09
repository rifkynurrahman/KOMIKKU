# 🗲 KomikKu — Web Platform Komik Indonesia

> Platform baca dan upload komik berbasis web yang mendukung sistem role (Guest, Kreator, Admin).

---

## 📋 Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Struktur Folder](#struktur-folder)
- [Instalasi](#instalasi)
- [Penggunaan](#penggunaan)
- [Role & Akses](#role--akses)
- [Catatan Pengembangan Tim](#️-catatan-pengembangan-tim-dev-notes)

---

## Tentang Proyek

**KomikKu** adalah platform web untuk membaca dan mengupload komik karya kreator lokal Indonesia. Platform ini mendukung tiga jenis pengguna: Guest, Kreator, dan Admin — masing-masing dengan hak akses yang berbeda.

---

## Fitur

### Guest (Belum Login)
- Lihat beranda & browse komik
- Baca komik secara gratis
- Lihat detail komik
- Lihat Profil Publik Kreator

### Kreator (Sudah Login)
- Semua akses Guest
- Kelola Profil Kreator (Ubah Foto Profil, Bio, & Sosial Media)
- Upload komik & kelola chapter
- Dashboard statistik views
- Bookmark & riwayat bacaan
- Komentar & rating

### Admin
- Semua akses Kreator
- Kelola Profil Internal (Ganti password & email)
- Kelola user, komik, dan genre
- Laporan konten
- Pengaturan sistem

---

## Teknologi

| Layer | Stack |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Template Engine | EJS |
| Database | MongoDB (Mongoose) |
| Auth | JWT + Session |
| Styling | CSS3 |

---

## Struktur Folder

```text
komikku/
├── controllers/        # Logika pemrosesan data (Disiapkan untuk Admin & Kreator)
│   ├── authController.js
│   ├── comicController.js
│   └── adminController.js
├── models/             # Skema database
│   ├── User.js
│   ├── Comic.js
│   └── Chapter.js
├── routes/             # Endpoint aplikasi
│   ├── auth.js
│   ├── comic.js
│   ├── guest.js        # Logika sistem Guest ada di sini
│   └── admin.js
├── views/              # Template UI (EJS)
│   ├── layouts/
│   ├── pages/
│   └── partials/
├── middleware/         # Autentikasi & Role Checker
│   ├── authMiddleware.js
│   └── roleMiddleware.js
├── public/             # Aset statis
│   ├── css/
│   ├── js/
│   └── images/
├── .env.example
├── app.js              # Entry point
└── package.json

⚙️ Instalasi
📌 Prasyarat (Wajib Diinstall Sebelum Mulai)
Sebelum menjalankan proyek ini, pastikan komputer kamu sudah terinstall:

Node.js (Versi LTS sangat direkomendasikan)

MongoDB Community Server & MongoDB Compass (Pastikan service MongoDB lokal sudah berjalan/Running)

🏃 Langkah Instalasi
Clone repository & masuk ke folder proyek

Bash
git clone [https://github.com/rifkynurrahman/komikku.git](https://github.com/rifkynurrahman/komikku.git)
cd komikku
Install dependencies

Bash
npm install
Salin file environment

Bash
cp .env.example .env
Isi konfigurasi pada file .env

Cuplikan kode
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/komikku
JWT_SECRET=your_secret_key
SESSION_SECRET=your_session_secret
(Catatan: Sesuaikan nilai MONGO_URI dengan konfigurasi instansi database MongoDB lokal kamu)

Jalankan Seeder (Wajib untuk pertama kali)
Karena aplikasi membutuhkan data awal (dummy) untuk memuat halaman beranda, jalankan seeder terlebih dahulu untuk mengisi database:

Bash
node seeder.js
Jalankan aplikasi

Bash
# Mode Pengembangan (Development)
npm run dev

# Mode Produksi (Production)
npm start
Buka browser kamu dan akses halaman di: http://localhost:3000