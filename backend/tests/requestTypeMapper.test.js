import assert from 'assert';
import { mapRequestTypeToDeptCategory, getCanonicalDepartment } from '../utils/requestTypeMapper.js';

function run() {
  // Mapping tests
  assert.deepStrictEqual(mapRequestTypeToDeptCategory('room_service'), { department: 'Kitchen', category: 'room_service' });
  assert.deepStrictEqual(mapRequestTypeToDeptCategory('dining'), { department: 'Kitchen', category: 'room_service' });
  assert.deepStrictEqual(mapRequestTypeToDeptCategory('housekeeping'), { department: 'Housekeeping', category: 'cleaning' });
  assert.deepStrictEqual(mapRequestTypeToDeptCategory('laundry'), { department: 'Housekeeping', category: 'laundry' });
  assert.deepStrictEqual(mapRequestTypeToDeptCategory('maintenance'), { department: 'Maintenance', category: 'general' });
  assert.deepStrictEqual(mapRequestTypeToDeptCategory('concierge'), { department: 'Service', category: 'concierge' });
  assert.deepStrictEqual(mapRequestTypeToDeptCategory('transport'), { department: 'Service', category: 'transportation' });
  assert.deepStrictEqual(mapRequestTypeToDeptCategory('wakeup_call'), { department: 'Service', category: 'guest_request' });
  assert.deepStrictEqual(mapRequestTypeToDeptCategory('other'), { department: 'Service', category: 'guest_request' });

  // Canonical department tests
  assert.strictEqual(getCanonicalDepartment('service'), 'Service');
  assert.strictEqual(getCanonicalDepartment('SERVICE'), 'Service');
  assert.strictEqual(getCanonicalDepartment('Kitchen'), 'Kitchen');
  assert.strictEqual(getCanonicalDepartment('kitchen'), 'Kitchen');
  assert.strictEqual(getCanonicalDepartment('unknown'), null);
}

run();
console.log('requestTypeMapper tests passed');
