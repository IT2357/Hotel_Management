import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useAuth from '../hooks/useAuth';
import authService from '../services/authService';
import DefaultLayout from '../layout/admin/DefaultAdminLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';

const ProfilePage = () => {
  const { user, logout: authLogout, setUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [originalProfileData, setOriginalProfileData] = useState({}); // Store original data for cancel
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'delete', label: 'Delete Account', icon: '🗑️' },
  ];

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const currentUser = await authService.getCurrentUser();
        const userData = currentUser.data?.data?.user;

        if (!userData) {
          throw new Error('User data not found in response');
        }

        const userProfile = {
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
        };
        setProfileData(userProfile);
        setOriginalProfileData(userProfile); // Store original data
        setUser(userData);
      } catch (error) {
        toast.error(error.message || 'Failed to fetch profile data.');
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user, setUser]);

  // Handlers
  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updatedUser = await authService.updateProfile(profileData);
      const updatedProfile = {
        name: updatedUser.user.name,
        email: updatedUser.user.email,
        phone: updatedUser.user.phone,
        address: updatedUser.user.address,
      };
      setProfileData(updatedProfile);
      setOriginalProfileData(updatedProfile); // Update original data
      setUser(updatedUser.user);
      toast.success('Profile updated successfully!');
      setIsEditingProfile(false);
    } catch (error) {
      toast.error(error.message || 'Failed to update profile.');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully! Please log in again.');
      authLogout();
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Failed to change password.');
      console.error('Error changing password:', error);
    } finally {
      setLoading(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await authService.deleteProfile();
      toast.success('Account deleted successfully! Redirecting to login.');
      authLogout();
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Failed to delete account.');
      console.error('Error deleting account:', error);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleCancelProfileEdit = () => {
    setProfileData(originalProfileData); // Reset to original data
    setIsEditingProfile(false);
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    setIsChangingPassword(false);
  };

  // Stats for the dashboard
  const stats = {
    profileCompletion: profileData.name && profileData.email && profileData.phone && profileData.address ? 100 : 75,
    accountStatus: user?.isActive ? 'Active' : 'Inactive',
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner size="lg" />
          <p className="text-gray-500 mt-4">Loading profile...</p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="space-y-6">
        {/* Modern Page Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">👤 My Profile</h1>
              <p className="text-indigo-100 text-lg">
                Welcome back, {user?.name?.split(' ')[0]}! Manage your personal information and account settings
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => fetchUserProfile()}
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
        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Profile Completion</p>
                <p className="text-3xl font-bold text-blue-900">{stats.profileCompletion}%</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Account Status</p>
                <p className="text-3xl font-bold text-green-900">{stats.accountStatus}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'profile') setIsEditingProfile(false);
                  if (tab.id !== 'security') setIsChangingPassword(false);
                }}
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

        {/* Content Based on Active Tab */}
        <Card className="bg-white shadow-xl rounded-2xl border-0 p-6">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Personal Information</h2>
              {isEditingProfile ? (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      placeholder="Your Name"
                      required
                      className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      disabled
                      className="py-3 rounded-xl border-gray-200 bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                    <Input
                      type="text"
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      placeholder="Your Phone Number"
                      className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                    <Input
                      type="text"
                      id="address"
                      name="address"
                      value={profileData.address}
                      onChange={handleProfileChange}
                      placeholder="Your Address"
                      className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-gray-50 text-gray-700 hover:bg-gray-100"
                      onClick={handleCancelProfileEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600"
                    >
                      {loading ? <Spinner size="sm" /> : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 text-gray-600">
                  <p><strong>Name:</strong> {profileData.name}</p>
                  <p><strong>Email:</strong> {profileData.email}</p>
                  <p><strong>Phone:</strong> {profileData.phone || 'N/A'}</p>
                  <p><strong>Address:</strong> {profileData.address || 'N/A'}</p>
                  <Button
                    onClick={() => setIsEditingProfile(true)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 mt-4"
                  >
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Security Settings</h2>
              {isChangingPassword ? (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
                    <Input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      required
                      className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                    <Input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      required
                      className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <Input
                      type="password"
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      value={passwordData.confirmNewPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      required
                      className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-gray-50 text-gray-700 hover:bg-gray-100"
                      onClick={handleCancelPasswordChange}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600"
                    >
                      {loading ? <Spinner size="sm" /> : 'Change Password'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={() => setIsChangingPassword(true)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                  >
                    Change Password
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'delete' && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Delete Account</h2>
              <p className="text-gray-600 mb-4">
                Deleting your account is permanent and cannot be undone. All your data will be removed.
              </p>
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white"
              >
                Delete My Account
              </Button>
            </div>
          )}
        </Card>

        {/* Delete Account Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Confirm Account Deletion"
          className="rounded-2xl"
        >
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete your account? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              className="bg-gray-50 text-gray-700 hover:bg-gray-100"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={loading}
              className="bg-gradient-to-r from-red-600 to-pink-600"
            >
              {loading ? <Spinner size="sm" /> : 'Delete Account'}
            </Button>
          </div>
        </Modal>
      </div>
    </DefaultLayout>
  );
};

export default ProfilePage;