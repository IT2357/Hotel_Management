import React from "react";
import { useModernCart } from "../context/ModernCartContext";

const ModernCart = () => {
  const { cart, dispatch } = useModernCart();
  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <div className="min-h-screen bg-white text-[#4A4A4A] p-4">
      <h2 className="text-xl font-bold text-primary mb-4">Your Cart</h2>
      {cart.items.length === 0 ? (
        <div className="text-gray-400">Cart is empty.</div>
      ) : (
        <div className="space-y-4">
          {cart.items.map(item => (
            <div key={item.id} className="flex items-center border-b pb-2">
              <img src={item.image} alt={item.name_eng} className="w-14 h-14 rounded object-cover" />
              <div className="ml-3 flex-1">
                <div className="font-bold">{item.name_tamil} / {item.name_eng}</div>
                <div className="text-primary">LKR {item.price} × {item.qty}</div>
              </div>
              <input
                type="number"
                min={1}
                value={item.qty}
                onChange={e => dispatch({ type: "MODIFY", id: item.id, qty: Number(e.target.value) })}
                className="w-14 border rounded mx-2 text-center"
              />
              <button
                className="bg-red-500 text-white px-2 py-1 rounded"
                onClick={() => dispatch({ type: "REMOVE", id: item.id })}
              >Remove</button>
            </div>
          ))}
          <div className="text-right font-bold text-lg mt-4">Subtotal: LKR {subtotal}</div>
        </div>
      )}
    </div>
  );
};

export default ModernCart;
