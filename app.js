// app.js — Entry point KomikKu
require('dotenv').config();

const express = require('express');
const path    = require('path');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes — Guest (no auth required)
const guestRouter = require('./routes/guest');
app.use('/', guestRouter);

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