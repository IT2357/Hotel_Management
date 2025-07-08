// 📁 middleware/roleAuth.js
import AdminProfile from "../models/profiles/AdminProfile.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";

// Enhanced role-based access control with approval check
export const authorizeRoles = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if user is approved (guests are always considered approved)
    if (req.user.role !== "guest" && !req.user.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Account pending admin approval",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }

    next();
  };
};

// Enhanced permission check with admin approval verification
export const checkPermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      // Verify admin is approved
      if (!req.user.isApproved) {
        return res.status(403).json({
          success: false,
          message: "Admin account pending approval",
        });
      }

      const adminProfile = await AdminProfile.findOne({ userId: req.user._id });

      if (!adminProfile) {
        return res.status(403).json({
          success: false,
          message: "Admin profile not found",
        });
      }

      const hasPermission = requiredPermissions.every((permission) =>
        adminProfile.permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
          requiredPermissions,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};

// Enhanced resource access control with approval checks
export const checkResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: "Missing resource ID",
        });
      }

      let resource;
      switch (resourceType) {
        case "booking":
          resource = await Booking.findById(resourceId);
          break;
        case "review":
          resource = await Review.findById(resourceId);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid resource type",
          });
      }

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${
            resourceType.charAt(0).toUpperCase() + resourceType.slice(1)
          } not found`,
        });
      }

      const isOwner = resource.userId.toString() === req.user._id.toString();
      const isStaff = ["staff", "manager", "admin"].includes(req.user.role);

      // Check if staff/admin is approved
      const isApprovedStaff = isStaff && req.user.isApproved;

      if (!isOwner && !isApprovedStaff) {
        return res.status(403).json({
          success: false,
          message: `Access denied to this ${resourceType}`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Resource access check failed",
      });
    }
  };
};

// New middleware for admin approval checks
export const checkApprovedAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    if (!req.user.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Admin account pending approval",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Admin verification failed",
    });
  }
};
