const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'music-app/songs',
    resource_type: 'auto', // Important for audio files
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
