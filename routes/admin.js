// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const isAdmin = require('../middleware/isAdmin');

// Semua rute di bawah ini wajib Admin
router.use(isAdmin);

// Dashboard & Profil
router.get('/', adminController.getDashboard);
router.post('/profile/internal', adminController.updateInternalProfile);

// Manajemen User
router.get('/users', adminController.manageUsers);
router.post('/users/delete/:id', adminController.deleteUser);

// Manajemen Komik & Genre
router.get('/comics', adminController.manageComics);
router.post('/comics/delete/:id', adminController.deleteComic);
router.get('/genres', adminController.manageGenres);

/** 
 * TAMBAHAN: RUTE AKSES KREATOR 
 * Digunakan untuk melihat daftar user dan mengubah role mereka menjadi creator
 */
router.get('/creators', adminController.getCreatorAccess); // Menampilkan halaman Kelola Kreator
router.post('/creators/promote/:id', adminController.promoteToCreator); // Aksi tombol "Jadikan Kreator"

module.exports = router;