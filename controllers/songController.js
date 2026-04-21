const Song = require('../models/Song');
const cloudinary = require('../config/cloudinary');

// Helper to normalize song URLs
const normalizeSong = (song) => {
  if (!song) return song;
  const songObj = song.toObject ? song.toObject() : song;
  
  // If it's a Cloudinary URL or already absolute, leave it
  // Otherwise, we might need to prepend the server URL if we ever support local uploads
  // For now, we just ensure it's a string
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

    const { title, artist, album, composer, genre, duration } = req.body;
    let coverImageUrl = '';
    
    if (req.files.image && req.files.image.length > 0) {
      coverImageUrl = req.files.image[0].path;
    }

    const song = await Song.create({
      title,
      artist,
      album,
      composer,
      genre,
      duration,
      coverImageUrl,
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
    const song = await Song.findById(req.params.id);
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
      await cloudinary.uploader.destroy(song.cloudinaryId, { resource_type: 'video' }); // audio is treated as video resource type for deletion in cloudinary
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
    const songs = await Song.find().sort({ playCount: -1 }).limit(10);
    res.json(songs.map(normalizeSong));
  } catch (error) {
    next(error);
  }
};

// @desc    Get smart recommendations based on recently played genres
// @route   GET /api/songs/recommendations
// @access  Private
exports.getRecommendations = async (req, res, next) => {
  try {
    const user = await require('../models/User').findById(req.user._id).populate('recentlyPlayed');
    
    if (!user || user.recentlyPlayed.length === 0) {
      // Return popular songs if no history
      const songs = await Song.find().sort({ playCount: -1 }).limit(10);
      return res.json(songs);
    }

    // Extract genres from recently played
    const genres = user.recentlyPlayed.map(song => song.genre).filter(Boolean);
    const uniqueGenres = [...new Set(genres)];

    const recommendations = await Song.find({
      genre: { $in: uniqueGenres },
      _id: { $nin: user.recentlyPlayed.map(s => s._id) }
    }).limit(10);

    // If still not enough, pad with trending
    if (recommendations.length < 10) {
      const needed = 10 - recommendations.length;
      const trending = await Song.find({
        _id: { $nin: [...user.recentlyPlayed.map(s => s._id), ...recommendations.map(s => s._id)] }
      }).sort({ playCount: -1 }).limit(needed);
      
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
    const composers = await Song.distinct('composer', { composer: { $ne: null, $ne: '' } });
    res.json(composers.filter(Boolean));
  } catch (error) {
    next(error);
  }
};

// @desc    Get distinct genres
// @route   GET /api/songs/genres
// @access  Public
exports.getGenres = async (req, res, next) => {
  try {
    const genres = await Song.distinct('genre', { genre: { $ne: null, $ne: '' } });
    res.json(genres.filter(Boolean));
  } catch (error) {
    next(error);
  }
};

// @desc    Get songs filtered by composer or genre
// @route   GET /api/songs/filter?composer=X or ?genre=Y
// @access  Public
exports.getSongsByFilter = async (req, res, next) => {
  try {
    const { composer, genre, artist } = req.query;
    const filter = {};
    if (composer) filter.composer = composer;
    if (genre) filter.genre = genre;
    if (artist) filter.artist = artist;
    const songs = await Song.find(filter).sort({ createdAt: -1 });
    res.json(songs);
  } catch (error) {
    next(error);
  }
};
