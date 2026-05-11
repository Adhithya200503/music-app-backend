const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title']
  },
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album',
    required: true
  },
  duration: {
    type: Number, // duration in seconds
    default: 0
  },
  audioUrl: {
    type: String,
    required: [true, 'Please add an audio URL']
  },
  cloudinaryId: {
    type: String,
    required: true
  },
  playCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search
songSchema.index({ title: 'text' });

module.exports = mongoose.model('Song', songSchema);
