// routes/auth.js — Authentication Routes (Login & Register)
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Folder penyimpanan komik (tetap di luar)
const uploadDirKomik = path.join(__dirname, '..', 'foto');

// Folder penyimpanan khusus Avatar Profil User (di dalam public)
const uploadDirAvatar = path.join(__dirname, '..', 'public', 'avatar');
if (!fs.existsSync(uploadDirAvatar)) {
  fs.mkdirSync(uploadDirAvatar, { recursive: true });
}

// Konfigurasi Multer khusus untuk Avatar Profil
const storageAvatar = multer.diskStorage({
  destination: uploadDirAvatar,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `profile-${req.session.user.id}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const uploadAvatar = multer({
  storage: storageAvatar,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (jpeg, jpg, png, webp) yang diperbolehkan'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ============================================================
// GET /auth/login — Render login page
// ============================================================
router.get('/login', (req, res) => {
  res.render('login', { currentPath: '/auth/login' });
});

// ============================================================
// POST /auth/login — Handle login dengan email atau username
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    
    if (!emailOrUsername || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email/Username dan password harus diisi' 
      });
    }
    
    const user = await User.findOne({ 
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Email/Username atau password salah' 
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        error: 'Email/Username atau password salah' 
      });
    }
    
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar || null,
      role: user.role || 'user'
    };
    
    req.session.role = user.role || 'user';
    
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('Error Save Session Login:', saveErr);
        return res.status(500).json({
          success: false,
          error: 'Terjadi kesalahan saat menyimpan sesi login'
        });
      }

      res.json({ 
        success: true, 
        message: 'Login berhasil! Selamat datang', 
        user: req.session.user,
        role: user.role || 'user'
      });
    });
  } catch (err) {
    console.error('Error Login:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Terjadi kesalahan pada server' 
    });
  }
});

// ============================================================
// GET /auth/register — Render register page
// ============================================================
router.get('/register', (req, res) => {
  res.render('register', { currentPath: '/auth/register' });
});

// ============================================================
// POST /auth/register — Handle registrasi user baru
// ============================================================
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, confirmPassword } = req.body;
    
    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Semua field harus diisi' 
      });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password tidak cocok' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password harus minimal 6 karakter' 
      });
    }
    
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username sudah terdaftar' 
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Email sudah terdaftar' 
        });
      }
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      role: 'user'
    });
    
    await newUser.save();
    
    req.session.user = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      avatar: newUser.avatar || null,
      role: newUser.role
    };

    req.session.role = newUser.role;
    
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('Error Save Session Register:', saveErr);
        return res.status(500).json({
          success: false,
          error: 'Terjadi kesalahan saat menyimpan sesi login'
        });
      }

      res.json({ 
        success: true, 
        message: 'Registrasi berhasil! Anda sudah login otomatis.', 
        user: req.session.user,
        role: newUser.role,
        redirectTo: '/'
      });
    });
  } catch (err) {
    console.error('Error Register:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Terjadi kesalahan pada server' 
    });
  }
});

// ============================================================
// GET /auth/profile — Render profile page
// ============================================================
router.get('/profile', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  
  try {
    const user = await User.findById(req.session.user.id)
      .populate({
        path: 'readHistory.comicId',
        select: 'title coverImage'
      })
      .populate({
        path: 'bookmarks',
        select: 'title coverImage rating'
      });
    
    if (!user) {
      return res.redirect('/auth/login');
    }

    const sortedHistory = user.readHistory.sort((a, b) => 
      new Date(b.readAt) - new Date(a.readAt)
    );

    const userBookmarks = user.bookmarks || [];

    res.render('profile', { 
      currentPath: '/profile',
      readHistory: sortedHistory,
      bookmarks: userBookmarks, 
      user
    });
  } catch (err) {
    console.error('Error di Profile:', err);
    res.status(500).send('Terjadi kesalahan pada server.');
  }
});

// ============================================================
// GET /auth/profile/edit — Render form edit profil
// ============================================================
router.get('/profile/edit', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    const userDb = await User.findById(req.session.user.id);
    if (!userDb) {
      return res.redirect('/auth/login');
    }
    
    res.render('edit-profile', {
      currentPath: '/profile',
      user: req.session.user,
      userDb: userDb,
      error: null,
      success: null
    });
  } catch (err) {
    console.error('Error saat memuat halaman edit profil:', err);
    res.status(500).send('Terjadi kesalahan pada server.');
  }
});

// =========================================================================
// POST /auth/profile/edit — Proses Gabungan Teks & Upload Avatar
// =========================================================================
router.post('/profile/edit', uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    const { firstName, lastName, username, password } = req.body;
    const userDb = await User.findById(req.session.user.id);
    
    if (!userDb) {
      return res.redirect('/auth/login');
    }

    if (!firstName || !lastName || !username) {
      return res.render('edit-profile', {
        currentPath: '/profile',
        user: req.session.user,
        userDb,
        error: 'Nama dan Username tidak boleh kosong!',
        success: null
      });
    }
    
    if (username !== userDb.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.render('edit-profile', {
          currentPath: '/profile',
          user: req.session.user,
          userDb,
          error: 'Username sudah digunakan oleh orang lain!',
          success: null
        });
      }
      userDb.username = username;
    }
    
    userDb.firstName = firstName;
    userDb.lastName = lastName;
    
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.render('edit-profile', {
          currentPath: '/profile',
          user: req.session.user,
          userDb,
          error: 'Password baru harus minimal 6 karakter!',
          success: null
        });
      }
      userDb.password = await bcrypt.hash(password, 10);
    }

    if (req.file) {
      if (userDb.avatar && userDb.avatar.startsWith('/avatar/')) {
        const oldAvatarPath = path.join(__dirname, '..', 'public', userDb.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      userDb.avatar = `/avatar/${req.file.filename}`;
    }
    
    await userDb.save();
    
    req.session.user.username = userDb.username;
    req.session.user.firstName = userDb.firstName;
    req.session.user.lastName = userDb.lastName;
    req.session.user.avatar = userDb.avatar;
    
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('Error saat menyimpan session ter-update:', saveErr);
      }
      res.redirect('/auth/profile?status=success');
    });
    
  } catch (err) {
    console.error('Error saat memproses edit profil:', err);
    res.status(500).send('Terjadi kesalahan saat memperbarui profil.');
  }
});

// ============================================================
// [BARU] POST /auth/unbookmark/:id — Hapus dari daftar bookmark
// ============================================================
router.post('/unbookmark/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Harus login terlebih dahulu!' });
    }

    const comicId = req.params.id;
    const userId = req.session.user.id;

    // Menghapus item dari array bookmarks menggunakan operator $pull dari Mongoose
    const userDb = await User.findByIdAndUpdate(
      userId,
      { $pull: { bookmarks: comicId } },
      { new: true }
    );

    if (!userDb) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan!' });
    }

    return res.json({ success: true, message: 'Berhasil dihapus dari bookmark! 🗑️' });
  } catch (err) {
    console.error('Error saat menghapus bookmark:', err);
    return res.status(500).json({ success: false, message: 'Gagal memproses data penghapusan.' });
  }
});

// ============================================================
// GET /auth/logout — Logout user
// ============================================================
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Gagal logout' });
    }
    res.redirect('/');
  });
});

module.exports = router;