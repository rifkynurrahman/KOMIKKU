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
    // Jika masih gagal login setelah deploy, ubah baris di bawah ke: secure: false
    secure: process.env.NODE_ENV === 'production' 
  }
}));

// ... (sisanya tidak berubah)
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

// ... (Routes tetap sama)
app.use('/', require('./routes/guest'));
app.use('/auth', require('./routes/auth'));
app.use('/upload', require('./routes/upload'));
app.use('/author', require('./routes/author'));
app.use('/admin', require('./routes/admin')); 

module.exports = app;