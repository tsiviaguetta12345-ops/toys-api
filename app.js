// Toys API - NodeJS + MongoDB project
// Author: Tsivia Guetta (348248634)

require("dotenv").config({ quiet: true });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const routesInit = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());

// Make sure MongoDB is connected before handling a request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

routesInit(app);

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.originalUrl });
});

// Invalid JSON body and unexpected errors
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }
  console.error(err);
  res.status(500).json({ error: "Server error, try again later" });
});

// On Vercel the app is exported and Vercel runs it.
// On the computer we start the server ourselves.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    })
    .catch((err) => {
      console.error("Could not connect to MongoDB:", err.message);
      process.exit(1);
    });
}

module.exports = app;
