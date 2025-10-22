import React from "react";
import PropTypes from "prop-types";

const ModernMenuCard = ({ item, onAddToCart }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center border border-gray-100">
      <img src={item.image} alt={item.name_eng} className="w-full h-40 object-cover rounded mb-2" loading="lazy" />
      <div className="font-bold text-lg font-tamil">{item.name_tamil} / {item.name_eng}</div>
      <div className="text-primary font-semibold mt-1">LKR {item.price}</div>
      <div className="text-xs mt-1 flex flex-wrap gap-1">
        {item.tags?.map(tag => (
          <span key={tag} className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{tag}</span>
        ))}
      </div>
      <button
        className="mt-3 bg-primary text-white px-4 py-1 rounded hover:bg-orange-500 transition"
        onClick={e => { e.stopPropagation(); onAddToCart(item); }}
        data-addcart
      >
        Add to Cart
      </button>
    </div>
  );
};

ModernMenuCard.propTypes = {
  item: PropTypes.object.isRequired,
  onAddToCart: PropTypes.func.isRequired,
};

export default ModernMenuCard;
