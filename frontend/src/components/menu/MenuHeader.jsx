// 📁 frontend/src/components/menu/MenuHeader.jsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, ShoppingCart, X, Home } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const MenuHeader = ({ 
  searchQuery, 
  onSearchChange, 
  onToggleFilters, 
  onToggleCart,
  cartCount = 0
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const miniCartRef = useRef(null);
  const { cart, cartSubtotal, tax, serviceCharge, cartTotal } = useCart();

  useEffect(() => {
    const onDocClick = (e) => {
      if (miniCartRef.current && !miniCartRef.current.contains(e.target)) {
        setShowMiniCart(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const formatPrice = (p) => `Rs. ${Number(p || 0).toLocaleString()}`;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Main Header */}
        <div className="flex items-center justify-between h-16">
          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
              aria-label="Go to Dashboard"
              title="Dashboard"
            >
              <Home size={20} />
            </Link>
            <Link to="/" className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-red-600">
              VALDOR
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search dishes, ingredients..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Search size={20} />
            </button>

            {/* Filters */}
            <button
              onClick={onToggleFilters}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <SlidersHorizontal size={20} />
            </button>

            {/* Cart */}
            <div className="relative" ref={miniCartRef}>
              <button
                onClick={() => setShowMiniCart((s) => !s)}
                className="relative p-2 hover:bg-gray-100 rounded-full"
                aria-label="Cart"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">
                    {cartCount}
                  </span>
                )}
              </button>

              {showMiniCart && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50">
                  <div className="flex items-center justify-between p-3 border-b">
                    <div className="font-semibold">Your Cart</div>
                    <button onClick={() => setShowMiniCart(false)} className="p-1 hover:bg-gray-100 rounded-full">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="max-h-72 overflow-auto divide-y">
                    {cart.items.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">Your cart is empty</div>
                    ) : (
                      cart.items.map((it) => (
                        <div key={it.id} className="p-3 text-sm">
                          <div className="flex justify-between">
                            <div className="pr-2">
                              <div className="font-medium text-gray-900">{it.name}</div>
                              <div className="text-gray-600">{it.portion.name} × {it.quantity}</div>
                            </div>
                            <div className="font-semibold text-blue-600">{formatPrice(it.portion.price * it.quantity)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3 space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(cartSubtotal)}</span></div>
                    <div className="flex justify-between"><span>Tax</span><span>{formatPrice(tax)}</span></div>
                    <div className="flex justify-between"><span>Service</span><span>{formatPrice(serviceCharge)}</span></div>
                    <div className="flex justify-between font-semibold border-t pt-2"><span>Total</span><span>{formatPrice(cartTotal)}</span></div>
                  </div>

                  <div className="p-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setShowMiniCart(false); onToggleCart && onToggleCart(); }}
                      className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    >
                      View Cart
                    </button>
                    <button
                      onClick={() => { setShowMiniCart(false); onToggleCart && onToggleCart(); }}
                      className="bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700"
                    >
                      Checkout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search dishes, ingredients..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default MenuHeader;
