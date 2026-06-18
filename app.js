// // app.js — Entry point KomikKu

require('dotenv').config();
const express = require('express');
const path    = require('path');
const session = require('express-session');
const mongoose = require('mongoose');

// Import Model untuk Setting (Ditambahkan)
const Setting = require('./models/Setting');

const app = express();

// ==========================================
// 1. KONEKSI DATABASE (DISESUAIKAN)
// ==========================================
// Menggunakan variabel lingkungan .env di production, jika tidak ada baru pakai lokal
const dbURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/komikku';

mongoose.connect(dbURI)
  .then(() => {
    console.log('✅ Berhasil terhubung ke MongoDB!');
  })
  .catch((err) => {
    console.error('❌ Gagal terhubung ke MongoDB:', err);
  });

// ==========================================
// 2. MIDDLEWARE CONFIGURATIONS
// ==========================================
app.use(session({
  // Menggunakan secret dari .env jika tersedia demi keamanan
  secret: process.env.SESSION_SECRET || 'komikku-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/foto', express.static(path.join(__dirname, 'foto')));
app.use('/logo', express.static(path.join(__dirname, 'logo')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- MIDDLEWARE GLOBAL SETTINGS & USER ---
app.use(async (req, res, next) => {
  try {
    // Ambil pengaturan dari database
    let siteSettings = await Setting.findOne();
    if (!siteSettings) siteSettings = await Setting.create({}); // Buat jika belum ada

    // Masukkan ke locals agar bisa dipakai di EJS
    res.locals.settings = siteSettings;
    res.locals.user = req.session.user || null;

    // LOGIKA MAINTENANCE MODE
    if (siteSettings.maintenanceMode && (!req.session.user || req.session.user.role !== 'admin')) {
        if (req.path !== '/auth/login' && req.path !== '/auth/logout') {
            return res.status(503).send(`
                <html><body style="background:#18181B;color:#f5f5f5;font-family:sans-serif;text-align:center;padding:100px">
                    <h1 style="font-size:50px;color:#f59e0b">🛠️ Maintenance Mode</h1>
                    <p style="font-size:18px">Maaf, ${siteSettings.siteName || 'KomikKu'} sedang dalam perbaikan berkala.</p>
                    <p style="color:#71717a">Silakan kembali lagi nanti.</p>
                </body></html>
            `);
        }
    }
  } catch (error) {
    console.error("Error di middleware global:", error);
  }

  console.log("User:", req.session.user ? req.session.user.username : 'Guest');
  next();
});

// ==========================================
// 3. ROUTES DEFINITION
// ==========================================
const guestRouter = require('./routes/guest');
const authRouter  = require('./routes/auth');
const uploadRouter = require('./routes/upload');
const authorRouter = require('./routes/author');
const adminRouter  = require('./routes/admin');

app.use('/', guestRouter);
app.use('/auth', authRouter);
app.use('/upload', uploadRouter);
app.use('/author', authorRouter);
app.use('/admin', adminRouter); 

// 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <html><body style="background:#18181B;color:#f5f5f5;font-family:sans-serif;text-align:center;padding:80px">
      <h1 style="font-size:80px;color:#2299DD">404</h1>
      <p style="font-size:18px">Halaman tidak ditemukan</p>
      <a href="/" style="color:#2299DD;font-weight:bold;font-size:16px">← Kembali ke Beranda</a>
    </body></html>
  `);
});

// ==========================================
// 4. SERVER LISTENING (DISESUAIKAN UNTUK VERCEL)
// ==========================================
const PORT = process.env.PORT || 3000;

// Agar tidak bentrok dengan arsitektur serverless Vercel, app.listen hanya dipanggil di luar production (lokal)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✦ KomikKu running at http://localhost:${PORT}`);
  });
}

// Ekspor modul app (Sangat krusial untuk dibaca oleh Vercel handler)
module.exports = app;