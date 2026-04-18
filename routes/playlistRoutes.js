const express = require('express');
const router = express.require ? express.Router() : require('express').Router();
const { 
  createPlaylist, 
  getUserPlaylists, 
  getPublicPlaylists, 
  getPlaylistById, 
  addSongToPlaylist, 
  removeSongFromPlaylist, 
  deletePlaylist 
} = require('../controllers/playlistController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, createPlaylist)
  .get(getPublicPlaylists);

router.route('/my').get(protect, getUserPlaylists);

// We define a middleware to conditionally protect the GET route if needed for public check, 
// but for simplicity we can let the controller handle it if req.user is optional.
// Here we use a trick: if there's a token, set req.user, else don't error out.
const optionalProtect = require('jsonwebtoken').verify ? async (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const User = require('../models/User');
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {}
  }
  next();
} : (req, res, next) => next();


router.route('/:id')
  .get(optionalProtect, getPlaylistById)
  .delete(protect, deletePlaylist);

router.route('/:id/songs')
  .post(protect, addSongToPlaylist);

router.route('/:id/songs/:songId')
  .delete(protect, removeSongFromPlaylist);

module.exports = router;
