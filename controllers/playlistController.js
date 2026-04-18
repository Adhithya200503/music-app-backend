const Playlist = require('../models/Playlist');

// @desc    Create a playlist
// @route   POST /api/playlists
// @access  Private
exports.createPlaylist = async (req, res, next) => {
  try {
    const { name, description, isPublic, coverImageUrl } = req.body;

    const playlist = await Playlist.create({
      name,
      description,
      isPublic,
      coverImageUrl,
      user: req.user._id
    });

    res.status(201).json(playlist);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user playlists
// @route   GET /api/playlists/my
// @access  Private
exports.getUserPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({ user: req.user._id }).populate('songs');
    res.json(playlists);
  } catch (error) {
    next(error);
  }
};

// @desc    Get public playlists
// @route   GET /api/playlists
// @access  Public
exports.getPublicPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({ isPublic: true }).populate('user', 'username').populate('songs');
    res.json(playlists);
  } catch (error) {
    next(error);
  }
};

// @desc    Get playlist by ID
// @route   GET /api/playlists/:id
// @access  Public
exports.getPlaylistById = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id).populate('songs').populate('user', 'username');
    
    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    // Check visibility
    if (!playlist.isPublic && playlist.user._id.toString() !== (req.user ? req.user._id.toString() : null)) {
      res.status(403);
      throw new Error('Not authorized to view this playlist');
    }

    res.json(playlist);
  } catch (error) {
    next(error);
  }
};

// @desc    Add song to playlist
// @route   POST /api/playlists/:id/songs
// @access  Private
exports.addSongToPlaylist = async (req, res, next) => {
  try {
    const { songId } = req.body;
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    if (playlist.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to edit this playlist');
    }

    if (!playlist.songs.includes(songId)) {
      playlist.songs.push(songId);
      await playlist.save();
    }

    res.json(playlist);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove song from playlist
// @route   DELETE /api/playlists/:id/songs/:songId
// @access  Private
exports.removeSongFromPlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    if (playlist.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to edit this playlist');
    }

    playlist.songs = playlist.songs.filter(s => s.toString() !== req.params.songId);
    await playlist.save();

    res.json(playlist);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a playlist
// @route   DELETE /api/playlists/:id
// @access  Private
exports.deletePlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    if (playlist.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this playlist');
    }

    await playlist.deleteOne();

    res.json({ message: 'Playlist removed' });
  } catch (error) {
    next(error);
  }
};
