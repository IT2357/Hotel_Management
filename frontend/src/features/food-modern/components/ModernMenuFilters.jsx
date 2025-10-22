import React from "react";
import PropTypes from "prop-types";

const ModernMenuFilters = ({ categories, dietaryOptions, selectedCategory, setSelectedCategory, selectedDietary, setSelectedDietary, search, setSearch }) => (
  <div className="flex flex-col md:flex-row gap-2 mb-4 items-center">
    <select
      className="border rounded px-3 py-2 text-[#4A4A4A]"
      value={selectedCategory}
      onChange={e => setSelectedCategory(e.target.value)}
    >
      <option value="all">All Categories</option>
      {categories.map(cat => (
        <option key={cat.value} value={cat.value}>{cat.label}</option>
      ))}
    </select>
    <select
      className="border rounded px-3 py-2 text-[#4A4A4A]"
      value={selectedDietary}
      onChange={e => setSelectedDietary(e.target.value)}
    >
      <option value="all">All Dietary</option>
      {dietaryOptions.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    <input
      className="border rounded px-3 py-2 flex-1 text-[#4A4A4A]"
      type="text"
      placeholder="Search dishes..."
      value={search}
      onChange={e => setSearch(e.target.value)}
    />
  </div>
);

ModernMenuFilters.propTypes = {
  categories: PropTypes.array.isRequired,
  dietaryOptions: PropTypes.array.isRequired,
  selectedCategory: PropTypes.string.isRequired,
  setSelectedCategory: PropTypes.func.isRequired,
  selectedDietary: PropTypes.string.isRequired,
  setSelectedDietary: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
  setSearch: PropTypes.func.isRequired,
};

export default ModernMenuFilters;
