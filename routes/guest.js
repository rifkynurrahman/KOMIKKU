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

// 🛠️ UPDATE UTAMA: Menggunakan Consumet MangaDex API (Bukan Jikan MAL lagi)
const fetchExternalComics = async (keyword = 'Naruto') => {
  try {
    // Membaca konfigurasi endpoint Consumet dari .env kamu
    const apiBaseUrl = process.env.MANGA_API_URL || 'https://api.consumet.org/manga/mangadex';
    const response = await axios.get(`${apiBaseUrl}/${encodeURIComponent(keyword)}`);
    
    // Consumet biasanya mengembalikan object { results: [...] } atau langsung array
    const dataAPI = response.data.results || response.data || [];
    
    return dataAPI.map(comic => ({
      _id: comic.id, // ID string unik dari MangaDex (Contoh: "a1c2...")
      title: typeof comic.title === 'object' ? (comic.title.en || comic.title.ja || Object.values(comic.title)[0]) : comic.title,
      image: comic.image || '/img/no-cover.jpg',
      views: comic.views || Math.floor(Math.random() * 5000) + 1000, // Fallback views dummy agar estetik
      rating: comic.rating || '0.0',
      genres: comic.genres || [],
      status: comic.status || 'Ongoing',
      isFromApi: true // Penanda komik luar
    }));
  } catch (error) {
    console.error("Gagal mengambil data MangaDex API:", error.message);
    return [];
  }
};

// GET / — Beranda
router.get('/', async (req, res) => {
  try {
    const trending = await Comic.find().sort({ views: -1 }).limit(12);
    const terbaruLokal = await Comic.find().sort({ createdAt: -1 }).limit(6);
    
    // Ambil list komik luar populer untuk Beranda secara otomatis
    const komikLuar = await fetchExternalComics('One Piece');

    // Gabungkan data lokal dengan data luar
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
      terbaru,
      formatViews,
      user: req.session.user,
      stats: { totalViews, totalPembaca, totalKreator, totalKomik }
    });
  } catch (err) {
    console.error('Error di Beranda:', err);
    res.status(500).send('Terjadi kesalahan pada server.');
  }
});

