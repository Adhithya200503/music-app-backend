const express = require('express');
const router = express.Router();
const { getAlbums, createAlbum, getAlbumById, deleteAlbum } = require('../controllers/albumController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.route('/')
  .get(getAlbums)
  .post(protect, admin, upload.fields([{ name: 'image', maxCount: 1 }]), createAlbum);

router.route('/:id')
  .get(getAlbumById)
  .delete(protect, admin, deleteAlbum);

module.exports = router;
