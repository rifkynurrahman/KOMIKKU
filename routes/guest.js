// routes/guest.js
const express = require('express');
const router = express.Router();
const Comic = require('../models/Comic');
const User = require('../models/User');
const { GENRES } = require('../data/dummyData'); 

// Fungsi pembantu untuk mengubah angka mentah menjadi format ringkas (1.2JT)
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

// GET / — Beranda (UPDATE: REAL-TIME TRENDING + TERBARU)
router.get('/', async (req, res) => {
  try {
    // 1. Ambil 12 komik trending berdasarkan views terbanyak
    const trending = await Comic.find().sort({ views: -1 }).limit(12);

    // [PERBAIKAN] 2. Ambil 6 komik terbaru berdasarkan input waktu (Biar komik baru lgsg muncul)
    const terbaru = await Comic.find().sort({ createdAt: -1 }).limit(6);

    // 3. Hitung total komik riil di database
    const totalKomik = await Comic.countDocuments({});

    // 4. Hitung total akun pembaca yang terdaftar di database
    const totalPembaca = await User.countDocuments({});

    // 5. Hitung total akumulasi views dari seluruh komik yang ada (Menggunakan Aggregation)
    const viewsAggregate = await Comic.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" }
        }
      }
    ]);
    const totalViews = viewsAggregate.length > 0 ? viewsAggregate[0].totalViews : 0;

    // 6. Hitung total kreator
    const totalKreator = await Comic.distinct('author').then(authors => authors.length) || 12; 

    // Render ke index.ejs sambil mengirimkan variabel statistik & komik terbaru
    res.render('index', {
      currentPath: '/',
      trending,
      terbaru, // <-- Variabel baru dikirim ke index.ejs
      formatViews,
      user: req.session.user,
      stats: {
        totalViews,
        totalPembaca,
        totalKreator,
        totalKomik
      }
    });
  } catch (err) {
    console.error('Error di Beranda:', err);
    res.status(500).send('Terjadi kesalahan pada server.');
  }
});

// GET /browse — Browse semua komik
router.get('/browse', async (req, res) => {
  try {
    const { genre, q } = req.query;
    let query = {};

    if (genre) query.genres = genre; 
    if (q) query.title = { $regex: q, $options: 'i' };

    // Ditambahkan sort agar komik terbaru di menu browse berada di posisi paling atas
    const filteredComics = await Comic.find(query).sort({ createdAt: -1 });

    res.render('browse', {
      currentPath: '/browse',
      comics: filteredComics,
      genres: GENRES,
      activeGenre: genre || null,
      query: q || '',
      formatViews,
      user: req.session.user 
    });
  } catch (err) {
    console.error('Error di Browse:', err);
    res.status(500).send('Terjadi kesalahan pada server.');
  }
});

// GET /komik/:id — Detail komik
router.get('/komik/:id', async (req, res) => {
  try {
    const comicData = await Comic.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!comicData) return res.status(404).send('Komik tidak ditemukan');

    const comic = comicData.toObject();
    comic.chapters = comic.chapters.map(ch => ({
      ...ch,
      number: ch.chapterNumber
    }));

    const similar = await Comic.find({
      genres: { $in: comic.genres },
      _id: { $ne: comic._id }
    }).limit(4);

    res.render('detail', { 
      currentPath: '', 
      comic, 
      similar, 
      formatViews,
      user: req.session.user 
    });
  } catch (err) {
    console.error('Error di Detail Komik:', err);
    if (err.name === 'CastError') return res.status(404).send('Komik tidak ditemukan');
    res.status(500).send('Terjadi kesalahan pada server.');
  }
});

