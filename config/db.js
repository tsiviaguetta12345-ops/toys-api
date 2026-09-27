const mongoose = require("mongoose");

// The connection is created once and reused (important on Vercel,
// where the server is started again for new requests)
let connection = null;

function connectDB() {
  if (!connection) {
    connection = mongoose.connect(process.env.MONGO_URL).then(() => {
      console.log("MongoDB connected");
    });
    connection.catch(() => {
      connection = null;
    });
  }
  return connection;
}

module.exports = connectDB;
