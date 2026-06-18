// routes/auth.js — Authentication Routes (Login, Register & Reset Password)
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto'); // 🔥 TAMBAHAN: Untuk generate token acak rahasia
const nodemailer = require('nodemailer'); // 🔥 TAMBAHAN: Untuk sistem pengiriman email
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
      role: user.role || 'creator' 
    };
    req.session.role = user.role || 'creator';
    
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
        role: user.role || 'creator'
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
      role: 'creator' 
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
        message: 'Registrasi berhasil! Anda sudah login otomatis sebagai Kreator.', 
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
// GET /auth/forgot-password — Render halaman lupa password (Direct dari /views)
// ============================================================
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { currentPath: '/auth/forgot-password' });
});

// ============================================================
// 🔥 [DIUBAH] POST /auth/forgot-password — Proses kirim email token reset (Aman dari Spasi & Case-Insensitive)
// ============================================================
router.post('/forgot-password', async (req, res) => {
  try {
    // Membersihkan spasi tak sengaja di awal atau akhir input email
    const emailInput = req.body.email ? req.body.email.trim() : '';
    
    if (!emailInput) {
      return res.status(400).send('Email wajib diisi.');
    }

    // Menggunakan RegExp '^...$' dengan flag 'i' agar pencarian bersifat case-insensitive
    const user = await User.findOne({ email: new RegExp('^' + emailInput + '$', 'i') });
    
    if (!user) {
      return res.send('Error: Alamat email tidak terdaftar di sistem kami.');
    }

    // Membuat token acak unik sepanjang 20 karakter hex
    const token = crypto.randomBytes(20).toString('hex');

    // Menyimpan token dan set kedaluwarsa 1 jam ke depan (3600000 ms)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    // Konfigurasi mailer (Pastikan isi EMAIL_USER & EMAIL_PASS di file .env kamu)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
      }
    });

    const resetUrl = `http://${req.headers.host}/auth/reset-password/${token}`;

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'KomikKu - Permintaan Reset Password',
      text: `Anda menerima email ini karena ada permintaan untuk mereset password akun Anda.\n\n` +
            `Silakan klik link di bawah ini atau tempel di browser Anda untuk melanjutkan:\n\n` +
            `${resetUrl}\n\n` +
            `Jika Anda tidak meminta ini, abaikan saja email ini.\n`
    };

    await transporter.sendMail(mailOptions);
    res.send('Sukses! Link reset password telah dikirim ke email Anda. Silakan periksa inbox/spam.');

  } catch (err) {
    console.error('Error Forgot Password:', err);
    res.status(500).send("Gagal memproses permintaan: " + err.message);
  }
});

// ============================================================
// GET /auth/reset-password/:token — Halaman bikin password baru (Direct dari /views)
// ============================================================
router.get('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() } // Memastikan waktu expired belum lewat
    });

    if (!user) {
      return res.send('Link reset password tidak valid atau sudah kedaluwarsa.');
    }

    res.render('reset-password', { token: req.params.token, currentPath: '/auth/reset-password' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ============================================================
// POST /auth/reset-password/:token — Simpan password baru ter-enkripsi
// ============================================================
router.post('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.send('Gagal: Token tidak valid atau kedaluwarsa.');
    }

    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.send('Gagal: Password baru minimal harus 6 karakter.');
    }

    // Mengenangkliripsi password baru menggunakan bcrypt sesuai standar registrasi awal
    user.password = await bcrypt.hash(password, 10);

    // Hapus kembali token dari database agar tidak bisa dipakai ulang
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.send('Selamat! Password berhasil diperbarui. Silakan kembali ke halaman login.');
  } catch (err) {
    console.error('Error Reset Password:', err);
    res.status(500).send(err.message);
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
// POST /auth/login — Handle login dengan perbaikan session
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    
    if (!emailOrUsername || !password) {
      return res.status(400).json({ success: false, error: 'Email/Username dan password harus diisi' });
    }
    
    const user = await User.findOne({ 
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, error: 'Email/Username atau password salah' });
    }
    
    // 🔥 PENTING: Regenerate session agar aman & pastikan session baru
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ success: false, error: 'Gagal mereset sesi' });

      req.session.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar || null,
        role: user.role || 'creator' 
      };
      
      // 🔥 PENTING: Wajib menunggu save selesai sebelum redirect/response
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Error Save Session:', saveErr);
          return res.status(500).json({ success: false, error: 'Gagal menyimpan sesi' });
        }
        res.json({ success: true, message: 'Login berhasil!', role: user.role });
      });
    });
  } catch (err) {
    console.error('Error Login:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;