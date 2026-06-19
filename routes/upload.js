const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Comic = require('../models/Comic');

const router = express.Router();

// ==========================================
// KONFIGURASI CLOUDINARY STORAGE
// ==========================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Menentukan sub-folder dinamis di dalam Cloudinary
    let folderName = 'komikku_covers';
    if (file.fieldname.startsWith('chapterPages_')) {
      folderName = 'komikku_chapters';
    }
    
    return {
      folder: folderName,
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      public_id: `${req.session.user.id}-${Date.now()}-${Math.round(Math.random() * 1E4)}`
    };
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Batas 5MB per gambar
  }
});

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

// Fungsi bantu hapus file dari Cloudinary jika proses database gagal
async function removeCloudinaryFiles(files = []) {
  for (const file of files) {
    if (file.filename) {
      try {
        await cloudinary.uploader.destroy(file.filename);
      } catch (err) {
        console.error('Gagal menghapus file dari Cloudinary:', err);
      }
    }
  }
}

// Fungsi pembantu untuk memvalidasi dan memperbaiki format URL Cloudinary
function fixCloudinaryUrl(url) {
  if (!url) return '';
  // Mengatasi bug jika string dimulai dengan https:/ tanpa double-slash
  if (url.startsWith('https:/') && !url.startsWith('https://')) {
    return url.replace('https:/', 'https://');
  }
  return url;
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
      await removeCloudinaryFiles(files);
      return res.status(400).json({
        success: false,
        error: 'File cover image harus diunggah'
      });
    }

    try {
      const { title, description, author, genres, status } = req.body;

      const genreList = genres 
        ? (Array.isArray(genres) ? genres : [genres]) 
        : [];

      if (!title || !description || !author || genreList.length === 0) {
        await removeCloudinaryFiles(files);
        return res.status(400).json({
          success: false,
          error: 'Semua field komik harus diisi, termasuk minimal memilih satu genre'
        });
      }

      const chapterKeys = Array.isArray(req.body.chapterKeys)
        ? req.body.chapterKeys
        : [req.body.chapterKeys].filter(Boolean);

      if (chapterKeys.length === 0) {
        await removeCloudinaryFiles(files);
        return res.status(400).json({
          success: false,
          error: 'Tambahkan minimal satu chapter'
        });
      }

      const chapters = chapterKeys.map((key, index) => {
        const chapterNumber = Number(req.body[`chapterNumber_${key}`] || index + 1);
        const chapterTitle = req.body[`chapterTitle_${key}`] || `Chapter ${chapterNumber}`;
        
        // Membersihkan URL setiap halaman komik menggunakan fungsi fixCloudinaryUrl
        const pages = files
          .filter((file) => file.fieldname === `chapterPages_${key}`)
          .map((file) => fixCloudinaryUrl(file.path));

        return {
          chapterNumber,
          title: chapterTitle,
          pages
        };
      }).filter((chapter) => chapter.chapterNumber && chapter.pages.length > 0);

      if (chapterKeys.length > 0 && chapters.length !== chapterKeys.length) {
        await removeCloudinaryFiles(files);
        return res.status(400).json({
          success: false,
          error: 'Setiap chapter harus memiliki nomor dan minimal satu gambar halaman'
        });
      }

      // Simpan dokumen baru ke database Mongoose dengan URL yang sudah divalidasi
      const newComic = new Comic({
        title,
        author,
        synopsis: description,
        genres: genreList.filter(Boolean),
        status: status || 'Ongoing',
        coverImage: fixCloudinaryUrl(coverFile.path), // Mengamankan format URL cover
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
      await removeCloudinaryFiles(files);
      console.error('Error upload komik:', err);
      res.status(500).json({
        success: false,
        error: 'Terjadi kesalahan saat mengunggah komik'
      });
    }
  });
});

module.exports = router;