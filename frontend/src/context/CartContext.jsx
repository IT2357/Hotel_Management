// 📁 frontend/src/context/CartContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_CART':
      return action.payload;
    
    case 'ADD_ITEM': {
      const { item, portion, quantity, specialInstructions } = action.payload;
      const cartItemId = `${item._id}-${portion?.name || 'default'}`;
      
      const existingItem = state.items.find(cartItem => cartItem.id === cartItemId);
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(cartItem =>
            cartItem.id === cartItemId
              ? { ...cartItem, quantity: cartItem.quantity + quantity }
              : cartItem
          )
        };
      }
      
      const newItem = {
        id: cartItemId,
        menuItem: item._id,
        name: item.name,
        image: item.primaryImage?.url || item.images?.[0]?.url,
        portion: portion || { name: 'Regular', price: item.basePrice || item.displayPrice },
        quantity,
        specialInstructions: specialInstructions || '',
        category: item.category.name,
        spiceLevel: item.spiceLevel,
        dietaryTags: item.dietaryTags || []
      };
      
      return {
        ...state,
        items: [...state.items, newItem]
      };
    }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    
    case 'UPDATE_QUANTITY': {
      const { itemId, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== itemId)
        };
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      };
    }
    
    case 'UPDATE_INSTRUCTIONS': {
      const { itemId, instructions } = action.payload;
      return {
        ...state,
        items: state.items.map(item =>
          item.id === itemId ? { ...item, specialInstructions: instructions } : item
        )
      };
    }
    
    case 'CLEAR_CART':
      return {
        items: [],
        orderType: 'Dine-in',
        tableNumber: '',
        customerInfo: {
          name: '',
          phone: '',
          email: ''
        }
      };
    
    case 'SET_ORDER_TYPE':
      return {
        ...state,
        orderType: action.payload
      };
    
    case 'SET_TABLE_NUMBER':
      return {
        ...state,
        tableNumber: action.payload
      };
    
    case 'SET_CUSTOMER_INFO':
      return {
        ...state,
        customerInfo: { ...state.customerInfo, ...action.payload }
      };
    
    default:
      return state;
  }
};

const initialState = {
  items: [],
  orderType: 'Dine-in',
  tableNumber: '',
  customerInfo: {
    name: '',
    phone: '',
    email: ''
  }
};

export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const legacyKey = 'culture-colombo-cart';
    const newKey = 'valdor-cart';
    let loaded = false;

    // Prefer new key
    const newSaved = localStorage.getItem(newKey);
    if (newSaved) {
      try {
        const parsed = JSON.parse(newSaved);
        dispatch({ type: 'LOAD_CART', payload: parsed });
        loaded = true;
      } catch (e) {
        console.error('Failed to parse VALDOR cart from localStorage:', e);
      }
    }

    // Fallback: migrate legacy key
    if (!loaded) {
      const legacySaved = localStorage.getItem(legacyKey);
      if (legacySaved) {
        try {
          const parsedLegacy = JSON.parse(legacySaved);
          dispatch({ type: 'LOAD_CART', payload: parsedLegacy });
          localStorage.setItem(newKey, legacySaved);
        } catch (e) {
          console.error('Failed to migrate legacy cart data:', e);
        }
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('valdor-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item, portion, quantity = 1, specialInstructions = '') => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { item, portion, quantity, specialInstructions }
    });
  };

  const removeFromCart = (itemId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  };

  const updateInstructions = (itemId, instructions) => {
    dispatch({ type: 'UPDATE_INSTRUCTIONS', payload: { itemId, instructions } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const setOrderType = (orderType) => {
    dispatch({ type: 'SET_ORDER_TYPE', payload: orderType });
  };

  const setTableNumber = (tableNumber) => {
    dispatch({ type: 'SET_TABLE_NUMBER', payload: tableNumber });
  };

  const setCustomerInfo = (customerInfo) => {
    dispatch({ type: 'SET_CUSTOMER_INFO', payload: customerInfo });
  };

  // Computed values
  const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
  
  const cartSubtotal = cart.items.reduce((total, item) => {
    return total + (Number(item.portion.price || 0) * item.quantity);
  }, 0);

  // Align with backend calculations (12.5% tax, 10% service)
  const tax = Math.round(cartSubtotal * 0.125 * 100) / 100; // 12.5% tax
  const serviceCharge = Math.round(cartSubtotal * 0.10 * 100) / 100; // 10% service charge
  const cartTotal = Math.round((cartSubtotal + tax + serviceCharge) * 100) / 100;

  const value = {
    cart,
    cartCount,
    cartSubtotal,
    tax,
    serviceCharge,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateInstructions,
    clearCart,
    setOrderType,
    setTableNumber,
    setCustomerInfo
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
