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

      // Get the correct profile field based on role
      const profileField = `${user.role}Profile`;
      
      // Populate the profile with the correct model reference
      await user.populate({
        path: profileField,
        // Ensure we're populating from the correct model
        model: user.role.charAt(0).toUpperCase() + user.role.slice(1) + 'Profile'
      });
      
      // Convert to plain object and get the profile
      const userObj = user.toObject({ virtuals: true });
      const profile = user[profileField];
      
      // Log for debugging
      console.log("User role:", user.role);
      console.log("Profile field:", profileField);
      console.log("Profile populated:", !!profile);
      
      if (profile) {
        console.log("Profile data:", JSON.stringify(profile, null, 2));
        if (profile.permissions) {
          console.log("Profile permissions:", JSON.stringify(profile.permissions, null, 2));
        } else {
          console.log("No permissions array found on profile");
        }
      } else {
        console.log("Profile not found. Available user properties:", Object.keys(userObj));
      }

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
        // Use the populated profile from earlier
        const profile = user[profileField];
        
        // Debug log
        console.log("Checking permissions for:", permissions);
        console.log("User profile reference exists:", !!profile);
        
        if (!profile) {
          console.log(`Profile ${profileField} not found on user`);
          return res.status(403).json({ 
            success: false, 
            message: `Profile not found for role: ${user.role}` 
          });
        }
        
        if (!profile.permissions || !Array.isArray(profile.permissions) || profile.permissions.length === 0) {
          console.log("No valid permissions array found on profile");
          console.log("No permissions found on profile");
          return res
            .status(403)
            .json({ success: false, message: "No permissions assigned" });
        }

        const hasPermissions = permissions.every((perm) => {
          console.log("Checking permission:", perm);
          
          // Split into module and action if using colon format (e.g., "invitations:read")
          let [module, action] = perm.includes(':') ? 
            perm.split(':') : 
            [perm, 'read'];
          
          console.log(`Looking for module: ${module}, action: ${action}`);
          
          try {
            // Find the permission object for this module
            const modulePerm = profile.permissions.find(
              (p) => p.module === module
            );
            
            console.log("Found module permission:", modulePerm);
            
            // Check if module exists and has the required action
            const hasPermission = modulePerm?.actions?.includes(action);
            console.log(`Permission ${perm} check result:`, hasPermission);
            return hasPermission;
          } catch (error) {
            console.error("Error checking permission:", error);
            return false;
          }
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
