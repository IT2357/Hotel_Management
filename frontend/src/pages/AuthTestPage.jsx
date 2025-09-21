import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Key,
  Settings,
  Trash2
} from 'lucide-react';
import authService from '../../services/authService';
import api from '../../services/api';

const AuthTestPage = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [testResults, setTestResults] = useState({});

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Register Form State
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Test Users
  const testUsers = [
    { email: 'admin@test.com', password: 'admin123', role: 'admin' },
    { email: 'guest@test.com', password: 'guest123', role: 'guest' },
    { email: 'manager@test.com', password: 'manager123', role: 'manager' },
    { email: 'staff@test.com', password: 'staff123', role: 'staff' }
  ];

  useEffect(() => {
    checkCurrentUser();
    testAllEndpoints();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      setCurrentUser(response.data.data?.user || null);
    } catch (error) {
      setCurrentUser(null);
    }
  };

  const testAllEndpoints = async () => {
    setLoading(true);
    const results = {};

    // Test Health Check
    try {
      const healthResponse = await api.get('/health');
      results.health = { success: true, data: healthResponse.data };
    } catch (error) {
      results.health = { success: false, error: error.message };
    }

    // Test Auth Endpoints
    for (const user of testUsers) {
      try {
        const loginResponse = await api.post('/auth/login', {
          email: user.email,
          password: user.password
        });
        results[`login_${user.role}`] = { success: true, data: loginResponse.data };
      } catch (error) {
        results[`login_${user.role}`] = { success: false, error: error.message };
      }
    }

    setTestResults(results);
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login(loginForm);
      toast.success('Login successful!');
      setCurrentUser(response.data.data?.user || null);
      localStorage.setItem('token', response.data.data?.token || '');
      localStorage.setItem('user', JSON.stringify(response.data.data?.user || null));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.register(registerForm);
      toast.success('Registration successful! Please check your email for verification.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);

    try {
      await authService.logout();
      toast.success('Logout successful!');
      setCurrentUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      toast.error('Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.changePassword(passwordForm);
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginForm.email) {
      toast.error('Please enter your email first');
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword(loginForm.email);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedTestUsers = async () => {
    setLoading(true);

    try {
      const response = await api.post('/auth/seed-test-users');
      toast.success(response.data.message);
      // Refresh test results after seeding
      setTimeout(() => testAllEndpoints(), 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to seed test users');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (user) => {
    setLoginForm({ email: user.email, password: user.password });
    setTimeout(() => {
      document.getElementById('login-form').requestSubmit();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Shield className="h-10 w-10 text-purple-400" />
            Authentication Test Suite
          </h1>
          <p className="text-gray-300 text-lg">
            Comprehensive testing of all authentication features
          </p>
          {currentUser && (
            <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-300 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Logged in as: <strong>{currentUser.name}</strong> ({currentUser.role})
              </p>
            </div>
          )}
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center mb-8 gap-2">
          {[
            { id: 'login', label: 'Login', icon: LogIn },
            { id: 'register', label: 'Register', icon: UserPlus },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'password', label: 'Password', icon: Lock },
            { id: 'test', label: 'Test Results', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20"
            >
              {activeTab === 'login' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <LogIn className="h-6 w-6 text-blue-400" />
                    Login
                  </h2>

                  {/* Quick Test Users */}
                  <div className="mb-6">
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Quick Test Users
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {testUsers.map((user) => (
                        <button
                          key={user.email}
                          onClick={() => quickLogin(user)}
                          className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm"
                        >
                          <div className="font-medium">{user.role.toUpperCase()}</div>
                          <div className="text-xs opacity-75">{user.email}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <form id="login-form" onSubmit={handleLogin} className="space-y-6">
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm(prev => ({...prev, email: e.target.value}))}
                          className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm(prev => ({...prev, password: e.target.value}))}
                          className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                          placeholder="Enter your password"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                        Login
                      </button>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={loading}
                        className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all disabled:opacity-50"
                      >
                        Forgot?
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'register' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <UserPlus className="h-6 w-6 text-green-400" />
                    Register
                  </h2>

                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white font-medium mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            value={registerForm.name}
                            onChange={(e) => setRegisterForm(prev => ({...prev, name: e.target.value}))}
                            className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                            placeholder="Enter your full name"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">
                          Phone
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="tel"
                            value={registerForm.phone}
                            onChange={(e) => setRegisterForm(prev => ({...prev, phone: e.target.value}))}
                            className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                            placeholder="Enter your phone number"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm(prev => ({...prev, email: e.target.value}))}
                          className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="password"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm(prev => ({...prev, password: e.target.value}))}
                          className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                          placeholder="Create a password (min 8 characters)"
                          required
                          minLength={8}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                      Register
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <User className="h-6 w-6 text-orange-400" />
                    Profile Management
                  </h2>

                  {currentUser ? (
                    <div className="space-y-6">
                      <div className="bg-white/10 p-6 rounded-lg">
                        <h3 className="text-white font-medium mb-4">Current User Info</h3>
                        <div className="space-y-2 text-gray-300">
                          <p><strong>Name:</strong> {currentUser.name}</p>
                          <p><strong>Email:</strong> {currentUser.email}</p>
                          <p><strong>Role:</strong> {currentUser.role}</p>
                          <p><strong>Status:</strong> {currentUser.isActive ? 'Active' : 'Inactive'}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleLogout}
                          disabled={loading}
                          className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <LogIn className="h-5 w-5 rotate-180" />
                          Logout
                        </button>
                        <button
                          onClick={handleDeleteProfile}
                          disabled={loading}
                          className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          <Trash2 className="h-5 w-5" />
                          Delete Profile
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                      <p className="text-gray-300">Please log in to view profile information</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'password' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Key className="h-6 w-6 text-yellow-400" />
                    Password Management
                  </h2>

                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({...prev, currentPassword: e.target.value}))}
                          className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                          placeholder="Enter current password"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                          className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                          placeholder="Enter new password"
                          required
                          minLength={8}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({...prev, confirmPassword: e.target.value}))}
                          className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                          placeholder="Confirm new password"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Key className="h-5 w-5" />}
                      Change Password
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'test' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-purple-400" />
                    Test Results
                  </h2>

                  <div className="space-y-4">
                    {Object.entries(testResults).map(([key, result]) => (
                      <div key={key} className="bg-white/10 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium capitalize">
                            {key.replace(/_/g, ' ').replace('login ', 'Login ')}
                          </span>
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                        {result.error && (
                          <p className="text-red-300 text-sm mt-2">{result.error}</p>
                        )}
                        {result.data && (
                          <pre className="text-gray-300 text-xs mt-2 overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={testAllEndpoints}
                    disabled={loading}
                    className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                    Re-run Tests
                  </button>
                  <button
                    onClick={handleSeedTestUsers}
                    disabled={loading}
                    className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Users className="h-5 w-5" />}
                    Seed Test Users
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* API Endpoints */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            >
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Available Endpoints
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  'POST /api/auth/login',
                  'POST /api/auth/register',
                  'POST /api/auth/logout',
                  'GET /api/auth/me',
                  'PUT /api/auth/profile',
                  'PUT /api/auth/change-password',
                  'DELETE /api/auth/profile',
                  'POST /api/auth/forgot-password',
                  'POST /api/auth/reset-password'
                ].map((endpoint) => (
                  <div key={endpoint} className="text-gray-300 font-mono">
                    {endpoint}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Test Credentials */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            >
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Test Credentials
              </h3>
              <div className="space-y-3">
                {testUsers.map((user) => (
                  <div key={user.email} className="bg-white/5 p-3 rounded-lg">
                    <div className="text-white font-medium text-sm">{user.role.toUpperCase()}</div>
                    <div className="text-gray-400 text-xs">{user.email}</div>
                    <div className="text-gray-400 text-xs">Password: {user.password}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            >
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Features
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  JWT Authentication
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Role-based Access
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Password Encryption
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Email Verification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Password Reset
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Profile Management
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTestPage;
