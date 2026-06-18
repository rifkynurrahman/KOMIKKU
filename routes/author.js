const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Comic = require('../models/Comic');
const User = require('../models/User');

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
    return {
      folder: 'komikku_chapters', // Menyimpan halaman chapter ke folder khusus di cloud
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      public_id: `${req.session.user.id}-chapter-${Date.now()}-${Math.round(Math.random() * 1E4)}`
    };
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Batasan 5MB per file halaman
  }
});

// Helper format angka views agar ringkas (Misal: 1.2JT, 45RB)
const formatViews = (num) => {
  if (!num) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace('.0', '') + 'JT';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace('.0', '') + 'RB';
  }
  return num.toString();
};

// MIDDLEWARE: Proteksi login stabil memakai reload session
function requireLogin(req, res, next) {
  if (!req.session) {
    if (req.method === 'GET') return res.redirect('/auth/login');
    return res.status(401).json({ success: false, error: 'Anda harus login' });
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

function toPublicImagePath(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
}

// 🔥 SEKARANG MENGHAPUS GAMBAR LANGSUNG DARI CLOUDINARY CLOUD
async function deleteCloudinaryImage(imagePath) {
  if (!imagePath || !imagePath.startsWith('http')) return;
  
  try {
    // Mengekstrak Public ID unik Cloudinary dari URL gambar internet
    // Contoh URL: https://res.cloudinary.com/.../komikku_chapters/nama_file.jpg
    const parts = imagePath.split('/');
    const folderAndFile = parts.slice(-2).join('/'); // 'komikku_chapters/nama_file.jpg'
    const publicId = folderAndFile.substring(0, folderAndFile.lastIndexOf('.')); // hapus ekstensi '.jpg'
    
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Gagal menghapus gambar dari Cloudinary:', err);
  }
}

// Fungsi bantu membersihkan file jika proses simpan gagal ditengah jalan
async function removeCloudinaryFiles(files = []) {
  for (const file of files) {
    if (file.filename) {
      try {
        await cloudinary.uploader.destroy(file.filename);
      } catch (err) {
        console.error('Gagal membatalkan upload di Cloudinary:', err);
      }
    }
  }
}

// GET /author — Dashboard Kreator Pribadi
router.get('/', requireLogin, async (req, res) => {
  try {
    const comics = await Comic.find({ uploadedBy: req.session.user.id })
      .sort({ createdAt: -1 });

    const totals = comics.reduce((summary, comic) => {
      summary.comics += 1;
      summary.chapters += comic.chapters ? comic.chapters.length : 0;
      summary.views += comic.views || 0;
      return summary;
    }, { comics: 0, chapters: 0, views: 0 });
    totals.averageViews = totals.comics > 0 ? Math.round(totals.views / totals.comics) : 0;

    const topComic = comics.reduce((best, comic) => {
      if (!best || (comic.views || 0) > (best.views || 0)) return comic;
      return best;
    }, null);
    totals.topComicTitle = topComic ? topComic.title : '-';
    totals.topComicViews = topComic ? topComic.views || 0 : 0;

    res.render('author', {
      currentPath: '/author',
      comics,
      totals,
      user: req.session.user,
      creator: req.session.user, 
      toPublicImagePath,
      formatViews,              
      isPublicView: false        
    });
  } catch (err) {
    console.error('Error author dashboard:', err);
    res.status(500).send('Terjadi kesalahan pada server.');
  }
});

// POST /author/comics/:id/chapters — Tambah Chapter Baru ke Cloudinary
router.post('/comics/:id/chapters', requireLogin, (req, res) => {
  upload.array('chapterPages')(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).send(uploadErr.message || 'Gagal mengunggah gambar chapter.');
    }

    const files = req.files || [];

    try {
      const comic = await Comic.findOne({
        _id: req.params.id,
        uploadedBy: req.session.user.id
      });

      if (!comic) {
        await removeCloudinaryFiles(files);
        return res.status(404).send('Komik tidak ditemukan atau bukan milik Anda.');
      }

      if (req.body.status) {
        comic.status = req.body.status;
      }

      if (files.length === 0) {
        await comic.save();
        return res.redirect('/author');
      }

      const nextChapterNumber = comic.chapters.length > 0
        ? Math.max(...comic.chapters.map((chapter) => chapter.chapterNumber || 0)) + 1
        : 1;
      const chapterNumber = Number(req.body.chapterNumber || nextChapterNumber);
      const chapterTitle = req.body.chapterTitle || `Chapter ${chapterNumber}`;

      if (!chapterNumber || chapterNumber < 1) {
        await removeCloudinaryFiles(files);
        return res.status(400).send('Nomor chapter tidak valid.');
      }

      const duplicateChapter = comic.chapters.some((chapter) => chapter.chapterNumber === chapterNumber);
      if (duplicateChapter) {
        await removeCloudinaryFiles(files);
        return res.status(400).send('Nomor chapter sudah ada pada komik ini.');
      }

      comic.chapters.push({
        chapterNumber,
        title: chapterTitle,
        // 🔥 AMBIL LINK SECURE URL INTERNET DARI CLOUDINARY (file.path)
        pages: files.map((file) => file.path)
      });

      comic.chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
      await comic.save();
      res.redirect('/author');
    } catch (err) {
      await removeCloudinaryFiles(files);
      console.error('Error add chapter / update status:', err);
      if (err.name === 'CastError') {
        return res.status(404).send('Komik tidak ditemukan.');
      }

      res.status(500).send('Terjadi kesalahan saat memproses data.');
    }
  });
});

// POST /author/comics/:id/delete — Hapus Komik & Bersihkan Gambar di Cloudinary
router.post('/comics/:id/delete', requireLogin, async (req, res) => {
  try {
    const comic = await Comic.findOne({
      _id: req.params.id,
      uploadedBy: req.session.user.id
    });

    if (!comic) {
      return res.status(404).send('Komik tidak ditemukan atau bukan milik Anda.');
    }

    // 🔥 HAPUS COVER & HALAMAN CHAPTER DARI INTERNET CLOUDINARY
    await deleteCloudinaryImage(comic.coverImage);
    for (const chapter of comic.chapters) {
      for (const pageUrl of chapter.pages) {
        await deleteCloudinaryImage(pageUrl);
      }
    }

    await User.updateMany(
      { 'readHistory.comicId': comic._id },
      { $pull: { readHistory: { comicId: comic._id } } }
    );

    await Comic.deleteOne({ _id: comic._id });
    res.redirect('/author');
  } catch (err) {
    console.error('Error delete comic:', err);
    if (err.name === 'CastError') {
      return res.status(404).send('Komik tidak ditemukan.');
    }

    res.status(500).send('Terjadi kesalahan saat menghapus komik.');
  }
});

module.exports = router;