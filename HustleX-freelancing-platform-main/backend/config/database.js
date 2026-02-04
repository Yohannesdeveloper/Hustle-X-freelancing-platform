const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/hustlex",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        socketTimeoutMS: 45000, // 45 seconds timeout
        maxPoolSize: 10,
        retryWrites: true,
        w: 'majority'
      }
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error.message);
    console.log("Server will continue running without database connection");
    console.log("Messages will be stored in memory temporarily");
    // Don't exit, allow server to run
  }
};

module.exports = connectDB;
