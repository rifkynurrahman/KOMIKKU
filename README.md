# 🗲 KomikKu — Web Platform Komik Indonesia
1. Khilmi Bahrulrozaq (202451011) 
2. Muhammad Rifky Nur Rahman (202451012) 
3. Hernanda Yudha Habibullah (202451016) 
4. Anif Fauzhun Ni'am (202451020)
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
komikku-guest/
├── controllers/          # Logika pemrosesan data (Backend)
│   └── adminController.js # Mengatur aksi admin (Kelola user & komik)
├── middleware/           # Proteksi rute & pembatasan hak akses
│   └── isAdmin.js        # Memastikan hanya akun ber-role admin yang masuk
├── data/                 # Penyimpanan data statis pendukung
│   └── dummyData.js      # Menyimpan daftar genre, status, dll.
├── foto/                 # Penyimpanan gambar sampul (cover) komik hasil unggahan
├── logo/                 # Aset gambar bawaan sistem aplikasi
├── models/               # Skema database berbasis Mongoose (MongoDB)
│   ├── Comic.js          # Skema data komik, chapter, dan gambar isi komik
│   └── User.js           # Skema data akun pengguna, role, & riwayat baca
├── routes/               # Gerbang endpoint aplikasi (Routing)
│   ├── admin.js          # Jalur khusus panel kontrol admin
│   ├── auth.js           # Jalur sistem masuk (login), daftar, & keluar (logout)
│   ├── author.js         # Jalur studio kreator untuk upload komik
│   ├── guest.js          # Jalur publik (Beranda, Detail Komik, & Browse)
│   └── routes.js         # Pengatur rute tambahan aplikasi
├── public/               # Aset statis front-end yang bisa diakses publik
│   ├── avatar/           # Tempat menyimpan berkas gambar profil user
│   ├── css/              # Kumpulan berkas style tampilan halaman (admin.css, style.css, dll.)
│   └── js/               # Kumpulan skrip interaksi client-side (main.js, profile.js, dll.)
├── views/                # Berkas template antarmuka pengguna (EJS)
│   ├── admin/            # Wilayah dashboard kontrol admin
│   │   ├── comics.ejs    # Halaman manajemen daftar komik oleh admin
│   │   ├── dashboard.ejs # Halaman utama statistik dan profil internal admin
│   │   └── users.ejs     # Halaman tabel kelola & hapus akun pengguna
│   ├── partials/         # Komponen UI modular yang dipakai berulang (Navbar & Footer)
│   ├── author.ejs        # Tampilan dashboard studio khusus pembuat komik
│   ├── browse.ejs        # Tampilan pencarian, filter genre, dan list komik
│   ├── detail.ejs        # Tampilan informasi detail, sinopsis, dan daftar bab komik
│   ├── edit-profile.ejs  # Form pengubahan data profil pembaca
│   ├── index.ejs         # Tampilan beranda utama (Trending & Rilis Terbaru)
│   ├── login.ejs         # Tampilan form masuk akun
│   ├── profile.ejs       # Tampilan halaman profil utama dan riwayat bacaan
│   ├── read.ejs          # Tampilan lembar baca gambar-gambar chapter komik
│   ├── register.ejs      # Tampilan form pendaftaran akun baru
│   └── upload.ejs        # Tampilan form unggah komik baru oleh author
├── app.js                # Berkas utama (Entry Point) konfigurasi Express & Koneksi DB
├── package.json          # Berkas catatan dependencies library (Mongoose, Express, EJS)
├── package-lock.json     # Catatan versi detail penguncian library node_modules
├── .gitignore            # Daftar berkas/folder tersembunyi yang diabaikan oleh Git (e.g., node_modules)
├── seedAdmin.js          # Skrip otomatis untuk membuat akun admin utama di database
└── seeder.js             # Skrip otomatis untuk mengisi data dummy komik ke database

⚙️ Instalasi
📌 Prasyarat (Wajib Diinstall Sebelum Mulai)
Sebelum menjalankan proyek ini, pastikan komputer kamu sudah terinstall:

Node.js (Versi LTS sangat direkomendasikan)

MongoDB Community Server & MongoDB Compass (Pastikan service MongoDB lokal sudah berjalan/Running)

🏃 Langkah Instalasi
Clone repository & masuk ke folder proyek

Bash
git clone https://github.com/rifkynurrahman/komikku.git
cd komikku

2. **Install dependencies**
   ```bash
   npm install
Salin file environment
Buat file .env baru di folder paling luar proyek dengan menyalin format yang ada:

Bash
cp .env.example .env

4. **Isi konfigurasi pada file `.env`**
   Buka file `.env` yang baru dibuat, lalu sesuaikan isinya menjadi seperti ini:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/komikku
   SESSION_SECRET=inirahasiabangetjanganadamygtau123
(Catatan: Sesuaikan nilai MONGODB_URI dengan konfigurasi instansi database MongoDB lokal kamu).

Jalankan Seeder (Wajib untuk pertama kali)
Karena aplikasi membutuhkan data awal (dummy) untuk memuat halaman beranda serta akun login bawaan, jalankan kedua seeder ini di terminal secara berurutan:

Bash
# 1. Memasukkan data komik dummy ke database
node seeder.js

# 2. Memasukkan data akun admin & kreator bawaan
node seedAdmin.js

6. **Jalankan aplikasi**
   ```bash
   node app.js
Buka Browser
Akses halaman utama website melalui tautan berikut: http://localhost:3000
