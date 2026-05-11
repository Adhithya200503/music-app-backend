const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a movie title']
  },
  composer: {
    type: String,
    required: [true, 'Please add a composer']
  },
  coverImageUrl: {
    type: String,
    required: [true, 'Please add a cover image URL']
  },
  cloudinaryId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Album', albumSchema);
