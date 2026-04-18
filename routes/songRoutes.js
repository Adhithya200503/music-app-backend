const express = require('express');
const router = express.require ? express.Router() : require('express').Router();
const { uploadSong, getSongs, getSongById, deleteSong, incrementPlayCount, getTrendingSongs, getRecommendations, getComposers, getGenres, getSongsByFilter } = require('../controllers/songController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/trending', getTrendingSongs);
router.get('/recommendations', protect, getRecommendations);
router.get('/composers', getComposers);
router.get('/genres', getGenres);
router.get('/filter', getSongsByFilter);

router.route('/')
  .get(getSongs)
  .post(protect, admin, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'image', maxCount: 1 }]), uploadSong);

router.route('/:id')
  .get(getSongById)
  .delete(protect, admin, deleteSong);

router.route('/:id/play').put(incrementPlayCount);

module.exports = router;
