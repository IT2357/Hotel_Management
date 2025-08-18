import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';

export default function UserManagementPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    role: '',
    isApproved: 'all', // Default to showing all users
    search: ''
  });
  const [pagination, setPagination] = useState({});
  
  // Modals and selected user
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  
  // Form states
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [editFormData, setEditFormData] = useState({});
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff'
  });

  const tabs = [
    { id: 'users', label: 'All Users', icon: '👥' },
    { id: 'pending', label: 'Pending Approval', icon: '⏳' },
    { id: 'create', label: 'Create User', icon: '➕' }
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Convert string filters to proper types
      const apiFilters = {
        ...filters,
        role: filters.role || undefined,
        isApproved: filters.isApproved === '' ? undefined :
                   filters.isApproved === 'all' ? undefined :
                   filters.isApproved === 'true',
        search: filters.search || undefined
      };
      const response = await adminService.getUsers(apiFilters);
      setUsers(response.data.data.users || []);
      setPagination(response.data.data.pagination || {});
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const response = await adminService.getPendingApprovals();
      setUsers(response.data.data);
      setPagination({});
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'pending') {
      fetchPendingApprovals();
    }
  }, [activeTab, filters.page, filters.limit, filters.role, filters.isApproved, filters.search]);

  const handleUserAction = async (action, userId, data = {}) => {
    try {
      let response;
      switch (action) {
        case 'approve':
          response = await adminService.approveUser(userId, data);
          break;
        case 'deactivate':
          response = await adminService.deactivateUser(userId, data);
          break;
        case 'reactivate':
          response = await adminService.reactivateUser(userId);
          break;
        case 'delete':
          response = await adminService.deleteUser(userId, data);
          break;
        case 'updateRole':
          response = await adminService.updateUserRole(userId, data);
          break;
        case 'resetPassword':
          response = await adminService.resetUserPassword(userId, data);
          break;
        case 'updateProfile':
          response = await adminService.updateUserProfile(userId, data);
          break;
      }
      
      // Refresh the user list
      if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'pending') {
        fetchPendingApprovals();
      }
      
      // Close modals
      setShowDeleteModal(false);
      setShowEditModal(false);
      setShowPasswordResetModal(false);
      setSelectedUser(null);
      setDeleteConfirmation('');
      setDeleteReason('');
      
      return response;
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      throw error;
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminService.createPrivilegedUser(createFormData);
      setCreateFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'staff'
      });
      setActiveTab('users');
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const openDetailsModal = async (userId) => {
    try {
      const response = await adminService.getUserDetails(userId);
      setSelectedUser(response.data.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      phone: user.phone || '',
      address: user.address || {},
      profile: {}
    });
    setShowEditModal(true);
  };

  const getRoleColor = (role) => {
    const colors = {
      guest: 'bg-gray-100 text-gray-800',
      staff: 'bg-blue-100 text-blue-800',
      manager: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (user) => {
    if (!user.isActive) return 'bg-red-100 text-red-800';
    if (!user.isApproved && user.role !== 'guest') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (user) => {
    if (!user.isActive) return 'Inactive';
    if (!user.isApproved && user.role !== 'guest') return 'Pending';
    return 'Active';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-indigo-600">User Management</h1>
          <p className="text-gray-600 mt-1">Manage users, roles, and permissions</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'create' ? (
          <CreateUserForm 
            formData={createFormData}
            setFormData={setCreateFormData}
            onSubmit={handleCreateUser}
          />
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                />
                <Select
                  value={filters.role}
                  onChange={(e) => setFilters({...filters, role: e.target.value, page: 1})}
                >
                  <option value="">All Roles</option>
                  <option value="guest">Guest</option>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </Select>
                <Select
                  value={filters.isApproved}
                  onChange={(e) => setFilters({...filters, isApproved: e.target.value, page: 1})}
                >
                  <option value="all">All Status</option>
                  <option value="true">Approved</option>
                  <option value="false">Pending</option>
                </Select>
                <Button onClick={() => activeTab === 'users' ? fetchUsers() : fetchPendingApprovals()}>
                  Apply Filters
                </Button>
              </div>
            </div>

            {/* Users List */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <UsersList 
                users={users}
                onViewDetails={openDetailsModal}
                onEdit={openEditModal}
                onDelete={(user) => {
                  setSelectedUser(user);
                  setShowDeleteModal(true);
                }}
                onAction={handleUserAction}
                onResetPassword={(user) => {
                  setSelectedUser(user);
                  setShowPasswordResetModal(true);
                }}
                getRoleColor={getRoleColor}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                isPending={activeTab === 'pending'}
              />
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  onPageChange={(page) => setFilters({...filters, page})}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <DeleteUserModal
        isOpen={showDeleteModal}
        user={selectedUser}
        confirmation={deleteConfirmation}
        setConfirmation={setDeleteConfirmation}
        reason={deleteReason}
        setReason={setDeleteReason}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
          setDeleteConfirmation('');
          setDeleteReason('');
        }}
        onDelete={() => handleUserAction('delete', selectedUser._id, {
          confirmationText: deleteConfirmation,
          reason: deleteReason
        })}
      />

      <UserDetailsModal
        isOpen={showDetailsModal}
        user={selectedUser}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedUser(null);
        }}
      />

      <EditUserModal
        isOpen={showEditModal}
        user={selectedUser}
        formData={editFormData}
        setFormData={setEditFormData}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
          setEditFormData({});
        }}
        onSave={() => handleUserAction('updateProfile', selectedUser._id, editFormData)}
      />

      <PasswordResetModal
        isOpen={showPasswordResetModal}
        user={selectedUser}
        onClose={() => {
          setShowPasswordResetModal(false);
          setSelectedUser(null);
        }}
        onReset={(data) => handleUserAction('resetPassword', selectedUser._id, data)}
      />
    </div>
  );
}

