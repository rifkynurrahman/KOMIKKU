const mongoose = require('mongoose');

const comicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  synopsis: { type: String },
  coverImage: { type: String }, // Menyimpan nama file/URL gambar cover
  genres: [{ type: String }],   // Array berisi string genre (Fantasy, Action, dll)
  status: { type: String, default: 'Ongoing' },
  views: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  
  // Struktur Chapter di dalam komik
  chapters: [{
    chapterNumber: Number,
    title: String,
    pages: [{ type: String }] // Array URL/nama file gambar halaman komik
  }]
}, { timestamps: true }); // Otomatis menambahkan createdAt dan updatedAt

module.exports = mongoose.model('Comic', comicSchema);