const mongoose = require('mongoose');
const Comic = require('./models/Comic'); // Mengambil schema yang kamu buat tadi
const { comics } = require('./data/dummyData'); // Mengambil data dummy kamu

// 1. Hubungkan ke Database
mongoose.connect('mongodb://127.0.0.1:27017/komikku')
  .then(async () => {
    console.log('⏳ Menghubungkan seeder ke MongoDB...');
    
    // 2. Bersihkan database terlebih dahulu agar tidak duplikat jika dijalankan ulang
    await Comic.deleteMany({});
    
    // 3. Sesuaikan struktur data dummy ke struktur schema MongoDB kamu
    const formattedComics = comics.map(comic => {
      
      // KODE PEMBERSIH VIEWS: Mengubah "1.2JT" menjadi angka 1200000
      let cleanViews = 0;
      if (typeof comic.views === 'string') {
        if (comic.views.toUpperCase().includes('JT')) {
          cleanViews = parseFloat(comic.views.toUpperCase().replace('JT', '')) * 1000000;
        } else {
          cleanViews = parseInt(comic.views) || 0;
        }
      } else if (typeof comic.views === 'number') {
        cleanViews = comic.views;
      }

      // KODE PEMBERSIH RATING: Memastikan rating aman dikonversi ke angka desimal
      let cleanRating = 0;
      if (typeof comic.rating === 'string') {
        cleanRating = parseFloat(comic.rating) || 0;
      } else if (typeof comic.rating === 'number') {
        cleanRating = comic.rating;
      }

      return {
        title: comic.title,
        author: comic.author || 'Anonim',
        synopsis: comic.synopsis || 'Tidak ada sinopsis.',
        coverImage: comic.cover || comic.coverImage || '',
        genres: comic.genres || [],
        status: comic.status || 'Ongoing',
        views: cleanViews, // Sudah berupa angka murni
        rating: cleanRating, // Sudah berupa angka desimal murni
        // Memastikan field 'number' di dummy masuk ke 'chapterNumber' di schema kamu
        chapters: comic.chapters ? comic.chapters.map(ch => ({
          chapterNumber: ch.number, 
          title: ch.title,
          pages: ch.pages || []
        })) : []
      };
    });

    // 4. Masukkan data ke MongoDB
    await Comic.insertMany(formattedComics);
    console.log('🚀 Selesai! Semua data dummy berhasil dipindahkan ke MongoDB.');
    
    // 5. Tutup koneksi seeder jika sudah selesai
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ Gagal menjalankan seeder:');
    if (err.errors) {
      Object.keys(err.errors).forEach(key => {
        console.error(`👉 Kolom [${key}]: ${err.errors[key].message}`);
      });
    } else {
      console.error(err);
    }
  });