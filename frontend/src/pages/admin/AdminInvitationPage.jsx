import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import adminService from "../../services/adminService";
import DefaultAdminLayout from "../../layout/admin/DefaultAdminLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Spinner from "../../components/ui/Spinner";
import Badge from "../../components/ui/Badge";
import EditInvitationModal from "./components/EditInvitationModal";
import useDebounce from "../../hooks/useDebounce";
import PermissionSelector from "./components/PermissionSelector";

export default function AdminInvitationPage() {
  const { user } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [permissions, setPermissions] = useState([]);

  const [status, setStatus] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [filters, setFilters] = useState({
    status: "active",
    search: "",
  });
  const [activeTab, setActiveTab] = useState("create");
  const [editingInvitation, setEditingInvitation] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, used: 0, expired: 0 });
  const debouncedSearch = useDebounce(filters.search, 500);
  const tabs = [
    { id: "create", label: "Create Invitation", icon: "➕" },
    { id: "active", label: "Active Invitations", icon: "⏳" },
    { id: "used", label: "Used Invitations", icon: "✅" },
    { id: "expired", label: "Expired Invitations", icon: "❌" },
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab !== "create") {
      fetchInvitations();
    }
  }, [activeTab, filters.status, debouncedSearch]);

  const fetchStats = async () => {
    try {
      const res = await adminService.getInvitations({
        params: {},
      });
      const allInvs = res.data.data || [];
      const computedStats = allInvs.reduce(
        (acc, inv) => {
          const invStatus = inv.used ? "used" : new Date(inv.expiresAt) > new Date() ? "active" : "expired";
          acc.total++;
          acc[invStatus] = (acc[invStatus] || 0) + 1;
          return acc;
        },
        { total: 0, active: 0, used: 0, expired: 0 }
      );
      setStats(computedStats);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setStatus({
        type: "error",
        message: err.response?.data?.message || "Failed to fetch invitation stats.",
      });
    }
  };

  const fetchInvitations = async () => {
    setLoadingInvites(true);
    try {
      const res = await adminService.getInvitations({
        params: {
          status: filters.status === "all" ? undefined : filters.status,
          email: filters.search || undefined,
        },
      });
      setInvitations(
        (res.data.data || []).map((inv) => ({
          ...inv,
          status: inv.used ? "used" : new Date(inv.expiresAt) > new Date() ? "active" : "expired",
        }))
      );
    } catch (err) {
      console.error("Failed to fetch invitations:", err);
      setStatus({
        type: "error",
        message: err.response?.data?.message || "Failed to fetch invitations.",
      });
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    try {
      const payload = {
        email,
        role,
        expiresInHours,
        ...(role === "admin" && permissions.length ? { permissions } : {}),
      };
      const response = await adminService.sendInvitation(payload);
      if (response.data.success) {
        setStatus({ type: "success", message: "✅ Invitation sent successfully!" });
        setEmail("");
        setRole("staff");
        setExpiresInHours(24);
        setPermissions([]);
        fetchStats();
        if (activeTab !== "create") {
          fetchInvitations();
        }
      } else {
        setStatus({ type: "error", message: "❌ Failed to send invitation." });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || "❌ Server error.",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminService.deleteInvitation(id);
      fetchStats();
      fetchInvitations();
      setStatus({ type: "success", message: "✅ Invitation deleted successfully!" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || "❌ Failed to delete invitation.",
      });
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId !== "create") {
      setFilters((prev) => ({ ...prev, status: tabId }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "used":
        return "bg-green-50 text-green-800 border-green-200";
      case "expired":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

  return (
    <DefaultAdminLayout>
      <div className="space-y-6">
        {/* Modern Page Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">📬 Invitation Management</h1>
              <p className="text-indigo-100 text-lg">
                Welcome back, {user?.name?.split(" ")[0]}! Invite new users to your organization
              </p>
            </div>
            <Button
              onClick={() => {
                fetchInvitations();
                fetchStats();
              }}
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
        {/* Modern Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Invitations</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Active</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.active || 0}</p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Used</p>
                <p className="text-3xl font-bold text-green-900">{stats.used || 0}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Expired</p>
                <p className="text-3xl font-bold text-red-900">{stats.expired || 0}</p>
              </div>
              <div className="p-3 bg-red-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                onClick={() => handleTabChange(tab.id)}
                className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102 border border-gray-200"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </Card>
        {/* Create Invitation Form or Invitation List */}
        {activeTab === "create" ? (
          <Card className="bg-white shadow-xl rounded-2xl border-0 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">✨ Create New Invitation</h2>
              <p className="text-gray-600">Invite a new team member to your organization</p>
            </div>
            {status && (
              <div
                className={`mb-6 p-4 rounded-xl ${
                  status.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {status.message}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📧 Email</label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Role</label>
                  <Select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="staff">👨‍💼 Staff</option>
                    <option value="admin">🔑 Admin</option>
                    <option value="manager">👨‍💻 Manager</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">⏳ Expires In (Hours)</label>
                  <Input
                    type="number"
                    min="1"
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              {role === "admin" && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Optional: assign granular permissions for the invited admin.
                  </div>
                  <PermissionSelector
                    selectedPermissions={permissions}
                    onPermissionChange={setPermissions}
                  />
                </div>
              )}
              <Button
                type="submit"
                variant="primary"
                className="w-full md:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-semibold"
              >
                🚀 Send Invitation
              </Button>
            </form>
          </Card>
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
                      placeholder="🔍 Search by email..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10 py-3 text-base rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                {/* <div className="w-full lg:w-64">
                  <Select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    options={[
                      { value: "all", label: "All Status" },
                      { value: "active", label: "Active" },
                      { value: "used", label: "Used" },
                      { value: "expired", label: "Expired" },
                    ]}
                    className="py-3 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div> */}
              </div>
            </Card>
            {/* Invitations List */}
            {loadingInvites ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Spinner size="lg" />
                <p className="text-gray-500 mt-4">Loading invitations...</p>
              </div>
            ) : (
              <InvitationsList
                invitations={invitations}
                onEdit={(inv) => {
                  setEditingInvitation(inv);
                  setModalOpen(true);
                }}
                onDelete={handleDelete}
                getStatusColor={getStatusColor}
              />
            )}
          </>
        )}
        {/* Modal for Editing Invitation */}
        <EditInvitationModal
          isOpen={modalOpen}
          invitation={editingInvitation}
          onClose={() => {
            setModalOpen(false);
            setEditingInvitation(null);
          }}
          onUpdate={async (updatedData) => {
            try {
              await adminService.updateInvitation(updatedData._id, updatedData);
              setModalOpen(false);
              setEditingInvitation(null);
              fetchInvitations();
              fetchStats();
              setStatus({ type: "success", message: "✅ Invitation updated successfully!" });
            } catch (err) {
              console.error("Update failed:", err);
              setStatus({
                type: "error",
                message: err.response?.data?.message || "❌ Failed to update invitation.",
              });
            }
          }}
        />
      </div>
    </DefaultAdminLayout>
  );
}

function InvitationsList({ invitations, onEdit, onDelete, getStatusColor }) {
  if (invitations.length === 0) {
    return (
      <Card className="bg-white shadow-xl rounded-2xl border-0 text-center py-16">
        <div className="flex flex-col items-center">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-xl mb-2">No invitations found</p>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      </Card>
    );
  }
  return (
    <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📋 Invitations</h2>
          <div className="text-sm text-gray-500">
            {invitations.length} {invitations.length === 1 ? "invitation" : "invitations"} found
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {invitations.map((inv) => (
            <div
              key={inv._id}
              className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`${getStatusColor(inv.status)} rounded-xl p-4 text-white mb-4 shadow-lg bg-opacity-20`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{inv.email}</h3>
                    <p className="text-white/90 text-sm">
                      {inv.role === "admin" ? "🔑" : inv.role === "manager" ? "👨‍💻" : "👨‍💼"} {inv.role.charAt(0).toUpperCase() + inv.role.slice(1)}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(inv.status)} bg-white/20 text-white border-white/30`}>
                    {inv.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Expires: {new Date(inv.expiresAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="truncate max-w-xs">Token: {inv.token}</span>
                </div>
                {inv.role === "admin" && inv.permissions?.length > 0 && (
                  <div className="text-xs text-gray-600">
                    <div className="font-semibold mb-1">Permissions:</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {inv.permissions.map((p) => (
                        <li key={`${p.module}`}>{p.module}: {Array.isArray(p.actions) ? p.actions.join(", ") : ''}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(inv)}
                  className="flex-1 rounded-full border-gray-300 hover:border-yellow-500 hover:text-yellow-600"
                >
                  ✏️ Edit
                </Button>
                <Button
                  size="sm"
                  variant="error"
                  onClick={() => onDelete(inv._id)}
                  className="flex-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                >
                  🗑️ Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}