// GET /browse
router.get('/browse', async (req, res) => {
  try {
    const { genre, q } = req.query;
    let query = {};

    if (genre) query.genres = genre; 
    if (q) query.title = { $regex: q, $options: 'i' };

    const filteredComics = await Comic.find(query).sort({ createdAt: -1 });

    let apiComics = [];
    if (q) {
      apiComics = await fetchExternalComics(q);
    } else {
      apiComics = await fetchExternalComics('Naruto');
    }

    if (genre) {
      apiComics = apiComics.filter(c => c.genres.some(g => g.toLowerCase() === genre.toLowerCase()));
    }

    const combinedComics = [...filteredComics, ...apiComics];

    res.render('browse', {
      currentPath: '/browse',
      comics: combinedComics,
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

// GET /komik/:id — Detail Komik Otomatis Menampilkan Daftar Chapter Nyata dari API Luar
router.get('/komik/:id', async (req, res) => {
  try {
    const comicId = req.params.id;

    // JIKA FORMAT ID BUKAN MONGOOSE OBJECTID (Artinya Komik Luar)
    if (!mongoose.Types.ObjectId.isValid(comicId)) {
      const apiBaseUrl = process.env.MANGA_API_URL || 'https://api.consumet.org/manga/mangadex';
      
      // Hit endpoint info detail komik berdasarkan ID unik MangaDex
      const response = await axios.get(`${apiBaseUrl}/info/${comicId}`);
      const comicData = response.data;

      if (!comicData) return res.status(404).send('Komik luar tidak ditemukan');

      const comic = {
        _id: comicData.id,
        title: typeof comicData.title === 'object' ? (comicData.title.en || comicData.title.ja || Object.values(comicData.title)[0]) : comicData.title,
        synopsis: comicData.description || 'Tidak ada sinopsis.',
        image: comicData.image || '/img/no-cover.jpg',
        rating: comicData.rating || '8.5',
        views: comicData.views || 2500,
        genres: comicData.genres || [],
        status: comicData.status || 'Ongoing',
        isFromApi: true,
        // Map data chapter bawaan API agar seragam dengan struktur looping kamu
        chapters: comicData.chapters ? comicData.chapters.map(ch => ({
          id: ch.id, // ID chapter unik dari MangaDex untuk dibaca gambarnya nanti
          chapterNumber: ch.chapterNumber || ch.number || '1',
          title: ch.title || `Chapter ${ch.chapterNumber || ch.number}`
        })) : []
      };

      return res.render('detail', { 
        currentPath: '', 
        comic, 
        similar: [], 
        formatViews,
        user: req.session.user 
      });
    }

    // JIKA FORMAT ID VALID MONGOOSE (Komik Lokal)
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

// GET /komik/:id/baca/:chapter — Reader Gambar Otomatis Dinamis Lokal & Luar
router.get('/komik/:id/baca/:chapter', async (req, res) => {
  try {
    const comicId = req.params.id;
    const chapterId = req.params.chapter; // Berisi nomor chapter (lokal) atau ID chapter string (API)

    // JIKA KOMIK LUAR (BACA GAMBAR VIA API)
    if (!mongoose.Types.ObjectId.isValid(comicId)) {
      const apiBaseUrl = process.env.MANGA_API_URL || 'https://api.consumet.org/manga/mangadex';
      
      // Ambil array data halaman gambar langsung dari server MangaDex
      const response = await axios.get(`${apiBaseUrl}/read/${chapterId}`);
      const pagesData = response.data || [];

      const chapter = {
        number: req.query.num || 'Baca',
        title: req.query.title || 'Chapter Komik Luar',
        // Ekstrak URL gambar langsung dari struktur response API Consumet
        pages: pagesData.map(p => ({ pageImage: p.image || p.img })) 
      };

      return res.render('read', { 
        currentPath: '', 
        comic: { _id: comicId, title: req.query.comicTitle || 'Komik Luar' }, 
        chapter, 
        allChapters: [], 
        user: req.session.user 
      });
    }

    // JIKA KOMIK LOKAL (BACA DARI DATABASE MONGODB KAMU)
    const comicData = await Comic.findById(comicId);
    if (!comicData) return res.status(404).send('Komik tidak ditemukan');

    const chNum = parseInt(chapterId);
    const chData = comicData.chapters.find(c => c.chapterNumber === chNum);
    if (!chData) return res.status(404).send('Chapter tidak ditemukan');

    // Menjaga riwayat baca user lokal
    if (req.session.user) {
      const user = await User.findById(req.session.user.id);
      if (user) {
        const existingEntry = user.readHistory.find(h => 
          h.comicId.toString() === comicId && h.chapterNumber === chNum
        );
        if (existingEntry) {
          existingEntry.readAt = new Date();
        } else {
          user.readHistory.push({
            comicId: comicId,
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
      // Struktur disesuaikan array object pageImage agar aman di read.ejs
      pages: chData.pages ? chData.pages.map(p => (typeof p === 'string' ? { pageImage: p } : p)) : [] 
    };
    const allChapters = comicData.chapters.map(c => ({ chapterNumber: c.chapterNumber, number: c.chapterNumber, title: c.title }));

    res.render('read', { currentPath: '', comic: comicData, chapter, allChapters, user: req.session.user });
  } catch (err) {
    console.error('Error di Reader Komik:', err);
    res.status(500).send('Terjadi kesalahan pada server.');
  }
});

// Autentikasi pintasan
router.get('/login', (req, res) => res.redirect('/auth/login'));
router.get('/register', (req, res) => res.redirect('/auth/register'));
router.get('/profile', (req, res) => res.redirect('/auth/profile'));
router.get('/logout', (req, res) => res.redirect('/auth/logout'));

router.post('/komik/:id/komentar', async (req, res) => {
  try {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Harus login' });
    const comic = await Comic.findById(req.params.id);
    if (!comic) return res.status(404).json({ success: false, message: 'Manga dari API luar tidak mendukung fitur komentar lokal saat ini.' });
    const newComment = { username: req.session.user.username, text: req.body.text, createdAt: new Date() };
    comic.comments.push(newComment);
    await comic.save();
    return res.json({ success: true, comment: newComment });
  } catch (err) { return res.status(500).json({ success: false }); }
});

module.exports = router;