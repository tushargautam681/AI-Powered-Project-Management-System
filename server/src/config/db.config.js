const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/project_management_ai';

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    };

    cached.promise = mongoose.connect(uri, opts).then(async (m) => {
      console.log(`✅ MongoDB connected: ${m.connection.host}`);
      // Auto-seed if database has no users (e.g. freshly connected cloud DB)
      try {
        const User = require('../models/User');
        const userCount = await User.countDocuments();
        if (userCount === 0) {
          console.log('🌱 Database is empty. Auto-seeding initial demo data...');
          const seed = require('../utils/seed');
          await seed(false);
          console.log('✅ Auto-seed completed');
        }
      } catch (seedErr) {
        console.warn('ℹ️  Auto-seed check note:', seedErr.message);
      }
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

module.exports = connectDB;
