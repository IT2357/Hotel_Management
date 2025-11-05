import mongoose from 'mongoose';
import StaffTaskModel from '../models/StaffTask.js';
import GuestServiceRequestModel from '../models/GuestServiceRequest.js';
import config from '../config/environment.js';

// Allow tests to override models
let StaffTask = StaffTaskModel;
let GuestServiceRequest = GuestServiceRequestModel;

export const setModelOverrides = ({ StaffTaskOverride, GuestServiceRequestOverride } = {}) => {
  if (StaffTaskOverride) StaffTask = StaffTaskOverride;
  if (GuestServiceRequestOverride) GuestServiceRequest = GuestServiceRequestOverride;
};

/**
 * Sync the status of a GuestServiceRequest based on the statuses of all linked StaffTasks.
 * Contract:
 * - Input: A StaffTask mongoose document or plain object with source/sourceModel/sourceRef/status
 * - Behavior:
 *   - If any sibling task is assigned or in_progress -> GSR becomes in_progress
 *   - Else if all sibling tasks are completed -> GSR becomes completed (and sets completedAt)
 *   - Else if feature flag enabled and all sibling tasks are cancelled -> GSR becomes cancelled
 *   - Otherwise, do not change the GSR status
 * - Errors are logged but never thrown (non-fatal sync)
 */
export const syncGSRStatusFromTask = async (taskLike) => {
  try {
    if (!taskLike) return;

    const { source, sourceModel, sourceRef } = taskLike;
    if (source !== 'guest_service' || sourceModel !== 'GuestServiceRequest' || !sourceRef) return;

    const requestId = String(sourceRef);
    if (!mongoose.isValidObjectId(requestId)) return;

    // Pull statuses of all siblings
    const siblingsQuery = await StaffTask.find(
      { source: 'guest_service', sourceModel: 'GuestServiceRequest', sourceRef: requestId },
      { status: 1 }
    );
    const siblings = typeof siblingsQuery.lean === 'function' ? await siblingsQuery.lean() : siblingsQuery;

    if (!siblings || siblings.length === 0) return;

    const total = siblings.length;
    let completed = 0;
    let cancelled = 0;
    let inProgressish = 0; // assigned or in_progress

    for (const s of siblings) {
      const st = s.status;
      if (st === 'completed') completed += 1;
      else if (st === 'cancelled') cancelled += 1;
      else if (st === 'assigned' || st === 'in_progress') inProgressish += 1;
    }

    let target = null;
    if (inProgressish > 0) {
      target = 'in_progress';
    } else if (completed === total) {
      target = 'completed';
    } else if (config.FEATURES?.GSR_ALL_CANCELLED_CANCELS_GSR && cancelled === total) {
      target = 'cancelled';
    }

    if (!target) return;

    const update = { status: target };
    if (target === 'completed') {
      update.completedAt = new Date();
    }

    await GuestServiceRequest.findByIdAndUpdate(requestId, { $set: update }, { new: true });
  } catch (err) {
    // Non-fatal: log and continue
    console.warn('GSR reverse sync failed:', err?.message || err);
  }
};

export default { syncGSRStatusFromTask };
