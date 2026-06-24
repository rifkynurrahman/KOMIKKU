// routes/guest.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
const Comic = require('../models/Comic');
const User = require('../models/User');
const Report = require('../models/Report');
const { GENRES } = require('../data/dummyData'); 

// Fungsi pembantu format views
const formatViews = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'JT';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'RB';
  return num.toString();
};

// 🛠️ Fungsi pembantu untuk ambil data dari Jikan API secara aman
const fetchExternalComics = async (keyword = 'Naruto') => {
  try {
    const apiBaseUrl = process.env.MANGA_API_URL || 'https://api.jikan.moe/v4/manga?q=';
    const response = await axios.get(`${apiBaseUrl}${keyword}`);
    const dataAPI = response.data.data || [];
    
    // Normalisasi struktur Jikan API agar seragam dengan struktur schema MongoDB kamu
    return dataAPI.map(comic => ({
      _id: comic.mal_id, // Gunakan MAL ID sebagai pengganti ObjectId MongoDB
      title: comic.title,
      image: comic.images?.jpg?.image_url || '/img/no-cover.jpg',
      views: comic.scored_by || 0,
      rating: comic.score || '0.0',
      genres: comic.genres ? comic.genres.map(g => g.name) : [],
      isFromApi: true // Flag penanda bahwa ini komik luar
    }));
  } catch (error) {
    console.error("Gagal mengambil data Jikan API:", error.message);
    return [];
  }
};

