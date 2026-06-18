// controllers/adminController.js
const User = require('../models/User');
const Comic = require('../models/Comic');
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2; // 🔥 TAMBAHAN: Import Cloudinary

// Konfigurasi Cloudinary agar admin bisa menghapus file di cloud internet
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 🔥 FUNGSI BANTU: Ekstrak Public ID dan hapus gambar dari Cloudinary
async function deleteCloudinaryImage(imagePath) {
  if (!imagePath || !imagePath.startsWith('http')) return;
  try {
    const parts = imagePath.split('/');
    const folderAndFile = parts.slice(-2).join('/'); 
    const publicId = folderAndFile.substring(0, folderAndFile.lastIndexOf('.')); 
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Gagal menghapus gambar dari Cloudinary (Admin):', err);
  }
}

exports.getDashboard = async (req, res) => {
    try {
        const totalUser = await User.countDocuments();
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
        const comics = await Comic.find().populate('uploadedBy');
        res.render('admin/comics', { 
            user: req.session.user, 
            comics: comics || [], 
            currentPath: '/admin/comics' 
        });
    } catch (err) {
        console.error("Error Manage Comics:", err);
        res.status(500).send("Gagal memuat daftar komik: " + err.message);
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

// 🔥 KODE FIX: Fungsi deleteComic yang sudah terintegrasi Cloudinary & Pembersihan Riwayat Bacaan
exports.deleteComic = async (req, res) => {
    try {
        const comic = await Comic.findById(req.params.id);

        if (!comic) {
            return res.status(404).send('Komik tidak ditemukan.');
        }

        // 1. Hapus Cover Komik dari Cloudinary
        await deleteCloudinaryImage(comic.coverImage);

        // 2. Hapus Semua Gambar Halaman Chapter dari Cloudinary
        if (comic.chapters && comic.chapters.length > 0) {
            for (const chapter of comic.chapters) {
                for (const pageUrl of chapter.pages) {
                    await deleteCloudinaryImage(pageUrl);
                }
            }
        }

        // 3. Bersihkan riwayat bacaan user agar database tidak error/menggantung
        await User.updateMany(
            { 'readHistory.comicId': comic._id },
            { $pull: { readHistory: { comicId: comic._id } } }
        );

        // 4. Hapus data komik dari MongoDB Atlas
        await Comic.deleteOne({ _id: comic._id });

        res.redirect('/admin/comics');
    } catch (err) {
        console.error('Error Admin Delete Comic:', err);
        res.status(500).send('Terjadi kesalahan saat menghapus komik.');
    }
};