const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = String(authHeader.split(" ")[1] || "").trim();

  if (!token || token === "undefined" || token === "null") {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "nexbank-dev-secret"
    );

    req.user = decoded; // store user info in request
    next();

  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = authMiddleware;