// Create User Form Component
function CreateUserForm({ formData, setFormData, onSubmit }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Create New User</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <Input
            label="Password"
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
          >
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </Select>
        </div>
        <div className="flex justify-end">
          <Button type="submit">Create User</Button>
        </div>
      </form>
    </div>
  );
}

// Users List Component
function UsersList({ 
  users, 
  onViewDetails, 
  onEdit, 
  onDelete, 
  onAction, 
  onResetPassword,
  getRoleColor, 
  getStatusColor, 
  getStatusText,
  isPending 
}) {
  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No users found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user._id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge className={getRoleColor(user.role)}>
                  {user.role}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge className={getStatusColor(user)}>
                  {getStatusText(user)}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails(user._id)}
                  >
                    View
                  </Button>
                  {!isPending && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResetPassword(user)}
                      >
                        Reset Password
                      </Button>
                      {user.isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAction('deactivate', user._id, { reason: 'Administrative action' })}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAction('reactivate', user._id)}
                        >
                          Reactivate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => onDelete(user)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                  {isPending && (
                    <Button
                      size="sm"
                      onClick={() => onAction('approve', user._id, { role: user.role })}
                    >
                      Approve
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Delete User Modal Component
function DeleteUserModal({ isOpen, user, confirmation, setConfirmation, reason, setReason, onClose, onDelete }) {
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteReasonConfirmed, setDeleteReasonConfirmed] = useState(false);

  const handleDelete = () => {
    if (deleteStep === 1) {
      if (!deleteReason) {
        alert('Please provide a reason for deletion');
        return;
      }
      setDeleteStep(2);
      return;
    }
    
    if (deleteStep === 2) {
      if (!deleteReasonConfirmed) {
        alert('Please confirm you understand this action is permanent');
        return;
      }
      setDeleteStep(3);
      return;
    }

    if (confirmation !== 'DELETE') {
      alert('Please type "DELETE" to confirm');
      return;
    }
    onDelete();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete User Account">
      <div className="space-y-4">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-800">
            ⚠️ <strong>Warning:</strong> This action is permanent and cannot be undone.
          </p>
        </div>
        
        {user && (
          <div>
            <p className="text-gray-700">
              You are about to permanently delete the account for:
            </p>
            <div className="bg-gray-100 p-3 rounded mt-2">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
            </div>
          </div>
        )}

        {deleteStep === 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for deletion (required):
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows="3"
              placeholder="Provide a detailed reason for this deletion..."
              required
            />
          </div>
        )}

        {deleteStep === 2 && (
          <div className="bg-yellow-50 p-4 rounded-md">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="confirmReason"
                checked={deleteReasonConfirmed}
                onChange={(e) => setDeleteReasonConfirmed(e.target.checked)}
                className="mt-1 mr-2"
              />
              <label htmlFor="confirmReason" className="text-yellow-800">
                I understand this action is permanent and cannot be undone.
                The user account and all associated data will be permanently deleted.
              </label>
            </div>
          </div>
        )}

        {deleteStep === 3 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type "DELETE" to confirm:
            </label>
            <Input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
            />
          </div>
        )}

        <div className="flex justify-end space-x-3">
          {deleteStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setDeleteStep(deleteStep - 1)}
            >
              Back
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={
              (deleteStep === 1 && !reason) ||
              (deleteStep === 2 && !deleteReasonConfirmed) ||
              (deleteStep === 3 && confirmation !== 'DELETE')
            }
          >
            {deleteStep < 3 ? 'Continue' : 'Delete Account'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// User Details Modal Component
function UserDetailsModal({ isOpen, user, onClose }) {
  if (!user || !user.user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Details">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="text-sm text-gray-900">{user.user?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{user.user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="text-sm text-gray-900">{user.user.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Role</p>
              <p className="text-sm text-gray-900">{user.user.role}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="text-sm text-gray-900">
                {user.user.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Approval Status</p>
              <p className="text-sm text-gray-900">
                {user.user.isApproved ? 'Approved' : 'Pending'}
              </p>
            </div>
          </div>
        </div>

        {user.profile && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Profile Information</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(user.profile, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

// Edit User Modal Component
function EditUserModal({ isOpen, user, formData, setFormData, onClose, onSave }) {
  const handleSave = () => {
    onSave();
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
      <div className="space-y-4">
        <Input
          label="Name"
          value={formData.name || ''}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
        <Input
          label="Phone"
          value={formData.phone || ''}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />
        
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Password Reset Modal Component
function PasswordResetModal({ isOpen, user, onClose, onReset }) {
  const [tempPassword, setTempPassword] = useState('');
  const [requireChange, setRequireChange] = useState(true);

  const handleReset = () => {
    onReset({
      temporaryPassword: tempPassword || undefined,
      requirePasswordChange: requireChange
    });
    setTempPassword('');
    setRequireChange(true);
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset User Password">
      <div className="space-y-4">
        <p className="text-gray-700">
          Reset password for: <strong>{user.name}</strong> ({user.email})
        </p>
        
        <Input
          label="Temporary Password (leave empty to generate)"
          type="password"
          value={tempPassword}
          onChange={(e) => setTempPassword(e.target.value)}
          placeholder="Leave empty to auto-generate"
        />
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="requireChange"
            checked={requireChange}
            onChange={(e) => setRequireChange(e.target.checked)}
          />
          <label htmlFor="requireChange" className="text-sm text-gray-700">
            Require password change on next login
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleReset}>
            Reset Password
          </Button>
        </div>
      </div>
    </Modal>
  );
}