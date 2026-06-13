// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const isAdmin = require('../middleware/isAdmin');

// Semua rute di bawah ini wajib Admin
router.use(isAdmin);

router.get('/', adminController.getDashboard);
router.get('/users', adminController.manageUsers);
router.post('/users/delete/:id', adminController.deleteUser);
router.get('/comics', adminController.manageComics);
router.post('/profile/internal', adminController.updateInternalProfile);

module.exports = router;