
import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { useModernCart } from "../context/ModernCartContext";


const ModernMenuDetailsModal = ({ open, item, onClose, menu = [] }) => {
  const { dispatch } = useModernCart();
  const [added, setAdded] = useState(false);
  const [suggestedItem, setSuggestedItem] = useState(null);
  // Upsell/cross-sell: find related/popular items (same category or tag, not self)
  const suggestions = useMemo(() => {
    if (!item || !Array.isArray(menu)) return [];
    // Priority: same category, then same tag, then popular (by price as proxy)
    let related = menu.filter(m => m._id !== item._id && m.category && item.category && (m.category._id === item.category._id || m.category === item.category));
    if (related.length < 2 && item?.tags?.length) {
      const tagSet = new Set(item.tags);
      related = related.concat(menu.filter(m => m._id !== item._id && m.tags && m.tags.some(t => tagSet.has(t)) && !related.includes(m)));
    }
    if (related.length < 2) {
      // Fallback: top 2 by price (proxy for popularity)
      related = related.concat(menu.filter(m => m._id !== item._id && !related.includes(m)).sort((a, b) => b.price - a.price).slice(0, 2 - related.length));
    }
    return related.slice(0, 2);
  }, [item, menu]);
  if (!open || !item) return null;
  const handleAddToCart = () => {
    // Ensure item has 'id' for cartReducer compatibility
    const cartItem = { ...item, id: item._id };
    dispatch({ type: "ADD", item: cartItem });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 800);
  };
  const handleSuggestionClick = (sugg) => {
    setSuggestedItem(sugg);
  };
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
          <button className="absolute top-2 right-2 text-gray-400 hover:text-primary" onClick={onClose}>&times;</button>
          <img src={item.imageUrl || item.image} alt={item.name_eng} className="w-full h-48 object-cover rounded mb-4" />
          <div className="font-bold text-xl font-tamil mb-1">{item.name_tamil} / {item.name_eng}</div>
          <div className="text-primary font-semibold mb-2">LKR {item.price}</div>
          <div className="mb-2 text-sm text-gray-700">{item.description}</div>
          <div className="mb-2">
            <span className="font-semibold">Category:</span> {item.category?.name || item.category || "-"}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Ingredients:</span> {Array.isArray(item.ingredients) ? item.ingredients.join(", ") : item.ingredients || "-"}
          </div>
          <div className="mb-2 flex flex-wrap gap-1">
            {item.tags?.map(tag => (
              <span key={tag} className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{tag}</span>
            ))}
          </div>
          <button
            className={`mt-4 w-full bg-primary text-white px-4 py-2 rounded ${added ? "bg-green-500" : ""}`}
            onClick={handleAddToCart}
            disabled={added}
          >
            {added ? "Added!" : "Add to Cart"}
          </button>
          {/* Upsell/Cross-sell suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <div className="font-semibold mb-2 text-sm text-gray-700">You may also like:</div>
              <div className="flex gap-3">
                {suggestions.map(sugg => (
                  <div key={sugg._id} className="w-24 cursor-pointer" onClick={() => handleSuggestionClick(sugg)}>
                    <img src={sugg.imageUrl || sugg.image} alt={sugg.name_eng} className="w-24 h-16 object-cover rounded mb-1" />
                    <div className="text-xs font-bold truncate">{sugg.name_eng}</div>
                    <div className="text-xs text-primary">LKR {sugg.price}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Nested modal for suggestion */}
      {suggestedItem && (
        <ModernMenuDetailsModal open={true} item={suggestedItem} onClose={() => setSuggestedItem(null)} menu={menu} />
      )}
    </>
  );
};

ModernMenuDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  item: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  menu: PropTypes.array,
};

export default ModernMenuDetailsModal;
