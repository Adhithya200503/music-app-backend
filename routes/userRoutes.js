const express = require('express');
const router = express.require ? express.Router() : require('express').Router();
const { toggleFavorite, addRecentlyPlayed } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/favorites/:songId', protect, toggleFavorite);
router.post('/recently-played/:songId', protect, addRecentlyPlayed);

module.exports = router;
