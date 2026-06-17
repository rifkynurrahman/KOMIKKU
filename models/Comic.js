const mongoose = require('mongoose');

const comicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  synopsis: { type: String },
  coverImage: { type: String },
  genres: [{ type: String }],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  views: { type: Number, default: 0 },
  
  // 🛠️ 1. UBAH tipe rating menjadi String agar seragam dengan format ".toFixed(1)" (Contoh: "4.5")
  rating: { type: String, default: '0.0' },

  // 🛠️ 2. BARU: Array untuk menampung riwayat rating dari masing-masing user agar bisa dirata-rata
  ratings: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      score: { type: Number, required: true }
    }
  ],

  // (Sudah dirapikan karena sebelumnya double)
  status: { 
    type: String, 
    enum: ['Ongoing', 'Completed'], // Membatasi inputan hanya boleh 2 kata ini
    default: 'Ongoing' 
  },
  
  chapters: [{
    chapterNumber: Number,
    title: String,
    pages: [{ type: String }]
  }],

  // 🟢 Comments berada di dalam sini sebelum penutup skema
  comments: [
    {
      username: { type: String, required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true }); 

module.exports = mongoose.model('Comic', comicSchema);