// Central mapping from GuestServiceRequest.requestType to StaffTask department/category
// Keeps manager oversight consistent and avoids drift.

const CANON_DEPARTMENTS = ["Housekeeping", "Kitchen", "Maintenance", "Service"];

export function mapRequestTypeToDeptCategory(requestType) {
  const type = String(requestType || '').trim().toLowerCase();
  switch (type) {
    case 'room_service':
    case 'dining':
      return { department: 'Kitchen', category: 'room_service' };
    case 'housekeeping':
      return { department: 'Housekeeping', category: 'cleaning' };
    case 'laundry':
      return { department: 'Housekeeping', category: 'laundry' };
    case 'maintenance':
      return { department: 'Maintenance', category: 'general' };
    case 'concierge':
      return { department: 'Service', category: 'concierge' };
    case 'transport':
      return { department: 'Service', category: 'transportation' };
    case 'wakeup_call':
    case 'spa':
    case 'other':
    default:
      return { department: 'Service', category: 'guest_request' };
  }
}

export function getCanonicalDepartment(dept) {
  if (!dept) return null;
  const str = String(dept).trim().toLowerCase();
  return CANON_DEPARTMENTS.find(d => d.toLowerCase() === str) || null;
}
