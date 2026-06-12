const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Comic = require('../models/Comic');
const User = require('../models/User');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'foto');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${req.session.user.id}-${uniqueSuffix}${ext}`);
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
    fileSize: 5 * 1024 * 1024,
    files: 80
  }
});

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/profile?status=success');
  }

  next();
}

function toPublicImagePath(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
}

function deleteUploadedImage(imagePath) {
  if (!imagePath || imagePath.startsWith('http')) return;

  const normalized = imagePath.replace(/^\/+/, '');
  if (!normalized.startsWith('foto/')) return;

  const filePath = path.join(uploadDir, path.basename(normalized));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function removeUploadedFiles(files = []) {
  files.forEach((file) => {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
}

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
      toPublicImagePath
    });
  } catch (err) {
    console.error('Error author dashboard:', err);
    res.status(500).send('Terjadi kesalahan pada server.');
  }
});

router.post('/comics/:id/chapters', requireLogin, (req, res) => {
  upload.array('chapterPages', 80)(req, res, async (uploadErr) => {
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
        removeUploadedFiles(files);
        return res.status(404).send('Komik tidak ditemukan atau bukan milik Anda.');
      }

      const nextChapterNumber = comic.chapters.length > 0
        ? Math.max(...comic.chapters.map((chapter) => chapter.chapterNumber || 0)) + 1
        : 1;
      const chapterNumber = Number(req.body.chapterNumber || nextChapterNumber);
      const chapterTitle = req.body.chapterTitle || `Chapter ${chapterNumber}`;

      if (!chapterNumber || chapterNumber < 1) {
        removeUploadedFiles(files);
        return res.status(400).send('Nomor chapter tidak valid.');
      }

      const duplicateChapter = comic.chapters.some((chapter) => chapter.chapterNumber === chapterNumber);
      if (duplicateChapter) {
        removeUploadedFiles(files);
        return res.status(400).send('Nomor chapter sudah ada pada komik ini.');
      }

      if (files.length === 0) {
        return res.status(400).send('Tambahkan minimal satu gambar halaman.');
      }

      comic.chapters.push({
        chapterNumber,
        title: chapterTitle,
        pages: files.map((file) => `/foto/${file.filename}`)
      });

      comic.chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
      await comic.save();
      res.redirect('/author');
    } catch (err) {
      removeUploadedFiles(files);
      console.error('Error add chapter:', err);
      if (err.name === 'CastError') {
        return res.status(404).send('Komik tidak ditemukan.');
      }

      res.status(500).send('Terjadi kesalahan saat menambahkan chapter.');
    }
  });
});

router.post('/comics/:id/delete', requireLogin, async (req, res) => {
  try {
    const comic = await Comic.findOne({
      _id: req.params.id,
      uploadedBy: req.session.user.id
    });

    if (!comic) {
      return res.status(404).send('Komik tidak ditemukan atau bukan milik Anda.');
    }

    deleteUploadedImage(comic.coverImage);
    comic.chapters.forEach((chapter) => {
      chapter.pages.forEach(deleteUploadedImage);
    });

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
