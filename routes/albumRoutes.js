const express = require('express');
const router = express.Router();
const { getAlbums, createAlbum, getAlbumById, deleteAlbum } = require('../controllers/albumController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
  .get(getAlbums)
  .post(protect, admin, createAlbum);

router.route('/:id')
  .get(getAlbumById)
  .delete(protect, admin, deleteAlbum);

module.exports = router;
