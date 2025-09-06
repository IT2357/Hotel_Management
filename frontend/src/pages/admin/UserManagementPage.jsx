import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import DefaultAdminLayout from '../../layout/admin/DefaultAdminLayout';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import Card from '../../components/ui/Card';
import useDebounce from '../../hooks/useDebounce';

export default function UserManagementPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    role: '',
    isApproved: 'all',
    search: '',
  });
  const debouncedSearch = useDebounce(filters.search, 500);
  const [pagination, setPagination] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [editFormData, setEditFormData] = useState({});
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff',
  });

  const tabs = [
    { id: 'users', label: 'All Users', icon: '👥' },
    { id: 'pending', label: 'Pending Approval', icon: '⏳' },
    { id: 'create', label: 'Create User', icon: '➕' },
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const apiFilters = {
        ...filters,
        role: filters.role || undefined,
        isApproved: filters.isApproved === 'all' ? undefined : filters.isApproved === 'true',
        search: filters.search || undefined,
      };
      const response = await adminService.getUsers(apiFilters);
      setUsers(response.data.data.users || []);
      setPagination(response.data.data.pagination || {});
    } catch (error) {
      console.error('Failed to fetch users:', error);
      alert(error.response?.data?.message || 'Failed to fetch users.');
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
      alert(error.response?.data?.message || 'Failed to fetch pending approvals.');
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
  }, [activeTab, filters.page, filters.limit, filters.role, filters.isApproved, debouncedSearch]);

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
          response = await adminService.deleteUser(userId, { reason: data.reason, confirmationText: data.confirmationText });
          break;
        case 'updateRole':
          response = await adminService.updateUserRole(userId, data);
          break;
        case 'resetPassword':
          response = await adminService.resetUserPassword(userId, {
            temporaryPassword: data.temporaryPassword,
            requirePasswordChange: data.requirePasswordChange,
            adminId: user._id,
          });
          alert(`Password reset successful. Temporary password: ${response.data.temporaryPassword}`);
          break;
        case 'updateProfile':
          response = await adminService.updateUserProfile(userId, data);
          break;
      }
      if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'pending') {
        fetchPendingApprovals();
      }
      setShowDeleteModal(false);
      setShowEditModal(false);
      setShowPasswordResetModal(false);
      setSelectedUser(null);
      setDeleteConfirmation('');
      setDeleteReason('');
      return response;
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      alert(error.response?.data?.message || `Failed to ${action} user.`);
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
        role: 'staff',
      });
      setActiveTab('users');
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      alert(error.response?.data?.message || 'Failed to create user.');
    }
  };

  const openDetailsModal = async (userId) => {
    try {
      const response = await adminService.getUserDetails(userId);
      setSelectedUser(response.data.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      alert(error.response?.data?.message || 'Failed to fetch user details.');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      phone: user.phone || '',
      address: user.address || {},
      profile: {},
    });
    setShowEditModal(true);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      case 'manager': return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
      case 'staff': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
    }
  };

  const getStatusColor = (user) => {
    if (!user.isActive && user.passwordResetPending) return 'bg-orange-50 text-orange-800 border-orange-200';
    if (!user.isActive) return 'bg-red-50 text-red-800 border-red-200';
    if (!user.isApproved && user.role !== 'guest') return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    return 'bg-green-50 text-green-800 border-green-200';
  };

  const getStatusText = (user) => {
    if (!user.isActive && user.passwordResetPending) return 'Password Reset Pending';
    if (!user.isActive) return 'Inactive';
    if (!user.isApproved && user.role !== 'guest') return 'Pending';
    return 'Active';
  };

  const stats = {
    total: users.length,
    guests: users.filter(u => u.role === 'guest').length,
    staff: users.filter(u => u.role === 'staff').length,
    managers: users.filter(u => u.role === 'manager').length,
    admins: users.filter(u => u.role === 'admin').length,
    active: users.filter(u => u.isActive).length,
    pending: users.filter(u => !u.isApproved && u.role !== 'guest').length,
  };

  return (
    <DefaultAdminLayout>
      <div className="space-y-6">
        {/* Modern Page Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">👥 User Management</h1>
              <p className="text-indigo-100 text-lg">
                Welcome back, {user?.name?.split(" ")[0]}! Manage users, roles, and permissions
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => activeTab === 'users' ? fetchUsers() : fetchPendingApprovals()}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Guests</p>
                <p className="text-3xl font-bold text-gray-900">{stats.guests}</p>
              </div>
              <div className="p-3 bg-gray-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Staff</p>
                <p className="text-3xl font-bold text-green-900">{stats.staff}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v6a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Managers</p>
                <p className="text-3xl font-bold text-purple-900">{stats.managers}</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Admins</p>
                <p className="text-3xl font-bold text-red-900">{stats.admins}</p>
              </div>
              <div className="p-3 bg-red-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Active</p>
                <p className="text-3xl font-bold text-emerald-900">{stats.active}</p>
              </div>
              <div className="p-3 bg-emerald-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-orange-900">{stats.pending}</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <Card className="bg-white shadow-xl rounded-2xl border-0 p-6">
          <div className="flex flex-wrap gap-3 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102 border border-gray-200'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Create User Form or User List */}
        {activeTab === 'create' ? (
          <CreateUserForm
            formData={createFormData}
            setFormData={setCreateFormData}
            onSubmit={handleCreateUser}
          />
        ) : (
          <>
            {/* Filter Section */}
            <Card className="bg-white shadow-xl rounded-2xl border-0 p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <Input
                      type="text"
                      placeholder="🔍 Search by name or email..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                      className="pl-10 py-3 text-base rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="w-full lg:w-64">
                <Select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
                  className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">All Roles</option>
                  <option value="guest">Guest</option>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </Select>
                </div>
                <div className="w-full lg:w-64">
                <Select
                  value={filters.isApproved}
                  onChange={(e) => setFilters({ ...filters, isApproved: e.target.value, page: 1 })}
                  className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="true">Approved</option>
                  <option value="false">Pending</option>
                </Select>
                </div>
              </div>
            </Card>

            {/* Users List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Spinner size="lg" />
                <p className="text-gray-500 mt-4">Loading users...</p>
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
                  onPageChange={(page) => setFilters({ ...filters, page })}
                />
              </div>
            )}
          </>
        )}

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
            reason: deleteReason,
            confirmationText: deleteConfirmation.trim(),
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
    </DefaultAdminLayout>
  );
}

function CreateUserForm({ formData, setFormData, onSubmit }) {
  return (
    <Card className="bg-white shadow-xl rounded-2xl border-0 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">✨ Create New User</h2>
        <p className="text-gray-600">Add a new team member to your organization</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📛 Full Name</label>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📧 Email</label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">🔒 Password</label>
            <Input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter password"
              className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📞 Phone</label>
            <Input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
              className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Role</label>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: 'staff', label: '👨‍💼 Staff' },
                { value: 'manager', label: '👨‍💻 Manager' },
                { value: 'admin', label: '🔑 Admin' },
              ]}
              className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
        <Button
          type="submit"
          variant="primary"
          className="w-full md:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-semibold"
        >
          🚀 Create User
        </Button>
      </form>
    </Card>
  );
}

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
  isPending,
}) {
  if (users.length === 0) {
    return (
      <Card className="bg-white shadow-xl rounded-2xl border-0 text-center py-16">
        <div className="flex flex-col items-center">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <p className="text-gray-500 text-xl mb-2">No users found</p>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📋 Users</h2>
          <div className="text-sm text-gray-500">
            {users.length} {users.length === 1 ? 'user' : 'users'} found
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user._id}
              className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* User Header with Role Color */}
              <div className={`${getRoleColor(user.role)} rounded-xl p-4 text-white mb-4 shadow-lg`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{user.name}</h3>
                    <p className="text-white/90 text-sm">
                      {user.role === 'admin' ? '🔑' : user.role === 'manager' ? '👨‍💻' : user.role === 'staff' ? '👨‍💼' : '👤'} {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(user)} bg-white/20 text-white border-white/30`}>
                    {getStatusText(user).toUpperCase()}
                  </Badge>
                </div>
              </div>
              {/* User Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewDetails(user._id)}
                  className="flex-1 rounded-full border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
                >
                  👁️ View
                </Button>
                {!isPending && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(user)}
                      className="flex-1 rounded-full border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onResetPassword(user)}
                      className="flex-1 rounded-full border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
                    >
                      🔑 Reset
                    </Button>
                    {user.isActive ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction('deactivate', user._id, { reason: 'Administrative action' })}
                        className="flex-1 rounded-full border-gray-300 hover:border-yellow-500 hover:text-yellow-600"
                      >
                        🚫 Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction('reactivate', user._id)}
                        className="flex-1 rounded-full border-gray-300 hover:border-green-500 hover:text-green-600"
                      >
                        ✅ Reactivate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="error"
                      onClick={() => onDelete(user)}
                      className="rounded-full"
                    >
                      🗑️
                    </Button>
                  </>
                )}
                {isPending && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onAction('approve', user._id, { role: user.role })}
                    className="flex-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    ✅ Approve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function DeleteUserModal({ isOpen, user, confirmation, setConfirmation, reason, setReason, onClose, onDelete }) {
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteReasonConfirmed, setDeleteReasonConfirmed] = useState(false);

  const handleDelete = () => {
    if (deleteStep === 1) {
      if (!reason) {
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
    try {
      onDelete();
    } catch (error) {
      console.error("Error during user deletion:", error);
      alert(error?.response?.data?.message || "Failed to delete user.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete User Account" className="rounded-2xl shadow-xl">
      <div className="space-y-6 p-6">
        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
          <p className="text-red-800 flex items-center">
            <span className="mr-2">⚠️</span>
            <strong>Warning:</strong> This action is permanent and cannot be undone.
          </p>
        </div>
        {user && (
          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-gray-700 mb-2">You are about to permanently delete:</p>
            <div className="space-y-2">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            </div>
          </div>
        )}
        {deleteStep === 1 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Deletion</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500"
              rows="4"
              placeholder="Provide a detailed reason for this deletion..."
              required
            />
          </div>
        )}
        {deleteStep === 2 && (
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="confirmReason"
                checked={deleteReasonConfirmed}
                onChange={(e) => setDeleteReasonConfirmed(e.target.checked)}
                className="mt-1 mr-2 rounded"
              />
              <label htmlFor="confirmReason" className="text-yellow-800 text-sm">
                I understand this action is permanent. The user account and all associated data will be deleted.
              </label>
            </div>
          </div>
        )}
        {deleteStep === 3 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type "DELETE" to Confirm</label>
            <Input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
              className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        )}
        <div className="flex justify-end gap-3">
          {deleteStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setDeleteStep(deleteStep - 1)}
              className="rounded-full border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
            >
              Back
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
          >
            Cancel
          </Button>
          <Button
            variant="error"
            onClick={handleDelete}
            disabled={
              (deleteStep === 1 && !reason) ||
              (deleteStep === 2 && !deleteReasonConfirmed) ||
              (deleteStep === 3 && confirmation !== 'DELETE')
            }
            className="rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
          >
            {deleteStep < 3 ? 'Continue' : 'Delete Account'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function UserDetailsModal({ isOpen, user, onClose }) {
  if (!user || !user.user) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Details" className="rounded-2xl shadow-xl">
      <div className="space-y-6 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-600">Name</p>
              <p className="text-sm text-gray-900">{user.user?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Email</p>
              <p className="text-sm text-gray-900">{user.user.email}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Phone</p>
              <p className="text-sm text-gray-900">{user.user.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Role</p>
              <p className="text-sm text-gray-900">{user.user.role.charAt(0).toUpperCase() + user.user.role.slice(1)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Status</p>
              <p className="text-sm text-gray-900">
                {user.user.isActive ? 'Active' : user.user.passwordResetPending ? 'Password Reset Pending' : 'Inactive'}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Approval Status</p>
              <p className="text-sm text-gray-900">
                {user.user.isApproved ? 'Approved' : 'Pending'}
              </p>
            </div>
          </div>
        </div>
        {user.profile && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">Profile Information</h3>
            <pre className="bg-gray-50 p-4 rounded-xl text-xs text-gray-700 overflow-auto">
              {JSON.stringify(user.profile, null, 2)}
            </pre>
          </div>
        )}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function EditUserModal({ isOpen, user, formData, setFormData, onClose, onSave }) {
  if (!user) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User" className="rounded-2xl shadow-xl">
      <div className="space-y-6 p-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">📛 Name</label>
          <Input
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
            className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">📞 Phone</label>
          <Input
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Enter phone number"
            className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PasswordResetModal({ isOpen, user, onClose, onReset }) {
  const [tempPassword, setTempPassword] = useState('');
  const [requireChange, setRequireChange] = useState(true);

  const handleReset = () => {
    try {
      onReset({
        temporaryPassword: tempPassword || undefined,
        requirePasswordChange: requireChange,
      });
      setTempPassword('');
      setRequireChange(true);
    } catch (error) {
      console.error("Error during password reset:", error);
      alert(error.response?.data?.message || "Failed to reset password.");
    }
  };

  if (!user) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset User Password" className="rounded-2xl shadow-xl">
      <div className="space-y-6 p-6">
        <p className="text-gray-700">
          Reset password for: <strong>{user.name}</strong> ({user.email})
        </p>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">🔑 Temporary Password</label>
          <Input
            type="password"
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
            placeholder="Leave empty to auto-generate"
            className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="requireChange"
            checked={requireChange}
            onChange={(e) => setRequireChange(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="requireChange" className="text-sm text-gray-700">
            Require password change on next login
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleReset}
            className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            Reset Password
          </Button>
        </div>
      </div>
    </Modal>
  );
}