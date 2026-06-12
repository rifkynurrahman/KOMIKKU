// routes/guest.js
const express = require('express');
const router = express.Router();
const Comic = require('../models/Comic'); 
const { GENRES } = require('../data/dummyData'); 

// Fungsi pembantu untuk mengubah angka mentah (1200000) menjadi format ringkas (1.2JT)
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

router.get('/', async (req, res) => {
  try {
    // Mencari komik, diurutkan berdasarkan views terbanyak (-1), lalu ambil 12 teratas
    const trending = await Comic.find().sort({ views: -1 }).limit(12);
    
    res.render('index', {
      currentPath: '/',
      trending,
      formatViews // Kirim fungsi ini ke EJS agar bisa digunakan di template
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

    const filteredComics = await Comic.find(query);

    res.render('browse', {
      currentPath: '/browse',
      comics: filteredComics,
      genres: GENRES,
      activeGenre: genre || null,
      query: q || '',
      formatViews // Kirim fungsi ke browse.ejs juga
    });
  } catch (err) {
    console.error('Error di Browse:', err);
    res.status(500).send('Terjadi kesalahan pada server.');
  }
});

// GET /komik/:id — Detail komik
router.get('/komik/:id', async (req, res) => {
  try {
    const comicData = await Comic.findById(req.params.id);
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

    res.render('detail', { currentPath: '', comic, similar, formatViews });
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
    });
  } catch (err) {
    console.error('Error di Reader Komik:', err);
    res.status(500).send('Terjadi kesalahan pada server.');
  }
});


router.get('/login', (req, res) => res.render('login', { currentPath: '' }));
router.post('/login', (req, res) => { /* ... */ });
router.get('/register', (req, res) => res.render('register', { currentPath: '' }));
router.post('/register', (req, res) => { /* ... */ });

module.exports = router;