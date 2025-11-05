import { body } from "express-validator";
import { TASK_PRIORITIES } from "../models/ManagerTask.js";

// POST /api/manager/manage-assignment
// action: 'approve' | 'reject' | 'reassign'
export const manageAssignmentValidation = [
  body("taskId")
    .isMongoId()
    .withMessage("Valid taskId is required"),
  body("action")
    .isIn(["approve", "reject", "reassign"]) 
    .withMessage("action must be one of: approve, reject, reassign"),
  // staffId required only when action === 'reassign'
  body("staffId")
    .if((value, { req }) => req.body.action === "reassign")
    .isMongoId()
    .withMessage("staffId is required and must be a valid ID when action is reassign"),
];

// POST /api/manager/set-priority
export const setTaskPriorityValidation = [
  body("taskId")
    .isMongoId()
    .withMessage("Valid taskId is required"),
  body("priority")
    .isIn(TASK_PRIORITIES)
    .withMessage(`priority must be one of: ${TASK_PRIORITIES.join(", ")}`),
];

// PUT /api/manager/profile/update
export const updateManagerProfileValidation = [
  // profile fields (User model)
  body("profile").optional().isObject().withMessage("profile must be an object"),
  body("profile.name")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("profile.phone")
    .optional()
    .isMobilePhone("any")
    .withMessage("Please provide a valid phone number"),
  body("profile.email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email"),

  // permissions flags
  body("permissions").optional().isObject().withMessage("permissions must be an object"),
  body("permissions.canApproveLeave").optional().isBoolean().withMessage("canApproveLeave must be boolean"),
  body("permissions.canAuthorizePayments").optional().isBoolean().withMessage("canAuthorizePayments must be boolean"),
  body("permissions.canManageInventory").optional().isBoolean().withMessage("canManageInventory must be boolean"),
  body("permissions.canOverridePricing").optional().isBoolean().withMessage("canOverridePricing must be boolean"),
  body("permissions.canViewFinancials").optional().isBoolean().withMessage("canViewFinancials must be boolean"),

  // shift
  body("shift").optional().isObject().withMessage("shift must be an object"),
  body("shift.startTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("startTime must be HH:mm (00:00 - 23:59)"),
  body("shift.endTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("endTime must be HH:mm (00:00 - 23:59)"),

  // emergency contact
  body("emergencyContact").optional().isObject().withMessage("emergencyContact must be an object"),
  body("emergencyContact.name").optional().isLength({ min: 2, max: 80 }).withMessage("Emergency name must be 2-80 chars"),
  body("emergencyContact.relationship").optional().isLength({ min: 2, max: 60 }).withMessage("Relationship must be 2-60 chars"),
  body("emergencyContact.phone").optional().isString().isLength({ min: 6, max: 30 }).withMessage("Phone must be 6-30 chars"),
  body("emergencyContact.email").optional().isEmail().withMessage("Emergency email must be valid"),

  // notes
  body("notes").optional().isLength({ max: 1000 }).withMessage("Notes must be 1000 characters or less"),
];
