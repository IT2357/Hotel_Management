import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Cart item structure
// {
//   id: string,
//   name: string,
//   price: number,
//   quantity: number,
//   imageUrl: string,
//   description: string,
//   isTakeaway: boolean
// }

// Cart actions
const ADD_TO_CART = 'ADD_TO_CART';
const REMOVE_FROM_CART = 'REMOVE_FROM_CART';
const UPDATE_QUANTITY = 'UPDATE_QUANTITY';
const CLEAR_CART = 'CLEAR_CART';
const TOGGLE_TAKEAWAY = 'TOGGLE_TAKEAWAY';

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case ADD_TO_CART: {
      const existingItem = state.items.find(item => item.id === action.payload.id);

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
          total: state.total + action.payload.price
        };
      } else {
        return {
          ...state,
          items: [...state.items, { ...action.payload, quantity: 1 }],
          total: state.total + action.payload.price
        };
      }
    }

    case REMOVE_FROM_CART: {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload),
          total: state.total - (item.price * item.quantity)
        };
      }
      return state;
    }

    case UPDATE_QUANTITY: {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.id === id);

      if (item && quantity > 0) {
        const quantityDiff = quantity - item.quantity;
        return {
          ...state,
          items: state.items.map(item =>
            item.id === id ? { ...item, quantity } : item
          ),
          total: state.total + (item.price * quantityDiff)
        };
      } else if (item && quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== id),
          total: state.total - (item.price * item.quantity)
        };
      }
      return state;
    }

    case TOGGLE_TAKEAWAY: {
      return {
        ...state,
        isTakeaway: !state.isTakeaway
      };
    }

    case CLEAR_CART: {
      return {
        items: [],
        total: 0,
        isTakeaway: false
      };
    }

    default:
      return state;
  }
};

// Initial state
const initialState = {
  items: [],
  total: 0,
  isTakeaway: false
};

// Create context
const CartContext = createContext();

// Cart provider component
export const CartProvider = ({ children, userRole = 'guest' }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('foodCart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        // Restore cart items
        cartData.items.forEach(item => {
          dispatch({ type: ADD_TO_CART, payload: item });
        });
        // Restore takeaway setting
        if (cartData.isTakeaway) {
          dispatch({ type: TOGGLE_TAKEAWAY });
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('foodCart', JSON.stringify(state));
  }, [state]);

  // Cart actions
  const addToCart = (item) => {
    console.log('Adding item to cart:', item); // Debug log
    console.log('Item image field:', item.image); // Debug log
    console.log('Item imageUrl field:', item.imageUrl); // Debug log
    dispatch({
      type: ADD_TO_CART,
      payload: {
        id: item._id || item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.image, // Fix: use item.image instead of item.imageUrl
        description: item.description
      }
    });
  };

  const removeFromCart = (itemId) => {
    dispatch({ type: REMOVE_FROM_CART, payload: itemId });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({ type: UPDATE_QUANTITY, payload: { id: itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: CLEAR_CART });
  };

  const toggleTakeaway = () => {
    dispatch({ type: TOGGLE_TAKEAWAY });
  };

  const getItemCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalItems = () => {
    return state.items.length;
  };

  const value = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleTakeaway,
    getItemCount,
    getTotalItems,
    userRole,
    canUseTakeaway: userRole !== 'room-guest' // Only non-room guests can use takeaway
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;