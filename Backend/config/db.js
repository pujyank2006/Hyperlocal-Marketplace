const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const baseMongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
    const mongoUri = baseMongoUrl.includes('Hyperlocal-Marketplace')
      ? baseMongoUrl
      : `${baseMongoUrl.replace(/\/$/, '')}/Hyperlocal-Marketplace`;

    const conn = await mongoose.connect(mongoUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
