// app.js — Entry point KomikKu
require('dotenv').config();

const express = require('express');
const path    = require('path');
const session = require('express-session');

const app = express();

// Session middleware
app.use(session({
  secret: 'komikku-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 jam
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/foto', express.static(path.join(__dirname, 'foto')));
app.use('/logo', express.static(path.join(__dirname, 'logo')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware untuk pass user ke semua views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes — Guest (no auth required)
const guestRouter = require('./routes/guest');
const authRouter = require('./routes/auth');
const uploadRouter = require('./routes/upload');
const authorRouter = require('./routes/author');
app.use('/', guestRouter);
app.use('/auth', authRouter);
app.use('/upload', uploadRouter);
app.use('/author', authorRouter);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✦ KomikKu running at http://localhost:${PORT}`);
});

module.exports = app;

const mongoose = require('mongoose');

// Setup koneksi Mongoose ke MongoDB
// 'komikku' di akhir URL adalah nama database yang akan otomatis dibuat
mongoose.connect('mongodb://127.0.0.1:27017/komikku')
  .then(() => {
    console.log('✅ Berhasil terhubung ke MongoDB!');
  })
  .catch((err) => {
    console.error('❌ Gagal terhubung ke MongoDB:', err);
  });
