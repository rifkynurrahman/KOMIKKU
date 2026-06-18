const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Comic = require('../models/Comic');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'foto');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// MIDDLEWARE: Memastikan status login sinkron & aman
function requireLogin(req, res, next) {
  if (!req.session) {
    if (req.method === 'GET') return res.redirect('/auth/login');
    return res.status(401).json({ success: false, error: 'Anda harus login terlebih dahulu' });
  }

  req.session.reload((err) => {
    if (err || !req.session.user) {
      if (req.method === 'GET') {
        return res.redirect('/auth/login');
      }
      return res.status(401).json({
        success: false,
        error: 'Anda harus login terlebih dahulu'
      });
    }
    next();
  });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const filename = `${req.session.user.id}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (jpeg, jpg, png, webp) yang diperbolehkan'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

function removeUploadedFiles(files = []) {
  files.forEach((file) => {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
}

router.get('/', requireLogin, (req, res) => {
  res.render('upload', {
    currentPath: '/upload',
    user: req.session.user
  });
});

router.post('/', requireLogin, (req, res) => {
  upload.any()(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({
        success: false,
        error: uploadErr.message || 'Gagal mengunggah file'
      });
    }

    const files = req.files || [];
    const coverFile = files.find((file) => file.fieldname === 'coverImage');

    if (!coverFile) {
      removeUploadedFiles(files);
      return res.status(400).json({
        success: false,
        error: 'File cover image harus diunggah'
      });
    }

    try {
      const { title, description, author, genres, status } = req.body;

      // ==========================================================================
      // PENYESUAIAN UTAMA: NORMALISASI DATA GENRE (ANTI-BUG SINGLE DATA)
      // ==========================================================================
      // Mengubah string tunggal menjadi array, atau buat array kosong jika tidak ada yang dipilih
      const genreList = genres 
        ? (Array.isArray(genres) ? genres : [genres]) 
        : [];

      // Validasi kelengkapan data form utama
      if (!title || !description || !author || genreList.length === 0) {
        removeUploadedFiles(files);
        return res.status(400).json({
          success: false,
          error: 'Semua field komik harus diisi, termasuk minimal memilih satu genre'
        });
      }
      // ==========================================================================

      const chapterKeys = Array.isArray(req.body.chapterKeys)
        ? req.body.chapterKeys
        : [req.body.chapterKeys].filter(Boolean);

      if (chapterKeys.length === 0) {
        removeUploadedFiles(files);
        return res.status(400).json({
          success: false,
          error: 'Tambahkan minimal satu chapter'
        });
      }

      const chapters = chapterKeys.map((key, index) => {
        const chapterNumber = Number(req.body[`chapterNumber_${key}`] || index + 1);
        const chapterTitle = req.body[`chapterTitle_${key}`] || `Chapter ${chapterNumber}`;
        const pages = files
          .filter((file) => file.fieldname === `chapterPages_${key}`)
          .map((file) => `/foto/${file.filename}`);

        return {
          chapterNumber,
          title: chapterTitle,
          pages
        };
      }).filter((chapter) => chapter.chapterNumber && chapter.pages.length > 0);

      if (chapterKeys.length > 0 && chapters.length !== chapterKeys.length) {
        removeUploadedFiles(files);
        return res.status(400).json({
          success: false,
          error: 'Setiap chapter harus memiliki nomor dan minimal satu gambar halaman'
        });
      }

      // Simpan dokumen baru ke database Mongoose
      const newComic = new Comic({
        title,
        author,
        synopsis: description,
        genres: genreList.filter(Boolean), // Array terfilter bebas dari nilai null/undefined
        status: status || 'Ongoing',       // Default ke 'Ongoing' jika input status kosong
        coverImage: `foto/${coverFile.filename}`,
        uploadedBy: req.session.user.id,
        chapters,
        views: 0
      });

      await newComic.save();

      res.json({
        success: true,
        message: 'Komik berhasil diunggah!',
        comicId: newComic._id,
        redirectTo: `/komik/${newComic._id}`
      });
    } catch (err) {
      removeUploadedFiles(files);
      console.error('Error upload komik:', err);
      res.status(500).json({
        success: false,
        error: 'Terjadi kesalahan saat mengunggah komik'
      });
    }
  });
});

module.exports = router;
