

import React, { useState, useMemo, useEffect } from "react";
import ModernMenuCard from "./ModernMenuCard";
import ModernMenuDetailsModal from "./ModernMenuDetailsModal";
import ModernMenuFilters from "./ModernMenuFilters";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import { useModernCart } from "../context/ModernCartContext";
import { getCategories, default as api } from "../api";

const dietaryOptions = ["all", "Vegetarian", "Vegan", "Halal", "Spicy"];


const ModernMenuGrid = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDietary, setSelectedDietary] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedSearch(search, 300);
  const [categories, setCategories] = useState([{ value: "all", label: "All" }]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  // Advanced filter state
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  // Fetch categories and menu from backend
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCategories().then(data => data.map(cat => ({ value: cat._id, label: cat.name }))),
      api.get("/menu/items").then(res => res.data.data.items || [])
    ])
      .then(([catList, menuList]) => {
        setCategories([{ value: "all", label: "All" }, ...catList]);
        setMenu(menuList);
        setError(null);
      })
      .catch(() => setError("Failed to load menu"))
      .finally(() => setLoading(false));
  }, []);

  // Filtered menu items
  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchCategory = selectedCategory === "all" || item.category?._id === selectedCategory || item.category === selectedCategory;
      const matchDietary = selectedDietary === "all" || (item.tags && item.tags.includes(selectedDietary));
      const matchSearch =
        !debouncedSearch ||
        item.name_eng.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.name_tamil.includes(debouncedSearch);
      const matchMinPrice = !minPrice || Number(item.price) >= Number(minPrice);
      const matchMaxPrice = !maxPrice || Number(item.price) <= Number(maxPrice);
      const matchTag = !selectedTag || (item.tags && item.tags.includes(selectedTag));
      const matchAvailable = !availableOnly || item.available === true;
      return matchCategory && matchDietary && matchSearch && matchMinPrice && matchMaxPrice && matchTag && matchAvailable;
    });
  }, [menu, selectedCategory, selectedDietary, debouncedSearch, minPrice, maxPrice, selectedTag, availableOnly]);

  // Add to cart handler (real)
  const { dispatch } = useModernCart();
  const handleAddToCart = (item) => {
    // Ensure item has 'id' for cartReducer compatibility
    const cartItem = { ...item, id: item._id };
    dispatch({ type: "ADD", item: cartItem });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white text-[#3A2C1A] p-2 md:p-6">
      <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-4 font-tamil tracking-tight drop-shadow-sm">🍛 Jaffna Restaurant Menu</h1>
      <div className="bg-white/80 rounded-xl shadow p-4 md:p-6 mb-6 border border-orange-100">
        <ModernMenuFilters
          categories={categories}
          dietaryOptions={dietaryOptions}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedDietary={selectedDietary}
          setSelectedDietary={setSelectedDietary}
          search={search}
          setSearch={setSearch}
        />
        {/* Advanced Filters */}
        <div className="flex flex-wrap gap-4 mt-4 mb-2 items-end">
          <div>
            <label className="block text-xs font-semibold text-primary">Min Price</label>
            <input type="number" className="border border-orange-200 rounded-lg px-3 py-1.5 w-28 focus:ring-2 focus:ring-primary/30 transition" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary">Max Price</label>
            <input type="number" className="border border-orange-200 rounded-lg px-3 py-1.5 w-28 focus:ring-2 focus:ring-primary/30 transition" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary">Tag</label>
            <input type="text" className="border border-orange-200 rounded-lg px-3 py-1.5 w-36 focus:ring-2 focus:ring-primary/30 transition" placeholder="e.g. Spicy" value={selectedTag} onChange={e => setSelectedTag(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 mt-5">
            <input type="checkbox" id="availableOnly" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} className="accent-primary scale-110" />
            <label htmlFor="availableOnly" className="text-xs text-primary">Available Only</label>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="animate-spin text-4xl mb-2">🍲</span>
          <div className="text-lg font-semibold text-primary">Loading menu...</div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-8 text-lg font-semibold">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredMenu.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <span className="text-6xl mb-2">😔</span>
              <div className="text-xl font-semibold text-gray-400">No dishes found.<br/>Try adjusting your filters.</div>
            </div>
          ) : (
            filteredMenu.map(item => (
              <div
                key={item._id}
                className="cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-xl rounded-xl bg-white/90 border border-orange-100"
                style={{ boxShadow: '0 2px 8px 0 rgba(255, 153, 51, 0.06)' }}
                onClick={e => {
                  // Only open modal if not clicking the Add to Cart button
                  if (e.target.closest('button[data-addcart]')) return;
                  setSelectedItem(item); setModalOpen(true);
                }}
              >
                <ModernMenuCard item={item} onAddToCart={handleAddToCart} />
              </div>
            ))
          )}
        </div>
      )}
      <ModernMenuDetailsModal open={modalOpen} item={selectedItem} onClose={() => setModalOpen(false)} menu={menu} />
    </div>
  );
};

export default ModernMenuGrid;
