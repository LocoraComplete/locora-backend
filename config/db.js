const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are now default in Mongoose 7+, no need to include useNewUrlParser, useUnifiedTopology
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Failed: ${error.message}`);
    process.exit(1); // Exit the process with failure
  }
};

module.exports = connectDB;
