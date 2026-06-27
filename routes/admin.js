const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const isAdmin = require('../middleware/isAdmin');
const Report = require('../models/Report');
const Setting = require('../models/Setting');

// Middleware Global: Semua rute di file ini wajib Admin
router.use(isAdmin);

// 1. Dashboard Utama Admin
router.get('/', adminController.getDashboard);

// 2. Profil Internal Admin
router.post('/profile/internal', adminController.updateInternalProfile);

// 3. Manajemen User (Tabel User)
router.get('/users', adminController.manageUsers);
router.post('/users/delete/:id', adminController.deleteUser);

// 4. Manajemen Komik & Genre
router.get('/comics', adminController.manageComics);
router.post('/comics/delete/:id', adminController.deleteComic);
router.get('/genres', adminController.manageGenres);

// 5. FITUR LAPORAN KONTEN (BARU)
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('comicId')
      .populate('reporterId')
      .sort({ createdAt: -1 });
    res.render('admin/reports', { reports, user: req.session.user });
  } catch (err) { 
    res.status(500).send("Error Laporan: " + err.message); 
  }
});

router.post('/reports/resolve/:id', async (req, res) => {
  try {
    await Report.findByIdAndUpdate(req.params.id, { status: 'Resolved' });
    res.redirect('/admin/reports');
  } catch (err) { 
    res.status(500).send(err.message); 
  }
});

// 6. FITUR PENGATURAN SISTEM (BARU)
router.get('/settings', async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({}); 
    res.render('admin/settings', { settings, user: req.session.user });
  } catch (err) { 
    res.status(500).send("Error Pengaturan: " + err.message); 
  }
});

router.post('/settings/update', async (req, res) => {
  try {
    const { siteName, announcement, maintenanceMode, contactEmail } = req.body;
    await Setting.findOneAndUpdate({}, { 
      siteName, 
      announcement, 
      contactEmail,
      maintenanceMode: maintenanceMode === 'true' 
    }, { upsert: true });
    res.redirect('/admin/settings');
  } catch (err) { 
    res.status(500).send(err.message); 
  }
});

module.exports = router;