const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ error: "No token, access denied" });
  }

  try {
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET || "nexbank-dev-secret"
    );

    req.user = decoded; // contains userId
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};