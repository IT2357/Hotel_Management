import assert from 'assert';
import { setModelOverrides } from '../utils/gsrSync.js';

// Build simple stubs for StaffTask and User
function addChainMethods(obj) {
  obj.populate = function() { return this; };
  obj.toObject = function() { return { ...this }; };
  return obj;
}

async function testAssignTask() {
  const saved = { count: 0 };
  const task = addChainMethods({
    _id: 't1',
    department: 'Service',
    assignmentHistory: [],
    notes: [],
    save: async () => { saved.count++; },
  });

  const StaffTaskOverride = {
    findById: (id) => task
  };
  const UserOverride = {
    findById: (id) => ({ populate: () => ({ role: 'staff', name: 'Alice' }) })
  };

  // Avoid real DB in sync util
  setModelOverrides({ StaffTaskOverride, GuestServiceRequestOverride: { findByIdAndUpdate: async () => {} } });

  // Monkey patch actual model modules so controller uses stubs
  const staffTaskModule = await import('../models/StaffTask.js');
  staffTaskModule.default.findById = StaffTaskOverride.findById;

  // Monkey patch User model in-place by importing module and overriding export (works as it's an object)
  const userModule = await import('../models/User.js');
  userModule.User.findById = UserOverride.findById;

  const { default: ManagerTaskController } = await import('../controllers/manager/managerTaskController.js');

  const req = { params: { taskId: 't1' }, body: { staffId: 's1', notes: 'note' }, user: { userId: 'm1' } };
  let json;
  const res = { status: () => res, json: (payload) => { json = payload; } };

  await ManagerTaskController.assignTask(req, res);

  assert.strictEqual(saved.count, 1);
  assert.strictEqual(task.assignedTo, 's1');
  assert.strictEqual(task.status, 'assigned');
  assert.strictEqual(json.success, true);
  // Response object shape may vary; ensure assignment occurred on task object
  assert.strictEqual(task.assignedTo, 's1');
}

async function testUpdateTaskStatus() {
  const { default: ManagerTaskController } = await import('../controllers/manager/managerTaskController.js');

  const saved = { count: 0 };
  const task = addChainMethods({
    _id: 't2',
    notes: [],
    save: async () => { saved.count++; }
  });

  const StaffTaskOverride = {
    findById: (id) => task
  };

  setModelOverrides({ StaffTaskOverride, GuestServiceRequestOverride: { findByIdAndUpdate: async () => {} } });
  const staffTaskModule = await import('../models/StaffTask.js');
  staffTaskModule.default.findById = StaffTaskOverride.findById;

  const req = { params: { taskId: 't2' }, body: { status: 'in_progress', notes: 'go' }, user: { userId: 'm1' } };
  let json;
  const res = { status: () => res, json: (payload) => { json = payload; } };

  await ManagerTaskController.updateTaskStatus(req, res);

  assert.strictEqual(saved.count, 1);
  assert.strictEqual(task.status, 'in_progress');
  assert.strictEqual(json.success, true);
}

async function run() {
  await testAssignTask();
  await testUpdateTaskStatus();
}

run();
console.log('managerController tests passed');
