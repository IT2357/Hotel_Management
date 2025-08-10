import { User } from "../models/User.js";

export const authorizeRoles = (options) => {
  let roles = [],
    permissions = [],
    approvalRequired = true;

  if (Array.isArray(options)) {
    roles = options;
  } else if (typeof options === "object" && options !== null) {
    roles = options.roles || [];
    permissions = options.permissions || [];
    approvalRequired =
      options.approvalRequired !== undefined ? options.approvalRequired : true;
  }

  return async (req, res, next) => {
    try {
      if (!req.user?._id) {
        return res
          .status(401)
          .json({ success: false, message: "Authentication required" });
      }

      // Fetch user WITHOUT populate first
      const user = await User.findById(req.user._id);

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }

      // Populate profile based on role AFTER fetching user document
      const profileField =
        req.user.role === "admin" ? "adminProfile" : `${req.user.role}Profile`;

      await user.populate(profileField);

      const userObj = user.toObject();

      console.log("User:", JSON.stringify(userObj, null, 2));
      console.log("Profile:", JSON.stringify(userObj[profileField], null, 2));

      // Role check
      if (roles.length && !roles.includes(userObj.role)) {
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized role" });
      }

      // Approval check
      if (
        approvalRequired &&
        ["admin", "manager", "staff"].includes(userObj.role) &&
        !userObj.isApproved
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Account pending approval" });
      }

      // Permissions check
      if (permissions.length) {
        const profile = userObj[profileField];
        if (
          !profile ||
          !profile.permissions ||
          profile.permissions.length === 0
        ) {
          return res
            .status(403)
            .json({ success: false, message: "No permissions assigned" });
        }

        const hasPermissions = permissions.every((perm) => {
          const [module, action] = perm.split(":");
          const modulePerm = profile.permissions.find(
            (p) => p.module === module
          );
          return modulePerm?.actions.includes(action);
        });

        if (!hasPermissions) {
          return res
            .status(403)
            .json({ success: false, message: "Insufficient permissions" });
        }
      }

      // Attach full user object with populated profile to req.user
      req.user = userObj;
      next();
    } catch (error) {
      console.error("authorizeRoles error:", error.stack);
      res.status(500).json({
        success: false,
        message: `Authorization error: ${error.message}`,
      });
    }
  };
};
