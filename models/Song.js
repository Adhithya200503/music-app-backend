const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title']
  },
  artist: {
    type: String,
    required: [true, 'Please add an artist']
  },
  album: {
    type: String
  },
  composer: {
    type: String
  },
  genre: {
    type: String
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
  coverImageUrl: {
    type: String
  },
  playCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search
songSchema.index({ title: 'text', artist: 'text', album: 'text' });

module.exports = mongoose.model('Song', songSchema);
