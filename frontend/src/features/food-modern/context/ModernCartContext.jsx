import React, { createContext, useContext, useReducer, useEffect } from "react";

const ModernCartContext = createContext();

const initialState = {
  items: [], // {id, name_eng, name_tamil, price, image, qty}
};

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const exists = state.items.find(i => i.id === action.item.id);
      if (exists) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, qty: 1 }] };
    }
    case "REMOVE":
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case "MODIFY":
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, qty: action.qty } : i
        ),
      };
    case "CLEAR":
      return { ...state, items: [] };
    case "SET":
      return { ...state, items: action.items };
    default:
      return state;
  }
}

export const ModernCartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState, (init) => {
    try {
      const persisted = localStorage.getItem("modernCart");
      return persisted ? { items: JSON.parse(persisted) } : init;
    } catch {
      return init;
    }
  });

  useEffect(() => {
    localStorage.setItem("modernCart", JSON.stringify(state.items));
  }, [state.items]);

  return (
    <ModernCartContext.Provider value={{ cart: state, dispatch }}>
      {children}
    </ModernCartContext.Provider>
  );
};

export const useModernCart = () => useContext(ModernCartContext);
