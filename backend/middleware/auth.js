import jwt from "jsonwebtoken";
import { promisify } from "util";
import { User } from "../models/User.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select(
      "+tokenVersion -password"
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }
    // Validate tokenVersion
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid or has been revoked",
      });
    }
    // Check email verification
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email address",
      });
    }
    // Check account approval for privileged roles
    if (user.role !== "guest" && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your account is pending admin approval",
        requiresApproval: true,
      });
    }
    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    }
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );
      const user = await User.findById(decoded.userId).select(
        "+tokenVersion -password"
      );
      if (
        user &&
        user.emailVerified &&
        decoded.tokenVersion === user.tokenVersion
      ) {
        // Only set user if account is approved (or guest)
        if (user.role === "guest" || user.isApproved) {
          req.user = user;
        }
      }
    }
    next();
  } catch {
    next(); // Proceed without user context
  }
};
