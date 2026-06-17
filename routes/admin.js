const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const isAdmin = require('../middleware/isAdmin');

// Middleware untuk memastikan hanya admin yang bisa akses
router.use(isAdmin);

// 1. Dashboard
router.get('/', adminController.getDashboard);

// 2. Profil Internal
router.post('/profile/internal', adminController.updateInternalProfile);

// 3. Manajemen User
router.get('/users', adminController.manageUsers);
router.post('/users/delete/:id', adminController.deleteUser);

// 4. Manajemen Komik & Genre
router.get('/comics', adminController.manageComics);
router.post('/comics/delete/:id', adminController.deleteComic);
router.get('/genres', adminController.manageGenres);

module.exports = router;