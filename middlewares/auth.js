const jwt = require("jsonwebtoken");

// Checks the token sent in the "x-api-key" header
function auth(req, res, next) {
  const token = req.header("x-api-key");
  if (!token) {
    return res.status(401).json({ error: "You must send a token in the x-api-key header" });
  }
  try {
    req.tokenData = jwt.verify(token, process.env.TOKEN_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token is invalid or expired, please log in again" });
  }
}

// Same as auth, but only lets admins through
function authAdmin(req, res, next) {
  auth(req, res, () => {
    if (req.tokenData.role !== "admin") {
      return res.status(403).json({ error: "Only an admin can do this" });
    }
    next();
  });
}

module.exports = { auth, authAdmin };
