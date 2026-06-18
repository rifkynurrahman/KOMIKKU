require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose'); 
const MongoStore = require('connect-mongo').default;

const Setting = require('./models/Setting');
const app = express();

// ==========================================
// 1. KONEKSI DATABASE
// ==========================================
const dbURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/komikku';

mongoose.connect(dbURI)
  .then(() => console.log('✅ Berhasil terhubung ke MongoDB!'))
  .catch((err) => console.error('❌ Gagal terhubung ke MongoDB:', err));

// ==========================================
// 2. MIDDLEWARE CONFIGURATIONS (SESUAIKAN INI)
// ==========================================
app.use(session({
  secret: process.env.SESSION_SECRET || 'komikku-secret-key-2024',
  resave: false,
  saveUninitialized: false, // Ubah ke false agar sesi tidak dibuat untuk guest
  store: MongoStore.create({
    mongoUrl: dbURI,       // Menggunakan URI yang sama dengan koneksi DB
    collectionName: 'sessions' // Nama koleksi di MongoDB untuk simpan sesi
  }),
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // Aktifkan secure jika sudah HTTPS
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

  console.log("User:", req.session.user ? req.session.user.username : 'Guest');
  next();
});

// ... (Routes tetap sama seperti kode Anda sebelumnya)
const guestRouter = require('./routes/guest');
const authRouter = require('./routes/auth');
const uploadRouter = require('./routes/upload');
const authorRouter = require('./routes/author');
const adminRouter = require('./routes/admin');

app.use('/', guestRouter);
app.use('/auth', authRouter);
app.use('/upload', uploadRouter);
app.use('/author', authorRouter);
app.use('/admin', adminRouter); 

module.exports = app;