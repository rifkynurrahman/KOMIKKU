const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: null },
  
  // 🛡️ TAMBAHKAN FIELD ROLE INI
  role: { 
    type: String, 
    enum: ['guest', 'creator', 'admin'], 
    default: 'creator' 
  },

  readHistory: [{
    comicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comic' },
    comicTitle: String,
    chapterNumber: Number,
    readAt: { type: Date, default: Date.now }
  }],
  
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comic' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);