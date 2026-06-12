const mongoose = require('mongoose');

const comicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  synopsis: { type: String },
  coverImage: { type: String },
  genres: [{ type: String }],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'Ongoing' },
  views: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
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

  // 🟢 Pindahkan comments ke DALAM sini, tepat sebelum penutup skema
  comments: [
    {
      username: { type: String, required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true }); 

module.exports = mongoose.model('Comic', comicSchema);