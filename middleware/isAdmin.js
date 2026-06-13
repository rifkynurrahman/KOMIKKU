// middleware/isAdmin.js
module.exports = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        // Jika bukan admin, tendang ke beranda dengan pesan error
        res.status(403).send('Akses Ditolak: Halaman ini khusus Admin.');
    }
};