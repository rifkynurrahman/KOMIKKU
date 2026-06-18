// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: null },
  
  role: { 
    type: String, 
    enum: ['user', 'creator', 'admin'], 
    default: 'user' 
  },

  readHistory: [{
    comicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comic' },
    comicTitle: String,
    chapterNumber: Number,
    readAt: { type: Date, default: Date.now }
  }],
  
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comic' }],

  // ============================================================
  // 🔥 FITUR LUPA PASSWORD (TAMBAHAN BARU)
  // ============================================================
  resetPasswordToken: { 
    type: String, 
    default: null 
  },
  resetPasswordExpires: { 
    type: Date, 
    default: null 
  }
  // ============================================================

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);