const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  siteName: { type: String, default: 'KomikKu' },
  maintenanceMode: { type: Boolean, default: false },
  announcement: { type: String, default: '' },
  contactEmail: { type: String, default: 'admin@komikku.com' }
});

module.exports = mongoose.model('Setting', settingSchema);