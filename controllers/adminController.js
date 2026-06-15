// controllers/adminController.js
const User = require('../models/User');
const Comic = require('../models/Comic');
const bcrypt = require('bcrypt');

exports.getDashboard = async (req, res) => {
    try {
        const totalUser = await User.countDocuments();
        // PERBAIKAN: Hitung dari koleksi Comic, bukan User
        const totalComic = await Comic.countDocuments(); 
        res.render('admin/dashboard', { 
            user: req.session.user,
            stats: { totalUser, totalComic },
            currentPath: '/admin' 
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.manageUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        // Password akan terkirim secara otomatis (dalam bentuk hash) 
        // karena di skema Mongoose biasanya tidak di-exclude secara default
        res.render('admin/users', { user: req.session.user, users, currentPath: '/admin/users' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.redirect('/admin/users');
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.manageComics = async (req, res) => {
    try {
        // Mengambil semua komik dan data usernya
        const comics = await Comic.find().populate('uploadedBy');
        res.render('admin/comics', { 
            user: req.session.user, 
            comics: comics || [], // Jaga-jaga jika null, kirim array kosong
            currentPath: '/admin/comics' 
        });
    } catch (err) {
        console.error("Error Manage Comics:", err);
        res.status(500).send("Gagal memuat daftar komik: " + err.message);
    }
};

exports.getCreatorAccess = async (req, res) => {
    try {
        // Mengambil semua user untuk dikelola hak aksesnya
        const users = await User.find().sort({ role: 1 }); 
        res.render('admin/creators', { 
            user: req.session.user, 
            users, 
            currentPath: '/admin/creators' 
        });
    } catch (err) {
        res.status(500).send("Gagal memuat halaman akses kreator: " + err.message);
    }
};

exports.makeCreator = async (req, res) => {
    try {
        const { id } = req.params;
        // Update role user menjadi 'creator'
        await User.findByIdAndUpdate(id, { role: 'creator' });
        res.redirect('/admin/creators?status=promoted');
    } catch (err) {
        res.status(500).send("Gagal mengubah role: " + err.message);
    }
};

exports.updateInternalProfile = async (req, res) => {
    try {
        const { email, password } = req.body;
        const updateData = { email };
        
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await User.findByIdAndUpdate(req.session.user.id, updateData);
        res.redirect('/admin?status=updated');
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.manageGenres = async (req, res) => {
    try {
        const comics = await Comic.find();
        const genres = [...new Set(comics.flatMap(c => c.genres))]; 
        res.render('admin/genres', { user: req.session.user, genres, currentPath: '/admin/genres' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.deleteComic = async (req, res) => {
    try {
        await Comic.findByIdAndDelete(req.params.id);
        res.redirect('/admin/comics');
    } catch (err) {
        res.status(500).send(err.message);
    }
};