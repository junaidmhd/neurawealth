const jwt = require("jsonwebtoken");

// Require a secure JWT secret from environment variables.
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is missing. Configure it in your backend environment variables."
  );
}

function signToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
    },
    JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
}

// Requires a valid token.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      message: "Not authenticated",
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    req.userId = payload.userId;
    req.userEmail = payload.email;

    return next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired session. Please log in again.",
    });
  }
}

// Attaches the user if a valid token is present,
// but does not block requests without a valid token.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : null;

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);

      req.userId = payload.userId;
      req.userEmail = payload.email;
    } catch {
      // Ignore invalid tokens in optional authentication.
    }
  }

  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  signToken,
  JWT_SECRET,
};