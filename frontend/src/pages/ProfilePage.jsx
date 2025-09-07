import React, { useState, useEffect, useContext } from 'react';
import useAuth from '../hooks/useAuth';
import authService from '../services/authService';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProfilePage = () => {
  const { user, logout: authLogout, setUser } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
        try {
          setLoading(true);
          const currentUser = await authService.getCurrentUser();
      
          // Access nested user data properly
          const user = currentUser.data?.data?.user;
      
          if (!user) {
            throw new Error("User data not found in response");
          }
      
          setProfileData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
          });
      
          setUser(user); // Update user in context
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
      setProfileData({
        name: updatedUser.user.name,
        email: updatedUser.user.email,
        phone: updatedUser.user.phone,
        address: updatedUser.user.address,
      });
      setUser(updatedUser.user); // Update user in context
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        User Profile
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information Card */}
        <Card className="lg:col-span-2 p-6 shadow-lg rounded-lg bg-white dark:bg-gray-800">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-white mb-4">
            Personal Information
          </h2>
          {isEditingProfile ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  placeholder="Your Name"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  disabled
                  className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <Input
                  type="text"
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  placeholder="Your Phone Number"
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                <Input
                  type="text"
                  id="address"
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  placeholder="Your Address"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="secondary" onClick={() => setIsEditingProfile(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner size="sm" /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-gray-600 dark:text-gray-300">
              <p><strong>Name:</strong> {profileData.name}</p>
              <p><strong>Email:</strong> {profileData.email}</p>
              <p><strong>Phone:</strong> {profileData.phone || 'N/A'}</p>
              <p><strong>Address:</strong> {profileData.address || 'N/A'}</p>
              <Button onClick={() => setIsEditingProfile(true)} className="mt-4">
                Edit Profile
              </Button>
            </div>
          )}
        </Card>

        {/* Security Settings Card */}
        <Card className="p-6 shadow-lg rounded-lg bg-white dark:bg-gray-800">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-white mb-4">
            Security Settings
          </h2>
          {isChangingPassword ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                <Input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                <Input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                <Input
                  type="password"
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  value={passwordData.confirmNewPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="secondary" onClick={() => setIsChangingPassword(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner size="sm" /> : 'Change Password'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <Button onClick={() => setIsChangingPassword(true)} className="w-full">
                Change Password
              </Button>
              <Button variant="danger" onClick={() => setShowDeleteModal(true)} className="w-full">
                Delete Account
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Account Deletion"
      >
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Are you sure you want to delete your account? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteAccount} disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Delete Account'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;