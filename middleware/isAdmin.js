// middleware/isAdmin.js
module.exports = (req, res, next) => {
    console.log("User saat ini:", req.session.user); // <--- Tambahkan ini untuk cek di terminal VS Code
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Akses Ditolak: Halaman ini khusus Admin.');
    }
};