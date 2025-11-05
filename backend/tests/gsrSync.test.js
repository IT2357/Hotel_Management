import assert from 'assert';
import mongoose from 'mongoose';

// Ensure feature flag is off by default for first tests
process.env.FEATURE_GSR_ALL_CANCELLED_CANCELS_GSR = "false";

const validId = new mongoose.Types.ObjectId().toString();

const makeMockModels = (statuses, capture) => {
  const StaffTaskOverride = {
    find: () => ({
      lean: () => statuses.map(s => ({ status: s }))
    })
  };
  const GuestServiceRequestOverride = {
    findByIdAndUpdate: async (id, update) => {
      capture.push({ id, update });
    }
  };
  return { StaffTaskOverride, GuestServiceRequestOverride };
};

async function run() {
  // Dynamic import to ensure env flags are read
  const gsrSync = await import('../utils/gsrSync.js');
  const { setModelOverrides, syncGSRStatusFromTask } = gsrSync;

  // Case 1: any assigned/in_progress -> GSR in_progress
  {
    const capture = [];
    const { StaffTaskOverride, GuestServiceRequestOverride } = makeMockModels(['assigned', 'pending'], capture);
    setModelOverrides({ StaffTaskOverride, GuestServiceRequestOverride });
    await syncGSRStatusFromTask({ source: 'guest_service', sourceModel: 'GuestServiceRequest', sourceRef: validId, status: 'assigned' });
    assert.strictEqual(capture.length, 1);
    assert.strictEqual(capture[0].id.toString(), validId.toString());
    assert.strictEqual(capture[0].update.$set.status, 'in_progress');
  }

  // Case 2: all completed -> GSR completed (with completedAt)
  {
    const capture = [];
    const { StaffTaskOverride, GuestServiceRequestOverride } = makeMockModels(['completed', 'completed'], capture);
    setModelOverrides({ StaffTaskOverride, GuestServiceRequestOverride });
    await syncGSRStatusFromTask({ source: 'guest_service', sourceModel: 'GuestServiceRequest', sourceRef: validId, status: 'completed' });
    assert.strictEqual(capture.length, 1);
    assert.strictEqual(capture[0].update.$set.status, 'completed');
    assert.ok(capture[0].update.$set.completedAt instanceof Date);
  }

  // Case 3: all cancelled + flag ON -> GSR cancelled
  {
    // Turn on feature flag at runtime
    const envMod = await import('../config/environment.js');
    envMod.default.FEATURES.GSR_ALL_CANCELLED_CANCELS_GSR = true;

    const capture = [];
    const { StaffTaskOverride, GuestServiceRequestOverride } = makeMockModels(['cancelled', 'cancelled'], capture);
    setModelOverrides({ StaffTaskOverride, GuestServiceRequestOverride });
    await syncGSRStatusFromTask({ source: 'guest_service', sourceModel: 'GuestServiceRequest', sourceRef: validId, status: 'cancelled' });
    assert.strictEqual(capture.length, 1);
    assert.strictEqual(capture[0].update.$set.status, 'cancelled');
  }
}

run();
console.log('gsrSync tests passed');
