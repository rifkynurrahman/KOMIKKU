// seedAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User'); 

// 1. WAJIB DIALOKASIKAN DI PALING ATAS AGAR FILE .ENV LANGSUNG TERBACA
require('dotenv').config();

// 2. Hubungkan ke Database Menggunakan Alamat di File .env
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('⚡ Sukses Terhubung ke MongoDB Atlas Cloud!');

        // Hapus akun lama dengan email yang sama (opsional, agar tidak duplikat)
        await User.deleteOne({ email: 'admin@komikku.com' });

        // Enkripsi Password
        const hashedPassword = await bcrypt.hash('admin12345', 10);

        // Simpan Akun Admin Baru
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
        console.log('✅ AKUN ADMIN BERHASIL DIBUAT DI CLOUD! 100%');
        console.log('Email   : admin@komikku.com');
        console.log('Password: admin12345');
        console.log('=========================================');
        console.log('Silakan kembali ke web Vercel dan langsung LOGIN.');
        
        process.exit();
    })
    .catch(err => {
        console.error('❌ Eror membuat admin:', err);
        process.exit();
    });