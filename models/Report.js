const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  comicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comic', required: true },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Resolved'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);