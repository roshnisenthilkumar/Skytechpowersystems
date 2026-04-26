const mongoose = require('mongoose');

const connectDB = async () => {
  const conn = await mongoose.connect(
    process.env.MONGO_URI || 'mongodb://localhost:27017/skytech_db'
  );
  console.log(`✅ [MongoDB] Connected: ${conn.connection.host}`);
  mongoose.connection.on('error', err => console.error('❌ [MongoDB]', err));
  mongoose.connection.on('disconnected', () => console.warn('⚠️  [MongoDB] Disconnected'));
};

module.exports = connectDB;
