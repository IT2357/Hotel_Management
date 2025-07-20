//src/pages/admin/AdminInvitationPage.jsx

import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import adminService from "../../services/adminService";
import EditInvitationModal from "./components/EditInvitationModal";

export default function AdminInvitationPage() {
  const { user } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [status, setStatus] = useState(null);

  const [invitations, setInvitations] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [filterStatus, setFilterStatus] = useState("active");
  const [searchEmail, setSearchEmail] = useState("");

  const [editingInvitation, setEditingInvitation] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchInvitations = async () => {
    setLoadingInvites(true);
    try {
      const res = await adminService.getInvitations({
        params: {
          status: filterStatus,
          email: searchEmail,
        },
      });
      setInvitations(res.data.data);
    } catch (err) {
      console.error("Failed to fetch invitations:", err);
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    try {
      const response = await adminService.sendInvitation({
        email,
        role,
        expiresInHours,
      });

      if (response.data.success) {
        setStatus({ type: "success", message: "✅ Invitation sent successfully!" });
        setEmail("");
        setRole("staff");
        setExpiresInHours(24);
        fetchInvitations();
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await adminService.updateInvitation(editingInvitation._id, editingInvitation);
      setModalOpen(false);
      setEditingInvitation(null);
      fetchInvitations();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleDelete = async (id) => {
    await adminService.deleteInvitation(id);
    fetchInvitations();
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-white shadow">
        <div className="mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Manage Invitations</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-10 space-y-10">
        {/* Send Invitation Form */}
        <section>
          <h2 className="text-xl font-semibold mb-6">
            Invite a new user, {user?.name?.split(" ")[0]} 👤
          </h2>

          {status && (
            <div
              className={`mb-4 p-4 rounded ${
                status.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {status.message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white p-6 rounded shadow"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Expires In (Hours)</label>
              <input
                type="number"
                min="1"
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
            >
              Send Invitation
            </button>
          </form>
        </section>

        {/* Filter Controls */}
        <section className="space-y-4">
          <div className="flex gap-4 items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
            </select>
            <input
              type="text"
              placeholder="Search by email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="border rounded px-3 py-2 flex-1"
            />
            <button
              onClick={fetchInvitations}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Filter
            </button>
          </div>
        </section>

        {/* Invitation List */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Invitations</h2>
          {loadingInvites ? (
            <p className="text-gray-600">Loading invitations...</p>
          ) : invitations.length === 0 ? (
            <p className="text-gray-600">No invitations found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invitations.map((inv) => (
                <div key={inv._id} className="bg-white shadow rounded-lg p-6 space-y-2">
                  <h2 className="text-lg font-semibold text-gray-800">{inv.email}</h2>
                  <p className="text-sm text-gray-600">Role: {inv.role}</p>
                  <p className="text-sm text-gray-600">
                    Expires At: {new Date(inv.expiresAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 break-all">Token: {inv.token}</p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setEditingInvitation(inv);
                        setModalOpen(true);
                      }}
                      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(inv._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

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
          } catch (err) {
            console.error("Update failed:", err);
          }
        }}
      />
  </div>
);
}
