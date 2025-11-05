# Guest Service ↔ Staff Task Sync and Feature Flags

This document summarizes the features implemented to improve consistency between Guest Service Requests (GSR) and Staff Tasks, and to make staff task visibility configurable.

## Overview

We centralized reverse-sync logic, added targeted feature flags, and refined staff visibility rules. The goals:
- Keep GuestServiceRequest status in sync with linked StaffTasks
- Make department-wide task visibility for staff configurable
- Provide an optional rule to mark a GSR as cancelled when all linked tasks are cancelled

## What changed

### 1) Central reverse-sync utility

- File: `backend/utils/gsrSync.js`
- Export: `syncGSRStatusFromTask(task)`
- Purpose: Update a linked `GuestServiceRequest` based on the statuses of all sibling `StaffTask` documents.
- Behavior:
  - If any sibling task is `assigned` or `in_progress` → GSR becomes `in_progress`.
  - Else if all siblings are `completed` → GSR becomes `completed` and `completedAt` is set.
  - Else if the feature flag is enabled and all siblings are `cancelled` → GSR becomes `cancelled`.
  - Otherwise, GSR status does not change.
- Non-fatal: Logs a warning if sync fails; doesn’t throw.

### 2) Status update refactor

- File: `backend/controllers/staffTaskController.js`
- Endpoint: `PUT /api/staff/tasks/:taskId/status`
- Change: Replaced inline reverse-sync logic with a call to `syncGSRStatusFromTask(task)` to de-duplicate the logic and make it reusable from other update paths in the future.

### 3) Staff visibility is now configurable

- File: `backend/controllers/staffTaskController.js` (getStaffTasks)
- Default (collaborative): Staff can see
  - Tasks assigned to them
  - Tasks they assigned
  - All tasks in their department
- Restricted mode: If enabled, staff only see
  - Tasks assigned to them
  - Tasks they assigned
- Documentation comment updated in `backend/routes/staffTaskRoutes.js` to explain the flag.

### 4) New feature flags

- File: `backend/config/environment.js`
- Flags:
  - `FEATURE_GSR_TO_TASK_PIPELINE` (existing): When `true`, creating a GSR spawns linked StaffTask(s) behind a feature flag.
  - `FEATURE_RESTRICT_STAFF_DEPT_VISIBILITY` (new): When `true`, disables department-wide visibility for staff.
  - `FEATURE_GSR_ALL_CANCELLED_CANCELS_GSR` (new): When `true`, if every linked StaffTask is cancelled, the GSR is set to `cancelled`.

## Configuration

You can set flags via `.env` or environment variables.

Example `.env` entries:
```
FEATURE_GSR_TO_TASK_PIPELINE=true
FEATURE_RESTRICT_STAFF_DEPT_VISIBILITY=false
FEATURE_GSR_ALL_CANCELLED_CANCELS_GSR=true
```

Windows PowerShell (current session only):
```
$env:FEATURE_GSR_TO_TASK_PIPELINE = "true"
$env:FEATURE_RESTRICT_STAFF_DEPT_VISIBILITY = "false"
$env:FEATURE_GSR_ALL_CANCELLED_CANCELS_GSR = "true"
```

The application reads these into `config.FEATURES`:
- `config.FEATURES.GSR_TO_TASK_PIPELINE`
- `config.FEATURES.RESTRICT_STAFF_DEPT_VISIBILITY`
- `config.FEATURES.GSR_ALL_CANCELLED_CANCELS_GSR`

## How to use the sync utility elsewhere

If another controller or service updates `StaffTask` statuses, import and call the util to keep GSRs in sync:

```
import { syncGSRStatusFromTask } from "../utils/gsrSync.js";

// after saving or updating a task's status
await syncGSRStatusFromTask(task);
```

Inputs can be a Mongoose document or a plain object that includes: `source`, `sourceModel`, `sourceRef`, and `status`.

## Notes and next steps

- Consider adding small unit tests for `gsrSync.js` similar to the mapper tests.
- If you prefer the “all-cancelled” rule always on, we can remove the feature flag and make it default.
- Ensure any other status update pathways for `StaffTask` also call `syncGSRStatusFromTask`.
- Longer-term: consolidate manager views on `StaffTask` only and deprecate the legacy `Task` model if still present in any endpoints.

## Quick verification

- We ran existing backend tests and confirmed the suite passes (requestTypeMapper tests). Add further tests for sync behavior as you expand coverage.
