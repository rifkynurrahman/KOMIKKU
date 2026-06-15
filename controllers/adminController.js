// controllers/adminController.js
const User = require('../models/User');
const Comic = require('../models/Comic');
const bcrypt = require('bcrypt');

exports.getDashboard = async (req, res) => {
    try {
        const totalUser = await User.countDocuments();
        const totalComic = await User.countDocuments(); // Contoh hitung sederhana
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
    const users = await User.find().sort({ createdAt: -1 });
    res.render('admin/users', { user: req.session.user, users, currentPath: '/admin/users' });
};

exports.deleteUser = async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/users');
};

exports.manageComics = async (req, res) => {
    const comics = await Comic.find().populate('uploadedBy');
    res.render('admin/comics', { user: req.session.user, comics, currentPath: '/admin/comics' });
};

exports.updateInternalProfile = async (req, res) => {
    const { email, password } = req.body;
    const updateData = { email };
    
    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    await User.findByIdAndUpdate(req.session.user.id, updateData);
    res.redirect('/admin?status=updated');
};

exports.manageGenres = async (req, res) => {
    // Karena genre biasanya disimpan dalam array unik di koleksi Comic atau file statis
    // Kita bisa ambil daftar genre unik dari semua komik yang ada
    const comics = await Comic.find();
    const genres = [...new Set(comics.flatMap(c => c.genres))]; 
    res.render('admin/genres', { user: req.session.user, genres, currentPath: '/admin/genres' });
};

exports.deleteComic = async (req, res) => {
    await Comic.findByIdAndDelete(req.params.id);
    res.redirect('/admin/comics');
};