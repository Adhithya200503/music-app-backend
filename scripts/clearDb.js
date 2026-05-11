require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Models
const Song = require('../models/Song');
const Album = require('../models/Album');
const Playlist = require('../models/Playlist');

const clearData = async () => {
  try {
    await connectDB();
    console.log('MongoDB Connected...');
    
    await Song.deleteMany();
    await Album.deleteMany();
    await Playlist.deleteMany(); // Since songs are changing, clearing playlists too just in case

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

clearData();
