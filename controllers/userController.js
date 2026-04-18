const User = require('../models/User');

// @desc    Add or remove song from favorites
// @route   POST /api/users/favorites/:songId
// @access  Private
exports.toggleFavorite = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.favorites) {
      user.favorites = [];
    }

    const hasFavorite = user.favorites.some(id => id.toString() === req.params.songId);

    if (hasFavorite) {
      // Remove from favorites
      user.favorites = user.favorites.filter(id => id.toString() !== req.params.songId);
    } else {
      // Add to favorites
      user.favorites.push(req.params.songId);
    }

    await user.save();
    res.json(user.favorites);
  } catch (error) {
    next(error);
  }
};

// @desc    Add song to recently played
// @route   POST /api/users/recently-played/:songId
// @access  Private
exports.addRecentlyPlayed = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    // Remove if already in list to put it at the beginning
    user.recentlyPlayed = user.recentlyPlayed.filter(id => id.toString() !== req.params.songId);
    
    // Add to beginning
    user.recentlyPlayed.unshift(req.params.songId);

    // Keep only last 20 songs
    if (user.recentlyPlayed.length > 20) {
      user.recentlyPlayed = user.recentlyPlayed.slice(0, 20);
    }

    await user.save();
    res.json(user.recentlyPlayed);
  } catch (error) {
    next(error);
  }
};
