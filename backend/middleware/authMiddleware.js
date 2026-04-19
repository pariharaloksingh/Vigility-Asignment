const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return res.status(401).json({ msg: "No token provided" });
    }

    // Optional: support Bearer token
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { id: userId }

    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};