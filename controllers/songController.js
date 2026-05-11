const Song = require('../models/Song');
const Album = require('../models/Album');
const cloudinary = require('../config/cloudinary');

// Helper to normalize song URLs
const normalizeSong = (song) => {
  if (!song) return song;
  const songObj = song.toObject ? song.toObject() : song;
  return songObj;
};

// @desc    Upload new song
// @route   POST /api/songs
// @access  Private/Admin
exports.uploadSong = async (req, res, next) => {
  try {
    if (!req.files || !req.files.audio) {
      res.status(400);
      throw new Error('Please upload an audio file');
    }

    const { title, albumId, duration } = req.body;

    if (!title || !albumId) {
      res.status(400);
      throw new Error('Please provide title and albumId');
    }

    const album = await Album.findById(albumId);
    if (!album) {
      res.status(404);
      throw new Error('Album not found');
    }

    const song = await Song.create({
      title,
      album: albumId,
      duration: duration || 0,
      audioUrl: req.files.audio[0].path,
      cloudinaryId: req.files.audio[0].filename // This holds the Cloudinary public_id
    });

    res.status(201).json(song);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all songs (with pagination & search)
// @route   GET /api/songs
// @access  Public
exports.getSongs = async (req, res, next) => {
  try {
    const pageSize = 20;
    const page = Number(req.query.page) || 1;

    const keyword = req.query.keyword
      ? {
          $text: { $search: req.query.keyword }
        }
      : {};

    const count = await Song.countDocuments({ ...keyword });
    const songs = await Song.find({ ...keyword })
      .populate('album')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    const normalizedSongs = songs.map(normalizeSong);

    res.json({ songs: normalizedSongs, page, pages: Math.ceil(count / pageSize), total: count });
  } catch (error) {
    next(error);
  }
};

// @desc    Get song by ID
// @route   GET /api/songs/:id
// @access  Public
exports.getSongById = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id).populate('album');
    if (!song) {
      res.status(404);
      throw new Error('Song not found');
    }
    res.json(normalizeSong(song));
  } catch (error) {
    next(error);
  }
};

// @desc    Update song play count
// @route   PUT /api/songs/:id/play
// @access  Public
exports.incrementPlayCount = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      res.status(404);
      throw new Error('Song not found');
    }
    
    song.playCount += 1;
    await song.save();

    res.json({ message: 'Play count updated', playCount: song.playCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a song
// @route   DELETE /api/songs/:id
// @access  Private/Admin
exports.deleteSong = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      res.status(404);
      throw new Error('Song not found');
    }

    // Delete from Cloudinary
    if (song.cloudinaryId) {
      await cloudinary.uploader.destroy(song.cloudinaryId, { resource_type: 'video' });
    }

    await song.deleteOne();

    res.json({ message: 'Song removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending songs
// @route   GET /api/songs/trending
// @access  Public
exports.getTrendingSongs = async (req, res, next) => {
  try {
    const songs = await Song.find().populate('album').sort({ playCount: -1 }).limit(10);
    res.json(songs.map(normalizeSong));
  } catch (error) {
    next(error);
  }
};

// @desc    Get smart recommendations based on recently played composers
// @route   GET /api/songs/recommendations
// @access  Private
exports.getRecommendations = async (req, res, next) => {
  try {
    const user = await require('../models/User').findById(req.user._id).populate({
      path: 'recentlyPlayed',
      populate: { path: 'album' }
    });
    
    if (!user || user.recentlyPlayed.length === 0) {
      // Return popular songs if no history
      const songs = await Song.find().populate('album').sort({ playCount: -1 }).limit(10);
      return res.json(songs);
    }

    // Extract composers from recently played albums
    const composers = user.recentlyPlayed
      .map(song => song.album?.composer)
      .filter(Boolean);
    const uniqueComposers = [...new Set(composers)];

    // Find albums with these composers
    const recommendedAlbums = await Album.find({ composer: { $in: uniqueComposers } });
    const albumIds = recommendedAlbums.map(a => a._id);

    const recommendations = await Song.find({
      album: { $in: albumIds },
      _id: { $nin: user.recentlyPlayed.map(s => s._id) }
    }).populate('album').limit(10);

    // If still not enough, pad with trending
    if (recommendations.length < 10) {
      const needed = 10 - recommendations.length;
      const trending = await Song.find({
        _id: { $nin: [...user.recentlyPlayed.map(s => s._id), ...recommendations.map(s => s._id)] }
      }).populate('album').sort({ playCount: -1 }).limit(needed);
      
      recommendations.push(...trending);
    }

    res.json(recommendations.map(normalizeSong));
  } catch (error) {
    next(error);
  }
};

// @desc    Get distinct composers
// @route   GET /api/songs/composers
// @access  Public
exports.getComposers = async (req, res, next) => {
  try {
    const composers = await Album.distinct('composer', { composer: { $ne: null, $ne: '' } });
    res.json(composers.filter(Boolean));
  } catch (error) {
    next(error);
  }
};

// @desc    Get distinct genres (deprecated, returning empty)
// @route   GET /api/songs/genres
// @access  Public
exports.getGenres = async (req, res, next) => {
  res.json([]);
};

// @desc    Get songs filtered by composer or album
// @route   GET /api/songs/filter?composer=X or ?album=Y
// @access  Public
exports.getSongsByFilter = async (req, res, next) => {
  try {
    const { composer, album } = req.query;
    
    let filter = {};
    if (album) {
      // album here is album title or id
      // Assume id for simplicity, or find album by title
      // We will handle it in the frontend to pass album id if needed, 
      // but let's support querying by album title
      const albums = await Album.find({ title: { $regex: album, $options: 'i' } });
      filter.album = { $in: albums.map(a => a._id) };
    }
    
    if (composer) {
      const albums = await Album.find({ composer: { $regex: composer, $options: 'i' } });
      filter.album = { $in: albums.map(a => a._id) };
    }

    const songs = await Song.find(filter).populate('album').sort({ createdAt: -1 });
    res.json(songs);
  } catch (error) {
    next(error);
  }
};
