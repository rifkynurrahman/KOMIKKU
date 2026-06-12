// routes/auth.js — Authentication Routes (Login & Register)
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

const uploadDir = path.join(__dirname, '..', 'foto');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${req.session.user.id}-${Date.now()}${ext}`;
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
    
    // Validasi input
    if (!emailOrUsername || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email/Username dan password harus diisi' 
      });
    }
    
    // Cari user berdasarkan email ATAU username
    const user = await User.findOne({ 
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Email/Username atau password salah' 
      });
    }
    
    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        error: 'Email/Username atau password salah' 
      });
    }
    
    // Set session user
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar || null
    };
    
    // TODO: Implementasi session/JWT di sini nanti
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
        user: req.session.user
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
    
    // Validasi input
    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Semua field harus diisi' 
      });
    }
    
    // Cek password cocok
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password tidak cocok' 
      });
    }
    
    // Validasi panjang password (minimal 6 karakter)
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password harus minimal 6 karakter' 
      });
    }
    
    // Cek apakah username/email sudah terdaftar
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
    
    // Hash password dengan salt 10
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Buat user baru
    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword
    });
    
    // Simpan ke database
    await newUser.save();
    
    // Set session langsung setelah register (auto-login)
    req.session.user = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      avatar: newUser.avatar || null
    };
    
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
    // Ambil user dari database dengan populate history komik
    const user = await User.findById(req.session.user.id).populate({
      path: 'readHistory.comicId',
      select: 'title coverImage'
    });
    
    if (!user) {
      return res.redirect('/auth/login');
    }

    // Urutkan history berdasarkan waktu baca terbaru
    const sortedHistory = user.readHistory.sort((a, b) => 
      new Date(b.readAt) - new Date(a.readAt)
    );
    res.render('profile', { 
      currentPath: '/profile',
      readHistory: sortedHistory,
      user
    });
  } catch (err) {
    console.error('Error di Profile:', err);
    res.status(500).send('Terjadi kesalahan pada server.');
  }
});

// ============================================================
// POST /auth/profile/avatar — Upload user avatar
// ============================================================
router.post('/profile/avatar', upload.single('avatar'), async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  if (!req.file) {
    return res.status(400).send('Tidak ada file yang diunggah.');
  }

  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.redirect('/auth/login');
    }

    if (user.avatar) {
      const oldAvatarPath = path.join(uploadDir, path.basename(user.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    user.avatar = `/foto/${req.file.filename}`;
    await user.save();

    req.session.user.avatar = user.avatar;
    res.redirect('/auth/profile');
  } catch (err) {
    console.error('Error upload avatar:', err);
    res.status(500).send('Terjadi kesalahan saat mengunggah foto.');
  }
});

// ============================================================
// POST /auth/profile/avatar/delete — Remove user avatar
// ============================================================
router.post('/profile/avatar/delete', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.redirect('/auth/login');
    }

    if (user.avatar) {
      const oldAvatarPath = path.join(uploadDir, path.basename(user.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    user.avatar = null;
    await user.save();

    if (req.session.user) {
      req.session.user.avatar = null;
    }

    res.redirect('/auth/profile');
  } catch (err) {
    console.error('Error delete avatar:', err);
    res.status(500).send('Terjadi kesalahan saat menghapus foto.');
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
