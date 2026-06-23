// seedAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // Pastikan path ke model User sudah benar

// Koneksi ke Database
mongoose.connect('mongodb://127.0.0.1:27017/komikku')
    .then(async () => {
        console.log('Terhubung ke MongoDB untuk pembuatan admin...');

        // 1. Hapus akun lama dengan email yang sama (opsional, agar tidak duplikat)
        await User.deleteOne({ email: 'admin@komikku.com' });

        // 2. Enkripsi Password
        const hashedPassword = await bcrypt.hash('admin12345', 10);

        // 3. Simpan Akun Admin Baru
        const adminBaru = new User({
            firstName: 'Admin',
            lastName: 'Utama',
            username: 'admin_komikku',
            email: 'admin@komikku.com',
            password: hashedPassword,
            role: 'admin' 
        });

        await adminBaru.save();

        console.log('=========================================');
        console.log('✅ AKUN ADMIN BERHASIL DIBUAT! 100%');
        console.log('Email   : admin@komikku.com');
        console.log('Password: admin12345');
        console.log('=========================================');
        console.log('Silakan jalankan aplikasi dan LOGIN dengan akun ini.');
        
        process.exit();
    })
    .catch(err => {
        console.error('❌ eror membuat admin:', err);
        process.exit();
    });