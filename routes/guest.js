// routes/guest.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // 🟢 BARU: Diperlukan untuk validasi & casting ObjectId
const Comic = require('../models/Comic');
const User = require('../models/User');
const { GENRES } = require('../data/dummyData'); 

// Fungsi pembantu untuk mengubah angka mentah menjadi format ringkas (1.2JT)
const formatViews = (num) => {
  if (!num) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'JT';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'RB';
  }
  return num.toString();
};

// GET / — Beranda (REAL-TIME TRENDING + TERBARU)
router.get('/', async (req, res) => {
  try {
    const trending = await Comic.find().sort({ views: -1 }).limit(12);
    const terbaru = await Comic.find().sort({ createdAt: -1 }).limit(6);
    const totalKomik = await Comic.countDocuments({});
    const totalPembaca = await User.countDocuments({});

    const viewsAggregate = await Comic.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" }
        }
      }
    ]);
    const totalViews = viewsAggregate.length > 0 ? viewsAggregate[0].totalViews : 0;
    
    // 🛠️ Mengubah 'author' menjadi 'uploadedBy' agar perhitungan jumlah kreator real-time akurat
    const totalKreator = await Comic.distinct('uploadedBy').then(authors => authors.length) || 0; 

    res.render('index', {
      currentPath: '/',
      trending,
      terbaru, 
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

// GET /komik/:id — Detail komik (FIXED WARNING DEPRECATION & POPULATE)
router.get('/komik/:id', async (req, res) => {
  try {
    const comicData = await Comic.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { returnDocument: 'after' } 
    ).populate('uploadedBy', 'username firstName lastName avatar');

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

// Rute Pengalihan Autentikasi
router.get('/login', (req, res) => res.redirect('/auth/login'));
router.get('/register', (req, res) => res.redirect('/auth/register'));
router.get('/profile', (req, res) => res.redirect('/auth/profile'));
router.get('/logout', (req, res) => res.redirect('/auth/logout'));


// =======================================================
// FITUR INTERAKSI USER (MENGGUNAKAN API JSON RESPONSE)
// =======================================================

// 1. RUTE KOMENTAR (Sudah OK)
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

// 2. RUTE RATING (🛠️ DIUBAH TOTAL: SEKARANG MENGHITUNG RATA-RATA DENGAN AKURAT)
router.post('/komik/:id/rate', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, message: 'Harus login terlebih dahulu!' });
    }

    const comicId = req.params.id;
    const { score } = req.body;
    const userId = req.session.user.id || req.session.user._id;

    const comic = await Comic.findById(comicId);
    if (!comic) {
      return res.status(404).json({ success: false, message: 'Komik tidak ditemukan!' });
    }

    // Pastikan array penampung sub-document ratings tersedia
    if (!comic.ratings) comic.ratings = [];

    // Cek apakah user bersangkutan sudah pernah memberikan rating di komik ini
    const existingRatingIndex = comic.ratings.findIndex(r => r.userId && r.userId.toString() === userId.toString());

    if (existingRatingIndex > -1) {
      // Jika sudah ada, timpa skor lamanya dengan skor inputan baru
      comic.ratings[existingRatingIndex].score = parseFloat(score);
    } else {
      // Jika belum ada riwayat, push data penilai baru ke dalam array
      comic.ratings.push({ userId: userId, score: parseFloat(score) });
    }

    // Hitung akumulasi nilai rata-rata (Total Skor / Jumlah Pemberi Rating)
    const totalScore = comic.ratings.reduce((sum, item) => sum + item.score, 0);
    const averageRating = totalScore / comic.ratings.length;

    // Masukkan ke field string utama dalam format satu angka desimal (Contoh: "4.5")
    comic.rating = averageRating.toFixed(1);
    await comic.save();

    return res.json({ 
      success: true, 
      message: 'Terima kasih atas rating yang kamu berikan! ⭐', 
      newRating: comic.rating 
    });
  } catch (err) {
    console.error('Error saat rating:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server saat menyimpan rating.' });
  }
});

// 3. RUTE BOOKMARK (DIUBAH MENJADI POST & MENGGUNAKAN API RESPONSE)
router.post('/komik/:id/bookmark', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, message: 'Harus login terlebih dahulu!' });
    }

    const comicId = req.params.id;
    const userId = req.session.user.id || req.session.user._id;
    const userDb = await User.findById(userId);
    
    if (!userDb) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan di database!' });
    }

    if (!userDb.bookmarks) userDb.bookmarks = [];

    if (userDb.bookmarks.includes(comicId)) {
      return res.status(400).json({ success: false, message: 'Komik ini sudah ada di daftar bookmark kamu!' });
    }

    userDb.bookmarks.push(comicId);
    await userDb.save();

    return res.json({ success: true, message: 'Berhasil ditambahkan ke daftar Bookmark! 📌' });
  } catch (err) {
    console.error('Error saat bookmark:', err);
    return res.status(500).json({ success: false, message: 'Gagal memproses penambahan data ke bookmark.' });
  }
});

// DETAIL KREATOR / PUBLIC VIEW (🛠️ DIUBAH LOGIKA QUERY NYA AGAR TERDITEKSI MENGGUNAKAN OBJECTID)
router.get('/creator/:id', async (req, res) => {
    try {
        const creatorId = req.params.id;
        
        const creator = await User.findById(creatorId);
        if (!creator) return res.status(404).send('Kreator tidak ditemukan');

        // Cast string parameter ID dari URL menjadi Mongoose ObjectId asli agar query pencocokan .find() akurat
        let queryId;
        if (mongoose.Types.ObjectId.isValid(creatorId)) {
            queryId = new mongoose.Types.ObjectId(creatorId);
        } else {
            queryId = creatorId;
        }

        // Ambil data komik menggunakan queryId hasil konversi
        const comics = await Comic.find({ uploadedBy: queryId });

        let totalViews = 0;
        let totalChapters = 0;
        let topComicTitle = '-';
        let topComicViews = 0;

        comics.forEach(comic => {
            const views = comic.views || 0;
            totalViews += views;
            totalChapters += (comic.chapters ? comic.chapters.length : 0);

            if (views >= topComicViews) {
                topComicViews = views;
                topComicTitle = comic.title;
            }
        });

        const averageViews = comics.length > 0 ? Math.round(totalViews / comics.length) : 0;

        const totals = {
            comics: comics.length,
            chapters: totalChapters,
            views: totalViews,
            averageViews: averageViews,
            topComicTitle: topComicTitle,
            topComicViews: topComicViews
        };

        const localFormatViews = (num) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'JT';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'RB';
            return num.toString();
        };

        res.render('author', {
            creator: creator,
            comics: comics,
            totals: totals,          
            formatViews: localFormatViews, 
            isPublicView: true,       
            user: req.session.user || null 
        });

    } catch (error) {
        console.error("Error pada halaman creator public view:", error);
        res.status(500).send("Server Error");
    }
});

const Report = require('../models/Report');

// Endpoint User melapor komik
router.post('/komik/:id/report', async (req, res) => {
  if (!req.session.user) return res.json({ success: false, message: 'Harus login dulu!' });
  try {
    await Report.create({
      comicId: req.params.id,
      reporterId: req.session.user.id,
      reason: req.body.reason
    });
    res.json({ success: true, message: 'Laporan kamu sudah diterima admin.' });
  } catch (err) {
    res.json({ success: false, message: 'Gagal mengirim laporan.' });
  }
});

module.exports = router;