// GET /komik/:id/baca/:chapter — Reader
router.get('/komik/:id/baca/:chapter', async (req, res) => {
  try {
    const comicData = await Comic.findById(req.params.id);
    if (!comicData) return res.status(404).send('Komik tidak ditemukan');

    const chNum = parseInt(req.params.chapter);
    const chData = comicData.chapters.find(c => c.chapterNumber === chNum);
    if (!chData) return res.status(404).send('Chapter tidak ditemukan');

    if (req.session.user) {
      const User = require('../models/User');
      const user = await User.findById(req.session.user.id);
      if (user) {
        const existingEntry = user.readHistory.find(h => 
          h.comicId.toString() === req.params.id && h.chapterNumber === chNum
        );
        if (existingEntry) {
          existingEntry.readAt = new Date();
        } else {
          user.readHistory.push({
            comicId: req.params.id,
            comicTitle: comicData.title,
            chapterNumber: chNum,
            readAt: new Date()
          });
        }
        await user.save();
      }
    }

    const chapter = {
      number: chNum,
      title: chData.title,
      pages: chData.pages || [],
    };

    const allChapters = comicData.chapters.map(c => ({
      chapterNumber: c.chapterNumber,
      number: c.chapterNumber,
      title: c.title
    }));

    res.render('read', {
      currentPath: '',
      comic: comicData,
      chapter,
      allChapters,
      user: req.session.user 
    });
  } catch (err) {
    console.error('Error di Reader Komik:', err);
    res.status(500).send('Terjadi kesalahan pada server.');
  }
});

// Rute Login & Register — redirect ke auth routes
router.get('/login', (req, res) => {
  res.redirect('/auth/login');
});

router.get('/register', (req, res) => {
  res.redirect('/auth/register');
});

// Redirect profile & logout ke auth routes
router.get('/profile', (req, res) => {
  res.redirect('/auth/profile');
});

router.get('/logout', (req, res) => {
  res.redirect('/auth/logout');
});

// =======================================================
// FITUR INTERAKSI USER (KOMENTAR, RATING, BOOKMARK)
// =======================================================

// 1. RUTE KOMENTAR
router.post('/komik/:id/komentar', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, message: 'Harus login terlebih dahulu' });
    }

    const comicId = req.params.id;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Komentar tidak boleh kosong' });
    }
    
    const comic = await Comic.findById(comicId);
    if (!comic) {
      return res.status(404).json({ success: false, message: 'Komik tidak ditemukan' });
    }

    const newComment = {
      username: req.session.user.username,
      text: text,
      createdAt: new Date()
    };

    if (!comic.comments) comic.comments = [];
    comic.comments.push(newComment);
    await comic.save();

    return res.json({ success: true, comment: newComment });

  } catch (err) {
    console.error('Error saat menyimpan komentar:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// 2. RUTE RATING (POST /komik/:id/rate)
router.post('/komik/:id/rate', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.send('<script>alert("Harus login terlebih dahulu!"); window.history.back();</script>');
    }

    const comicId = req.params.id;
    const { score } = req.body;

    const comic = await Comic.findById(comicId);
    if (!comic) {
      return res.send('<script>alert("Komik tidak ditemukan!"); window.history.back();</script>');
    }

    comic.rating = parseFloat(score).toFixed(1);
    await comic.save();

    return res.send('<script>alert("Terima kasih atas ratingnya!"); window.location.href="/komik/' + comicId + '";</script>');

  } catch (err) {
    console.error('Error saat rating:', err);
    return res.send('<script>alert("Gagal memberi rating!"); window.history.back();</script>');
  }
});

// 3. RUTE BOOKMARK (GET /komik/:id/bookmark)
router.get('/komik/:id/bookmark', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.send('<script>alert("Harus login terlebih dahulu!"); window.history.back();</script>');
    }

    const comicId = req.params.id;
    const User = require('../models/User'); 

    const userId = req.session.user.id || req.session.user._id;
    const userDb = await User.findById(userId);
    
    if (!userDb) {
      return res.send('<script>alert("User tidak ditemukan di database!"); window.history.back();</script>');
    }

    if (!userDb.bookmarks) userDb.bookmarks = [];

    if (userDb.bookmarks.includes(comicId)) {
      return res.send('<script>alert("Komik ini sudah ada di daftar bookmark kamu!"); window.history.back();</script>');
    }

    userDb.bookmarks.push(comicId);
    await userDb.save();

    return res.send('<script>alert("Berhasil menambahkan ke Bookmark!"); window.location.href="/komik/' + comicId + '";</script>');

  } catch (err) {
    console.error('Error saat bookmark:', err);
    return res.send('<script>alert("Gagal menambahkan bookmark! Pastikan field `bookmarks` bertipe array di model User kalian."); window.history.back();</script>');
  }
});

module.exports = router;