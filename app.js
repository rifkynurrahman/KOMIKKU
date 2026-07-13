require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
// PERUBAHAN: Menghapus .default agar kompatibel dengan versi terbaru
const MongoStore = require('connect-mongo');

const Setting = require('./models/Setting');
const app = express();

// ==========================================
// 1. KONEKSI DATABASE
// ==========================================
const dbURI = process.env.MONGODB_URI;
const mongooseOptions = {
  serverSelectionTimeoutMS: 20000,
  socketTimeoutMS: 45000,
};

mongoose.connect(dbURI, mongooseOptions)
  .then(() => console.log('✅ Berhasil terhubung ke MongoDB!'))
  .catch((err) => console.error('❌ Gagal terhubung ke MongoDB:', err));

app.set('trust proxy', 1);

// ==========================================
// 2. MIDDLEWARE SESSION
// ==========================================
app.use(session({
  secret: process.env.SESSION_SECRET || 'komikku-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: dbURI,
    collectionName: 'sessions',
    touchAfter: 24 * 3600 
  }),
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    // 🔥 UBAH BARIS INI JADI false AGAR SESSION DI VERCEL AMAN & STABIL
    secure: false 
  }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/foto', express.static(path.join(__dirname, 'foto')));
app.use('/logo', express.static(path.join(__dirname, 'logo')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- MIDDLEWARE GLOBAL ---
app.use(async (req, res, next) => {
  try {
    let siteSettings = await Setting.findOne();
    if (!siteSettings) siteSettings = await Setting.create({});
    res.locals.settings = siteSettings;
    res.locals.user = req.session.user || null;

    if (siteSettings.maintenanceMode && (!req.session.user || req.session.user.role !== 'admin')) {
        if (req.path !== '/auth/login' && req.path !== '/auth/logout') {
            return res.status(503).send('<h1>🛠️ Maintenance Mode</h1>');
        }
    }
  } catch (error) { console.error("Error middleware:", error); }
  
  next();
});

// ==========================================
// 3. ROUTES UTAMA
// ==========================================
app.use('/', require('./routes/guest'));
app.use('/auth', require('./routes/auth'));
app.use('/upload', require('./routes/upload'));
app.use('/author', require('./routes/author'));
app.use('/admin', require('./routes/admin')); 

// ==========================================
// 🔥 RUTE TEMPORARY: BYPASS PEMBUATAN ADMIN VIA CLOUD VERCEL
// ==========================================
app.get('/bikin-admin-rahasia-123', async (req, res) => {
  try {
    const bcrypt = require('bcrypt');
    const User = require('./models/User'); //mengambil model

    // Hapus akun lama dengan email ini agar tidak duplikat
    await User.deleteOne({ email: 'rifky1@komikku.com' });

    // Enkripsi Password
    const hashedPassword = await bcrypt.hash('admin12345', 10);

    // Buat data instansiasi model baru
    const adminBaru = new User({
      firstName: 'Admin',
      lastName: 'Utama',
      username: 'admin_komikku',
      email: 'admin@komikku.com',
      password: hashedPassword,
      role: 'admin'
    });

    await adminBaru.save();
    res.send('<h1 style="color: green; text-align: center; margin-top: 50px;">✅ AKUN ADMIN BERHASIL DIBUAT DI CLOUD VIA VERCEL!</h1><p style="text-align: center;">Silakan kembali ke halaman login asli untuk masuk.</p>');
  } catch (error) {
    res.status(500).send('❌ Gagal membuat akun admin: ' + error.message);
  }
});

module.exports = app;