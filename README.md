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
├── controllers/        # [Rencana] Logika pemrosesan data (Admin & Creator)
├── middleware/         # [Rencana] Proteksi rute & pembatasan akses Admin
├── data/               # Data statis aplikasi
│   └── dummyData.js    # Menyimpan daftar genre komik
├── foto/               # Penyimpanan gambar cover komik hasil upload
├── logo/               # Aset gambar sistem (e.g., kamera.png)
├── models/             # Skema database (Mongoose Models)
│   ├── Comic.js        # Skema data komik & isi chapter didalamnya
│   └── User.js         # Skema data pengguna & riwayat baca
├── routes/             # Endpoint & Logika aplikasi (Routing)
│   ├── auth.js         # Sistem login, register, & logout
│   ├── author.js       # Fitur creator untuk mengelola & upload komik
│   ├── guest.js        # Rute publik (Beranda, Browse, Detail, & Baca)
│   └── admin.js        # [Rencana] Rute khusus Admin & Form CRUD Manajemen
├── public/             # Aset statis front-end
│   ├── avatar/         # Gambar profil pengguna
│   ├── css/            # Style utama halaman (style.css)
│   └── js/             # Script interaksi client-side (main.js)
├── views/              # Template UI (EJS)
│   ├── index.ejs       # Halaman utama (Trending & Rilis Terbaru)
│   ├── browse.ejs      # Halaman pencarian & filter genre
│   ├── detail.ejs      # Halaman info detail komik
│   ├── read.ejs        # Halaman pembaca gambar-gambar chapter
│   ├── admin/          # [Rencana] Folder khusus halaman EJS Admin
│   │   └── dashboard.ejs # Form manajemen komik/user oleh admin
│   └── partials/       # Komponen modular (navbar, footer)
├── app.js              # Entry point utama aplikasi Express
├── package.json        # Dependensi project & script running
└── .env                # Variabel lingkungan (Koneksi MongoDB & Session Secret)

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

by yudha