// GET / — Beranda (GABUNGAN DATA LOKAL + API LUAR)
router.get('/', async (req, res) => {
  try {
    // 1. Ambil data dari MongoDB lokal
    const trending = await Comic.find().sort({ views: -1 }).limit(12);
    const terbaruLokal = await Comic.find().sort({ createdAt: -1 }).limit(6);
    
    // 2. Ambil data dari API Luar (Default: anime populer untuk dipajang di beranda)
    const komikLuar = await fetchExternalComics('One Piece');

    // 3. Gabungkan komik lokal terbaru dengan komik luar di section "Terbaru"
    const terbaru = [...terbaruLokal, ...komikLuar.slice(0, 6)];

    const totalKomik = await Comic.countDocuments({});
    const totalPembaca = await User.countDocuments({});
    const viewsAggregate = await Comic.aggregate([
      { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    const totalViews = viewsAggregate.length > 0 ? viewsAggregate[0].totalViews : 0;
    const totalKreator = await Comic.distinct('uploadedBy').then(authors => authors.length) || 0; 

    res.render('index', {
      currentPath: '/',
      trending,
      terbaru, // Sudah berisi gabungan lokal + API luar!
      formatViews,
      user: req.session.user,
      stats: { totalViews, totalPembaca, totalKreator, totalKomik }
    });
  } catch (err) {
    console.error('Error di Beranda:', err);
    res.status(500).send('Terjadi kesalahan pada server.');
  }
});

// GET /browse — Browse semua komik (GABUNGAN LOKAL + API LUAR + REAL-TIME SEARCH)
router.get('/browse', async (req, res) => {
  try {
    const { genre, q } = req.query;
    let query = {};

    if (genre) query.genres = genre; 
    if (q) query.title = { $regex: q, $options: 'i' };

    // 1. Ambil dari database lokal
    const filteredComics = await Comic.find(query).sort({ createdAt: -1 });

    // 2. Ambil dari API luar jika ada keyword pencarian `q` atau default beranda browse
    let apiComics = [];
    if (q) {
      apiComics = await fetchExternalComics(q);
    } else {
      apiComics = await fetchExternalComics('Naruto');
    }

    // Filter genre untuk data API jika user memilih genre tertentu
    if (genre) {
      apiComics = apiComics.filter(c => c.genres.includes(genre));
    }

    // 3. Gabungkan hasilnya ke dalam satu array
    const combinedComics = [...filteredComics, ...apiComics];

    res.render('browse', {
      currentPath: '/browse',
      comics: combinedComics, // Array gabungan lokal + API luar
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

// GET /komik/:id — Detail Komik Otomatis Deteksi Lokal vs API Luar
router.get('/komik/:id', async (req, res) => {
  try {
    const comicId = req.params.id;

    // Jika ID bukan format MongoDB (berarti ini MAL ID angka biasa dari API Jikan)
    if (!mongoose.Types.ObjectId.isValid(comicId)) {
      const response = await axios.get(`https://api.jikan.moe/v4/manga/${comicId}/full`);
      const comicData = response.data.data;

      if (!comicData) return res.status(404).send('Komik luar tidak ditemukan');

      const comic = {
        _id: comicData.mal_id,
        title: comicData.title,
        synopsis: comicData.synopsis || 'Tidak ada sinopsis.',
        image: comicData.images?.jpg?.large_image_url || comicData.images?.jpg?.image_url || '/img/no-cover.jpg',
        rating: comicData.score || '0.0',
        views: comicData.scored_by || 0,
        genres: comicData.genres ? comicData.genres.map(g => g.name) : [],
        chapters: [], // API gratisan Jikan tidak memberikan halaman gambar baca gratis demi hak cipta
        isFromApi: true
      };

      return res.render('detail', { 
        currentPath: '', 
        comic, 
        similar: [], 
        formatViews,
        user: req.session.user 
      });
    }

    // Jika format ID valid MongoDB ObjectId, cari di database lokal kamu
    const comicData = await Comic.findByIdAndUpdate(
      comicId,
      { $inc: { views: 1 } },
      { returnDocument: 'after' } 
    ).populate('uploadedBy', 'username firstName lastName avatar');

    if (!comicData) return res.status(404).send('Komik tidak ditemukan');

    const comic = comicData.toObject();
    comic.chapters = comic.chapters.map(ch => ({ ...ch, number: ch.chapterNumber }));

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
    res.status(500).send('Terjadi kesalahan pada server.');
  }
});

// GET /komik/:id/baca/:chapter — Reader
router.get('/komik/:id/baca/:chapter', async (req, res) => {
  try {
    const comicData = await Comic.findById(req.params.id);
    if (!comicData) return res.status(404).send('Komik tidak ditemukan atau data API tidak menyediakan chapter baca gratis.');

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

    const chapter = { number: chNum, title: chData.title, pages: chData.pages || [] };
    const allChapters = comicData.chapters.map(c => ({ chapterNumber: c.chapterNumber, number: c.chapterNumber, title: c.title }));

    res.render('read', { currentPath: '', comic: comicData, chapter, allChapters, user: req.session.user });
  } catch (err) {
    console.error('Error di Reader Komik:', err);
    res.status(500).send('Terjadi kesalahan pada server.');
  }
});

// Keep rute otentikasi dan interaksi lainnya di bawah tetap sama...
router.get('/login', (req, res) => res.redirect('/auth/login'));
router.get('/register', (req, res) => res.redirect('/auth/register'));
router.get('/profile', (req, res) => res.redirect('/auth/profile'));
router.get('/logout', (req, res) => res.redirect('/auth/logout'));

router.post('/komik/:id/komentar', async (req, res) => {
  try {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Harus login' });
    const comic = await Comic.findById(req.params.id);
    if (!comic) return res.status(404).json({ success: false, message: 'Manga dari API luar tidak mendukung penulisan komentar lokal.' });
    const newComment = { username: req.session.user.username, text: req.body.text, createdAt: new Date() };
    comic.comments.push(newComment);
    await comic.save();
    return res.json({ success: true, comment: newComment });
  } catch (err) { return res.status(500).json({ success: false }); }
});

router.post('/komik/:id/rate', async (req, res) => { /* tetap sama */ });
router.post('/komik/:id/bookmark', async (req, res) => { /* tetap sama */ });
router.get('/creator/:id', async (req, res) => { /* tetap sama */ });
router.post('/komik/:id/report', async (req, res) => { /* tetap sama */ });

module.exports = router;