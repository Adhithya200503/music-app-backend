const Album = require('../models/Album');
const cloudinary = require('../config/cloudinary');

// @desc    Get all albums
// @route   GET /api/albums
// @access  Public
exports.getAlbums = async (req, res, next) => {
  try {
    const albums = await Album.find().sort({ createdAt: -1 });
    res.json(albums);
  } catch (error) {
    next(error);
  }
};

// @desc    Create an album
// @route   POST /api/albums
// @access  Private/Admin
exports.createAlbum = async (req, res, next) => {
  try {
    if (!req.files || !req.files.image) {
      res.status(400);
      throw new Error('Please upload a cover image');
    }

    const { title, composer } = req.body;
    
    if (!title || !composer) {
      res.status(400);
      throw new Error('Please provide a title and composer');
    }

    const coverImageUrl = req.files.image[0].path;
    const cloudinaryId = req.files.image[0].filename;

    const album = await Album.create({
      title,
      composer,
      coverImageUrl,
      cloudinaryId
    });

    res.status(201).json(album);
  } catch (error) {
    next(error);
  }
};

// @desc    Get album by ID
// @route   GET /api/albums/:id
// @access  Public
exports.getAlbumById = async (req, res, next) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      res.status(404);
      throw new Error('Album not found');
    }
    res.json(album);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an album
// @route   DELETE /api/albums/:id
// @access  Private/Admin
exports.deleteAlbum = async (req, res, next) => {
  try {
    const album = await Album.findById(req.params.id);

    if (!album) {
      res.status(404);
      throw new Error('Album not found');
    }

    if (album.cloudinaryId) {
      await cloudinary.uploader.destroy(album.cloudinaryId); 
    }

    await album.deleteOne();

    res.json({ message: 'Album removed' });
  } catch (error) {
    next(error);
  }
};
