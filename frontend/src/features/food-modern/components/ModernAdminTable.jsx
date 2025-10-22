

import React, { useState, useEffect } from "react";
import ModernAdminMenuModal from "./ModernAdminMenuModal";

import api from "../api";

const emptyMenuItem = {
  name_eng: "",
  name_tamil: "",
  price: "",
  image: null,
  description: "",
  ingredients: [],
  tags: [],
  available: true
};

const ModernAdminTable = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch menu from backend
  useEffect(() => {
    setLoading(true);
    api.get("/")
      .then(res => {
        setMenu(res.data.data || []);
        setError(null);
      })
      .catch(() => {
        setError("Failed to load menu");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    setModalOpen(true);
  };
  const handleEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };
  // Save handler: supports FormData for image upload
  const handleSave = async (formData) => {
    setSaving(true);
    try {
      let res;
      if (editingItem && editingItem._id) {
        // Edit existing (PUT with multipart/form-data)
        res = await api.put(
          `/menu/items/${editingItem._id}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setMenu(menu.map(i => i._id === editingItem._id ? res.data.data : i));
      } else {
        // Add new (POST with multipart/form-data)
        res = await api.post(
          `/menu/items`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setMenu([res.data.data, ...menu]);
      }
      setModalOpen(false);
      setError(null);
    } catch {
      setError("Failed to save item");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (item) => {
    if (!window.confirm("Delete this menu item?")) return;
    try {
      await api.delete(`/${item._id}`);
      setMenu(menu.filter(i => i._id !== item._id));
      setError(null);
    } catch {
      setError("Failed to delete item");
    }
  };
  const handleCancel = () => setModalOpen(false);

  return (
    <div className="min-h-screen bg-white text-[#4A4A4A] p-4">
      <h2 className="text-xl font-bold text-primary mb-4">Admin Menu Management</h2>
      <button className="mb-4 bg-primary text-white px-4 py-2 rounded" onClick={handleAdd}>Add New Item</button>
      {loading ? (
        <div className="text-center py-8">Loading menu...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-4">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Image</th>
                <th className="p-2 border">Name (Tamil/Eng)</th>
                <th className="p-2 border">Category</th>
                <th className="p-2 border">Price (LKR)</th>
                <th className="p-2 border">Tags</th>
                <th className="p-2 border">Available</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {menu.map(item => (
                <tr key={item._id} className="border-b">
                  <td className="p-2 border"><img src={item.imageUrl || item.image} alt={item.name_eng} className="w-16 h-12 object-cover rounded" /></td>
                  <td className="p-2 border font-tamil">{item.name_tamil} / {item.name_eng}</td>
                  <td className="p-2 border">{item.category?.name || item.category || "-"}</td>
                  <td className="p-2 border">{item.price}</td>
                  <td className="p-2 border text-xs">{item.tags?.join(", ")}</td>
                  <td className="p-2 border text-center">{item.available ? "Yes" : "No"}</td>
                  <td className="p-2 border text-center">
                    <button className="bg-blue-500 text-white px-2 py-1 rounded mr-2" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => handleDelete(item)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ModernAdminMenuModal
        open={modalOpen}
        initialValues={editingItem || emptyMenuItem}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />
    </div>
  );
};

export default ModernAdminTable;
